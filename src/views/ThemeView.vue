<template>
  <div class="container">
    <header>
      <h1>闪卡学习应用</h1>
    </header>

    <!-- Loading state -->
    <LoadingOverlay v-if="isLoading" />

    <div class="main-content">
      <!-- Category filter -->
      <div v-if="categories.length > 0" class="category-filter">
        <div class="category-buttons">
          <button 
            class="category-btn" 
            :class="{ active: !selectedCategory }"
            @click="setCategory('')"
          >
            全部
          </button>
          <button 
            v-for="category in categories" 
            :key="category"
            class="category-btn"
            :class="{ active: selectedCategory === category }"
            @click="setCategory(category)"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <div class="content-area">
        <!-- Current theme header -->
        <div v-if="currentThemeData" class="current-theme">
          <div class="theme-header">
            <div class="theme-title">
              <div class="theme-icon" :style="{ backgroundColor: currentThemeData.color }">
                {{ currentThemeData.icon.charAt(0).toUpperCase() }}
              </div>
              <h2>{{ currentThemeData.name }}</h2>
            </div>
            <div class="theme-stats">
              <div class="stats-item">
                <span class="stats-label">当前分类</span>
                <span class="stats-value">{{ selectedCategory || '全部' }}</span>
              </div>
              <div class="stats-item">
                <span class="stats-label">学习进度</span>
                <span class="stats-value">{{ viewedCardsCount }}/{{ filteredFlashcards.length }}</span>
              </div>
            </div>
          </div>

          <!-- Theme progress -->
          <div class="theme-progress">
            <div class="progress-info">
              <span class="progress-percentage">{{ themeProgress }}%</span>
              <span class="progress-label">已完成</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: `${themeProgress}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Main content area -->
        <div class="main-content-wrapper">
          <!-- Flashcard area -->
          <div class="flashcard-area">
            <!-- Keyboard shortcuts -->
            <div v-if="filteredFlashcards.length > 0" class="keyboard-shortcuts">
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

            <!-- Flashcard -->
            <div v-if="filteredFlashcards.length > 0" class="flashcard-container">
              <div class="flashcard" :class="{ flipped: isFlipped }" @click="flipCard"
                :style="currentThemeData ? { '--theme-color': currentThemeData.color } : {}">
                <div class="flashcard-front">
                  <div class="flashcard-content">{{ currentCard.question }}</div>
                </div>
                <div class="flashcard-back">
                  <div class="flashcard-content" v-html="currentCard.answer"></div>
                </div>
              </div>
            </div>

            <!-- Navigation controls -->
            <div v-if="filteredFlashcards.length > 0" class="navigation-controls">
              <button @click="prevCard" :disabled="currentIndex <= 0" class="nav-btn prev-btn">
                <span class="btn-icon">←</span>
              </button>
              <span class="card-count">{{ currentIndex + 1 }} / {{ filteredFlashcards.length }}</span>
              <button @click="nextCard" :disabled="currentIndex >= filteredFlashcards.length - 1" class="nav-btn next-btn">
                <span class="btn-icon">→</span>
              </button>
            </div>

            <!-- No cards message -->
            <div v-else-if="!isLoading" class="no-cards-message">
              <p>没有找到闪卡数据。</p>
              <button @click="goToHome" class="return-btn">返回主题选择</button>
            </div>
          </div>

          <!-- Right sidebar -->
          <div class="right-sidebar">
            <!-- Review status -->
            <div v-if="currentCardStatus === 'review'" class="review-status">
              <div v-if="isCardDueForReview" class="review-due">
                <span class="review-icon">⏰</span>
                <span>需要复习</span>
              </div>
              <div v-else class="next-review">
                <span class="review-icon">📅</span>
                <span>下次复习: {{ formatReviewTime }}</span>
              </div>
            </div>

            <!-- Card status controls -->
            <div class="card-status-controls">
              <div class="status-group">
                <button 
                  class="status-btn mastered-btn" 
                  :class="{ active: currentCardStatus === 'mastered' }"
                  @click="markCardAsMastered"
                  title="标记为已掌握"
                >
                  <span class="btn-icon">✓</span>
                  <span class="btn-label">已掌握</span>
                </button>
                <button 
                  class="status-btn review-btn" 
                  :class="{ active: currentCardStatus === 'review' }"
                  @click="markCardForReview"
                  title="标记为需要复习"
                >
                  <span class="btn-icon">↻</span>
                  <span class="btn-label">需要复习</span>
                </button>
              </div>
              <button 
                class="status-btn reset-btn" 
                v-if="currentCardStatus"
                @click="resetCardStatus"
                title="重置状态"
              >
                <span class="btn-icon">↺</span>
                <span class="btn-label">重置状态</span>
              </button>
            </div>

            <!-- Action controls -->
            <div class="action-controls">
              <button @click="resetCards" class="action-btn">
                <span class="btn-icon">↻</span>
                <span>重置学习</span>
              </button>
              <button @click="goToHome" class="action-btn">
                <span class="btn-icon">←</span>
                <span>返回主题选择</span>
              </button>
              <button class="delete-btn action-btn" @click="deleteCurrentCard">
                <span class="btn-icon">🗑️</span>
                <span>删除卡片</span>
              </button>
            </div>
          </div>
        </div>
      </div>
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
const currentCardStatus = computed(() => flashcardStore.currentCardStatus)
const currentCardReviewTime = computed(() => flashcardStore.currentCardReviewTime)
const isCardDueForReview = computed(() => flashcardStore.isCardDueForReview)

const viewedCardsCount = computed(() => {
  const themeViewed = progressStore.viewedCards[themeId.value]
  if (!themeViewed) return 0

  // Count only viewed cards in the current category
  if (selectedCategory.value) {
    return filteredFlashcards.value.filter(card => {
      const cardIndex = flashcards.value.findIndex(f => 
        f.question === card.question && f.answer === card.answer
      )
      return themeViewed[cardIndex]
    }).length
  }

  return Object.keys(themeViewed).length
})

const themeProgress = computed(() => {
  const totalCards = filteredFlashcards.value.length
  if (totalCards === 0) return 0
  return Math.round((viewedCardsCount.value / totalCards) * 100)
})

const categories = computed(() => flashcardStore.categories)
const selectedCategory = computed(() => flashcardStore.selectedCategory)
const filteredFlashcards = computed(() => flashcardStore.filteredFlashcards)

const formatReviewTime = computed(() => {
  if (!currentCardReviewTime.value) return ''
  
  const reviewTime = new Date(currentCardReviewTime.value)
  const now = new Date()
  const diff = reviewTime - now
  
  if (diff < 0) return '现在'
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天后`
  if (hours > 0) return `${hours}小时后`
  return `${minutes}分钟后`
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

function setCategory(category) {
  flashcardStore.setCategory(category)
}

function markCardForReview() {
  flashcardStore.markCardForReview()
}

function markCardAsMastered() {
  flashcardStore.markCardAsMastered()
}

function resetCardStatus() {
  flashcardStore.resetCardStatus()
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
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.main-content {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.category-filter {
  width: 200px;
  flex-shrink: 0;
  background-color: #f8f8f8;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: calc(100vh - 200px);
  position: sticky;
  top: 20px;
}

.category-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 5px;
}

.category-buttons::-webkit-scrollbar {
  width: 6px;
}

.category-buttons::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.category-buttons::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.category-buttons::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

.category-btn {
  padding: 12px 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-btn:hover {
  background-color: #e0e0e0;
}

.category-btn.active {
  background-color: var(--theme-color, #ff6b00);
  color: white;
}

.content-area {
  flex: 1;
  min-width: 0;
}

/* Current theme styles */
.current-theme {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.theme-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.theme-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: var(--theme-color, #ff6b00);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 1.4rem;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.theme-title h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
  font-weight: 600;
}

.theme-stats {
  display: flex;
  gap: 24px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stats-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 4px;
}

.stats-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

/* Theme progress styles */
.theme-progress {
  display: flex;
  align-items: center;
  gap: 20px;
}

.progress-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 120px;
}

.progress-percentage {
  font-size: 2rem;
  font-weight: bold;
  color: var(--theme-color, #ff6b00);
  line-height: 1;
}

.progress-label {
  font-size: 1rem;
  color: #666;
}

.progress-bar-container {
  flex: 1;
  height: 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--theme-color, #ff6b00);
  border-radius: 6px;
  transition: width 0.5s ease;
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

/* Flashcard styles */
.flashcard-container {
  perspective: 1000px;
  margin: 40px auto;
  width: 100%;
  max-width: 600px;
}

.flashcard {
  position: relative;
  width: 100%;
  height: 400px;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  cursor: pointer;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  border-radius: 15px;
  background-color: white;
}

.flashcard-back {
  transform: rotateY(180deg);
  background-color: var(--theme-color, #f5f5f5);
  color: white;
}

.flashcard-content {
  font-size: 1.2rem;
  line-height: 1.6;
  text-align: center;
  width: 100%;
  white-space: pre-wrap;
}

/* 答案文本样式优化 */
.flashcard-back .flashcard-content {
  text-align: left;
  font-size: 1.1rem;
  line-height: 1.8;
}

/* 列表项样式 */
.flashcard-back .flashcard-content ul,
.flashcard-back .flashcard-content ol {
  margin: 10px 0;
  padding-left: 20px;
}

.flashcard-back .flashcard-content li {
  margin-bottom: 8px;
}

/* 强调文本样式 */
.flashcard-back .flashcard-content strong {
  color: #fff;
  font-weight: bold;
}

/* 代码块样式 */
.flashcard-back .flashcard-content code {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

/* 分隔线样式 */
.flashcard-back .flashcard-content hr {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  margin: 15px 0;
}

/* 问题文本样式 */
.flashcard-front .flashcard-content {
  font-size: 1.3rem;
  font-weight: 500;
  color: #333;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .flashcard {
    height: 300px;
  }

  .flashcard-content {
    font-size: 1rem;
  }

  .flashcard-back .flashcard-content {
    font-size: 0.95rem;
  }
}

.right-sidebar {
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
  height: fit-content;
}

.card-status-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.status-group {
  display: flex;
  gap: 8px;
}

.status-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
  background-color: #f0f0f0;
  color: #666;
  flex: 1;
}

.status-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-btn.active {
  color: white;
}

.mastered-btn.active {
  background-color: #4CAF50;
}

.review-btn.active {
  background-color: #FF9800;
}

.reset-btn {
  background-color: #f44336;
  color: white;
  width: 100%;
}

.reset-btn:hover {
  background-color: #d32f2f;
}

.btn-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.btn-label {
  flex: 1;
  text-align: left;
}

.action-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  text-align: left;
  width: 100%;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #e0e0e0;
}

.delete-btn {
  background-color: #ffebee !important;
  color: #f44336;
}

.delete-btn:hover {
  background-color: #ffcdd2 !important;
}

.review-status {
  padding: 15px;
  border-radius: 8px;
  background-color: white;
  text-align: center;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.review-due {
  color: #f44336;
  font-weight: bold;
}

.next-review {
  color: #2196F3;
}

.review-icon {
  margin-right: 5px;
  font-size: 1.1rem;
}

.main-content-wrapper {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.flashcard-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.nav-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background-color: var(--theme-color, #ff6b00);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-size: 1.5rem;
}

.nav-btn:hover:not(:disabled) {
  transform: scale(1.1);
  background-color: var(--theme-color-dark, #e05e00);
}

.nav-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.card-count {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  min-width: 80px;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content-wrapper {
    flex-direction: column;
  }

  .right-sidebar {
    width: 100%;
    position: static;
  }

  .status-group {
    flex-direction: column;
  }

  .status-btn {
    width: 100%;
  }
}
</style>
