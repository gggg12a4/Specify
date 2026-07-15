/**
 * 平台管理后台 API（真实后端 / JeecgBoot）。
 * 开发者门户认证见 @/api/auth.js；其余 mock 能力见本模块。
 */
import request from './request'
import { encryptPassword } from '@/utils/crypto'
export { login, getRandomImage } from './auth'

export const getModels = (params) => {
  return request.get('/specifysystem/modelList/list', { params })
}

export const getModelDetail = (id) => {
  return request.get('/specifysystem/modelList/queryById', { params: { id } })
}

export const getModelGroups = (params) => {
  return request.get('/specifysystem/modelGroups/list', { params })
}

export const getModelGroupById = (id) => {
  return request.get('/specifysystem/modelGroups/queryById', { params: { id } })
}

export const saveModelGroup = (data) => {
  if (data.id) {
    return request.put('/specifysystem/modelGroups/edit', data)
  }
  return request.post('/specifysystem/modelGroups/add', data)
}

export const deleteModelGroup = (data) => {
  return request.delete('/specifysystem/modelGroups/delete', {
    params: { id: data.id },
    headers: { 'verification-key': encryptPassword(data.password) }
  })
}

export const saveModel = (data) => {
  if (data.id) {
    return request.put('/specifysystem/modelList/edit', data)
  }
  return request.post('/specifysystem/modelList/add', data)
}

export const deleteModel = (data) => {
  return request.delete('/specifysystem/modelList/delete', {
    params: { id: data.id },
    headers: { 'verification-key': encryptPassword(data.password) }
  })
}

/**
 * 代码工具管理 (基础工具)
 */
export const getBaseTools = (params) => {
  return request.get('/specifysystem/platformBasetools/list', { params })
}

export const getBaseToolReferencingTools = (id) => {
  return request.get('/specifysystem/platformBasetools/getReferencingTools', { params: { id } })
}

export const saveBaseTool = (data) => {
  if (data.id) {
    return request.put('/specifysystem/platformBasetools/edit', data)
  }
  return request.post('/specifysystem/platformBasetools/add', data)
}

export const deleteBaseTool = (data) => {
  return request.delete('/specifysystem/platformBasetools/delete', {
    params: { id: data.id },
    headers: { 'verification-key': encryptPassword(data.password) }
  })
}

/**
 * Agent 工具管理
 */
export const getAgentTools = (params) => {
  return request.get('/specifysystem/agentTools/platformAgentTool/list', { params })
}

export const getAgentToolDetail = (id) => {
  return request.get('/specifysystem/agentTools/platformAgentTool/queryById', { params: { id } })
}

export const getAgentToolReferencingTools = (id) => {
  return request.get('/specifysystem/agentTools/platformAgentTool/getReferencingTools', { params: { id } })
}

export const getAgentSubToolsByMainId = (id) => {
  return request.get('/specifysystem/agentTools/platformAgentTool/queryPlatformAgentSubtoolByMainId', { params: { id } })
}

export const saveAgentTool = (data) => {
  if (data.id) {
    return request.put('/specifysystem/agentTools/platformAgentTool/edit', data)
  }
  return request.post('/specifysystem/agentTools/platformAgentTool/add', data)
}

export const deleteAgentTool = (data) => {
  return request.delete('/specifysystem/agentTools/platformAgentTool/delete', {
    params: { id: data.id },
    headers: { 'verification-key': encryptPassword(data.password) }
  })
}

/**
 * MCP 工具管理
 */
export const getMcpTools = (params) => {
  return request.get('/specifysystem/mcpTools/platformMcpTool/list', { params })
}

export const getMcpToolDetail = (id) => {
  return request.get('/specifysystem/mcpTools/platformMcpTool/queryById', { params: { id } })
}

export const getMcpToolReferencingTools = (id) => {
  return request.get('/specifysystem/mcpTools/platformMcpTool/getReferencingTools', { params: { id } })
}

export const saveMcpTool = (data) => {
  if (data.id) {
    return request.put('/specifysystem/mcpTools/platformMcpTool/edit', data)
  }
  return request.post('/specifysystem/mcpTools/platformMcpTool/add', data)
}

export const deleteMcpTool = (data) => {
  return request.delete('/specifysystem/mcpTools/platformMcpTool/delete', {
    params: { id: data.id },
    headers: { 'verification-key': encryptPassword(data.password) }
  })
}

/**
 * 工具模版管理
 */
export const getToolTemplates = (params) => {
  return request.get('/specifysystem/createableToolTemplates/list', { params })
}

export const saveToolTemplate = (data) => {
  if (data.id) {
    return request.put('/specifysystem/createableToolTemplates/edit', data)
  }
  return request.post('/specifysystem/createableToolTemplates/add', data)
}

export const deleteToolTemplate = (data) => {
  return request.delete('/specifysystem/createableToolTemplates/delete', {
    params: { id: data.id },
    headers: { 'verification-key': encryptPassword(data.password) }
  })
}

/**
 * 权限管理 - 角色 (暂时指向假的，等待后端或之后提供真实的路径)
 */
export const getRoles = (params) => request.get('/sys/sysDepartRole/list', { params })
export const saveRole = (data) => data.id ? request.put('/sys/sysDepartRole/edit', data) : request.post('/sys/sysDepartRole/add', data)
export const deleteRole = (data) => request.delete('/sys/sysDepartRole/delete', { params: { id: data.id } })

/**
 * 权限管理 - 管理员账号 (暂时指向假的，等待后端提供真实路径)
 */
export const getAdminAccounts = (params) => request.get('/admin/accounts', { params })
export const saveAdminAccount = (data) => request.post('/admin/accounts/save', data)
export const deleteAdminAccount = (data) => request.post('/admin/accounts/delete', data)
export const resetAdminPassword = (data) => request.post('/admin/accounts/reset-password', data)

/**
 * 辅助接口
 */
export const getAvailableSubTools = (params) => {
  return request.get('/specifysystem/agentTools/platformAgentTool/list', { params })
}

/**
 * Public 文件管理 (真实接口)
 */
export const getPublicFiles = (data = {}) => {
  return request.post('/specifyfilesystem/api/v1/list', {
    path: data.path || "public",
    recursive: data.recursive ?? true,
    pattern: data.pattern || "",
    file_types: data.file_types || [],
    max_items: data.max_items || 100,
    include_meta: data.include_meta ?? true,
    include_path: data.include_path ?? true,
    item_type: data.item_type || "all"
  })
}

export const mkdirPublic = (path) => {
  return request.post('/specifyfilesystem/api/v1/folder/create', { path })
}

export const uploadPublicFile = (file, path) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('path', path) // 把 path 放到 formData 里面，避免 URL 编码问题
  return request.post('/specifyfilesystem/api/v1/file/upload', formData)
}

export const deletePublicFile = (path, isDir = false) => {
  if (isDir) {
    return request.post('/specifyfilesystem/api/v1/folder/delete', {
      path,
      delete_all: true
    })
  }
  return request.post('/specifyfilesystem/api/v1/file/delete', { path })
}

export const downloadPublicFile = (path) => request.get('/admin/public-files/download', {
  params: { path },
  responseType: 'blob'
})
