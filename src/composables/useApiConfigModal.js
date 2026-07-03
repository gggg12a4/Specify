import { reactive } from 'vue'

export const API_CONFIG_MODAL_KEY = Symbol('apiConfigModal')

/** 全局单例，供 DeveloperLayout provide、子页面 inject */
let modalApi = null

/**
 * API 密钥配置弹窗控制器。
 * - 无 appContext：仅管理全局密钥池
 * - 有 appContext：弹窗顶部展示当前 App 的凭证选用区
 */
export function createApiConfigModalApi() {
  if (modalApi) return modalApi

  const state = reactive({
    visible: false,
    appContext: null,
  })

  modalApi = {
    state,
    /** @param {{ appContext?: { appId, appName, platform, credentialId, onSelect }}} options */
    open(options = {}) {
      state.appContext = options.appContext || null
      state.visible = true
    },
    close() {
      state.visible = false
      state.appContext = null
    },
    handleAppCredentialSelected(credentialId) {
      state.appContext?.onSelect?.(credentialId)
      modalApi.close()
    },
  }

  return modalApi
}

export function useApiConfigModal() {
  return createApiConfigModalApi()
}
