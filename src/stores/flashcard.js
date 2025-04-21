import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFlashcardStore = defineStore('flashcard', () => {
  // State
  const flashcards = ref([])
  const currentIndex = ref(0)
  const isFlipped = ref(false)
  const selectedCategory = ref('')
  const cardStatus = ref({}) // Track status of each card: 'mastered', 'review', or undefined
  const reviewSchedule = ref({}) // Track review schedule for each card

  // Getters
  const currentCard = computed(() => {
    if (filteredFlashcards.value.length === 0) {
      return { question: '', answer: '' }
    }
    return filteredFlashcards.value[currentIndex.value] || filteredFlashcards.value[0]
  })

  const currentCardStatus = computed(() => {
    const card = currentCard.value
    if (!card) return null
    const cardKey = `${card.question}-${card.answer}`
    return cardStatus.value[cardKey]
  })

  const currentCardReviewTime = computed(() => {
    const card = currentCard.value
    if (!card) return null
    const cardKey = `${card.question}-${card.answer}`
    return reviewSchedule.value[cardKey]
  })

  const isCardDueForReview = computed(() => {
    const card = currentCard.value
    if (!card) return false
    const cardKey = `${card.question}-${card.answer}`
    const reviewTime = reviewSchedule.value[cardKey]
    if (!reviewTime) return false
    return new Date() >= new Date(reviewTime)
  })

  const categories = computed(() => {
    const uniqueCategories = new Set()
    flashcards.value.forEach(card => {
      if (card.category) {
        uniqueCategories.add(card.category)
      }
    })
    return Array.from(uniqueCategories)
  })

  const filteredFlashcards = computed(() => {
    if (!selectedCategory.value) {
      return flashcards.value
    }
    return flashcards.value.filter(card => card.category === selectedCategory.value)
  })

  // Actions
  function parseAndLoadCards(text) {
    try {
      const lines = text.trim().split('\n')
      const cards = []

      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [category, question, answer] = line.split('\t')
        if (question && answer) {
          // 处理答案文本，添加格式化
          const formattedAnswer = formatAnswerText(answer)
          cards.push({ category, question, answer: formattedAnswer })
        }
      }

      if (cards.length === 0) {
        throw new Error('No valid flashcard data found. Please check the file format.')
      }

      flashcards.value = cards
      currentIndex.value = 0
      isFlipped.value = false
      
      return cards
    } catch (error) {
      console.error('Failed to parse file:', error)
      throw error
    }
  }

  // 格式化答案文本
  function formatAnswerText(text) {
    // 处理数字列表
    text = text.replace(/(\d+\.\s)/g, '<br>$1')
    
    // 处理破折号列表
    text = text.replace(/([-–—])\s/g, '<br>$1 ')
    
    // 处理冒号后的内容
    text = text.replace(/：/g, '：<br>')
    
    // 处理括号内容
    text = text.replace(/（([^）]+)）/g, '<br>（$1）')
    
    // 处理代码块
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // 处理强调文本
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    
    // 处理分隔线
    text = text.replace(/---/g, '<hr>')
    
    return text
  }

  function flipCard() {
    isFlipped.value = !isFlipped.value
    return isFlipped.value
  }

  function prevCard() {
    if (currentIndex.value > 0) {
      currentIndex.value--
      isFlipped.value = false
      return true
    }
    return false
  }

  function nextCard() {
    if (currentIndex.value < filteredFlashcards.value.length - 1) {
      currentIndex.value++
      isFlipped.value = false
      return true
    }
    return false
  }

  function resetCards() {
    currentIndex.value = 0
    isFlipped.value = false
  }

  function deleteCurrentCard() {
    if (flashcards.value.length === 0) return false
    
    // Find the actual index in the full flashcards array
    const currentFilteredCard = filteredFlashcards.value[currentIndex.value]
    const fullIndex = flashcards.value.findIndex(card => 
      card.question === currentFilteredCard.question && 
      card.answer === currentFilteredCard.answer
    )
    
    if (fullIndex !== -1) {
      flashcards.value.splice(fullIndex, 1)
      
      // Adjust current index if needed
      if (currentIndex.value >= filteredFlashcards.value.length - 1 && filteredFlashcards.value.length > 0) {
        currentIndex.value = filteredFlashcards.value.length - 1
      }
      
      return true
    }
    return false
  }

  function setCurrentIndex(index) {
    if (index >= 0 && index < filteredFlashcards.value.length) {
      currentIndex.value = index
      isFlipped.value = false
      return true
    }
    return false
  }

  function setCategory(category) {
    selectedCategory.value = category
    // Reset to first card when changing category
    currentIndex.value = 0
    isFlipped.value = false
  }

  function markCardForReview() {
    const card = currentCard.value
    if (!card) return

    const cardKey = `${card.question}-${card.answer}`
    cardStatus.value[cardKey] = 'review'
    
    // Set review schedule based on Ebbinghaus forgetting curve
    const now = new Date()
    const reviewTimes = [
      new Date(now.getTime() + 20 * 60 * 1000), // 20 minutes
      new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
      new Date(now.getTime() + 9 * 60 * 60 * 1000), // 9 hours
      new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day
      new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
      new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days
      new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000) // 31 days
    ]
    
    // If this is the first time marking for review, start with the first interval
    if (!reviewSchedule.value[cardKey]) {
      reviewSchedule.value[cardKey] = reviewTimes[0].toISOString()
    } else {
      // Find the next review time
      const currentReviewTime = new Date(reviewSchedule.value[cardKey])
      const nextIndex = reviewTimes.findIndex(time => time > currentReviewTime)
      if (nextIndex !== -1) {
        reviewSchedule.value[cardKey] = reviewTimes[nextIndex].toISOString()
      } else {
        // If all review times have passed, mark as mastered
        cardStatus.value[cardKey] = 'mastered'
        delete reviewSchedule.value[cardKey]
      }
    }
    
    saveCardStatus()
    saveReviewSchedule()
  }

  function markCardAsMastered() {
    const card = currentCard.value
    if (!card) return

    const cardKey = `${card.question}-${card.answer}`
    cardStatus.value[cardKey] = 'mastered'
    delete reviewSchedule.value[cardKey]
    saveCardStatus()
    saveReviewSchedule()
  }

  function resetCardStatus() {
    const card = currentCard.value
    if (!card) return

    const cardKey = `${card.question}-${card.answer}`
    delete cardStatus.value[cardKey]
    delete reviewSchedule.value[cardKey]
    saveCardStatus()
    saveReviewSchedule()
  }

  function saveCardStatus() {
    try {
      localStorage.setItem('cardStatus', JSON.stringify(cardStatus.value))
    } catch (error) {
      console.error('Failed to save card status:', error)
    }
  }

  function saveReviewSchedule() {
    try {
      localStorage.setItem('reviewSchedule', JSON.stringify(reviewSchedule.value))
    } catch (error) {
      console.error('Failed to save review schedule:', error)
    }
  }

  function loadCardStatus() {
    try {
      const savedStatus = localStorage.getItem('cardStatus')
      if (savedStatus) {
        cardStatus.value = JSON.parse(savedStatus)
      }
    } catch (error) {
      console.error('Failed to load card status:', error)
    }
  }

  function loadReviewSchedule() {
    try {
      const savedSchedule = localStorage.getItem('reviewSchedule')
      if (savedSchedule) {
        reviewSchedule.value = JSON.parse(savedSchedule)
      }
    } catch (error) {
      console.error('Failed to load review schedule:', error)
    }
  }

  // Load data when store is initialized
  loadCardStatus()
  loadReviewSchedule()

  return {
    flashcards,
    currentIndex,
    isFlipped,
    currentCard,
    categories,
    selectedCategory,
    filteredFlashcards,
    currentCardStatus,
    currentCardReviewTime,
    isCardDueForReview,
    parseAndLoadCards,
    flipCard,
    prevCard,
    nextCard,
    resetCards,
    deleteCurrentCard,
    setCurrentIndex,
    setCategory,
    markCardForReview,
    markCardAsMastered,
    resetCardStatus
  }
})
