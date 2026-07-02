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

function normalizeSchemaFields(template) {
  if (!template) return []
  if (Array.isArray(template.config_schema)) return template.config_schema
  if (Array.isArray(template.configSchema)) return template.configSchema
  if (template.configSchema?.fields) return template.configSchema.fields
  if (template.config_schema?.fields) return template.config_schema.fields
  return []
}

/** 按 create / config 模式过滤模板字段 */
export function getMcpTemplateFields(templateKey, mode = 'create') {
  const fields = normalizeSchemaFields(getMcpTemplate(templateKey))

  const filtered = fields.filter((field) => {
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
    return fields.filter((field) => {
      if (field.name === 'name') return false
      return isTruthyFlag(field.createVisible ?? field.create_visible, true)
    })
  }

  return filtered
}

export function getMcpFieldLabel(field) {
  const label = field.label || field.name
  return isFieldRequired(field) ? `${label} *` : label
}

export function isMcpDictField(field) {
  return field.type === 'object' && (field.class === 'DICT' || field.name === 'headers')
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

export function createDefaultMcpConfig(templateKey, mode = 'create') {
  const values = {}
  for (const field of getMcpTemplateFields(templateKey, mode)) {
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

export function mcpRecordToConfigValues(mcp, templateKey, mode = 'config') {
  const values = createDefaultMcpConfig(templateKey, mode)
  if (!mcp) return values

  for (const field of getMcpTemplateFields(templateKey, mode)) {
    if (isMcpDictField(field)) {
      values[field.name] = headersObjectToRows(mcp[field.name] ?? mcp.config?.[field.name])
    } else {
      values[field.name] = mcp[field.name] ?? mcp.config?.[field.name] ?? values[field.name]
    }
  }
  return values
}

export function validateMcpConfig(templateKey, mode, values) {
  const errors = {}

  for (const field of getMcpTemplateFields(templateKey, mode)) {
    if (!isFieldRequired(field)) continue

    if (isMcpDictField(field)) continue

    const val = values[field.name]
    if (val === undefined || val === null || String(val).trim() === '') {
      errors[field.name] = `${field.label || field.name}不能为空`
    }
  }

  const url = values.url?.trim?.() ?? values.url
  if (url && !/^https?:\/\/.+/.test(url)) {
    errors.url = '请输入有效的 URL'
  }

  const name = values.name?.trim?.() ?? values.name
  if (name && !/^[a-zA-Z_]+$/.test(name)) {
    errors.name = '服务名仅支持英文字母和下划线'
  }

  return errors
}

export function buildMcpPayload(templateKey, values) {
  const payload = { template: templateKey }

  for (const [key, val] of Object.entries(values)) {
    const field = normalizeSchemaFields(getMcpTemplate(templateKey)).find(f => f.name === key)
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
