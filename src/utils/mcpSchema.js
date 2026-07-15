import { getMcpTemplate } from '@/constants/mcpTemplates'

function isTruthyFlag(val, defaultWhenMissing = true) {
  if (val === undefined || val === null) return defaultWhenMissing
  return val === true || String(val).toLowerCase() === 'true' || val === 1 || val === '1'
}

function isFieldRequired(field) {
  return field.required === true
    || String(field.required).toLowerCase() === 'true'
    || field.required === 1
    || field.required === '1'
}

export function isMcpFieldRequired(field) {
  return isFieldRequired(field)
}

export function getMcpFieldLabel(field) {
  return field.label || field.name || ''
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

export function normalizeSchemaFields(template) {
  if (!template) return []
  const schema = template.config_schema ?? template.configSchema
  if (Array.isArray(schema)) return schema
  const parsed = parseJsonMaybe(schema, schema)
  if (Array.isArray(parsed)) return parsed
  if (parsed?.fields && Array.isArray(parsed.fields)) return parsed.fields
  return []
}

/** 按 create / config 模式过滤模板字段 */
export function getMcpTemplateFields(templateKey, mode = 'create', templates = null) {
  const fields = normalizeSchemaFields(getMcpTemplate(templateKey, templates || undefined) || templates?.[templateKey])

  let filtered = fields.filter((field) => {
    if (mode === 'create') {
      return isTruthyFlag(field.createVisible ?? field.create_visible, true)
    }
    if (mode === 'config') {
      return isTruthyFlag(field.configVisible ?? field.config_visible, false)
    }
    return isTruthyFlag(field[mode], true)
  })

  // App 配置弹窗：若模板未声明 configVisible 字段，回退到 createVisible（服务名除外）
  if (mode === 'config' && !filtered.length) {
    filtered = fields.filter((field) => {
      if (field.name === 'name') return false
      return isTruthyFlag(field.createVisible ?? field.create_visible, true)
    })
  }

  // 创建态展示顺序：工具名 → 端点 URL → 认证/其他
  if (mode === 'create') {
    const order = { name: 0, url: 1, headers: 2 }
    filtered = [...filtered].sort((a, b) => {
      const ao = order[a.name] ?? 50
      const bo = order[b.name] ?? 50
      return ao - bo
    })
  }

  return filtered
}

export function isMcpDictField(field) {
  const cls = String(field?.class || '')
  return field?.type === 'object' && (
    cls === 'DICT'
    || cls === 'MCPAuth'
    || field.name === 'headers'
  )
}

export function headersObjectToRows(headers) {
  if (Array.isArray(headers)) {
    return headers.length
      ? headers.map(h => ({ key: h.key || '', value: h.value || '' }))
      : [{ key: '', value: '' }]
  }
  if (headers && typeof headers === 'object') {
    const rows = Object.entries(headers).map(([key, value]) => ({ key, value: value ?? '' }))
    return rows.length ? rows : [{ key: '', value: '' }]
  }
  return [{ key: '', value: '' }]
}

export function headersRowsToObject(rows) {
  const headers = {}
  for (const row of rows || []) {
    const key = row.key?.trim()
    if (key) headers[key] = row.value ?? ''
  }
  return headers
}

export function createDefaultMcpConfig(templateKey, mode = 'create', templates = null) {
  const values = {}
  for (const field of getMcpTemplateFields(templateKey, mode, templates)) {
    if (isMcpDictField(field)) {
      values[field.name] = [{ key: '', value: '' }]
    } else if (field.default !== undefined) {
      values[field.name] = field.default
    } else if (field.type === 'boolean') {
      values[field.name] = false
    } else if (field.type === 'number' || field.type === 'integer') {
      values[field.name] = null
    } else {
      values[field.name] = ''
    }
  }
  return values
}

export function mcpRecordToConfigValues(mcp, templateKey, mode = 'config', templates = null) {
  const values = createDefaultMcpConfig(templateKey, mode, templates)
  if (!mcp) return values

  for (const field of getMcpTemplateFields(templateKey, mode, templates)) {
    if (isMcpDictField(field)) {
      values[field.name] = headersObjectToRows(mcp[field.name] ?? mcp.config?.[field.name])
    } else {
      values[field.name] = mcp[field.name] ?? mcp.config?.[field.name] ?? values[field.name]
    }
  }
  return values
}

export function validateMcpConfig(templateKey, mode, values, templates = null) {
  const errors = {}

  for (const field of getMcpTemplateFields(templateKey, mode, templates)) {
    if (!isFieldRequired(field)) continue

    if (isMcpDictField(field)) continue

    const val = values[field.name]
    if (val === undefined || val === null || String(val).trim() === '') {
      errors[field.name] = `${field.label || field.name}不能为空`
      continue
    }

    if (field.pattern) {
      try {
        const re = new RegExp(`^(?:${field.pattern})$`)
        if (!re.test(String(val))) {
          errors[field.name] = `${field.label || field.name}格式不正确`
        }
      } catch {
        // ignore invalid pattern from backend
      }
    }

    if (field.min_length != null && String(val).length < Number(field.min_length)) {
      errors[field.name] = `${field.label || field.name}长度不能少于 ${field.min_length}`
    }
    if (field.max_length != null && String(val).length > Number(field.max_length)) {
      errors[field.name] = `${field.label || field.name}长度不能超过 ${field.max_length}`
    }
  }

  const url = values.url?.trim?.() ?? values.url
  if (url && !/^https?:\/\/.+/.test(url)) {
    errors.url = '请输入有效的 URL'
  }

  return errors
}

export function buildMcpPayload(templateKey, values, templates = null) {
  const payload = { template: templateKey }
  const fields = normalizeSchemaFields(getMcpTemplate(templateKey, templates) || templates?.[templateKey])

  for (const [key, val] of Object.entries(values)) {
    const field = fields.find(f => f.name === key)
    if (field && isMcpDictField(field)) {
      payload[key] = headersRowsToObject(val)
    } else if (typeof val === 'string') {
      payload[key] = val.trim()
    } else {
      payload[key] = val
    }
  }

  return payload
}

/** 取 createable MCP 模板的默认 key（优先 MCPServerStreamable） */
export function resolveDefaultMcpTemplateKey(templates = {}) {
  const keys = Object.keys(templates || {})
  if (!keys.length) return ''
  if (templates.MCPServerStreamable) return 'MCPServerStreamable'
  const streamable = keys.find(k => /mcp/i.test(k) && /stream/i.test(k))
  return streamable || keys[0]
}
