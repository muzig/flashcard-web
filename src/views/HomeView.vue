<template>
  <div class="container">
    <!-- Left sidebar with app title and management panel -->
    <div v-if="!hasSelectedTheme" class="left-sidebar">
      <!-- App title at the top of sidebar -->
      <div class="app-title">
        <h1>闪卡学习应用</h1>
      </div>

      <!-- Management panel below title -->
      <div class="management-panel">
        <div class="section-header">
          <h2>管理面板</h2>
        </div>

        <!-- Panel content (always visible) -->
        <div class="panel-wrapper">
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

          <!-- Reserved space for future options -->
          <div class="panel-section future-options">
            <div class="future-options-placeholder">
              <p>更多功能即将推出...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <LoadingOverlay v-if="isLoading" />



    <!-- Theme selector -->
    <div v-if="!hasSelectedTheme" class="theme-selector full-width">
      <div class="theme-header">
        <h2>选择学习主题</h2>
        <div class="theme-filter">
          <input type="text" v-model="searchQuery" placeholder="搜索主题..." class="search-input" />
        </div>
      </div>
      <div class="theme-cards full-width-cards">
        <ThemeCard v-for="theme in filteredThemes" :key="theme.id" :theme="theme" @select="goToTheme"
          @update="showUpdateThemeForm" @delete="deleteTheme" />
      </div>
      <div v-if="filteredThemes.length === 0" class="no-themes-message">
        <p>没有找到匹配的主题</p>
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
const searchQuery = ref('')

// Computed properties
const themes = computed(() => themeStore.themes)
const isLoading = computed(() => themeStore.isLoading)
const hasSelectedTheme = computed(() => themeStore.selectedTheme !== '')
const hasProgress = computed(() => progressStore.hasProgress)
const formatLastStudyTime = computed(() => progressStore.formatLastStudyTime)

// Filtered themes based on search query
const filteredThemes = computed(() => {
  if (!searchQuery.value) return themes.value

  const query = searchQuery.value.toLowerCase()
  return themes.value.filter(theme =>
    theme.name.toLowerCase().includes(query) ||
    theme.description.toLowerCase().includes(query)
  )
})

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
  padding: 0;
  margin: 0;
  position: relative;
  display: flex;
  width: 100vw;
  /* Use viewport width */
  max-width: none;
  /* Override any max-width */
  overflow-x: hidden;
  /* Prevent horizontal scrollbar */
}

.full-width {
  width: 100vw !important;
  max-width: none !important;
  box-sizing: border-box;
}

.full-width-cards {
  width: 100% !important;
  max-width: 100% !important;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)) !important;
  gap: 40px !important;
  padding-right: 20px !important;
}

/* Left sidebar styles */
.left-sidebar {
  width: 280px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
  padding: 15px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
}

/* App title styles */
.app-title {
  padding: 15px 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 15px;
}

.app-title h1 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
  font-weight: 600;
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
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 15px;
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

/* Panel wrapper (always visible) */
.panel-wrapper {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f8f9fa;
}

.panel-wrapper::-webkit-scrollbar {
  width: 6px;
}

.panel-wrapper::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.panel-wrapper::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 6px;
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

/* Future options placeholder */
.future-options-placeholder {
  padding: 15px 0;
  text-align: center;
  color: #999;
  font-style: italic;
  font-size: 0.9rem;
  border-top: 1px dashed #ddd;
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
  padding: 20px 0 20px 30px;
  flex: 1;
  margin-left: 280px;
  /* Match the width of the sidebar */
  width: calc(100vw - 280px);
  /* Full viewport width minus sidebar */
  box-sizing: border-box;
  max-width: none;
  /* Override any max-width */
  overflow-x: hidden;
  /* Prevent horizontal scrollbar */
  padding-right: 0;
  /* Remove right padding */
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.theme-selector h2 {
  text-align: left;
  margin: 0;
  font-size: 1.8rem;
  color: #333;
  flex: 1;
}

.theme-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.95rem;
  width: 250px;
  transition: all 0.3s;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.search-input:focus {
  outline: none;
  border-color: #8e44ad;
  box-shadow: 0 2px 8px rgba(142, 68, 173, 0.2);
  width: 280px;
}

.no-themes-message {
  text-align: center;
  padding: 40px 0;
  color: #666;
  font-size: 1.1rem;
  font-style: italic;
}

.theme-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 30px;
  width: 100%;
  max-width: none;
  /* Override any max-width */
  margin-right: 0;
  /* Ensure no right margin */
  margin-bottom: 30px;
}

/* Special media query for wide screens with specific aspect ratios */
@media screen and (min-aspect-ratio: 16/9) {

  .theme-cards,
  .full-width-cards {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)) !important;
    gap: 35px !important;
  }
}

@media screen and (min-aspect-ratio: 21/9) {

  .theme-cards,
  .full-width-cards {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)) !important;
    gap: 35px !important;
    padding-right: 50px !important;
    /* margin-right: 30px !important; */
    width: calc(100vw - 280px) !important;
  }

  .theme-selector.full-width {
    width: 100vw !important;
    padding-right: 0 !important;
  }
}

@media (max-width: 1024px) {
  .left-sidebar {
    width: 250px;
  }

  .theme-selector {
    margin-left: 250px;
    width: calc(100vw - 250px);
    padding-right: 0;
  }

  .theme-cards {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)) !important;
    gap: 35px;
    margin-right: 0;
  }

  .container {
    width: 100vw;
    max-width: none;
  }


}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }

  .left-sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
    padding: 10px;
  }

  .theme-selector,
  .theme-selector.full-width {
    margin-left: 0;
    width: 100vw !important;
    padding-right: 0 !important;
  }

  .theme-cards,
  .full-width-cards {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)) !important;
    padding: 0 !important;
    gap: 30px !important;
    margin-right: 0 !important;
    width: 100% !important;
  }

  .theme-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
  }

  .search-input {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .search-input:focus {
    width: 100%;
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
    padding: 10px 0;
    margin-bottom: 10px;
    text-align: center;
  }

  .app-title h1 {
    font-size: 1.3rem;
  }

  /* Adjust management panel for mobile */
  .management-panel {
    margin-bottom: 10px;
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
    padding: 15px;
  }

  .theme-cards {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    padding: 0 5px;
  }
}

@media (max-width: 480px) {
  .theme-cards {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)) !important;
    gap: 20px;
  }

  .theme-header {
    margin-bottom: 15px;
  }

  .theme-selector h2 {
    font-size: 1.4rem;
  }

  .theme-selector {
    padding: 10px;
  }

  .app-title h1 {
    font-size: 1.1rem;
  }

  .section-header {
    flex-direction: row;
    padding: 8px 10px;
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
