import {
  PLATFORM_TOOLS,
  TOOL_SUB_MODELS,
} from '@/constants/spTools'
import { getDefaultModelForPlatform, getModelsForPlatform } from '@/constants/platformModels'
import { normalizeSubTools, getSubToolRefKey, isPlatformSubTool } from '@/utils/customToolErrors'

/** 无本地 PLATFORM_TOOLS 时返回 null，表示不按平台清单裁剪工具 */
function getAllowedToolKeys(platform) {
  const list = PLATFORM_TOOLS[platform] || PLATFORM_TOOLS.claude
  if (!list || !list.length) return null
  return new Set(list)
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
  const removedSpecialTools = allowed
    ? Object.keys(form.special_tools || {}).filter(key => !allowed.has(key))
    : []
  const modelWillChange = !getModelsForPlatform(newPlatform).some(m => m.id === form.model)

  let customToolRefsRemoved = 0
  if (allowed) {
    for (const ct of form.custom_tools || []) {
      const subs = normalizeSubTools(ct, form.custom_tools || [])
      customToolRefsRemoved += subs.filter(sub => isPlatformSubTool(sub) && !allowed.has(getSubToolRefKey(sub))).length
    }
  }

  return {
    hasChanges: true,
    removedSpecialTools,
    modelWillChange,
    nextModel: modelWillChange ? getDefaultModelForPlatform(newPlatform) : form.model,
    customToolRefsRemoved,
  }
}

/** 将 form 中与平台绑定的字段迁移到新平台（主模型清空，需用户重选） */
export function applyPlatformMigration(form, newPlatform) {
  const allowed = getAllowedToolKeys(newPlatform)

  // 与产品确认文案一致：切换后清除主模型，不自动填默认模型
  form.model = ''

  const nextSpecialTools = {}
  for (const [key, cfg] of Object.entries(form.special_tools || {})) {
    if (allowed && !allowed.has(key)) continue
    let sub_model = cfg.sub_model ?? null
    if (TOOL_SUB_MODELS[key]) {
      sub_model = resolveSubModelForPlatform(key, newPlatform, sub_model)
    }
    nextSpecialTools[key] = { ...cfg, sub_model }
  }
  form.special_tools = nextSpecialTools

  if (allowed) {
    form.custom_tools = (form.custom_tools || []).map(ct => {
      const subs = normalizeSubTools(ct, form.custom_tools || [])
      const filtered = subs.filter(sub => {
        if (!isPlatformSubTool(sub)) return true
        return allowed.has(getSubToolRefKey(sub))
      })
      if (filtered.length === subs.length) return ct
      return { ...ct, sub_tools: filtered }
    })
  }

  form.platform = newPlatform
  form.credential_id = null
}

/** 切换平台前的固定确认文案（与产品设计稿一致） */
export const PLATFORM_SWITCH_CONFIRM_MESSAGE = [
  '切换平台后：',
  '1. 当前对话模型将被**清除**，需要重新选择',
  '2. 不兼容新平台的工具需要**手动关闭**',
  '3. 已有对话记录不受影响',
  '',
  '确定要切换平台吗？',
].join('\n')

/** @deprecated 保留给调试用；产品确认弹窗请使用 PLATFORM_SWITCH_CONFIRM_MESSAGE */
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
  lines.push('· API 凭证将重置为跟随新平台默认')
  if (!analysis.modelWillChange && !analysis.removedSpecialTools.length && !analysis.customToolRefsRemoved) {
    lines.push('· 当前配置与新平台兼容，无需额外清理')
  }

  return lines.join('\n')
}
