import {
  PLATFORM_TOOLS,
  SPECIAL_TOOLS,
  TOOL_SUB_MODELS,
} from '@/constants/spTools'
import { getDefaultModelForPlatform, getModelsForPlatform } from '@/constants/platformModels'
import { normalizeSubTools, getSubToolRefKey, isPlatformSubTool } from '@/utils/customToolErrors'

function getAllowedToolKeys(platform) {
  return new Set(PLATFORM_TOOLS[platform] || PLATFORM_TOOLS.claude)
}

function getSpecialToolLabel(key) {
  return SPECIAL_TOOLS.find(t => t.key === key)?.name || key
}

function resolveSubModelForPlatform(toolKey, platform, current) {
  const options = TOOL_SUB_MODELS[toolKey]?.[platform]
  if (!options?.length) return null
  if (current && options.some(o => o.id === current)) return current
  return options.find(o => o.default)?.id || options[0].id
}

/** 分析切换平台会影响哪些配置，供确认弹窗展示 */
export function analyzePlatformMigration(form, oldPlatform, newPlatform) {
  if (oldPlatform === newPlatform) {
    return { hasChanges: false, removedSpecialTools: [], modelWillChange: false, customToolRefsRemoved: 0 }
  }

  const allowed = getAllowedToolKeys(newPlatform)
  const removedSpecialTools = Object.keys(form.special_tools || {}).filter(key => !allowed.has(key))
  const modelWillChange = !getModelsForPlatform(newPlatform).some(m => m.id === form.model)

  let customToolRefsRemoved = 0
  for (const ct of form.custom_tools || []) {
    const subs = normalizeSubTools(ct, form.custom_tools || [])
    customToolRefsRemoved += subs.filter(sub => isPlatformSubTool(sub) && !allowed.has(getSubToolRefKey(sub))).length
  }

  return {
    hasChanges: true,
    removedSpecialTools: removedSpecialTools.map(getSpecialToolLabel),
    modelWillChange,
    nextModel: modelWillChange ? getDefaultModelForPlatform(newPlatform) : form.model,
    customToolRefsRemoved,
  }
}

/** 将 form 中与平台绑定的字段迁移到新平台 */
export function applyPlatformMigration(form, newPlatform) {
  const allowed = getAllowedToolKeys(newPlatform)

  if (!getModelsForPlatform(newPlatform).some(m => m.id === form.model)) {
    form.model = getDefaultModelForPlatform(newPlatform)
  }

  const nextSpecialTools = {}
  for (const [key, cfg] of Object.entries(form.special_tools || {})) {
    if (!allowed.has(key)) continue
    const tool = SPECIAL_TOOLS.find(t => t.key === key)
    let sub_model = cfg.sub_model ?? null
    if (tool?.hasSubModel) {
      sub_model = resolveSubModelForPlatform(key, newPlatform, sub_model)
    }
    nextSpecialTools[key] = { ...cfg, sub_model }
  }
  form.special_tools = nextSpecialTools

  form.custom_tools = (form.custom_tools || []).map(ct => {
    const subs = normalizeSubTools(ct, form.custom_tools || [])
    const filtered = subs.filter(sub => {
      if (!isPlatformSubTool(sub)) return true
      return allowed.has(getSubToolRefKey(sub))
    })
    if (filtered.length === subs.length) return ct
    return { ...ct, sub_tools: filtered }
  })

  form.platform = newPlatform
  form.credential_id = null
}

export function buildPlatformSwitchMessage(analysis) {
  const lines = ['切换平台后，以下配置将自动调整：', '']

  if (analysis.modelWillChange) {
    lines.push(`· 底层模型将切换为新平台默认模型（${analysis.nextModel}）`)
  }
  if (analysis.removedSpecialTools.length) {
    lines.push(`· 以下平台专属工具将被关闭：${analysis.removedSpecialTools.join('、')}`)
  }
  if (analysis.customToolRefsRemoved) {
    lines.push(`· ${analysis.customToolRefsRemoved} 个自定义工具中的不兼容嵌套引用将被移除`)
  }
  if (!analysis.modelWillChange && !analysis.removedSpecialTools.length && !analysis.customToolRefsRemoved) {
    lines.push('· 当前配置与新平台兼容，无需额外清理')
  }

  return lines.join('\n')
}
