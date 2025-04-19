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
  flex: 1;
  min-width: 250px;
  max-width: 350px;
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  border-left: 5px solid #ddd;
  display: flex;
  flex-direction: column;
  position: relative;
}

.theme-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.theme-card.active {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.theme-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ff6b00;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-right: 15px;
  flex-shrink: 0;
}

.theme-card-content {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-bottom: 15px;
}

.theme-content {
  flex: 1;
}

.theme-card h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.4rem;
}

.theme-card p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 8px;
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
  padding-top: 15px;
  margin-top: auto;
  gap: 10px;
}

.update-btn,
.delete-theme-btn {
  padding: 8px 15px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  min-width: 80px;
}

.update-btn {
  background-color: #2196F3;
}

.update-btn:hover {
  background-color: #0b7dda;
  transform: translateY(-2px);
}

.btn-icon {
  margin-right: 5px;
  font-size: 1.1rem;
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
    min-width: 100%;
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
</style>
