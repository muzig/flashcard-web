import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFlashcardStore = defineStore('flashcard', () => {
  // State
  const flashcards = ref([])
  const currentIndex = ref(0)
  const isFlipped = ref(false)

  // Getters
  const currentCard = computed(() => {
    if (flashcards.value.length === 0) {
      return { question: '', answer: '' }
    }
    return flashcards.value[currentIndex.value]
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

        const [question, answer] = line.split('\t')
        if (question && answer) {
          // 处理答案文本，添加格式化
          const formattedAnswer = formatAnswerText(answer)
          cards.push({ question, answer: formattedAnswer })
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
    if (currentIndex.value < flashcards.value.length - 1) {
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
    
    flashcards.value.splice(currentIndex.value, 1)
    
    // Adjust current index if needed
    if (currentIndex.value >= flashcards.value.length && flashcards.value.length > 0) {
      currentIndex.value = flashcards.value.length - 1
    }
    
    return true
  }

  function setCurrentIndex(index) {
    if (index >= 0 && index < flashcards.value.length) {
      currentIndex.value = index
      isFlipped.value = false
      return true
    }
    return false
  }

  return {
    flashcards,
    currentIndex,
    isFlipped,
    currentCard,
    parseAndLoadCards,
    flipCard,
    prevCard,
    nextCard,
    resetCards,
    deleteCurrentCard,
    setCurrentIndex
  }
})
