<template>
  <div class="container">
    <header>
      <h1>闪卡学习应用</h1>
    </header>

    <!-- Loading state -->
    <LoadingOverlay v-if="isLoading" />

    <!-- File upload form -->
    <div class="file-upload">
      <h2>创建自定义闪卡</h2>
      <p>上传TSV文件创建自定义闪卡集合。文件应包含两列：问题和答案，以制表符分隔。</p>

      <div class="file-actions">
        <div class="upload-action">
          <label for="file-upload" class="upload-btn">
            <span class="btn-icon">📂</span> 选择文件
          </label>
          <input type="file" id="file-upload" accept=".tsv,.txt" @change="handleFileUpload" />
        </div>

        <div class="template-action">
          <button class="download-btn" @click="downloadTemplate">
            <span class="btn-icon">📄</span> 下载模板
          </button>
        </div>
      </div>

      <div v-if="selectedFile" class="selected-file-info">
        已选择: {{ selectedFile.name }}
      </div>

      <div class="return-action">
        <button class="cancel-btn" @click="goToHome">
          <span class="btn-icon">←</span> 返回主题选择
        </button>
      </div>
    </div>

    <!-- Theme name input -->
    <div v-if="fileContent" class="theme-name-form">
      <h3>为您的闪卡集合命名</h3>
      <div class="form-group">
        <label for="theme-name">主题名称:</label>
        <input type="text" id="theme-name" v-model="themeName" placeholder="例如: 英语单词、历史事件等" />
      </div>
      <div class="form-group">
        <label for="theme-description">主题描述:</label>
        <textarea id="theme-description" v-model="themeDescription" placeholder="简要描述这个闪卡集合的内容"></textarea>
      </div>
      <div class="form-group">
        <label for="theme-color">主题颜色:</label>
        <input type="color" id="theme-color" v-model="themeColor" />
      </div>
      <div class="form-actions">
        <button class="submit-btn" @click="createCustomTheme">创建主题</button>
        <button class="cancel-btn" @click="resetForm">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '../stores/theme'
import { useFlashcardStore } from '../stores/flashcard'
import LoadingOverlay from '../components/LoadingOverlay.vue'

const router = useRouter()
const themeStore = useThemeStore()
const flashcardStore = useFlashcardStore()

// Refs
const selectedFile = ref(null)
const fileContent = ref(null)
const themeName = ref('')
const themeDescription = ref('')
const themeColor = ref('#8e44ad')

// Computed
const isLoading = computed(() => themeStore.isLoading)

// Methods
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    fileContent.value = e.target.result

    // Try to parse the file to validate format
    try {
      flashcardStore.parseAndLoadCards(fileContent.value)
      // Reset cards after validation
      flashcardStore.resetCards()
    } catch (error) {
      alert('文件格式不正确: ' + error.message)
      resetForm()
    }
  }
  reader.onerror = () => {
    alert('读取文件失败，请重试。')
    resetForm()
  }
  reader.readAsText(file)
}

function downloadTemplate() {
  fetch('/template/flashcard_template.tsv')
    .then(response => response.text())
    .then(content => {
      const blob = new Blob([content], { type: 'text/tab-separated-values' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '闪卡模板.tsv'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    })
    .catch(error => {
      console.error('下载模板失败:', error)
      alert('下载模板失败，请重试')
    })
}

function createCustomTheme() {
  if (!themeName.value.trim()) {
    alert('请输入主题名称')
    return
  }

  if (!fileContent.value) {
    alert('请上传TSV文件')
    return
  }

  // Generate a unique ID for the theme
  const themeId = 'user_' + Date.now()

  // Create theme object
  const newTheme = {
    id: themeId,
    name: themeName.value.trim(),
    description: themeDescription.value.trim() || '自定义闪卡集合',
    icon: themeName.value.charAt(0).toUpperCase(),
    color: themeColor.value,
    cardsContent: fileContent.value
  }

  // Save theme
  themeStore.saveUserTheme(newTheme)

  // Navigate to the new theme
  router.push({ name: 'theme', params: { id: themeId } })
}

function resetForm() {
  selectedFile.value = null
  fileContent.value = null
  themeName.value = ''
  themeDescription.value = ''
  themeColor.value = '#8e44ad'

  // Reset file input
  const fileInput = document.getElementById('file-upload')
  if (fileInput) {
    fileInput.value = ''
  }
}

function goToHome() {
  router.push({ name: 'home' })
}
</script>

<style scoped>
/* File upload styles */
.file-upload {
  max-width: 600px;
  margin: 0 auto 40px;
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.file-upload p {
  margin-bottom: 20px;
  color: #666;
}

.file-upload input[type="file"] {
  display: none;
}

.file-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.upload-action,
.template-action {
  flex: 1;
  min-width: 150px;
  max-width: 250px;
}

.upload-btn,
.download-btn,
.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  width: 100%;
  min-width: 150px;
}

.upload-btn {
  background-color: #ff6b00;
}

.upload-btn:hover {
  background-color: #e05e00;
  transform: translateY(-2px);
}

.download-btn {
  background-color: #2196F3;
}

.download-btn:hover {
  background-color: #0b7dda;
  transform: translateY(-2px);
}

.cancel-btn {
  background-color: #9e9e9e;
}

.cancel-btn:hover {
  background-color: #757575;
  transform: translateY(-2px);
}

.return-action {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.btn-icon {
  margin-right: 5px;
  font-size: 1.1rem;
}

.selected-file-info {
  margin: 15px 0;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  font-size: 0.9rem;
  color: #333;
}

/* Theme name form styles */
.theme-name-form {
  max-width: 600px;
  margin: 0 auto 40px;
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.theme-name-form h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.form-group textarea {
  height: 100px;
  resize: vertical;
}

.form-group input[type="color"] {
  width: 100%;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  gap: 15px;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  flex: 1;
  min-width: 120px;
}

.submit-btn:hover {
  background-color: #3e8e41;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .file-upload {
    padding: 20px;
  }

  .file-actions {
    flex-direction: column;
    gap: 15px;
  }

  .upload-action,
  .template-action {
    max-width: 100%;
    width: 100%;
  }

  .upload-btn,
  .download-btn,
  .cancel-btn {
    padding: 10px 15px;
    font-size: 0.9rem;
  }

  .theme-name-form {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
    gap: 10px;
  }

  .submit-btn,
  .cancel-btn {
    margin: 0;
    width: 100%;
  }
}
</style>
