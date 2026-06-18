import request from './request'
import { useApiConfig } from '@/composables/useApiConfig'

// 是否使用 Mock 数据
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ============ Mock 数据服务 ============

const STORAGE_KEY = 'specify_sessions'
const MESSAGES_STORAGE_PREFIX = 'specify_session_messages_'

/**
 * 从 localStorage 获取会话列表
 */
function getMockSessions() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * 保存会话列表到 localStorage
 */
function saveMockSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

/**
 * 从 localStorage 获取会话消息
 */
function getMockSessionMessages(sessionId) {
  const key = MESSAGES_STORAGE_PREFIX + sessionId
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

/**
 * 保存会话消息到 localStorage
 */
function saveMockSessionMessages(sessionId, messages) {
  const key = MESSAGES_STORAGE_PREFIX + sessionId
  localStorage.setItem(key, JSON.stringify(messages))
}

/**
 * 删除会话消息
 */
function deleteMockSessionMessages(sessionId) {
  const key = MESSAGES_STORAGE_PREFIX + sessionId
  localStorage.removeItem(key)
}

// ============ API 函数 ============

// 获取会话列表
export function getSessionList() {
  if (USE_MOCK) {
    return Promise.resolve({
      data: getMockSessions()
    })
  }

  // 真实 API: GET /api/sessions
  return request({
    url: '/sessions',
    method: 'get'
  }).then(response => {
    // 格式适配 + 本地元数据合并
    const localMetadata = JSON.parse(
      localStorage.getItem('session_metadata') || '{}'
    )

    const sessions = (response || []).map(item => ({
      id: item.session_id,
      title: localMetadata[item.session_id]?.title || '新对话',
      created_at: item.created_at,
      updated_at: item.updated_at,
      message_count: item.message_count,
      pinned: localMetadata[item.session_id]?.pinned || false,
      system_prompt: item.system_prompt,
      model: item.model,
      tools: item.tools
    }))

    return { data: sessions }
  })
}

// 创建会话
export function createSession(sessionData = {}) {
  if (USE_MOCK) {
    const sessions = getMockSessions()
    const newSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: sessionData.title || '新对话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0,
      pinned: false, // 默认未置顶
      ...sessionData
    }
    sessions.unshift(newSession)
    saveMockSessions(sessions)

    return Promise.resolve({
      data: newSession
    })
  }

  // 真实 API: POST /api/sessions
  const { getConfig } = useApiConfig()
  const config = getConfig()

  const requestBody = {
    system_prompt: sessionData.system_prompt || null,
    model: config.qwen?.model || null,
    api_key: config.qwen?.apiKey || null,
    api_base: config.qwen?.baseUrl || null,
    sp_api_key: config.sp?.apiKey || null,
    sp_base_url: config.sp?.baseUrl || null,
    sp_app: config.sp?.app || null,
    sp_user: config.sp?.user || null,
    tools: sessionData.tools || config.tools || []
  }

  return request({
    url: '/sessions',
    method: 'post',
    data: requestBody
  }).then(response => {
    const newSession = {
      id: response.session_id,
      title: sessionData.title || '新对话',
      created_at: response.created_at,
      updated_at: response.updated_at,
      message_count: response.message_count || 0,
      pinned: false,
      system_prompt: response.system_prompt,
      model: response.model,
      tools: response.tools
    }

    // 保存本地元数据（title, pinned）
    const localMetadata = JSON.parse(
      localStorage.getItem('session_metadata') || '{}'
    )
    localMetadata[newSession.id] = {
      title: newSession.title,
      pinned: newSession.pinned
    }
    localStorage.setItem('session_metadata', JSON.stringify(localMetadata))

    return { data: newSession }
  })
}

// 删除会话
export function deleteSession(sessionId) {
  if (USE_MOCK) {
    const sessions = getMockSessions()
    const index = sessions.findIndex(s => s.id === sessionId)
    if (index > -1) {
      sessions.splice(index, 1)
      saveMockSessions(sessions)
      deleteMockSessionMessages(sessionId)
    }

    return Promise.resolve({
      data: { success: true }
    })
  }

  // 真实 API: DELETE /api/sessions/{session_id}
  return request({
    url: `/sessions/${sessionId}`,
    method: 'delete'
  }).then(() => {
    // 清理本地元数据
    const localMetadata = JSON.parse(
      localStorage.getItem('session_metadata') || '{}'
    )
    delete localMetadata[sessionId]
    localStorage.setItem('session_metadata', JSON.stringify(localMetadata))

    return { data: { success: true } }
  })
}

// 获取会话消息
export function getSessionMessages(sessionId) {
  if (USE_MOCK) {
    return Promise.resolve({
      data: getMockSessionMessages(sessionId)
    })
  }

  // 真实 API: GET /api/sessions/{session_id}/messages
  return request({
    url: `/sessions/${sessionId}/messages`,
    method: 'get'
  }).then(response => {
    // 后端返回的是 Specify 标准格式消息列表，直接使用
    return { data: response || [] }
  })
}

// 保存会话消息
export function saveSessionMessages(sessionId, messages) {
  if (USE_MOCK) {
    saveMockSessionMessages(sessionId, messages)

    // 更新会话的更新时间和消息数
    const sessions = getMockSessions()
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      session.updated_at = new Date().toISOString()
      session.message_count = messages.length
      saveMockSessions(sessions)
    }

    return Promise.resolve({
      data: { success: true }
    })
  }

  // 真实 API 模式：后端在聊天时自动保存消息，不需要手动保存
  // 直接返回成功，避免 404 错误
  console.log('[session.js] 真实 API 模式，消息由后端自动保存')
  return Promise.resolve({
    data: { success: true }
  })
}

// 更新会话信息（如标题、system_prompt）
export function updateSession(sessionId, updates) {
  if (USE_MOCK) {
    const sessions = getMockSessions()
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      Object.assign(session, updates)
      // 注意：不自动更新 updated_at，让调用方决定是否需要更新时间
      // 只有在 updates 中明确包含 updated_at 时才更新
      saveMockSessions(sessions)
    }

    return Promise.resolve({
      data: session
    })
  }

  // 真实 API 处理
  // 1. 更新 system_prompt: PUT /api/sessions/{id}/system-prompt
  if (updates.system_prompt !== undefined) {
    return request({
      url: `/sessions/${sessionId}/system-prompt`,
      method: 'put',
      data: { system_prompt: updates.system_prompt }
    }).then(response => {
      return {
        data: {
          id: response.session_id,
          system_prompt: response.system_prompt,
          updated_at: response.updated_at
        }
      }
    })
  }

  // 2. 更新其他字段（title, pinned）: 本地维护
  const localMetadata = JSON.parse(
    localStorage.getItem('session_metadata') || '{}'
  )

  if (!localMetadata[sessionId]) {
    localMetadata[sessionId] = {}
  }

  // 更新本地元数据
  if (updates.title !== undefined) {
    localMetadata[sessionId].title = updates.title
  }
  if (updates.pinned !== undefined) {
    localMetadata[sessionId].pinned = updates.pinned
  }

  localStorage.setItem('session_metadata', JSON.stringify(localMetadata))

  return Promise.resolve({
    data: {
      id: sessionId,
      ...updates
    }
  })
}
