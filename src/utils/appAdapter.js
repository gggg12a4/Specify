/**
 * 开发者 App 前后端字段转换。
 * 前端编辑页沿用 tools / special_tools / custom_tools / mcp_services 结构。
 */
import { SP_TOOLS, SPECIAL_TOOLS, SP_TOOL_MAP, SPECIAL_TOOL_MAP } from '@/constants/spTools'
import { normalizeSubToolEntry } from '@/utils/customToolErrors'

const SP_KEYS = new Set(SP_TOOLS.map(t => t.key))
const SPECIAL_KEYS = new Set(SPECIAL_TOOLS.map(t => t.key))

function genCustomToolId() {
  return 'ct_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function genMcpId() {
  return 'mcp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

/** 各平台工具的默认 enabled / config（目录由接口下发，此处不再预置 mock） */
export function defaultToolConfig() {
  return {}
}

/** 从模型分组名称推断前端 platform key */
export function modelGroupToPlatformKey(modelGroup) {
  if (!modelGroup) return 'claude'
  const label = String(modelGroup.display_name || modelGroup.displayName || modelGroup.name || '').toLowerCase()
  if (label.includes('claude')) return 'claude'
  if (label.includes('gemini')) return 'gemini'
  if (label.includes('gpt')) return 'gpt'
  if (label.includes('deepseek')) return 'deepseek'
  if (label.includes('qwen')) return 'qwen'
  return 'claude'
}

/** 从已加载的模型分组列表中，按 platform key 查找 model_group_id */
export function platformKeyToModelGroupId(platformKey, modelGroups = []) {
  const key = String(platformKey || 'claude').toLowerCase()
  const matched = modelGroups.find(g => modelGroupToPlatformKey(g) === key)
  return matched?.id || modelGroups[0]?.id || null
}

function normalizeBoolPublic(value) {
  if (typeof value === 'boolean') return value
  return value === 1 || value === '1'
}

/** 判断 queryEditPageData 的 config 是否为空（刚创建、尚未配置） */
export function isConfigEmpty(result) {
  const config = result?.config
  if (config == null) return true
  if (typeof config === 'object' && Object.keys(config).length === 0) return true

  const prompt = String(config.system_prompt || config.systemPrompt || '').trim()
  const model = String(config.selected_model || config.selectedModel || '').trim()
  const snapshot = config.tool_snapshot || config.toolSnapshot || {}
  const toolLists = [
    ...(snapshot.platform_tools || snapshot.platformTools || []),
    ...(snapshot.developer_agent_tools || snapshot.developerAgentTools || []),
    ...(snapshot.developer_mcp_tools || snapshot.developerMcpTools || []),
  ]
  const hasToolConfig = toolLists.some((item) => {
    if (!item) return false
    if (item.enabled === false) return false
    return !!(item.ref_id || item.refId || item.id)
  })

  return !prompt && !model && !hasToolConfig
}

/** 未发布且 config 为空 → 待配置 */
export function isPendingConfig(result) {
  if (!result) return false
  const app = result.app || {}
  const liveVersionId = app.live_version_id || app.liveVersionId
  if (liveVersionId) return false
  return isConfigEmpty(result)
}

/** 列表页无 config 时的兜底：未发布且创建后未更新过 */
export function inferPendingConfigFromListItem(item) {
  if (item?.liveVersionId) return false
  if (item?.isPendingConfig === true) return true
  if (item?.isPendingConfig === false) return false
  const createTime = item?.createTime || ''
  const updateTime = item?.updateTime || ''
  if (!createTime || !updateTime) return false
  return createTime === updateTime
}

/** 解析 App 发布态展示文案 */
export function resolveAppPublishStatus({ liveVersionId, isPendingConfig: pending, hasDraft = false } = {}) {
  if (liveVersionId) return { label: '已发布', badgeClass: 'badge-live' }
  if (pending) return { label: '待配置', badgeClass: 'badge-pending-config' }
  if (hasDraft) return { label: '草稿', badgeClass: 'badge-draft' }
  return { label: '草稿', badgeClass: 'badge-draft' }
}

/** listMyApps.records[] → 工作空间卡片数据 */
export function toListItem(vo) {
  const modelGroupName = vo.modelGroupName || vo.model_group_name || ''
  return {
    id: vo.id,
    name: vo.name,
    description: vo.description || '',
    modelGroupId: vo.modelGroupId || vo.model_group_id || '',
    modelGroupName,
    platform: inferPlatformFromName(modelGroupName),
    liveVersionId: vo.liveVersionId || vo.live_version_id || null,
    shareCode: vo.shareCode || vo.share_code || '',
    isPublic: normalizeBoolPublic(vo.isPublic ?? vo.is_public),
    createTime: vo.createTime || vo.create_time,
    updateTime: vo.updateTime || vo.update_time,
    isPendingConfig: false,
    isTemplate: false,
  }
}

/** 按 updateTime 倒序（无 updateTime 时回退 createTime） */
export function sortAppsByUpdateTimeDesc(items = []) {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a.updateTime || a.createTime || '') || 0
    const tb = Date.parse(b.updateTime || b.createTime || '') || 0
    return tb - ta
  })
}

/** listTemplates.records[] → 模板卡片数据 */
export function toTemplateItem(vo) {
  const modelGroupName = vo.modelGroupName || vo.model_group_name || ''
  return {
    id: vo.appId || vo.app_id || vo.id,
    name: vo.name,
    description: vo.description || '',
    modelGroupId: vo.modelGroupId || vo.model_group_id || '',
    modelGroupName,
    platform: inferPlatformFromName(modelGroupName),
    sortOrder: vo.sortOrder ?? vo.sort_order ?? 0,
    isTemplate: true,
  }
}

function inferPlatformFromName(name) {
  return modelGroupToPlatformKey({ name, display_name: name })
}

function deepMergeToolDefaults(tools) {
  const base = defaultToolConfig()
  const merged = { ...base }
  for (const [key, cfg] of Object.entries(tools || {})) {
    if (merged[key]) {
      merged[key] = {
        enabled: cfg?.enabled ?? merged[key].enabled,
        config: { ...merged[key].config, ...(cfg?.config || {}) },
      }
    } else {
      merged[key] = { enabled: cfg?.enabled ?? false, config: { ...(cfg?.config || {}) } }
    }
  }
  return merged
}

function parseJsonMaybe(value, fallback = null) {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function stripHtmlText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function asToolArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'object') {
    return Object.entries(value).map(([key, item]) => {
      if (!item || typeof item !== 'object') return null
      return { ...item, _dictKey: key }
    }).filter(Boolean)
  }
  return []
}

function schemaFieldsToParams(configSchema) {
  const schema = parseJsonMaybe(configSchema, null)
  const fields = schema?.fields || []
  return fields.map((f) => {
    const type = f.type === 'boolean' ? 'bool'
      : (f.type === 'integer' || f.type === 'number' ? 'int' : (f.type || 'string'))
    return {
      key: f.name,
      type,
      default: f.default ?? null,
      label: f.label || f.name || '',
      desc: f.desc || f.description || '',
      modelGroups: f.modelGroups || f.model_groups || [],
      configVisible: f.configVisible ?? f.config_visible,
      createVisible: f.createVisible ?? f.create_visible,
      min: f.min ?? null,
      max: f.max ?? null,
      step: f.step ?? 1,
    }
  }).filter(p => p.key)
}

function resolveToolConfigObject(tool) {
  return parseJsonMaybe(tool?.config, {}) || {}
}

/** 解析 platform_tools 字典 key：`platform_basetools:id` */
function parsePlatformToolDictKey(dictKey) {
  const s = String(dictKey || '')
  const idx = s.indexOf(':')
  if (idx <= 0) return { refType: '', id: s }
  return {
    refType: s.slice(0, idx),
    id: s.slice(idx + 1),
  }
}

function normalizeRefType(refType) {
  const t = String(refType || '').toLowerCase()
  if (t.includes('basetool')) return 'platform_basetools'
  if (t.includes('agent')) return 'platform_agent_tools'
  if (t.includes('mcp')) return 'platform_mcp_tools'
  return t
}

/**
 * basetool → 基础工具；agent → Agent 工具；mcp → 平台 MCP
 * @returns {'basetool'|'agent'|'mcp'|null}
 */
function resolvePlatformToolCategory(tool) {
  const refType = normalizeRefType(tool?.ref_type || tool?.refType || tool?._refType || '')
  if (refType === 'platform_basetools') return 'basetool'
  if (refType === 'platform_agent_tools') return 'agent'
  if (refType === 'platform_mcp_tools') return 'mcp'
  return null
}

function resolvePlatformToolId(tool) {
  if (tool?.id) return String(tool.id)
  const fromKey = parsePlatformToolDictKey(tool?._dictKey).id
  if (fromKey) return fromKey
  return String(tool?.ref_id || tool?.refId || tool?.name || '').trim()
}

function isToolVisible(tool) {
  if (tool?.is_deleted === true || tool?.isDeleted === true || tool?.delFlag === 1) return false
  const visible = tool?.visible
  if (visible === 0 || visible === '0' || visible === false) return false
  const status = tool?.status
  if (status === 0 || status === '0' || status === false) return false
  return true
}

function isToolForModelGroup(tool, modelGroupId) {
  const groups = tool?.model_groups || tool?.modelGroups
  if (!Array.isArray(groups) || groups.length === 0) return true
  if (!modelGroupId) return true
  return groups.map(String).includes(String(modelGroupId))
}

function extractPlatformToolEntries(templates = {}) {
  const root = templates || {}
  const nested = root.platform_tools || root.platformTools || null
  const collect = []

  const pushItem = (item, fallbackRefType = '') => {
    if (!item || typeof item !== 'object') return
    const parsed = parsePlatformToolDictKey(item._dictKey)
    const refType = normalizeRefType(
      item.ref_type || item.refType || item._refType || parsed.refType || fallbackRefType
    )
    collect.push({
      ...item,
      id: item.id || parsed.id || item.ref_id || item.refId || '',
      _refType: refType,
    })
  }

  const pushGroup = (list, refType) => {
    for (const item of asToolArray(list)) pushItem(item, refType)
  }

  pushGroup(root.platform_basetools || root.platformBasetools, 'platform_basetools')
  pushGroup(root.platform_agent_tools || root.platformAgentTools, 'platform_agent_tools')
  pushGroup(root.platform_mcp_tools || root.platformMcpTools, 'platform_mcp_tools')

  if (!nested) return collect

  // 主流结构：{ "platform_basetools:id": {...}, "platform_agent_tools:id": {...} }
  if (typeof nested === 'object' && !Array.isArray(nested)) {
    const hasTypedKeys = Object.keys(nested).some(k => k.includes(':') && k.startsWith('platform_'))
    if (hasTypedKeys) {
      for (const item of asToolArray(nested)) pushItem(item)
      return collect
    }

    pushGroup(nested.platform_basetools || nested.platformBasetools, 'platform_basetools')
    pushGroup(nested.platform_agent_tools || nested.platformAgentTools, 'platform_agent_tools')
    pushGroup(nested.platform_mcp_tools || nested.platformMcpTools, 'platform_mcp_tools')

    for (const [key, value] of Object.entries(nested)) {
      if ([
        'platform_basetools', 'platformBasetools',
        'platform_agent_tools', 'platformAgentTools',
        'platform_mcp_tools', 'platformMcpTools',
      ].includes(key)) continue
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        pushItem({ ...value, _dictKey: key })
      }
    }
    return collect
  }

  if (Array.isArray(nested)) {
    for (const item of nested) pushItem(item)
  }

  return collect
}

function buildPlatformToolDef(tool, category) {
  const id = resolvePlatformToolId(tool)
  if (!id) return null

  const params = schemaFieldsToParams(tool.config_schema || tool.configSchema)
  const displayName = tool.display_name || tool.displayName || ''
  const technicalName = tool.name || resolveToolConfigObject(tool).name || ''
  const description = stripHtmlText(tool.description || '')
  const detailRaw = tool.detail
  const detailText = typeof detailRaw === 'object' && detailRaw
    ? stripHtmlText(detailRaw.summary || detailRaw.text || '')
    : stripHtmlText(detailRaw || '')

  const kind = category === 'basetool' ? 'sp' : (category === 'agent' ? 'special' : 'mcp')

  return {
    key: id,
    id,
    refType: normalizeRefType(tool._refType || tool.ref_type || tool.refType),
    category,
    kind,
    // 标题：display_name；标题旁：detail；描述行：description
    name: displayName || technicalName || id,
    desc: detailText,
    detail: {
      summary: description || detailText,
      example: (typeof detailRaw === 'object' && detailRaw?.example) || '',
    },
    params,
    hasConfig: params.length > 0,
    hasSubModel: params.some(p => p.key === 'sub_model' || p.key === 'subModel')
      || id === 'draw'
      || id === 'tts',
    sortOrder: Number(tool.sortOrder ?? tool.sort_order ?? 0),
    modelGroups: tool.model_groups || tool.modelGroups || [],
    raw: tool,
  }
}

/**
 * 编辑页 result.templates.platform_tools → 分区目录。
 * basetool / agent / 平台 MCP 均进入推荐工具（已启用 / 更多工具）。
 * createable 不进入推荐工具卡片。
 */
export function normalizeToolCatalog(templates = {}, { modelGroupId } = {}) {
  const basetools = []
  const agentTools = []
  const mcpTools = []
  const seen = new Set()

  for (const tool of extractPlatformToolEntries(templates)) {
    const category = resolvePlatformToolCategory(tool)
    if (!category) continue
    if (!isToolVisible(tool)) continue
    if (!isToolForModelGroup(tool, modelGroupId)) continue

    const def = buildPlatformToolDef(tool, category)
    if (!def) continue
    const dedupeKey = `${def.refType}:${def.key}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    if (category === 'basetool') basetools.push(def)
    else if (category === 'agent') agentTools.push(def)
    else mcpTools.push(def)
  }

  const bySort = (a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return String(a.name).localeCompare(String(b.name), 'zh')
  }

  return {
    /** 推荐工具：基础工具 + Agent 工具 + 平台 MCP */
    platformToolDefs: [
      ...basetools.sort(bySort),
      ...agentTools.sort(bySort),
      ...mcpTools.sort(bySort),
    ],
    /** @deprecated 已并入 platformToolDefs，保留给兼容调用 */
    platformMcpDefs: mcpTools.sort(bySort),
  }
}

/**
 * templates.createable → 可创建 MCP 表单模板字典（name → template）
 * Agent 模板也返回，供创建 Agent 后续使用。
 */
export function normalizeCreateableTemplates(templates = {}) {
  const raw = templates?.createable || templates?.createableTemplates || {}
  const mcpTemplates = {}
  const agentTemplates = {}

  const entries = Array.isArray(raw)
    ? raw.map(item => [item.name || item.id, item])
    : Object.entries(raw || {})

  for (const [key, item] of entries) {
    if (!item || typeof item !== 'object') continue
    const name = item.name || key
    if (!name) continue

    const normalized = {
      name,
      displayName: item.display_name || item.displayName || name,
      description: item.description || '',
      handlerPath: item.handler_path || item.handlerPath || '',
      config_schema: item.config_schema || item.configSchema || { fields: [] },
      raw: item,
    }

    const path = String(normalized.handlerPath || name).toLowerCase()
    const isMcp = name === 'MCPServerStreamable'
      || path.includes('mcp')
      || /mcp/i.test(name)
    if (isMcp) mcpTemplates[name] = normalized
    else agentTemplates[name] = normalized
  }

  return { mcpTemplates, agentTemplates }
}

/** @deprecated 使用 normalizeToolCatalog；保留兼容旧调用 */
export function normalizePlatformToolDefs(templates = {}, options = {}) {
  return normalizeToolCatalog(templates, options).platformToolDefs
}

function platformToolsToForm(snapshot = {}) {
  const tools = defaultToolConfig()
  const special_tools = {}
  const platform_mcp = {}

  for (const item of snapshot.platform_tools || snapshot.platformTools || []) {
    const refId = String(item.ref_id || item.refId || '')
    if (!refId) continue
    const enabled = item.enabled !== false
    const config = item.config ?? {}
    const refType = normalizeRefType(item.ref_type || item.refType)

    if (refType === 'platform_basetools' || (!refType && SP_KEYS.has(refId))) {
      tools[refId] = {
        enabled,
        config: { ...(tools[refId]?.config || {}), ...config },
      }
      continue
    }

    if (refType === 'platform_agent_tools' || (!refType && SPECIAL_KEYS.has(refId))) {
      special_tools[refId] = {
        enabled,
        sub_model: config.sub_model || config.subModel || undefined,
        config: { ...config },
      }
      continue
    }

    if (refType === 'platform_mcp_tools') {
      platform_mcp[refId] = {
        enabled,
        config: { ...(config || {}) },
      }
      continue
    }

    // 无 ref_type 时按 id 形态兜底
    if (String(refId).startsWith('SP')) {
      tools[refId] = { enabled, config: { ...(tools[refId]?.config || {}), ...config } }
    } else {
      special_tools[refId] = {
        enabled,
        sub_model: config.sub_model || config.subModel || undefined,
        config: { ...config },
      }
    }
  }

  return {
    tools: deepMergeToolDefaults(tools),
    special_tools,
    platform_mcp,
  }
}

function agentToolsToCustomTools(items = []) {
  return items.map(item => ({
    id: item.id || genCustomToolId(),
    name: item.config?.name || '',
    description: item.config?.description || '',
    system_prompt: item.config?.system_prompt || item.config?.systemPrompt || '',
    enabled: item.enabled !== false,
    sub_tools: (item.subtools || item.sub_tools || []).map(st => subtoolRefToFrontend(st)),
    tool_configs: {},
    created_at: item.created_at || new Date().toISOString(),
  }))
}

function subtoolRefToFrontend(ref) {
  const refId = ref.ref_id || ref.refId
  const refType = ref.ref_type || ref.refType
  if (refType === 'platform_basetools' || SP_KEYS.has(refId)) {
    return { type: 'recommended', name: refId }
  }
  if (SPECIAL_KEYS.has(refId)) {
    return { type: 'recommended', name: refId }
  }
  return { type: 'custom', custom_tool_id: refId, name: refId }
}

function mcpToolsToMcpServices(items = []) {
  return items.map(item => ({
    id: item.id || genMcpId(),
    name: item.config?.name || '',
    url: item.config?.url || '',
    headers: item.config?.headers || {},
    enabled: item.enabled !== false,
    credential_sharing: item.credential_sharing || item.credentialSharing || '',
  }))
}

function normalizeModels(models = []) {
  return models.map(m => ({
    id: m.id,
    name: m.display_name || m.displayName || m.name || m.id,
    desc: m.description || m.desc || '',
  }))
}

/** queryEditPageData.result → 编辑页会话数据 */
export function editPageToSession(result) {
  const appRaw = result.app || {}
  const modelGroup = result.model_group || result.modelGroup || {}
  const config = result.config || {}
  const snapshot = config.tool_snapshot || config.toolSnapshot || {}
  const platform = modelGroupToPlatformKey(modelGroup)
  const toolParts = platformToolsToForm(snapshot)

  const meta = {
    id: appRaw.id,
    name: appRaw.name || '',
    description: appRaw.description || '',
    modelGroupId: appRaw.model_group_id || appRaw.modelGroupId || modelGroup.id || '',
    isPublic: normalizeBoolPublic(appRaw.is_public ?? appRaw.isPublic),
    shareCode: appRaw.share_code || appRaw.shareCode || '',
    liveVersionId: appRaw.live_version_id || appRaw.liveVersionId || null,
    billingMode: appRaw.billing_mode || appRaw.billingMode || 'user_pay',
    isPendingConfig: isPendingConfig(result),
  }

  const form = {
    platform,
    modelGroupId: meta.modelGroupId,
    credential_id: null,
    system_prompt: config.system_prompt || config.systemPrompt || '',
    model: config.selected_model || config.selectedModel || '',
    tools: toolParts.tools,
    special_tools: toolParts.special_tools,
    platform_mcp: toolParts.platform_mcp,
    custom_tools: agentToolsToCustomTools(snapshot.developer_agent_tools || snapshot.developerAgentTools),
    mcp_services: mcpToolsToMcpServices(snapshot.developer_mcp_tools || snapshot.developerMcpTools),
  }

  const app = {
    ...meta,
    platform,
    system_prompt: form.system_prompt,
    model: form.model,
    tools: form.tools,
    special_tools: form.special_tools,
    platform_mcp: form.platform_mcp,
    custom_tools: form.custom_tools,
    mcp_services: form.mcp_services,
  }

  const catalog = normalizeToolCatalog(result.templates || {}, {
    modelGroupId: meta.modelGroupId,
  })
  const createable = normalizeCreateableTemplates(result.templates || {})

  return {
    app,
    form,
    meta,
    models: normalizeModels(result.models || []),
    draft: {
      hasDraft: result.has_draft ?? result.hasDraft ?? false,
      configSource: result.config_source || result.configSource || null,
      draftUpdatedAt: result.draft_updated_at || result.draftUpdatedAt || null,
      selectedModelStatus: result.selected_model_status || result.selectedModelStatus || null,
      versions: result.versions || [],
    },
    toolTemplates: result.templates || {},
    platformToolDefs: catalog.platformToolDefs,
    platformMcpDefs: catalog.platformMcpDefs,
    createableMcpTemplates: createable.mcpTemplates,
    createableAgentTemplates: createable.agentTemplates,
  }
}

function spToolsToPlatformTools(tools = {}) {
  return Object.entries(tools).map(([key, cfg]) => ({
    ref_type: 'platform_basetools',
    ref_id: key,
    enabled: cfg?.enabled ?? false,
    config: cfg?.config ?? null,
  }))
}

function specialToolsToPlatformTools(specialTools = {}) {
  return Object.entries(specialTools).map(([key, cfg]) => {
    const config = { ...(cfg?.config || {}) }
    if (cfg?.sub_model) config.sub_model = cfg.sub_model
    return {
      ref_type: 'platform_agent_tools',
      ref_id: key,
      enabled: cfg?.enabled ?? false,
      config: Object.keys(config).length ? config : null,
    }
  })
}

function platformMcpToPlatformTools(platformMcp = {}) {
  return Object.entries(platformMcp).map(([key, cfg]) => ({
    ref_type: 'platform_mcp_tools',
    ref_id: key,
    enabled: cfg?.enabled ?? false,
    config: cfg?.config ?? null,
  }))
}

function subToolToPlatformRef(sub, customTools) {
  const entry = normalizeSubToolEntry(sub, customTools)
  if (!entry) return null
  if (entry.type === 'recommended') {
    const key = entry.name
    const refType = SP_KEYS.has(key) ? 'platform_basetools' : 'platform_agent_tools'
    return { ref_type: refType, ref_id: key, enabled: true, config: null }
  }
  return {
    ref_type: 'platform_agent_tools',
    ref_id: entry.custom_tool_id || entry.name,
    enabled: true,
    config: null,
  }
}

function customToolsToAgentTools(customTools = []) {
  return customTools.map(ct => ({
    id: ct.id,
    config: {
      name: ct.name || '',
      description: ct.description || '',
      system_prompt: ct.system_prompt || '',
    },
    enabled: ct.enabled !== false,
    subtools: (ct.sub_tools || [])
      .map(st => subToolToPlatformRef(st, customTools))
      .filter(Boolean),
  }))
}

function mcpServicesToMcpTools(mcpServices = []) {
  return mcpServices.map(mcp => ({
    id: mcp.id,
    config: {
      name: mcp.name || '',
      url: mcp.url || '',
      headers: mcp.headers || {},
    },
    enabled: mcp.enabled !== false,
    credential_sharing: mcp.credential_sharing || '',
  }))
}

/** 编辑页 form → saveDraft 请求体（全量快照） */
export function formToSaveDraft(appId, form) {
  return {
    app_id: appId,
    model_group_id: form.modelGroupId || '',
    system_prompt: form.system_prompt ?? '',
    selected_model: form.model ?? '',
    tool_snapshot: {
      platform_tools: [
        ...spToolsToPlatformTools(form.tools),
        ...specialToolsToPlatformTools(form.special_tools),
        ...platformMcpToPlatformTools(form.platform_mcp),
      ],
      developer_agent_tools: customToolsToAgentTools(form.custom_tools),
      developer_mcp_tools: mcpServicesToMcpTools(form.mcp_services),
    },
  }
}

/** 创建 App 请求体 */
export function toCreateRequest({ name, description, templateAppId, modelGroupId }) {
  const body = {
    name: String(name || '').trim(),
    description: String(description || '').trim(),
  }
  if (templateAppId) {
    body.template_app_id = templateAppId
  } else if (modelGroupId) {
    body.model_group_id = modelGroupId
  }
  return body
}

/** 解析 create 接口返回的 appId */
export function extractAppId(result) {
  if (!result) return null
  if (typeof result === 'string') return result
  return result.appId || result.app_id || result.id || null
}

/** 解析 publish 接口返回 */
export function extractPublishResult(result) {
  if (!result) return null
  return {
    versionId: result.versionId || result.version_id,
    versionNumber: result.versionNumber ?? result.version_number,
  }
}

export { SP_TOOL_MAP, SPECIAL_TOOL_MAP }
