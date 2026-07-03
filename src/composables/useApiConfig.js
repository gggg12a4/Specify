import { ref } from 'vue'
import { PLATFORMS } from '@/constants/platforms'

const API_CONFIG_KEY = 'specify_api_keys'

const apiKeys = ref(null)

function genKeyId() {
  return 'key_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function inferPlatform(key) {
  const url = (key.baseUrl || '').toLowerCase()
  if (url.includes('dashscope') || url.includes('qwen')) return 'qwen'
  if (url.includes('deepseek')) return 'deepseek'
  if (url.includes('openai')) return 'gpt'
  if (url.includes('generativelanguage') || url.includes('google')) return 'gemini'
  return 'claude'
}

function normalizeKey(key) {
  return {
    id: key.id || genKeyId(),
    alias: key.alias || '未命名密钥',
    platform: key.platform || inferPlatform(key),
    baseUrl: key.baseUrl || '',
    apiKey: key.apiKey || '',
    isDefault: !!key.isDefault,
  }
}

/** 保证每个平台最多一条默认密钥 */
function ensurePlatformDefaults(keys) {
  const validPlatforms = new Set(PLATFORMS.map(p => p.key))
  for (const platform of validPlatforms) {
    const platformKeys = keys.filter(k => k.platform === platform && k.apiKey)
    if (!platformKeys.length) continue
    const defaults = platformKeys.filter(k => k.isDefault)
    if (defaults.length === 1) continue
    platformKeys.forEach((k, index) => {
      k.isDefault = index === 0
    })
  }
  return keys
}

function normalizeStoredKeys(rawKeys) {
  if (!Array.isArray(rawKeys)) return []
  const keys = rawKeys.map(normalizeKey)
  return ensurePlatformDefaults(keys)
}

/**
 * API 配置池管理
 * - 每条密钥绑定单一 platform
 * - 同一 platform 可有多条密钥，其中一条 isDefault
 * - App 通过 credential_id 选用密钥；未指定时使用平台默认密钥
 */
export function useApiConfig() {
  function getStoredKeys() {
    try {
      const stored = localStorage.getItem(API_CONFIG_KEY)
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.warn('Failed to read API keys from localStorage:', e)
    }
    return null
  }

  function saveKeys(keysArray) {
    try {
      const normalized = ensurePlatformDefaults(keysArray.map(normalizeKey))
      localStorage.setItem(API_CONFIG_KEY, JSON.stringify(normalized))
      apiKeys.value = normalized
      return true
    } catch (e) {
      console.error('Failed to save API keys to localStorage:', e)
      return false
    }
  }

  function getKeys() {
    if (apiKeys.value) return apiKeys.value

    const stored = getStoredKeys()
    if (stored && Array.isArray(stored)) {
      const normalized = normalizeStoredKeys(stored)
      apiKeys.value = normalized
      if (JSON.stringify(stored) !== JSON.stringify(normalized)) {
        localStorage.setItem(API_CONFIG_KEY, JSON.stringify(normalized))
      }
      return normalized
    }

    apiKeys.value = []
    return []
  }

  function getKeyById(id) {
    if (!id) return null
    return getKeys().find(k => k.id === id) || null
  }

  function getKeysForPlatform(platform) {
    return getKeys().filter(k => k.platform === platform && k.apiKey)
  }

  function hasKeyForPlatform(platform) {
    return getKeysForPlatform(platform).length > 0
  }

  function getDefaultKeyForPlatform(platform) {
    const platformKeys = getKeysForPlatform(platform)
    return platformKeys.find(k => k.isDefault) || platformKeys[0] || null
  }

  /** App 运行时解析实际使用的密钥：优先 credential_id，否则平台默认 */
  function resolveKeyForApp(platform, credentialId = null) {
    if (credentialId) {
      const selected = getKeyById(credentialId)
      if (selected?.platform === platform && selected.apiKey) return selected
    }
    return getDefaultKeyForPlatform(platform)
  }

  function hasKeyForApp(platform, credentialId = null) {
    return !!resolveKeyForApp(platform, credentialId)?.apiKey
  }

  function isValidCredentialForPlatform(platform, credentialId) {
    if (!credentialId) return true
    const key = getKeyById(credentialId)
    return !!(key && key.platform === platform && key.apiKey)
  }

  /**
   * App 凭证展示摘要：是否可用、文案、是否跟随平台默认。
   * 供 AppPlatformSection 等 UI 使用。
   */
  function getAppCredentialSummary(platform, credentialId = null) {
    if (!hasKeyForPlatform(platform)) {
      return {
        ready: false,
        label: '尚未配置 API 密钥',
        buttonText: '去添加',
        usingDefault: false,
      }
    }

    const resolved = resolveKeyForApp(platform, credentialId)
    const usingDefault = !credentialId || !isValidCredentialForPlatform(platform, credentialId)

    if (usingDefault) {
      return {
        ready: true,
        label: `使用平台默认：${resolved?.alias || '默认密钥'}`,
        buttonText: '选择凭证',
        usingDefault: true,
      }
    }

    return {
      ready: true,
      label: `已选用：${resolved?.alias || '未知密钥'}`,
      buttonText: '选择凭证',
      usingDefault: false,
    }
  }

  function hasKeys() {
    return getKeys().some(k => k.apiKey)
  }

  function getConfig(id) {
    return getKeyById(id)
  }

  function setDefaultKey(id) {
    const keys = getKeys()
    const target = keys.find(k => k.id === id)
    if (!target?.apiKey) return false

    keys.forEach(k => {
      if (k.platform === target.platform) {
        k.isDefault = k.id === id
      }
    })
    saveKeys(keys)
    return true
  }

  function addKey(keyData) {
    const keys = getKeys()
    const platform = keyData.platform || 'claude'
    const platformKeys = keys.filter(k => k.platform === platform && k.apiKey)
    const shouldBeDefault = keyData.isDefault ?? platformKeys.length === 0

    if (shouldBeDefault) {
      keys.forEach(k => {
        if (k.platform === platform) k.isDefault = false
      })
    }

    const newKey = normalizeKey({
      id: genKeyId(),
      alias: keyData.alias || '未命名密钥',
      platform,
      baseUrl: keyData.baseUrl || '',
      apiKey: keyData.apiKey || '',
      isDefault: shouldBeDefault,
    })

    keys.push(newKey)
    saveKeys(keys)
    return newKey
  }

  function updateKey(id, updates) {
    const keys = getKeys()
    const index = keys.findIndex(k => k.id === id)
    if (index === -1) return false

    const nextPlatform = updates.platform || keys[index].platform
    keys[index] = normalizeKey({ ...keys[index], ...updates, platform: nextPlatform })

    if (updates.isDefault === true) {
      keys.forEach(k => {
        if (k.platform === keys[index].platform) {
          k.isDefault = k.id === id
        }
      })
    }

    saveKeys(keys)
    return true
  }

  function deleteKey(id) {
    const keys = getKeys()
    const target = keys.find(k => k.id === id)
    if (!target) return

    const platform = target.platform
    const wasDefault = target.isDefault
    const nextKeys = keys.filter(k => k.id !== id)

    if (wasDefault) {
      const remaining = nextKeys.filter(k => k.platform === platform && k.apiKey)
      if (remaining.length) remaining[0].isDefault = true
    }

    saveKeys(nextKeys)
  }

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
    getKeysForPlatform,
    getKeyById,
    saveKeys,
    hasKeys,
    hasKeyForPlatform,
    hasKeyForApp,
    getDefaultKeyForPlatform,
    resolveKeyForApp,
    isValidCredentialForPlatform,
    getAppCredentialSummary,
    setDefaultKey,
    getConfig,
    addKey,
    updateKey,
    deleteKey,
    clearConfig,
  }
}
