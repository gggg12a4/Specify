import { SP_TOOLS, SPECIAL_TOOLS, isToolError } from '@/constants/spTools'

const PLATFORM_KEYS = new Set([...SP_TOOLS, ...SPECIAL_TOOLS].map(t => t.key))

export function isPlatformToolKey(key) {
  if (!key) return false
  if (PLATFORM_KEYS.has(key)) return true
  // 本地清单已清空后：SP* 前缀仍视为平台基础工具
  return String(key).startsWith('SP')
}

export function findCustomToolRef(key, customTools) {
  if (!key) return null
  return customTools.find(t => t.id === key) || customTools.find(t => t.name === key) || null
}

/** 将单条引用规范化为 recommended / custom 结构 */
export function normalizeSubToolEntry(item, customTools = []) {
  if (typeof item === 'string') {
    if (isPlatformToolKey(item)) return { type: 'recommended', name: item }
    const ref = findCustomToolRef(item, customTools)
    return {
      type: 'custom',
      custom_tool_id: ref?.id || item,
      name: ref?.name || item,
    }
  }

  if (item.type === 'custom') {
    const ref = findCustomToolRef(item.custom_tool_id || item.name, customTools)
    return {
      type: 'custom',
      custom_tool_id: item.custom_tool_id || ref?.id,
      name: item.name || ref?.name || item.custom_tool_id,
    }
  }

  if (item.type === 'recommended') {
    const key = item.name || item.custom_tool_id
    if (!key) return null
    return { type: 'recommended', name: key }
  }

  const key = item.custom_tool_id || item.name
  if (!key) return null
  if (isPlatformToolKey(key)) return { type: 'recommended', name: key }
  if (item.custom_tool_id) {
    const ref = findCustomToolRef(item.custom_tool_id, customTools)
    return {
      type: 'custom',
      custom_tool_id: item.custom_tool_id,
      name: item.name || ref?.name || item.custom_tool_id,
    }
  }
  const ref = findCustomToolRef(key, customTools)
  return {
    type: 'custom',
    custom_tool_id: ref?.id || key,
    name: ref?.name || key,
  }
}

/** 兼容 sub_tools 对象数组与 legacy tools 字符串数组 */
export function normalizeSubTools(ct, customTools = []) {
  const raw = ct?.sub_tools?.length ? ct.sub_tools : (ct?.tools || [])
  return raw
    .map(item => normalizeSubToolEntry(item, customTools))
    .filter(Boolean)
}

/** 解析子工具引用 id/key */
export function getSubToolRefKey(sub) {
  if (typeof sub === 'string') return sub
  if (sub.type === 'custom') return sub.custom_tool_id
  if (sub.type === 'recommended') return sub.name
  return sub.custom_tool_id || sub.name
}

export function isPlatformSubTool(sub) {
  if (typeof sub === 'string') return isPlatformToolKey(sub)
  return sub?.type === 'recommended' && isPlatformToolKey(sub.name)
}

function markVisited(visited, ct) {
  if (!ct) return
  visited.add(ct.id)
  if (ct.name) visited.add(ct.name)
}

function isVisited(visited, ct) {
  if (!ct) return false
  return visited.has(ct.id) || (ct.name && visited.has(ct.name))
}

export function isSubToolError(sub, customTools, visited = new Set()) {
  const entry = normalizeSubToolEntry(sub, customTools)
  if (!entry) return false

  const key = getSubToolRefKey(entry)
  if (!key) return false

  if (isPlatformSubTool(entry)) {
    return isToolError(key)
  }

  const refTool = findCustomToolRef(key, customTools)
  if (!refTool) return true
  return isCustomToolOrDepError(refTool, customTools, visited)
}

export function isCustomToolOrDepError(ct, customTools, visited = new Set()) {
  if (!ct?.id) return false
  if (isVisited(visited, ct)) return false

  markVisited(visited, ct)
  if (isToolError(ct.id)) return true

  return normalizeSubTools(ct, customTools).some(sub =>
    isSubToolError(sub, customTools, visited)
  )
}
