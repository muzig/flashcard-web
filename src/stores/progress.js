import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProgressStore = defineStore('progress', () => {
  // State
  const viewedCards = ref({})
  const lastStudyTimestamp = ref(null)
  const hasProgress = ref(false)

  // Getters
  const getThemeProgress = computed(() => {
    return (themeId, totalCards) => {
      if (!viewedCards.value[themeId]) return 0
      
      const viewed = Object.keys(viewedCards.value[themeId]).length
      return totalCards > 0 ? Math.round((viewed / totalCards) * 100) : 0
    }
  })

  const formatLastStudyTime = computed(() => {
    if (!lastStudyTimestamp.value) return ''
    
    const now = new Date()
    const lastStudy = new Date(lastStudyTimestamp.value)
    const diffMs = now - lastStudy
    
    // Convert to minutes, hours, days
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 60) {
      return `${diffMinutes} 分钟前`
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`
    } else {
      return `${diffDays} 天前`
    }
  })

  // Actions
  function loadProgress() {
    try {
      const savedProgress = localStorage.getItem('learningProgress')
      if (savedProgress) {
        const progress = JSON.parse(savedProgress)
        viewedCards.value = progress.viewedCards || {}
        lastStudyTimestamp.value = progress.timestamp || null
        hasProgress.value = true
        return progress
      }
    } catch (error) {
      console.error('Failed to load learning progress:', error)
    }
    return null
  }

  function saveProgress(themeId, cardIndex) {
    try {
      // Update timestamp
      lastStudyTimestamp.value = new Date().toISOString()
      
      // Save to localStorage
      const progressData = {
        themeId,
        cardIndex,
        viewedCards: viewedCards.value,
        timestamp: lastStudyTimestamp.value
      }
      
      localStorage.setItem('learningProgress', JSON.stringify(progressData))
      hasProgress.value = true
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  function markCardAsViewed(themeId, cardIndex) {
    // Ensure viewedCards has the theme
    if (!viewedCards.value[themeId]) {
      viewedCards.value[themeId] = {}
    }
    
    // Mark card as viewed
    viewedCards.value[themeId][cardIndex] = true
    
    // Save progress
    saveProgress(themeId, cardIndex)
  }

  function resetProgress() {
    localStorage.removeItem('learningProgress')
    viewedCards.value = {}
    lastStudyTimestamp.value = null
    hasProgress.value = false
  }

  return {
    viewedCards,
    lastStudyTimestamp,
    hasProgress,
    getThemeProgress,
    formatLastStudyTime,
    loadProgress,
    saveProgress,
    markCardAsViewed,
    resetProgress
  }
})
