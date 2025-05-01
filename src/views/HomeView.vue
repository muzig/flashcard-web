<template>
  <div class="container">
    <!-- Management panel with toggle (top-left corner) -->
    <div v-if="!hasSelectedTheme" class="management-panel">
      <div class="section-header">
        <h2>管理面板</h2>
        <button class="toggle-btn" @click.stop="toggleCustomThemeCollapse">
          <span class="toggle-icon">{{ isCustomThemeCollapsed ? '▼' : '▲' }}</span>
          {{ isCustomThemeCollapsed ? '展开' : '收起' }}
        </button>
      </div>

      <!-- Panel content (collapsible) -->
      <div class="panel-wrapper" :class="{ 'collapsed': isCustomThemeCollapsed }">
        <!-- Theme management buttons -->
        <div class="panel-section">
          <h3 class="panel-section-title">主题管理</h3>
          <button class="panel-btn upload-btn" @click="showNewThemeForm">
            <span class="btn-icon">📤</span> 上传新主题
          </button>
        </div>

        <!-- Progress management -->
        <div v-if="hasProgress" class="panel-section">
          <h3 class="panel-section-title">学习进度</h3>
          <div class="last-study-panel">
            上次学习: {{ formatLastStudyTime }}
          </div>
          <div class="panel-buttons">
            <button class="panel-btn continue-btn" @click="continueLastStudy">
              <span class="btn-icon">⏵</span> 继续学习
            </button>
            <button class="panel-btn reset-btn" @click="resetProgress">
              <span class="btn-icon">↻</span> 重置进度
            </button>
          </div>
        </div>

        <!-- Custom theme card -->
        <div class="panel-section">
          <h3 class="panel-section-title">自定义主题</h3>
          <div class="custom-theme-card" @click="goToCustomTheme">
            <div class="custom-theme-icon">+</div>
            <div class="custom-theme-content">
              <h3>{{ customTheme.name }}</h3>
              <p>{{ customTheme.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="app-title">
      <h1>闪卡学习应用</h1>
    </div>

    <!-- Loading state -->
    <LoadingOverlay v-if="isLoading" />



    <!-- Theme selector -->
    <div v-if="!hasSelectedTheme" class="theme-selector">
      <h2>选择学习主题</h2>
      <div class="theme-cards">
        <ThemeCard v-for="theme in themes" :key="theme.id" :theme="theme" @select="goToTheme"
          @update="showUpdateThemeForm" @delete="deleteTheme" />
      </div>
    </div>

    <!-- New theme form -->
    <ThemeUploadForm v-if="showThemeUploadForm" @close="showThemeUploadForm = false" @submit="handleNewThemeUpload" />

    <!-- Update theme form -->
    <ThemeUpdateForm v-if="showThemeUpdateForm && themeToUpdate" :theme="themeToUpdate"
      @close="showThemeUpdateForm = false" @submit="handleThemeUpdate" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useThemeStore } from '../stores/theme'
import { useProgressStore } from '../stores/progress'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import ThemeCard from '../components/ThemeCard.vue'
import ThemeUploadForm from '../components/ThemeUploadForm.vue'
import ThemeUpdateForm from '../components/ThemeUpdateForm.vue'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const progressStore = useProgressStore()

// Refs
const showThemeUploadForm = ref(false)
const showThemeUpdateForm = ref(false)
const themeToUpdate = ref(null)
const isCustomThemeCollapsed = ref(true) // Default to collapsed

// Load collapsed state from localStorage
onMounted(() => {
  try {
    const savedState = localStorage.getItem('customThemeCollapsed')
    if (savedState !== null) {
      isCustomThemeCollapsed.value = JSON.parse(savedState)
    }
  } catch (error) {
    console.error('Failed to load custom theme collapsed state:', error)
  }
})

// Save collapsed state to localStorage
function toggleCustomThemeCollapse() {
  isCustomThemeCollapsed.value = !isCustomThemeCollapsed.value
  try {
    localStorage.setItem('customThemeCollapsed', JSON.stringify(isCustomThemeCollapsed.value))
  } catch (error) {
    console.error('Failed to save custom theme collapsed state:', error)
  }
}

// Computed properties
const themes = computed(() => themeStore.themes)
const isLoading = computed(() => themeStore.isLoading)
const hasSelectedTheme = computed(() => themeStore.selectedTheme !== '')
const hasProgress = computed(() => progressStore.hasProgress)
const formatLastStudyTime = computed(() => progressStore.formatLastStudyTime)

// Custom theme data
const customTheme = {
  id: 'custom',
  name: '自定义主题',
  description: '上传自己的TSV文件，创建自定义闪卡集合。',
  icon: 'upload',
  color: '#8e44ad',
  cards: null
}

// Methods
function showNewThemeForm() {
  showThemeUploadForm.value = true
}

function showUpdateThemeForm(theme) {
  themeToUpdate.value = theme
  showThemeUpdateForm.value = true
}

function goToTheme(themeId) {
  router.push({ name: 'theme', params: { id: themeId } })
}

function goToCustomTheme() {
  router.push({ name: 'custom' })
}

function continueLastStudy() {
  if (!hasProgress.value) return

  try {
    // Reload progress to get theme ID
    const progress = progressStore.loadProgress()
    if (progress && progress.themeId) {
      router.push({
        name: 'theme',
        params: { id: progress.themeId },
        query: { continueFrom: progress.cardIndex }
      })
    } else {
      alert('没有找到上次学习记录或记录已损坏')
    }
  } catch (error) {
    console.error('继续学习失败:', error)
    alert('继续学习失败，请重试')
  }
}

function resetProgress() {
  if (confirm('确定要重置学习进度吗？这将清除所有已保存的学习记录。')) {
    progressStore.resetProgress()
    alert('学习进度已重置。')
  }
}

async function handleNewThemeUpload(themeData) {
  try {
    await themeStore.saveUserTheme(themeData)
    showThemeUploadForm.value = false
    alert('主题上传成功！')
  } catch (error) {
    alert('主题上传失败: ' + error.message)
  }
}

async function handleThemeUpdate(themeData) {
  try {
    await themeStore.saveUserTheme(themeData)
    showThemeUpdateForm.value = false
    themeToUpdate.value = null
    alert('主题更新成功！')
  } catch (error) {
    alert('主题更新失败: ' + error.message)
  }
}

async function deleteTheme(themeId) {
  if (confirm('确定要删除这个主题吗？这将永久删除该主题及其所有闪卡。')) {
    try {
      await themeStore.deleteTheme(themeId)
      alert('主题已删除。')
    } catch (error) {
      alert('删除主题失败: ' + error.message)
    }
  }
}

// Lifecycle hooks
onMounted(async () => {
  try {
    await themeStore.loadAllThemes()
    progressStore.loadProgress()
  } catch (error) {
    alert('加载主题列表失败，请刷新页面重试。')
  }
})

// Watch for route changes to reload themes
watch(() => route.name, async (newRouteName) => {
  if (newRouteName === 'home') {
    try {
      await themeStore.loadAllThemes()
      progressStore.loadProgress()
    } catch (error) {
      console.error('Failed to reload themes:', error)
    }
  }
}, { immediate: true })
</script>

<style scoped>
/* Component-specific styles */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

/* App title styles */
.app-title {
  position: absolute;
  top: 15px;
  left: 340px;
  /* Position to the right of the management panel */
  z-index: 90;
  max-width: calc(100% - 350px);
  /* Prevent overlap with management panel */
}

.app-title h1 {
  font-size: 1.8rem;
  color: #333;
  margin: 0;
  font-weight: 500;
  white-space: nowrap;
}

/* Theme management styles */
.theme-management {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 15px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  background-color: #3e8e41;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.continue-btn {
  padding: 12px 24px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.continue-btn:hover {
  background-color: #0b7dda;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.reset-btn {
  padding: 12px 24px;
  background-color: #9e9e9e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.reset-btn:hover {
  background-color: #757575;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  margin-right: 8px;
  font-size: 1.1rem;
}

/* Last study info styles */
.last-study-info {
  text-align: center;
  margin-bottom: 30px;
  color: #666;
  font-style: italic;
  font-size: 1.1rem;
}

/* Management panel styles */
.management-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 320px;
  z-index: 100;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #8e44ad;
  color: white;
}

.section-header h2 {
  font-size: 1.2rem;
  color: white;
  margin: 0;
  font-weight: 500;
}

.toggle-btn {
  background-color: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.toggle-icon {
  margin-right: 5px;
  font-size: 0.8rem;
}

/* Panel wrapper for animation */
.panel-wrapper {
  max-height: 600px;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
  opacity: 1;
}

.panel-wrapper.collapsed {
  max-height: 0;
  opacity: 0;
}

/* Panel section styles */
.panel-section {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.panel-section:last-child {
  border-bottom: none;
}

.panel-section-title {
  font-size: 1rem;
  color: #333;
  margin: 0 0 10px 0;
  font-weight: 500;
}

.panel-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.panel-btn {
  padding: 8px 12px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.upload-btn {
  background-color: #4CAF50;
  width: 100%;
}

.upload-btn:hover {
  background-color: #3e8e41;
}

.continue-btn {
  background-color: #2196F3;
}

.continue-btn:hover {
  background-color: #0b7dda;
}

.reset-btn {
  background-color: #9e9e9e;
}

.reset-btn:hover {
  background-color: #757575;
}

.last-study-panel {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
  margin-bottom: 5px;
}

/* Custom theme card styles */
.custom-theme-card {
  width: 100%;
  background-color: #f9f0ff;
  padding: 12px;
  transition: all 0.3s;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
}

.custom-theme-card:hover {
  background-color: #f5e6ff;
}

.custom-theme-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #8e44ad;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 1.5rem;
  margin-right: 15px;
  flex-shrink: 0;
}

.custom-theme-content {
  flex: 1;
}

.custom-theme-content h3 {
  color: #333;
  margin-bottom: 5px;
  font-size: 1.1rem;
}

.custom-theme-content p {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.3;
  margin: 0;
}

/* Theme selector styles */
.theme-selector {
  margin-bottom: 50px;
  margin-top: 100px;
  /* Add space for the app title */
  position: relative;
}

.theme-selector h2 {
  text-align: left;
  margin-bottom: 30px;
  margin-left: 20px;
  font-size: 1.8rem;
  color: #333;
}

.theme-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  padding: 0 20px;
}

/* Responsive styles */
@media (max-width: 1024px) {
  .app-title {
    left: 340px;
  }

  .container {
    max-width: 900px;
  }

  .theme-cards {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .app-title {
    position: absolute;
    top: 15px;
    left: 15px;
  }

  .container {
    padding: 15px;
  }

  header h1 {
    font-size: 2rem;
  }

  .theme-management {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .action-btn,
  .continue-btn,
  .reset-btn {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }

  .management-panel {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    margin-bottom: 10px;
    border-radius: 0;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  /* Adjust app title for mobile */
  .app-title {
    position: absolute;
    top: 15px;
    left: 15px;
    margin: 0;
    z-index: 110;
    /* Above the management panel */
    max-width: calc(100% - 100px);
    /* Prevent overlap with toggle button */
  }

  .app-title h1 {
    font-size: 1.3rem;
  }

  /* Move management panel down to make room for title */
  .management-panel {
    top: 50px;
  }

  .section-header h2 {
    font-size: 1.1rem;
  }

  .toggle-btn {
    padding: 3px 8px;
    font-size: 0.75rem;
  }

  .panel-section {
    padding: 12px;
  }

  .panel-section-title {
    font-size: 0.9rem;
    margin-bottom: 8px;
  }

  .panel-btn {
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .panel-buttons {
    gap: 6px;
  }

  .last-study-panel {
    font-size: 0.8rem;
  }

  .custom-theme-card {
    padding: 10px;
  }

  .custom-theme-icon {
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
    margin-right: 12px;
  }

  .custom-theme-content h3 {
    font-size: 1rem;
  }

  .custom-theme-content p {
    font-size: 0.8rem;
  }

  .theme-selector h2 {
    font-size: 1.6rem;
    margin-bottom: 20px;
    margin-left: 15px;
  }

  .theme-selector {
    margin-top: 100px;
  }

  .theme-cards {
    grid-template-columns: 1fr;
    padding: 0;
  }
}

@media (max-width: 480px) {
  .theme-selector {
    margin-top: 120px;
  }

  .app-title h1 {
    font-size: 1.1rem;
  }

  header h1 {
    font-size: 1.8rem;
  }

  .section-header {
    flex-direction: row;
    padding: 8px 10px;
  }

  .toggle-btn {
    padding: 2px 6px;
    font-size: 0.7rem;
  }

  .panel-section {
    padding: 10px;
  }

  .panel-buttons {
    flex-direction: column;
    gap: 5px;
  }

  .panel-btn {
    width: 100%;
    padding: 6px 8px;
    font-size: 0.8rem;
  }

  .custom-theme-card {
    flex-direction: column;
    text-align: center;
  }

  .custom-theme-icon {
    margin-right: 0;
    margin-bottom: 15px;
  }

  .custom-theme-content h3 {
    font-size: 1.4rem;
  }

  .custom-theme-content p {
    font-size: 0.9rem;
  }
}
</style>
