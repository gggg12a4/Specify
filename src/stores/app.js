/**
 * 开发者 App 数据（Pinia）。
 *
 * 当前以 localStorage 为数据源（key: specify_apps_v2），用于创建/编辑/运行 App 的前端状态。
 * 推荐 App、最近使用列表由接口填充，初始值为占位 mock 数据。
 *
 * App 结构对齐后端 API 扁平字段：tools（SP 内置工具）、special_tools、custom_tools、mcp_services 等。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'specify_apps_v2'

function genId() {
  return 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function genCustomToolId() {
  return 'ct_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

/** 各 SP 内置工具的默认 enabled / config，新建 App 时全部关闭 */
function defaultToolConfig() {
  return {
    SPread:         { enabled: false, config: { max_output_length: null, max_line_length: 2000, image: false, video: false, audio: false, file: false, image_url: false, video_url: false, audio_url: false, file_url: false, max_image_size: 20, max_video_size: 50, max_audio_size: 50, max_file_size: 20, timeout: null } },
    SPglob:         { enabled: false, config: { max_output_length: null, timeout: null } },
    SPgrep:         { enabled: false, config: { max_output_length: null, timeout: null } },
    SPedit:         { enabled: false, config: { timeout: null } },
    SPwrite:        { enabled: false, config: { timeout: null } },
    SPmake:         { enabled: false, config: { timeout: null } },
    SPcreatedir:    { enabled: false, config: { timeout: null } },
    SPrm:           { enabled: false, config: { timeout: null } },
    SPupload:       { enabled: false, config: { max_file_size: 10, timeout: 60, use_magic_bytes: true } },
    SPSkillManager: { enabled: false, config: { skills_dir: 'shared/skills/', max_content_length: -1, max_desc_length: 250, timeout: null } },
  }
}

/** 合并默认值与用户输入，生成完整 App 对象 */
function defaultApp(data = {}) {
  return {
    id: data.id || genId(),
    user_id: data.user_id || 1,
    name: data.name || '',
    description: data.description || '',
    platform: data.platform || 'claude',
    system_prompt: data.system_prompt || '',
    tools: data.tools || defaultToolConfig(),
    // 平台预置特殊工具（绘图、图片理解等）
    special_tools: data.special_tools || {},
    // 开发者自定义子 Agent / 工具
    custom_tools: data.custom_tools || [],
    mcp_services: data.mcp_services || [],
    // 分享与计费
    share_billing_mode: data.share_billing_mode || 'user_pay',
    mcp_credential_modes: data.mcp_credential_modes || {},
    // 高级运行参数（原 advanced 嵌套字段，现扁平到顶层）
    tool_timeout: data.tool_timeout ?? 30,
    max_steps: data.max_steps ?? 20,
    steps_limit_behavior: data.steps_limit_behavior ?? 'auto',
    compress_threshold: data.compress_threshold ?? 80000,
    compress_behavior: data.compress_behavior ?? 'form',
    safety_enabled: data.safety_enabled ?? false,
    safety_rules: data.safety_rules ?? {},
    default_safety_policy: data.default_safety_policy ?? 'ASK',
    allowed_paths: data.allowed_paths ?? [],
    allowed_urls: data.allowed_urls ?? [],
    workspace_base_url: data.workspace_base_url ?? '',
    workspace_api_key: data.workspace_api_key ?? '',
    is_public: data.is_public ?? false,
    share_code: data.share_code ?? '',
    created_at: data.created_at || new Date().toISOString()
  }
}

export const useAppStore = defineStore('appStore', () => {
  /** 当前用户创建的 App 列表 */
  const apps = ref([])

  /** 平台推荐 App，由 AgentSpaceView 接口加载后覆盖 */
  const recommendedApps = ref([
    { id: 'rec_1', name: '面试助手', description: '帮你准备技术面试', creator_nickname: '官方', is_public: true },
    { id: 'rec_2', name: '英语老师', description: '全英文沉浸式对话', creator_nickname: 'TomEnglish', is_public: true },
  ])

  /** 最近使用过的他人 App，需登录后从接口加载 */
  const recentApps = ref([
    { id: 'shared_1', name: '面试助手', creator_nickname: '张三', last_used_at: '2026-04-20T10:00:00Z' },
    { id: 'shared_2', name: '英语老师', creator_nickname: '李四', last_used_at: '2026-04-18T08:00:00Z' },
  ])

  const hasApps = computed(() => apps.value.length > 0)

  /** 从 localStorage 加载；兼容旧版 specify_apps 并自动迁移 */
  function initApps() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        apps.value = JSON.parse(stored)
        return
      }
      const legacy = localStorage.getItem('specify_apps')
      if (legacy) {
        apps.value = JSON.parse(legacy).map(a => _migrateLegacy(a))
        _persist()
      }
    } catch {
      apps.value = []
    }
  }

  /** 将旧版嵌套结构（advanced / subAgents / workspace）转为当前扁平 schema */
  function _migrateLegacy(a) {
    const adv = a.advanced || {}
    return defaultApp({
      id: a.id,
      name: a.name,
      description: a.description,
      system_prompt: a.systemPrompt || a.system_prompt || '',
      tools: a.tools || defaultToolConfig(),
      custom_tools: (a.subAgents || []).map(sa => ({
        id: sa.id || genCustomToolId(),
        name: sa.name || '',
        description: sa.description || '',
        system_prompt: sa.system_prompt || sa.systemPrompt || '',
        sub_tools: (sa.tools || []).map(t =>
          typeof t === 'string'
            ? { type: 'recommended', name: t }
            : t
        ),
        referenced_by: [],
        enabled: sa.enabled ?? true,
        created_at: sa.created_at || new Date().toISOString()
      })),
      tool_timeout: adv.tool_timeout,
      max_steps: adv.max_steps,
      steps_limit_behavior: adv.steps_limit_behavior,
      compress_threshold: adv.compress_threshold,
      compress_behavior: adv.compress_behavior,
      safety_enabled: adv.safety_enabled,
      safety_rules: adv.safety_rules,
      default_safety_policy: adv.default_safety_policy,
      allowed_paths: adv.allowed_paths,
      allowed_urls: adv.allowed_urls,
      workspace_base_url: a.workspace?.base_url || '',
      workspace_api_key: a.workspace?.api_key || '',
      is_public: a.share ?? false,
      created_at: a.created_at
    })
  }

  function _persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps.value))
  }

  function addApp(data) {
    const app = defaultApp(data)
    apps.value.unshift(app)
    _persist()
    return app
  }

  /**
   * 更新 App 字段。tools 做按 key 深度合并，避免覆盖未提交的 SP 工具配置。
   */
  function updateApp(id, updates) {
    const idx = apps.value.findIndex(a => a.id === id)
    if (idx === -1) return
    if (updates.tools) {
      Object.keys(updates.tools).forEach(k => {
        if (apps.value[idx].tools[k]) {
          Object.assign(apps.value[idx].tools[k], updates.tools[k])
        }
      })
      delete updates.tools
    }
    Object.assign(apps.value[idx], updates)
    _persist()
  }

  function deleteApp(id) {
    const idx = apps.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      apps.value.splice(idx, 1)
      _persist()
    }
  }

  function getApp(id) {
    return apps.value.find(a => a.id === id) || null
  }

  /** 统计 App 已启用工具总数（SP + 特殊 + 自定义 + MCP 工具数） */
  function getEnabledToolCount(app) {
    const spCount = Object.values(app.tools || {}).filter(t => t.enabled).length
    const specialCount = Object.values(app.special_tools || {}).filter(t => t.enabled).length
    const customCount = (app.custom_tools || []).filter(ct => ct.enabled).length
    const mcpCount = (app.mcp_services || []).filter(m => m.enabled).reduce((s, m) => s + (m.tool_count || 0), 0)
    return spCount + specialCount + customCount + mcpCount
  }

  function setRecommendedApps(items) {
    recommendedApps.value = items
  }

  function setRecentApps(items) {
    recentApps.value = items
  }

  return {
    apps,
    recommendedApps,
    recentApps,
    hasApps,
    initApps,
    addApp,
    updateApp,
    deleteApp,
    getApp,
    getEnabledToolCount,
    setRecommendedApps,
    setRecentApps,
  }
})
