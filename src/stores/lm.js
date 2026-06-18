/**
 * 大模型与 BYOK 配置（Pinia）。
 *
 * 管理用户的模型偏好（主/备模型）和各平台 API Key，全部持久化到 localStorage。
 * 当前为前端本地 mock 方案；对接真实接口后 api_key 仅保留脱敏字段。
 *
 * 使用方：EnableToolModal 中的 LmSelector（子工具选模型）等。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const PREFS_KEY = 'specify_model_prefs'
const KEYS_KEY = 'specify_api_keys'

function genKeyId() {
  return 'key_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function defaultPrefs() {
  return { primary_model: null, secondary_model: null }
}

export const useLmStore = defineStore('lm', () => {
  /** 主模型必填，副模型可选 */
  const modelPreferences = ref(defaultPrefs())

  /**
   * 用户添加的各平台 API Key 列表。
   * api_key_masked 用于展示，_api_key_full 仅本地 mock 保留明文。
   */
  const apiKeys = ref([])

  /** 是否已完成模型配置（有主模型即视为已配置，供路由/向导判断） */
  const hasLms = computed(() => !!modelPreferences.value.primary_model)

  /** 从 localStorage 恢复偏好与 Key 列表 */
  function initLms() {
    try {
      const storedPrefs = localStorage.getItem(PREFS_KEY)
      if (storedPrefs) modelPreferences.value = JSON.parse(storedPrefs)
    } catch { modelPreferences.value = defaultPrefs() }

    try {
      const storedKeys = localStorage.getItem(KEYS_KEY)
      if (storedKeys) apiKeys.value = JSON.parse(storedKeys)
    } catch { apiKeys.value = [] }
  }

  function _persistPrefs() {
    localStorage.setItem(PREFS_KEY, JSON.stringify(modelPreferences.value))
  }

  function _persistKeys() {
    localStorage.setItem(KEYS_KEY, JSON.stringify(apiKeys.value))
  }

  function setModelPreferences(prefs) {
    Object.assign(modelPreferences.value, prefs)
    _persistPrefs()
  }

  /** 新增 Key 并自动脱敏存储 */
  function addApiKey(data) {
    const key = {
      id: genKeyId(),
      platform: data.platform,
      api_base: data.api_base || '',
      api_key_masked: data.api_key ? data.api_key.slice(0, 4) + '****' + data.api_key.slice(-4) : '****',
      _api_key_full: data.api_key || '',
      created_at: new Date().toISOString()
    }
    apiKeys.value.push(key)
    _persistKeys()
    return key
  }

  function updateApiKey(id, data) {
    const idx = apiKeys.value.findIndex(k => k.id === id)
    if (idx === -1) return
    if (data.api_key) {
      apiKeys.value[idx].api_key_masked = data.api_key.slice(0, 4) + '****' + data.api_key.slice(-4)
      apiKeys.value[idx]._api_key_full = data.api_key
    }
    if (data.api_base !== undefined) apiKeys.value[idx].api_base = data.api_base
    _persistKeys()
  }

  function deleteApiKey(id) {
    const idx = apiKeys.value.findIndex(k => k.id === id)
    if (idx !== -1) {
      apiKeys.value.splice(idx, 1)
      _persistKeys()
    }
  }

  /** 按平台查找已配置的 Key，用于判断某模型平台是否可用 */
  function getKeyByPlatform(platform) {
    return apiKeys.value.find(k => k.platform === platform) || null
  }

  return {
    modelPreferences,
    apiKeys,
    hasLms,
    initLms,
    setModelPreferences,
    addApiKey,
    updateApiKey,
    deleteApiKey,
    getKeyByPlatform
  }
})
