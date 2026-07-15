/**
 * 开发者门户 API（真实后端 / JeecgBoot）。
 * 平台管理后台请使用 @/api/admin.js。
 */
import request from './request'

export const listMyApps = (params) =>
  request.get('/specifyuser/app/listMyApps', { params })

export const listTemplates = (params) =>
  request.get('/specifyuser/app/listTemplates', { params })

export const createApp = (data) =>
  request.post('/specifyuser/app/create', data)

export const queryEditPageData = (appId) =>
  request.get('/specifyuser/app/queryEditPageData', { params: { appId } })

export const saveDraft = (data) =>
  request.post('/specifyuser/app/saveDraft', data)

export const updateAppMeta = (appId, data) =>
  request.put(`/specifyuser/app/${appId}`, data)

export const publishApp = (data) =>
  request.post('/specifyuser/app/publish', data)

export const toggleAppPublic = (appId, isPublic) =>
  request.put(`/specifyuser/app/${appId}/public`, { is_public: isPublic })

export const deleteApp = (appId) =>
  request.delete(`/specifyuser/app/${appId}`)
