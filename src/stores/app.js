/**
 * 开发者 App 数据（Pinia）。
 *
 * 列表、创建、编辑、草稿保存等走 @/api/developer.js；
 * credential_id 等运行配置仍存 localStorage。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as developerApi from '@/api/developer'
import { getModelGroups } from '@/api/admin'
import {
  toListItem,
  toTemplateItem,
  editPageToSession,
  formToSaveDraft,
  toCreateRequest,
  extractAppId,
  extractPublishResult,
  platformKeyToModelGroupId,
  sortAppsByUpdateTimeDesc,
  isPendingConfig,
  inferPendingConfigFromListItem,
} from '@/utils/appAdapter'

const CREDENTIAL_PREFIX = 'specify_app_credential_'

export const useAppStore = defineStore('appStore', () => {
  const apps = ref([])
  const listTotal = ref(0)
  const listPages = ref(0)
  const templates = ref([])
  const modelGroups = ref([])
  const editSessions = ref(new Map())
  const loading = ref(false)
  const templatesLoading = ref(false)

  const hasApps = computed(() => apps.value.length > 0)

  function _loadCredentialId(appId) {
    try {
      const raw = localStorage.getItem(CREDENTIAL_PREFIX + appId)
      return raw || null
    } catch {
      return null
    }
  }

  function _saveCredentialId(appId, credentialId) {
    try {
      if (credentialId) {
        localStorage.setItem(CREDENTIAL_PREFIX + appId, credentialId)
      } else {
        localStorage.removeItem(CREDENTIAL_PREFIX + appId)
      }
    } catch {
      // ignore
    }
  }

  async function fetchModelGroups() {
    if (modelGroups.value.length) return modelGroups.value
    const res = await getModelGroups({ pageNo: 1, pageSize: 100 })
    const records = res.data?.records || res.data || []
    modelGroups.value = Array.isArray(records) ? records : []
    return modelGroups.value
  }

  function _syncListPendingConfig(appId, isPendingConfig) {
    const item = apps.value.find(a => a.id === appId)
    if (item) item.isPendingConfig = isPendingConfig
  }

  async function fetchMyApps(params = { pageNo: 1, pageSize: 11 }) {
    loading.value = true
    try {
      const res = await developerApi.listMyApps(params)
      const page = res.data || {}
      apps.value = sortAppsByUpdateTimeDesc((page.records || []).map((vo) => {
        const item = toListItem(vo)
        const session = editSessions.value.get(item.id)
        if (session?.meta?.isPendingConfig != null) {
          item.isPendingConfig = session.meta.isPendingConfig
        } else {
          item.isPendingConfig = inferPendingConfigFromListItem(item)
        }
        return item
      }))
      listTotal.value = page.total ?? apps.value.length
      listPages.value = page.pages ?? 1
      return apps.value
    } finally {
      loading.value = false
    }
  }

  async function fetchTemplates(params = { pageNo: 1, pageSize: 20 }) {
    templatesLoading.value = true
    try {
      const res = await developerApi.listTemplates(params)
      const page = res.data || {}
      templates.value = (page.records || []).map(toTemplateItem)
      return templates.value
    } finally {
      templatesLoading.value = false
    }
  }

  async function createAppViaApi({ name, description, templateAppId, platform }) {
    await fetchModelGroups()
    const modelGroupId = templateAppId
      ? undefined
      : platformKeyToModelGroupId(platform, modelGroups.value)

    const payload = toCreateRequest({ name, description, templateAppId, modelGroupId })
    const res = await developerApi.createApp(payload)
    const appId = extractAppId(res.data)
    if (!appId) {
      throw new Error(res.msg || '创建 App 失败')
    }
    _syncListPendingConfig(appId, true)
    return appId
  }

  async function fetchEditPage(appId) {
    const res = await developerApi.queryEditPageData(appId)
    const session = editPageToSession(res.data || {})
    session.form.credential_id = _loadCredentialId(appId)
    session.meta.isPendingConfig = isPendingConfig(res.data || {})
    editSessions.value.set(appId, session)
    _syncListPendingConfig(appId, session.meta.isPendingConfig)
    return session
  }

  async function saveDraft(appId, form) {
    const payload = formToSaveDraft(appId, form)
    await developerApi.saveDraft(payload)
    const session = editSessions.value.get(appId)
    if (session) {
      Object.assign(session.form, form)
      Object.assign(session.app, {
        system_prompt: form.system_prompt,
        model: form.model,
        platform: form.platform,
        tools: form.tools,
        special_tools: form.special_tools,
        custom_tools: form.custom_tools,
        mcp_services: form.mcp_services,
        modelGroupId: form.modelGroupId,
      })
      if (session.draft) {
        session.draft.hasDraft = true
        session.draft.configSource = 'draft'
      }
      session.meta.isPendingConfig = false
    }
    _syncListPendingConfig(appId, false)
  }

  async function updateMeta(appId, { name, description }) {
    await developerApi.updateAppMeta(appId, { name, description })
    const session = editSessions.value.get(appId)
    if (session) {
      session.meta.name = name
      session.meta.description = description
      session.app.name = name
      session.app.description = description
    }
    const listItem = apps.value.find(a => a.id === appId)
    if (listItem) {
      listItem.name = name
      listItem.description = description
    }
  }

  async function publishAppViaApi(appId, options = {}) {
    const res = await developerApi.publishApp({
      app_id: appId,
      force_upgrade: options.forceUpgrade ?? false,
      is_compatible: options.isCompatible ?? true,
    })
    const result = extractPublishResult(res.data)
    await fetchEditPage(appId)
    return result
  }

  async function togglePublic(appId, isPublic) {
    await developerApi.toggleAppPublic(appId, isPublic)
    const session = editSessions.value.get(appId)
    if (session) {
      session.meta.isPublic = isPublic
      session.app.isPublic = isPublic
    }
    const listItem = apps.value.find(a => a.id === appId)
    if (listItem) {
      listItem.isPublic = isPublic
    }
  }

  async function removeApp(appId) {
    await developerApi.deleteApp(appId)
    apps.value = apps.value.filter(a => a.id !== appId)
    editSessions.value.delete(appId)
    listTotal.value = Math.max(0, listTotal.value - 1)
  }

  function getEditSession(appId) {
    return editSessions.value.get(appId) || null
  }

  function getApp(id) {
    const session = editSessions.value.get(id)
    if (session) return session.app
    return apps.value.find(a => a.id === id) || null
  }

  /** 局部更新（主要用于 credential_id 等前端本地字段） */
  function updateAppLocal(id, updates) {
    if (updates.credential_id !== undefined) {
      _saveCredentialId(id, updates.credential_id)
    }
    const session = editSessions.value.get(id)
    if (session) {
      Object.assign(session.app, updates)
      if (updates.credential_id !== undefined) {
        session.form.credential_id = updates.credential_id
      }
    }
  }

  function getEnabledToolCount(app) {
    if (!app?.tools) return 0
    const spCount = Object.values(app.tools || {}).filter(t => t.enabled).length
    const specialCount = Object.values(app.special_tools || {}).filter(t => t.enabled).length
    const customCount = (app.custom_tools || []).filter(ct => ct.enabled).length
    const mcpCount = (app.mcp_services || []).filter(m => m.enabled).length
    return spCount + specialCount + customCount + mcpCount
  }

  /** @deprecated 保留兼容，不再读 localStorage App 列表 */
  function initApps() {
    // no-op：列表改由 fetchMyApps 加载
  }

  return {
    apps,
    listTotal,
    listPages,
    templates,
    modelGroups,
    loading,
    templatesLoading,
    hasApps,
    fetchModelGroups,
    fetchMyApps,
    fetchTemplates,
    createAppViaApi,
    fetchEditPage,
    saveDraft,
    updateMeta,
    publishAppViaApi,
    togglePublic,
    removeApp,
    getEditSession,
    getApp,
    updateAppLocal,
    getEnabledToolCount,
    initApps,
  }
})
