import { ref } from 'vue'

const API_CONFIG_KEY = 'specify_api_keys'

// 默认配置（从环境变量读取，如果有的话可以作为初始项）
const defaultKey = {
  id: 'default_qwen',
  alias: '默认大模型',
  baseUrl: import.meta.env.VITE_QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: import.meta.env.VITE_QWEN_API_KEY || ''
}

// 全局配置状态 (API Key 池)
const apiKeys = ref(null)

/**
 * API 配置池管理
 */
export function useApiConfig() {
  /**
   * 从 localStorage 获取配置池
   */
  function getStoredKeys() {
    try {
      const stored = localStorage.getItem(API_CONFIG_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to read API keys from localStorage:', e)
    }
    return null
  }

  /**
   * 保存配置池到 localStorage
   */
  function saveKeys(keysArray) {
    try {
      localStorage.setItem(API_CONFIG_KEY, JSON.stringify(keysArray))
      apiKeys.value = keysArray
      return true
    } catch (e) {
      console.error('Failed to save API keys to localStorage:', e)
      return false
    }
  }

  /**
   * 按平台检查配置池是否有可用的密钥
   */
  function hasKeyForPlatform(platform) {
    const keys = getKeys()
    if (!keys || keys.length === 0) return false
    return keys.some(k => k.platform === platform && k.apiKey)
  }

  /**
   * 检查配置池是否有任何密钥
   */
  function hasKeys() {
    const keys = getKeys()
    return keys && keys.length > 0 && keys.some(k => k.apiKey)
  }

  /**
   * 获取当前配置池
   */
  function getKeys() {
    if (apiKeys.value) {
      return apiKeys.value
    }

    // 尝试从 localStorage 读取
    const stored = getStoredKeys()
    if (stored && Array.isArray(stored)) {
      apiKeys.value = stored
      return stored
    }

    // 初始化空池
    apiKeys.value = []
    return []
  }

  /**
   * 按 ID 查找特定配置
   */
  function getConfig(id) {
    const keys = getKeys()
    return keys.find(k => k.id === id) || null
  }

  /**
   * 获取某平台下的默认密钥（通常返回第一个找到的）
   */
  function getDefaultKeyForPlatform(platform) {
    const keys = getKeys()
    return keys.find(k => k.platform === platform && k.apiKey) || null
  }

  /**
   * 添加新密钥
   */
  function addKey(keyData) {
    const keys = getKeys()
    const newKey = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      alias: keyData.alias || '未命名密钥',
      platform: keyData.platform || 'claude', // 必须有归属平台
      baseUrl: keyData.baseUrl || '',
      apiKey: keyData.apiKey || ''
    }
    keys.push(newKey)
    saveKeys(keys)
    return newKey
  }

  /**
   * 更新现有密钥
   */
  function updateKey(id, updates) {
    const keys = getKeys()
    const index = keys.findIndex(k => k.id === id)
    if (index !== -1) {
      keys[index] = { ...keys[index], ...updates }
      saveKeys(keys)
      return true
    }
    return false
  }

  /**
   * 删除密钥
   */
  function deleteKey(id) {
    let keys = getKeys()
    keys = keys.filter(k => k.id !== id)
    saveKeys(keys)
  }

  /**
   * 清除所有配置
   */
  function clearConfig() {
    try {
      localStorage.removeItem(API_CONFIG_KEY)
      apiKeys.value = null
    } catch (e) {
      console.warn('Failed to clear API config:', e)
    }
  }

  return {
    apiKeys,
    getKeys,
    saveKeys,
    hasKeys,
    hasKeyForPlatform,
    getDefaultKeyForPlatform,
    addKey,
    updateKey,
    deleteKey,
    clearConfig
  }
}

