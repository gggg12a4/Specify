import { ref, reactive } from 'vue'

const API_CONFIG_KEY = 'specify_api_config'

// 默认配置（从环境变量读取）
const defaultConfig = {
  qwen: {
    apiKey: import.meta.env.VITE_QWEN_API_KEY || '',
    baseUrl: import.meta.env.VITE_QWEN_BASE_URL || '',
    model: import.meta.env.VITE_QWEN_MODEL || ''
  },
  sp: {
    apiKey: import.meta.env.VITE_SP_API_KEY || '',
    baseUrl: import.meta.env.VITE_SP_BASE_URL || '',
    app: import.meta.env.VITE_SP_APP || '',
    user: import.meta.env.VITE_SP_USER || ''
  }
}

// 全局配置状态
const apiConfig = ref(null)

/**
 * API 配置管理
 */
export function useApiConfig() {
  /**
   * 从 localStorage 获取配置
   */
  function getStoredConfig() {
    try {
      const stored = localStorage.getItem(API_CONFIG_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to read API config from localStorage:', e)
    }
    return null
  }

  /**
   * 保存配置到 localStorage
   */
  function saveConfig(config) {
    try {
      localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config))
      apiConfig.value = config
      return true
    } catch (e) {
      console.error('Failed to save API config to localStorage:', e)
      return false
    }
  }

  /**
   * 检查配置是否完整
   */
  function isConfigValid(config) {
    if (!config) return false

    // 检查 Qwen 配置
    if (!config.qwen?.apiKey || !config.qwen?.baseUrl || !config.qwen?.model) {
      return false
    }

    // 检查 SP 配置
    if (!config.sp?.apiKey || !config.sp?.baseUrl || !config.sp?.app || !config.sp?.user) {
      return false
    }

    return true
  }

  /**
   * 检查是否需要配置
   * @returns {boolean} true 表示需要配置，false 表示已配置
   */
  function needsConfiguration() {
    // 只检查 localStorage，环境变量作为默认值但不自动跳过配置
    const stored = getStoredConfig()
    if (stored && isConfigValid(stored)) {
      apiConfig.value = stored
      return false
    }

    // 没有 localStorage 配置，需要用户手动配置
    // 即使环境变量完整，也需要用户确认
    return true
  }

  /**
   * 获取当前配置
   */
  function getConfig() {
    if (apiConfig.value) {
      return apiConfig.value
    }

    // 尝试从 localStorage 读取
    const stored = getStoredConfig()
    if (stored && isConfigValid(stored)) {
      apiConfig.value = stored
      return stored
    }

    // 返回环境变量配置
    return defaultConfig
  }

  /**
   * 清除配置
   */
  function clearConfig() {
    try {
      localStorage.removeItem(API_CONFIG_KEY)
      apiConfig.value = null
    } catch (e) {
      console.warn('Failed to clear API config:', e)
    }
  }

  /**
   * 获取选中的工具列表
   * @returns {Array} 工具 ID 列表，如 ['SPglob', 'SPread', 'SPwrite']
   */
  function getSelectedTools() {
    const config = getConfig()
    return config.tools || []
  }

  /**
   * 保存工具选择
   * @param {Array} tools - 工具 ID 列表
   */
  function saveToolsSelection(tools) {
    const config = getConfig()
    config.tools = tools
    saveConfig(config)
  }

  return {
    apiConfig,
    getConfig,
    saveConfig,
    isConfigValid,
    needsConfiguration,
    clearConfig,
    defaultConfig,
    getSelectedTools,
    saveToolsSelection
  }
}
