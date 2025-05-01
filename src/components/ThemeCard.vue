<template>
  <div class="theme-card" :style="{ borderTopColor: theme.color }">
    <div class="theme-card-content" @click="$emit('select', theme.id)">
      <div class="theme-header">
        <div class="theme-icon" :style="{ backgroundColor: theme.color }">
          {{ theme.icon.charAt(0).toUpperCase() }}
        </div>
        <h3>{{ theme.name }}</h3>
      </div>
      <div class="theme-content">
        <p>{{ theme.description }}</p>
        <div class="progress-indicator" v-if="hasProgress">
          <div class="progress-bar" :style="{ width: `${progress}%`, backgroundColor: theme.color }"></div>
        </div>
        <div class="progress-text" v-if="hasProgress">{{ progress }}% 完成</div>
      </div>
    </div>

    <!-- Only show actions for user themes -->
    <div class="theme-actions" v-if="isUserTheme">
      <button class="update-btn" @click.stop="$emit('update', theme)">
        <span class="btn-icon">✏️</span> 更新
      </button>
      <button class="delete-theme-btn" @click.stop="$emit('delete', theme.id)">
        <span class="btn-icon">🗑️</span> 删除
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useProgressStore } from '../stores/progress'
import { useThemeStore } from '../stores/theme'

const props = defineProps({
  theme: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select', 'update', 'delete'])

const progressStore = useProgressStore()
const themeStore = useThemeStore()

// State
const cardCount = ref(0)

// Computed properties
const isUserTheme = computed(() => {
  return props.theme.id.startsWith('user_')
})

const hasProgress = computed(() => {
  const themeProgress = progressStore.viewedCards[props.theme.id]
  return themeProgress && Object.keys(themeProgress).length > 0
})

const progress = computed(() => {
  return progressStore.getThemeProgress(props.theme.id, cardCount.value)
})

// Load actual card count for the theme
onMounted(async () => {
  cardCount.value = await themeStore.getThemeCardCount(props.theme.id)
})
</script>

<style scoped>
.theme-card {
  background-color: white;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-top: 10px solid #ddd;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  justify-content: space-between;
  width: 100%;
  min-width: 250px;
  max-width: 250px;
  /* Minimum width for better readability */
  aspect-ratio: 16/9;
  height: 100%;
  min-height: 180px;
  max-height: 180px;
  overflow: hidden;
  /* Fill the grid cell height */
  background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.01), rgba(0, 0, 0, 0.02));
}

.theme-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-top-width: 5px;
}

.theme-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0) 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 0;
}

.theme-card:hover::before {
  opacity: 0.4;
}

.theme-card.active {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.theme-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #ff6b00;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.theme-icon::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%);
  border-radius: inherit;
}

.theme-card-content {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding-bottom: 10px;
  flex: 1;
  min-height: 0;
  /* Allows content to shrink if needed */
  position: relative;
  z-index: 1;
  width: 100%;
  overflow: hidden;
  /* 确保内容不会溢出 */
}

.theme-header {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  width: 100%;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.theme-content {
  flex: 1;
  min-width: 0;
  /* Prevents overflow */
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  /* 确保内容不会溢出 */
  max-height: calc(100% - 46px);
  /* 减去标题栏高度 */
}

.theme-card h3 {
  color: #222;
  margin: 0;
  font-size: 1.2rem;
  word-break: break-word;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  font-weight: 600;
  letter-spacing: -0.01em;
  flex: 1;
  padding-left: 12px;
}

.theme-card p {
  color: #555;
  font-size: 0.95rem;
  margin: 0 0 10px 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  flex-shrink: 0;
  letter-spacing: 0.01em;
  opacity: 0.9;
  width: 100%;
  max-width: 100%;
  padding-left: 2px;
  text-overflow: ellipsis;
  word-break: break-word;
  max-height: 3em;
  /* 确保最多显示2行，每行1.5em */
}

/* Progress indicator styles */
.progress-indicator {
  width: 100%;
  height: 5px;
  background-color: #f5f5f5;
  border-radius: 100px;
  overflow: hidden;
  margin-top: 8px;
  position: relative;
  flex-shrink: 0;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
}

.progress-indicator .progress-bar {
  height: 100%;
  background-color: #4CAF50;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  border-radius: 100px;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

.progress-indicator .progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(200%);
  }
}

.progress-text {
  font-size: 0.75rem;
  color: #444;
  display: flex;
  margin-top: 4px;
  margin-bottom: 0;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.progress-text::before {
  content: '学习进度';
  font-size: 0.7rem;
  color: #777;
  font-weight: normal;
}

.theme-actions {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 10px;
  margin-top: auto;
  gap: 8px;
  flex-shrink: 0;
}

.update-btn,
.delete-theme-btn {
  padding: 8px 12px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  min-width: 70px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.update-btn {
  background-color: #2196F3;
  box-shadow: 0 2px 5px rgba(33, 150, 243, 0.3);
}

.update-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.4);
}

.btn-icon {
  margin-right: 8px;
  font-size: 1rem;
}

.delete-theme-btn {
  background-color: #f44336;
  box-shadow: 0 2px 5px rgba(244, 67, 54, 0.3);
}

.delete-theme-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.4);
}

@media (max-width: 768px) {
  .theme-card {
    padding: 14px;
    aspect-ratio: 16/9;
    /* Maintain 16:9 aspect ratio */
    min-height: 150px;
    max-height: 150px;
    min-width: 220px;
    border-radius: 12px;
  }

  .theme-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    margin-right: 12px;
  }

  .theme-card h3 {
    font-size: 1.05rem;
    padding-left: 10px;
  }

  .theme-card p {
    font-size: 0.85rem;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    margin-bottom: 6px;
    line-height: 1.4;
    max-height: 2.8em;
  }

  .theme-header {
    margin-bottom: 10px;
  }

  .theme-actions {
    padding-top: 12px;
    margin-top: 12px;
    flex-direction: row;
    gap: 10px;
  }

  .update-btn,
  .delete-theme-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
    width: 100%;
    border-radius: 6px;
  }

  .btn-icon {
    font-size: 0.95rem;
    margin-right: 6px;
  }

  /* Mobile progress indicator styles */
  .progress-indicator {
    height: 6px;
    margin-top: 10px;
  }

  .progress-text {
    font-size: 0.8rem;
    margin-top: 6px;
  }

  .progress-text::before {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .theme-card {
    padding: 12px;
    aspect-ratio: 3/2;
    /* 3:2 aspect ratio for mobile */
    min-height: 130px;
    max-height: 130px;
    min-width: 160px;
    border-radius: 10px;
    border-top-width: 3px;
  }

  .theme-icon {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
    margin-right: 10px;
    border-radius: 8px;
  }

  .theme-card h3 {
    font-size: 0.95rem;
    padding-left: 8px;
  }

  .theme-card p {
    font-size: 0.8rem;
    margin-bottom: 5px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    line-height: 1.3;
    max-height: 2.6em;
  }

  .theme-header {
    margin-bottom: 8px;
  }

  .theme-card-content {
    padding-bottom: 8px;
  }

  .progress-indicator {
    height: 4px;
    margin-top: 4px;
  }

  .progress-text {
    font-size: 0.7rem;
    margin-top: 3px;
  }

  .progress-text::before {
    font-size: 0.65rem;
  }

  .theme-actions {
    padding-top: 10px;
    gap: 8px;
  }

  .update-btn,
  .delete-theme-btn {
    padding: 7px 10px;
    font-size: 0.8rem;
    min-width: 60px;
    border-radius: 6px;
  }

  .btn-icon {
    font-size: 0.9rem;
    margin-right: 5px;
  }
}
</style>
