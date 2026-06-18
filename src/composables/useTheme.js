import { ref, watch, onMounted } from 'vue'

const THEME_KEY = 'specify_theme'

// 支持的主题类型
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto' // 跟随系统
}

// 全局主题状态
const currentTheme = ref(THEMES.AUTO)

/**
 * 主题管理 Hook
 */
export function useTheme() {
  /**
   * 从 localStorage 获取保存的主题设置
   */
  function getStoredTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (stored && Object.values(THEMES).includes(stored)) {
        return stored
      }
    } catch (e) {
      console.warn('Failed to read theme from localStorage:', e)
    }
    return THEMES.AUTO
  }

  /**
   * 保存主题设置到 localStorage
   */
  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e)
    }
  }

  /**
   * 获取系统偏好的主题
   */
  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEMES.DARK
    }
    return THEMES.LIGHT
  }

  /**
   * 应用主题到 DOM
   */
  function applyTheme(theme) {
    const root = document.documentElement

    if (theme === THEMES.AUTO) {
      // 跟随系统，移除 data-theme 属性，让 CSS 的 media query 生效
      root.removeAttribute('data-theme')
    } else {
      // 手动设置主题
      root.setAttribute('data-theme', theme)
    }
  }

  /**
   * 设置主题
   */
  function setTheme(theme) {
    if (!Object.values(THEMES).includes(theme)) {
      console.warn(`Invalid theme: ${theme}`)
      return
    }

    currentTheme.value = theme
    applyTheme(theme)
    saveTheme(theme)
  }

  /**
   * 切换主题（在 light 和 dark 之间切换）
   */
  function toggleTheme() {
    const actualTheme = currentTheme.value === THEMES.AUTO
      ? getSystemTheme()
      : currentTheme.value

    const newTheme = actualTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    setTheme(newTheme)
  }

  /**
   * 获取当前实际生效的主题（考虑 auto 模式）
   */
  function getActualTheme() {
    if (currentTheme.value === THEMES.AUTO) {
      return getSystemTheme()
    }
    return currentTheme.value
  }

  /**
   * 初始化主题
   */
  function initTheme() {
    const savedTheme = getStoredTheme()
    currentTheme.value = savedTheme
    applyTheme(savedTheme)

    // 监听系统主题变化（仅在 auto 模式下生效）
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleSystemThemeChange = () => {
        if (currentTheme.value === THEMES.AUTO) {
          // 重新应用以触发更新
          applyTheme(THEMES.AUTO)
        }
      }

      // 现代浏览器使用 addEventListener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange)
      } else {
        // 旧版浏览器兼容
        mediaQuery.addListener(handleSystemThemeChange)
      }
    }
  }

  return {
    currentTheme,
    setTheme,
    toggleTheme,
    getActualTheme,
    initTheme,
    THEMES
  }
}
