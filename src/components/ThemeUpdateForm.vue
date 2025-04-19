<template>
  <div class="theme-update-overlay">
    <div class="theme-update-form">
      <h2>更新主题</h2>
      
      <div class="form-group">
        <label for="update-theme-name">主题名称:</label>
        <input 
          type="text" 
          id="update-theme-name" 
          v-model="themeName" 
          placeholder="例如: 英语单词、历史事件等"
        />
      </div>
      
      <div class="form-group">
        <label for="update-theme-description">主题描述:</label>
        <textarea 
          id="update-theme-description" 
          v-model="themeDescription" 
          placeholder="简要描述这个闪卡集合的内容"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label for="update-theme-color">主题颜色:</label>
        <input type="color" id="update-theme-color" v-model="themeColor" />
      </div>
      
      <div class="form-group">
        <label for="update-theme-file">闪卡内容 (TSV文件):</label>
        <div class="file-input-wrapper">
          <button class="file-input-button">
            <span class="btn-icon">📂</span> 选择文件
          </button>
          <input type="file" id="update-theme-file" accept=".tsv,.txt" @change="handleFileUpload" />
        </div>
        <div v-if="selectedFile" class="selected-file-info">
          已选择: {{ selectedFile.name }}
        </div>
        <div v-else class="current-file-info">
          当前使用已保存的闪卡内容
        </div>
      </div>
      
      <div class="form-actions">
        <button class="submit-btn" @click="submitForm" :disabled="!isFormValid">更新主题</button>
        <button class="cancel-btn" @click="$emit('close')">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  theme: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

// Form data
const themeName = ref('')
const themeDescription = ref('')
const themeColor = ref('#8e44ad')
const selectedFile = ref(null)
const fileContent = ref(null)

// Computed properties
const isFormValid = computed(() => {
  return themeName.value.trim() !== ''
})

// Methods
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  selectedFile.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    fileContent.value = e.target.result
    
    // Basic validation - check if file has tab-separated values
    const lines = fileContent.value.trim().split('\n')
    if (lines.length < 2 || !lines[0].includes('\t')) {
      alert('文件格式不正确。请确保文件包含标题行和至少一行数据，并且使用制表符分隔列。')
      resetFileInput()
    }
  }
  reader.onerror = () => {
    alert('读取文件失败，请重试。')
    resetFileInput()
  }
  reader.readAsText(file)
}

function resetFileInput() {
  selectedFile.value = null
  fileContent.value = null
  
  // Reset file input
  const fileInput = document.getElementById('update-theme-file')
  if (fileInput) {
    fileInput.value = ''
  }
}

function submitForm() {
  if (!isFormValid.value) {
    alert('请填写所有必填字段。')
    return
  }
  
  // Create updated theme object
  const updatedTheme = {
    id: props.theme.id,
    name: themeName.value.trim(),
    description: themeDescription.value.trim() || '自定义闪卡集合',
    icon: themeName.value.charAt(0).toUpperCase(),
    color: themeColor.value,
    cardsContent: fileContent.value || props.theme.cardsContent
  }
  
  // Emit submit event with updated theme data
  emit('submit', updatedTheme)
}

// Initialize form with theme data
onMounted(() => {
  themeName.value = props.theme.name || ''
  themeDescription.value = props.theme.description || ''
  themeColor.value = props.theme.color || '#8e44ad'
  fileContent.value = props.theme.cardsContent || null
})
</script>

<style scoped>
.theme-update-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.theme-update-form {
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.theme-update-form h2 {
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

.file-input-wrapper {
  position: relative;
  overflow: hidden;
  display: inline-block;
}

.file-input-wrapper input[type="file"] {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-input-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background-color: #ff6b00;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.file-input-button:hover {
  background-color: #e05e00;
}

.selected-file-info,
.current-file-info {
  margin-top: 10px;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 5px;
  font-size: 0.9rem;
  color: #333;
}

.current-file-info {
  font-style: italic;
  color: #666;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.submit-btn,
.cancel-btn {
  padding: 10px 20px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  flex: 1;
}

.submit-btn {
  background-color: #4CAF50;
  margin-right: 10px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #3e8e41;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #9e9e9e;
}

.cancel-btn:hover {
  background-color: #757575;
  transform: translateY(-2px);
}

.btn-icon {
  margin-right: 5px;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .theme-update-form {
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
