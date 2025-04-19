import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // State
  const themes = ref([])
  const isLoading = ref(false)
  const selectedTheme = ref('')
  const currentThemeData = ref(null)

  // Getters
  const getThemeById = computed(() => {
    return (id) => themes.value.find(theme => theme.id === id)
  })

  // Actions
  async function loadAllThemes() {
    try {
      isLoading.value = true
      const response = await fetch('/themes/index.json')
      const data = await response.json()

      const themePromises = data.themes.map(async (themeInfo) => {
        const metaResponse = await fetch(`/themes/${themeInfo.path}`)
        return await metaResponse.json()
      })

      const loadedThemes = await Promise.all(themePromises)

      // Load user saved themes
      const userThemes = loadUserThemes()

      // Merge system themes and user themes
      themes.value = [...loadedThemes, ...userThemes]
    } catch (error) {
      console.error('Failed to load themes:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function loadUserThemes() {
    try {
      const savedThemes = localStorage.getItem('userThemes')
      if (savedThemes) {
        return JSON.parse(savedThemes)
      }
    } catch (error) {
      console.error('Failed to load user themes:', error)
    }
    return []
  }

  async function loadTheme(themeId) {
    console.log('Loading theme:', themeId)
    selectedTheme.value = themeId

    // If it's a custom theme, don't load file
    if (themeId === 'custom') {
      console.log('Loading custom theme placeholder')
      currentThemeData.value = themes.value.find(t => t.id === 'custom')
      return null
    }

    const theme = themes.value.find(t => t.id === themeId)
    if (!theme) {
      console.error('Theme not found:', themeId)
      return null
    }

    console.log('Found theme:', theme)
    currentThemeData.value = theme

    try {
      isLoading.value = true

      // Check if it's a user uploaded theme
      const userThemes = loadUserThemes()
      const userTheme = userThemes.find(t => t.id === themeId)

      if (userTheme && userTheme.cardsContent) {
        console.log('Loading user theme content')
        return userTheme.cardsContent
      } else if (theme.cards) {
        console.log('Loading system theme from file:', `/themes/${theme.id}/${theme.cards}`)
        const response = await fetch(`/themes/${theme.id}/${theme.cards}`)
        if (!response.ok) {
          throw new Error(`Failed to load theme file: ${response.status} ${response.statusText}`)
        }
        const content = await response.text()
        console.log('Loaded theme content:', content.substring(0, 100) + '...')
        return content
      }

      console.error('No content found for theme:', themeId)
      return null
    } catch (error) {
      console.error('Failed to load theme:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function saveUserTheme(theme) {
    try {
      const userThemes = loadUserThemes()

      // Check if theme already exists
      const existingIndex = userThemes.findIndex(t => t.id === theme.id)

      if (existingIndex >= 0) {
        // Update existing theme
        userThemes[existingIndex] = theme
      } else {
        // Add new theme
        userThemes.push(theme)
      }

      localStorage.setItem('userThemes', JSON.stringify(userThemes))

      // Update themes list
      loadAllThemes()
    } catch (error) {
      console.error('Failed to save user theme:', error)
      throw error
    }
  }

  function deleteTheme(themeId) {
    try {
      const userThemes = loadUserThemes()
      const updatedThemes = userThemes.filter(t => t.id !== themeId)
      localStorage.setItem('userThemes', JSON.stringify(updatedThemes))

      // Update themes list
      loadAllThemes()
    } catch (error) {
      console.error('Failed to delete theme:', error)
      throw error
    }
  }

  // Get card count for a theme
  async function getThemeCardCount(themeId) {
    try {
      // If it's a custom theme placeholder, return 0
      if (themeId === 'custom') {
        return 0
      }

      const theme = themes.value.find(t => t.id === themeId)
      if (!theme) {
        return 0
      }

      // Check if it's a user uploaded theme
      const userThemes = loadUserThemes()
      const userTheme = userThemes.find(t => t.id === themeId)

      if (userTheme && userTheme.cardsContent) {
        // Count cards in user theme content
        const lines = userTheme.cardsContent.trim().split('\n')
        // Skip header line and count non-empty lines
        return lines.slice(1).filter(line => line.trim() && line.includes('\t')).length
      } else if (theme.cards) {
        // Load system theme content and count cards
        const response = await fetch(`themes/${theme.id}/${theme.cards}`)
        const text = await response.text()
        const lines = text.trim().split('\n')
        // Skip header line and count non-empty lines
        return lines.slice(1).filter(line => line.trim() && line.includes('\t')).length
      }

      return 0
    } catch (error) {
      console.error('Failed to get theme card count:', error)
      return 0
    }
  }

  return {
    themes,
    isLoading,
    selectedTheme,
    currentThemeData,
    getThemeById,
    loadAllThemes,
    loadTheme,
    loadUserThemes,
    saveUserTheme,
    deleteTheme,
    getThemeCardCount
  }
})
