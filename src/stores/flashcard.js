import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFlashcardStore = defineStore('flashcard', () => {
  // State
  const flashcards = ref([])
  const currentIndex = ref(0)
  const isFlipped = ref(false)
  const selectedCategory = ref('')

  // Getters
  const currentCard = computed(() => {
    if (filteredFlashcards.value.length === 0) {
      return { question: '', answer: '' }
    }
    return filteredFlashcards.value[currentIndex.value] || filteredFlashcards.value[0]
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

  return {
    flashcards,
    currentIndex,
    isFlipped,
    currentCard,
    categories,
    selectedCategory,
    filteredFlashcards,
    parseAndLoadCards,
    flipCard,
    prevCard,
    nextCard,
    resetCards,
    deleteCurrentCard,
    setCurrentIndex,
    setCategory
  }
})
