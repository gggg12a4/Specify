/**
 * MCP 模板辅助：编辑页 createable 由接口 templates 下发。
 * 本地不再内置 mock 字段清单；默认 key 仍为 MCPServerStreamable。
 */

export const MCP_TEMPLATES = {}

export const DEFAULT_MCP_TEMPLATE = 'MCPServerStreamable'

/**
 * 从接口 createable 条目或已规范化模板中读取 schema。
 * @param {string} templateKey
 * @param {Record<string, any>} [templates] name → template
 */
export function getMcpTemplate(templateKey = DEFAULT_MCP_TEMPLATE, templates = MCP_TEMPLATES) {
  if (!templateKey) return null
  return templates?.[templateKey] || null
}
