<template>
  <div class="container">
    <header>
      <h1>闪卡学习应用</h1>
    </header>

    <!-- Loading state -->
    <LoadingOverlay v-if="isLoading" />

    <!-- Current theme header -->
    <div v-if="currentThemeData" class="current-theme">
      <div class="theme-icon" :style="{ backgroundColor: currentThemeData.color }">
        {{ currentThemeData.icon.charAt(0).toUpperCase() }}
      </div>
      <h2>{{ currentThemeData.name }}</h2>
    </div>

    <!-- Theme progress -->
    <div v-if="currentThemeData" class="theme-progress">
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: `${themeProgress}%` }"></div>
      </div>
      <div class="progress-stats">
        已学习 {{ themeProgress }}% ({{ viewedCardsCount }}/{{ flashcards.length }})
      </div>
    </div>

    <!-- Keyboard shortcuts -->
    <div v-if="flashcards.length > 0" class="keyboard-shortcuts">
      <div class="shortcut-item">
        <span class="shortcut-key">←</span>
        <span class="shortcut-desc">上一张</span>
      </div>
      <div class="shortcut-item">
        <span class="shortcut-key">→</span>
        <span class="shortcut-desc">下一张</span>
      </div>
      <div class="shortcut-item">
        <span class="shortcut-key">空格</span>
        <span class="shortcut-desc">翻转卡片</span>
      </div>
    </div>

    <!-- Controls -->
    <div v-if="flashcards.length > 0" class="controls">
      <div class="navigation-controls">
        <button @click="prevCard" :disabled="currentIndex <= 0">上一张</button>
        <span class="card-count">{{ currentIndex + 1 }} / {{ flashcards.length }}</span>
        <button @click="nextCard" :disabled="currentIndex >= flashcards.length - 1">下一张</button>
      </div>
      <div class="action-controls">
        <button @click="resetCards">重置</button>
        <button @click="goToHome">返回主题选择</button>
        <button class="delete-btn" @click="deleteCurrentCard">删除卡片</button>
      </div>
    </div>

    <!-- Flashcard -->
    <div v-if="flashcards.length > 0" class="flashcard-container">
      <div class="flashcard" :class="{ flipped: isFlipped }" @click="flipCard"
        :style="currentThemeData ? { '--theme-color': currentThemeData.color } : {}">
        <div class="flashcard-front">
          <div class="flashcard-content">{{ currentCard.question }}</div>
        </div>
        <div class="flashcard-back">
          <div class="flashcard-content">{{ currentCard.answer }}</div>
        </div>
      </div>
    </div>

    <!-- No cards message -->
    <div v-else-if="!isLoading" class="no-cards-message">
      <p>没有找到闪卡数据。</p>
      <button @click="goToHome" class="return-btn">返回主题选择</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '../stores/theme'
import { useFlashcardStore } from '../stores/flashcard'
import { useProgressStore } from '../stores/progress'
import LoadingOverlay from '../components/LoadingOverlay.vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const flashcardStore = useFlashcardStore()
const progressStore = useProgressStore()

// Computed properties
const themeId = computed(() => route.params.id)
const currentThemeData = computed(() => themeStore.currentThemeData)
const isLoading = computed(() => themeStore.isLoading)
const flashcards = computed(() => flashcardStore.flashcards)
const currentIndex = computed(() => flashcardStore.currentIndex)
const isFlipped = computed(() => flashcardStore.isFlipped)
const currentCard = computed(() => flashcardStore.currentCard)

const viewedCardsCount = computed(() => {
  const themeViewed = progressStore.viewedCards[themeId.value]
  return themeViewed ? Object.keys(themeViewed).length : 0
})

const themeProgress = computed(() => {
  return progressStore.getThemeProgress(themeId.value, flashcards.value.length)
})

// Methods
function flipCard() {
  const isNowFlipped = flashcardStore.flipCard()

  // If card is flipped to answer side, mark as viewed
  if (isNowFlipped) {
    progressStore.markCardAsViewed(themeId.value, currentIndex.value)
  }
}

function prevCard() {
  if (flashcardStore.prevCard()) {
    progressStore.saveProgress(themeId.value, currentIndex.value)
  }
}

function nextCard() {
  if (flashcardStore.nextCard()) {
    progressStore.saveProgress(themeId.value, currentIndex.value)
  }
}

function resetCards() {
  flashcardStore.resetCards()
  progressStore.saveProgress(themeId.value, 0)
}

function deleteCurrentCard() {
  if (confirm('确定要删除当前卡片吗？此操作不可撤销。')) {
    if (flashcardStore.deleteCurrentCard()) {
      progressStore.saveProgress(themeId.value, currentIndex.value)

      // If it's a user theme, update the theme content
      if (currentThemeData.value && !currentThemeData.value.cards) {
        updateUserThemeContent()
      }
    }
  }
}

function updateUserThemeContent() {
  // Convert flashcards to TSV format
  let tsvContent = 'question\tanswer\n'
  flashcards.value.forEach(card => {
    tsvContent += `${card.question}\t${card.answer}\n`
  })

  // Update theme in storage
  const theme = { ...currentThemeData.value, cardsContent: tsvContent }
  themeStore.saveUserTheme(theme)
}

function goToHome() {
  // Reset theme state
  themeStore.selectedTheme = ''
  themeStore.currentThemeData = null
  flashcardStore.resetCards()
  
  // Navigate to home
  router.push({ name: 'home' })
}

// Keyboard event handler
function handleKeyDown(e) {
  if (flashcards.value.length === 0) return

  if (e.key === 'ArrowLeft') {
    prevCard()
  } else if (e.key === 'ArrowRight') {
    nextCard()
  } else if (e.key === ' ' || e.key === 'Enter') {
    flipCard()
    e.preventDefault() // Prevent space from scrolling the page
  }
}

// Lifecycle hooks
onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)

  try {
    console.log('Loading theme with ID:', themeId.value)
    
    // Load theme data
    const cardsContent = await themeStore.loadTheme(themeId.value)
    console.log('Theme data loaded:', { 
      hasContent: !!cardsContent,
      themeData: currentThemeData.value
    })

    if (cardsContent) {
      try {
        // Parse and load cards
        flashcardStore.parseAndLoadCards(cardsContent)
        console.log('Cards loaded:', {
          count: flashcards.value.length,
          currentIndex: currentIndex.value
        })

        // Check if we need to continue from a specific card
        const continueFrom = parseInt(route.query.continueFrom)
        if (!isNaN(continueFrom) && continueFrom >= 0) {
          console.log('Continuing from card:', continueFrom)
          flashcardStore.setCurrentIndex(continueFrom)
        }

        // Save initial progress
        progressStore.saveProgress(themeId.value, currentIndex.value)
      } catch (parseError) {
        console.error('Failed to parse cards:', parseError)
        alert('闪卡数据格式不正确，请检查主题文件。')
        router.push({ name: 'home' })
      }
    } else {
      console.error('No cards content found for theme:', themeId.value)
      alert('无法加载闪卡数据，请检查主题文件是否存在。')
      router.push({ name: 'home' })
    }
  } catch (error) {
    console.error('Failed to load theme:', error)
    alert('加载主题失败，请重试或选择其他主题。')
    router.push({ name: 'home' })
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// Watch for changes to save progress
watch(currentIndex, () => {
  progressStore.saveProgress(themeId.value, currentIndex.value)
})
</script>

<style scoped>
/* Current theme styles */
.current-theme {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.current-theme h2 {
  margin: 0 0 0 15px;
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
  flex-shrink: 0;
}

/* Theme progress styles */
.theme-progress {
  max-width: 600px;
  margin: 0 auto 20px;
}

.progress-bar-container {
  width: 100%;
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-bar {
  height: 100%;
  background-color: #ff6b00;
  border-radius: 5px;
  transition: width 0.5s ease;
}

.progress-stats {
  text-align: center;
  font-size: 0.9rem;
  color: #666;
}

/* Keyboard shortcuts styles */
.keyboard-shortcuts {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.shortcut-key {
  display: inline-block;
  padding: 5px 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #ddd;
}

.shortcut-desc {
  font-size: 0.9rem;
  color: #666;
}

/* Controls styles */
.controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.navigation-controls,
.action-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.controls button {
  padding: 10px 20px;
  background-color: #ff6b00;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
  min-width: 100px;
  text-align: center;
}

.controls button:hover:not(:disabled) {
  background-color: #e05e00;
}

.controls button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #ff9500 !important;
}

.delete-btn:hover {
  background-color: #e68600 !important;
}

.card-count {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

/* Flashcard styles */
.flashcard-container {
  display: flex;
  justify-content: center;
  perspective: 1000px;
  min-height: 300px;
  margin-bottom: 50px;
}

.flashcard {
  width: 100%;
  max-width: 600px;
  height: 300px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s, box-shadow 0.3s;
  cursor: pointer;
  animation: float 6s ease-in-out infinite;
  --theme-color: #ff6b00;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-10px);
  }

  100% {
    transform: translateY(0px);
  }
}

.flashcard.flipped {
  transform: rotateY(180deg);
  animation: none;
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: white;
  overflow: auto;
  transition: box-shadow 0.3s;
}

.flashcard:hover .flashcard-front,
.flashcard:hover .flashcard-back {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.flashcard-front {
  border-left: 5px solid var(--theme-color);
}

.flashcard-back {
  transform: rotateY(180deg);
  border-left: 5px solid var(--theme-color);
  opacity: 0.9;
}

.flashcard-content {
  text-align: center;
  font-size: 1.5rem;
  line-height: 1.5;
}

.no-cards-message {
  text-align: center;
  margin: 50px 0;
}

.no-cards-message p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 20px;
}

.return-btn {
  padding: 10px 20px;
  background-color: #ff6b00;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.return-btn:hover {
  background-color: #e05e00;
}

@media (max-width: 768px) {
  .flashcard {
    max-width: 90%;
    height: 250px;
  }

  .keyboard-shortcuts {
    gap: 10px;
    margin-bottom: 10px;
  }

  .shortcut-key {
    padding: 3px 8px;
    font-size: 0.8rem;
  }

  .shortcut-desc {
    font-size: 0.8rem;
  }

  .controls {
    gap: 15px;
  }

  .navigation-controls,
  .action-controls {
    gap: 8px;
    width: 100%;
  }

  .controls button {
    padding: 8px 12px;
    font-size: 0.9rem;
    flex: 1;
    min-width: 80px;
    max-width: 150px;
  }

  .card-count {
    min-width: 60px;
    text-align: center;
  }

  .flashcard-content {
    font-size: 1.2rem;
  }

  .theme-progress {
    max-width: 100%;
    padding: 0 10px;
  }

  .progress-stats {
    font-size: 0.8rem;
  }
}
</style>
