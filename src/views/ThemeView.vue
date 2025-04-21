<template>
  <div class="container">
    <header>
      <h1 class="header-title" @click="goToHome">闪卡学习应用</h1>
    </header>

    <!-- Loading state -->
    <LoadingOverlay v-if="isLoading" />

    <div class="main-content">
      <!-- Left sidebar with category and search filters -->
      <div class="left-sidebar">
        <!-- Category filter -->
        <div v-if="categories.length > 0" class="category-section">
          <h3>分类</h3>
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

        <!-- Search and filter controls -->
        <div class="search-filter-section">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="搜索卡片..." 
              @input="handleSearch"
            />
          </div>
          
          <div class="filter-group">
            <button 
              class="filter-btn" 
              :class="{ active: filterMode === 'all' }"
              @click="setFilterMode('all')"
            >
              <span class="btn-icon">📚</span>
              <span class="btn-label">全部卡片</span>
            </button>
            <button 
              class="filter-btn" 
              :class="{ active: filterMode === 'review' }"
              @click="setFilterMode('review')"
            >
              <span class="btn-icon">⏰</span>
              <span class="btn-label">需要复习</span>
            </button>
            <button 
              class="filter-btn" 
              :class="{ active: filterMode === 'mastered' }"
              @click="setFilterMode('mastered')"
            >
              <span class="btn-icon">✓</span>
              <span class="btn-label">已掌握</span>
            </button>
            <button 
              class="filter-btn" 
              :class="{ active: filterMode === 'new' }"
              @click="setFilterMode('new')"
            >
              <span class="btn-icon">✨</span>
              <span class="btn-label">新卡片</span>
            </button>
          </div>
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
            <div class="progress-header">
              <div class="progress-info">
                <span class="progress-percentage">{{ themeProgress }}%</span>
                <span class="progress-label">已完成</span>
              </div>
              <div class="progress-stats">
                <div class="card-count">
                  <span class="count-current">{{ currentIndex + 1 }}</span>
                  <span class="count-separator">/</span>
                  <span class="count-total">{{ filteredFlashcards.length }}</span>
                </div>
                <div class="keyboard-shortcuts">
                  <div class="shortcut-item">
                    <span class="shortcut-key">空格</span>
                    <span class="shortcut-desc">翻转</span>
                  </div>
                </div>
                <div class="progress-navigation">
                  <button @click="prevCard" :disabled="currentIndex <= 0" class="progress-nav-btn">
                    <span class="btn-icon">←</span>
                    <span>上一张</span>
                  </button>
                  <button @click="nextCard" :disabled="currentIndex >= filteredFlashcards.length - 1" class="progress-nav-btn">
                    <span class="btn-icon">→</span>
                    <span>下一张</span>
                  </button>
                </div>
              </div>
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
            <!-- Flashcard -->
            <div v-if="filteredFlashcards.length > 0" class="flashcard-container">
              <div class="flashcard" :class="{ flipped: isFlipped }" @click="handleCardClick"
                :style="currentThemeData ? { '--theme-color': currentThemeData.color } : {}">
                <div class="flashcard-front">
                  <div class="flashcard-content">{{ currentCard.question }}</div>
                </div>
                <div class="flashcard-back">
                  <div class="flashcard-content" v-html="currentCard.answer"></div>
                </div>
              </div>
            </div>

            <!-- No cards message -->
            <div v-else-if="!isLoading" class="no-cards-message">
              <p>没有找到闪卡数据。</p>
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

const filterMode = computed(() => flashcardStore.filterMode)
const searchQuery = ref('')

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

function setFilterMode(mode) {
  flashcardStore.setFilterMode(mode)
}

function handleSearch() {
  flashcardStore.setSearchQuery(searchQuery.value)
}

function handleCardClick() {
  // 只翻转卡片，不自动切换到下一张
  flipCard()
}

// Keyboard event handler
function handleKeyDown(e) {
  if (flashcards.value.length === 0) return

  if (e.key === 'ArrowLeft') {
    prevCard()
  } else if (e.key === 'ArrowRight') {
    nextCard()
  } else if (e.key === ' ' || e.key === 'Enter') {
    handleCardClick()
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
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.main-content {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.left-sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 20px;
  height: fit-content;
}

.category-section {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.category-section h3 {
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  color: #333;
  font-weight: 600;
}

.category-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f8f9fa;
}

.category-buttons::-webkit-scrollbar {
  width: 6px;
}

.category-buttons::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.category-buttons::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 3px;
}

.category-btn {
  padding: 12px 16px;
  background-color: #f8f9fa;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  text-align: left;
  white-space: normal;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-all;
  min-height: 44px;
  display: flex;
  align-items: center;
  width: 100%;
  line-height: 1.4;
}

.category-btn:hover {
  background-color: #f0f0f0;
}

.category-btn.active {
  background-color: var(--theme-color, #ff6b00);
  color: white;
}

.search-filter-section {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-box {
  margin-bottom: 15px;
}

.search-box input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s;
  background-color: #f8f9fa;
}

.search-box input:focus {
  outline: none;
  border-color: var(--theme-color, #ff6b00);
  box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.1);
  background-color: white;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  background-color: #f8f9fa;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
  text-align: left;
}

.filter-btn:hover {
  background-color: #f0f0f0;
}

.filter-btn.active {
  background-color: var(--theme-color, #ff6b00);
  color: white;
}

.content-area {
  flex: 1;
  min-width: 0;
  max-width: 1000px;
  margin: 0 auto;
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
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.flashcard-container {
  perspective: 1000px;
  margin: 20px auto;
  width: 100%;
  max-width: 800px;
}

.flashcard {
  position: relative;
  width: 100%;
  height: 500px;
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

/* No cards message */
.no-cards-message {
  text-align: center;
  margin: 50px 0;
}

.no-cards-message p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 20px;
}

/* Navigation controls style */
.navigation-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.nav-btn {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: none;
  background-color: var(--theme-color, #ff6b00);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-size: 1.2rem;
}

.nav-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  background-color: var(--theme-color-dark, #e05e00);
}

.nav-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* Right sidebar */
.right-sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
  height: fit-content;
  margin-top: 20px;
}

/* Right sidebar button styles */
.status-btn, .action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
  width: 100%;
  justify-content: flex-start;
  white-space: normal;
  word-break: break-word;
}

.btn-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.btn-label {
  flex: 1;
  text-align: left;
  white-space: normal;
  word-break: break-word;
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
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
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

.progress-stats {
  display: flex;
  align-items: center;
  gap: 24px;
}

.card-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 1.2rem;
  color: #333;
  padding: 4px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.count-current {
  font-weight: 600;
  color: var(--theme-color, #ff6b00);
}

.count-separator {
  color: #999;
  margin: 0 2px;
}

.count-total {
  color: #666;
}

.keyboard-shortcuts {
  display: flex;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.shortcut-key {
  display: inline-block;
  padding: 2px 6px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
  border: 1px solid #e0e0e0;
}

.shortcut-desc {
  font-size: 0.8rem;
  color: #666;
}

.progress-bar-container {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--theme-color, #ff6b00);
  border-radius: 4px;
  transition: width 0.5s ease;
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

.action-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.action-btn {
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 44px;
}

.delete-btn {
  background-color: #ffebee !important;
  color: #f44336;
}

.delete-btn:hover {
  background-color: #ffcdd2 !important;
}

.review-status {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  text-align: center;
  font-size: 0.9rem;
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
  width: 100%;
}

.status-btn {
  flex: 1;
  min-width: 0;
  height: auto;
  min-height: 44px;
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

/* Responsive adjustments */
@media (max-width: 1400px) {
  .main-content {
    max-width: 1200px;
  }
}

@media (max-width: 1200px) {
  .main-content {
    max-width: 1000px;
  }
  
  .left-sidebar,
  .right-sidebar {
    width: 220px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    max-width: 800px;
  }
  
  .left-sidebar,
  .right-sidebar {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    max-width: 600px;
  }

  .main-content-wrapper {
    flex-direction: column;
  }

  .left-sidebar,
  .right-sidebar {
    width: 100%;
    position: static;
  }

  .category-buttons {
    flex-direction: row;
    flex-wrap: wrap;
    max-height: none;
    padding-right: 0;
  }

  .category-btn {
    flex: 1 1 auto;
    min-width: 150px;
    max-width: calc(50% - 4px);
  }

  .filter-group {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .filter-btn {
    flex: 1;
    min-width: 120px;
  }

  .status-group {
    flex-direction: column;
  }

  .status-btn {
    width: 100%;
  }

  .flashcard-area {
    padding: 0;
  }

  .navigation-controls {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .main-content {
    max-width: 100%;
  }

  .category-buttons,
  .filter-group {
    flex-direction: column;
  }

  .category-btn,
  .filter-btn {
    width: 100%;
  }
}

/* Responsive adjustments */
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

/* 在样式部分添加新的样式 */
.progress-navigation {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.progress-nav-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background-color: var(--theme-color, #ff6b00);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.progress-nav-btn:hover:not(:disabled) {
  background-color: var(--theme-color-dark, #e05e00);
  transform: translateY(-2px);
}

.progress-nav-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* Add header title styles */
.header-title {
  cursor: pointer;
  transition: color 0.3s;
  display: inline-block;
  position: relative;
}

.header-title:hover {
  color: var(--theme-color, #ff6b00);
}

.header-title::after {
  content: '←';
  position: absolute;
  left: -25px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.header-title:hover::after {
  opacity: 1;
}
</style>
