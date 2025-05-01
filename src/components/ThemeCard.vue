<template>
  <div class="theme-card" :style="{ borderLeftColor: theme.color }">
    <div class="theme-card-content" @click="$emit('select', theme.id)">
      <div class="theme-icon" :style="{ backgroundColor: theme.color }">
        {{ theme.icon.charAt(0).toUpperCase() }}
      </div>
      <div class="theme-content">
        <h3>{{ theme.name }}</h3>
        <p>{{ theme.description }}</p>
        <div class="progress-indicator" v-if="hasProgress">
          <div class="progress-bar" :style="{ width: `${progress}%`, backgroundColor: theme.color }"></div>
        </div>
        <span class="progress-text" v-if="hasProgress">{{ progress }}% 完成</span>
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
  width: 100%;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 5px solid #ddd;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  justify-content: space-between;
  min-width: 220px;
  /* Increased minimum width for better readability */
  aspect-ratio: 3/2;
  /* 3:2 aspect ratio for longer cards */
  overflow: hidden;
  /* Ensures content doesn't overflow */
  min-height: 180px;
  /* Minimum height to ensure content fits */
}

.theme-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
  border-left-width: 8px;
}

.theme-card.active {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.theme-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #ff6b00;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 1.1rem;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.theme-card-content {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  padding-bottom: 8px;
  flex: 1;
  min-height: 0;
  /* Allows content to shrink if needed */
}

.theme-content {
  flex: 1;
  min-width: 0;
  /* Prevents overflow */
  display: flex;
  flex-direction: column;
}

.theme-card h3 {
  color: #333;
  margin-bottom: 6px;
  font-size: 1.15rem;
  word-break: break-word;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  font-weight: 600;
}

.theme-card p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 10px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  flex-shrink: 0;
}

/* Progress indicator styles */
.progress-indicator {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
  position: relative;
  flex-shrink: 0;
}

.progress-indicator .progress-bar {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #666;
  display: block;
  margin-top: 5px;
  text-align: right;
}

.theme-actions {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #eee;
  padding-top: 6px;
  margin-top: auto;
  gap: 6px;
  flex-shrink: 0;
}

.update-btn,
.delete-theme-btn {
  padding: 6px 10px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  min-width: 60px;
}

.update-btn {
  background-color: #2196F3;
}

.update-btn:hover {
  background-color: #0b7dda;
  transform: translateY(-2px);
}

.btn-icon {
  margin-right: 4px;
  font-size: 0.9rem;
}

.delete-theme-btn {
  background-color: #ff3b30;
}

.delete-theme-btn:hover {
  background-color: #d9332b;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .theme-card {
    padding: 14px;
    aspect-ratio: 3/2;
    /* Maintain 3:2 aspect ratio */
    min-height: 160px;
    min-width: 200px;
  }

  .theme-card h3 {
    font-size: 0.9rem;
    margin-bottom: 3px;
  }

  .theme-card p {
    font-size: 0.8rem;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    margin-bottom: 4px;
  }

  .theme-actions {
    padding-top: 10px;
    margin-top: 10px;
    flex-direction: column;
    gap: 8px;
  }

  .update-btn,
  .delete-theme-btn {
    padding: 8px 10px;
    font-size: 0.85rem;
    width: 100%;
  }

  .btn-icon {
    font-size: 1rem;
  }

  /* Mobile progress indicator styles */
  .progress-indicator {
    height: 6px;
    margin-top: 5px;
  }

  .progress-text {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .theme-card {
    padding: 12px;
    aspect-ratio: 3/2;
    /* Maintain 3:2 aspect ratio */
    min-height: 150px;
    min-width: 160px;
    border-radius: 10px;
  }

  .theme-icon {
    width: 24px;
    height: 24px;
    font-size: 0.8rem;
    margin-right: 8px;
  }

  .theme-card h3 {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }

  .theme-card p {
    font-size: 0.75rem;
    margin-bottom: 6px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    line-height: 1.3;
  }

  .theme-card-content {
    padding-bottom: 3px;
  }

  .progress-indicator {
    height: 3px;
    margin-top: 2px;
  }

  .progress-text {
    font-size: 0.65rem;
  }

  .update-btn,
  .delete-theme-btn {
    padding: 3px 5px;
    font-size: 0.65rem;
    min-width: 40px;
  }

  .btn-icon {
    font-size: 0.85rem;
    margin-right: 3px;
  }
}
</style>
