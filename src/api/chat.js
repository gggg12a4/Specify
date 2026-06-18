import request from './request'
import { buildAIMessageFromResponse } from '@/types/message'
import { buildChatRequest, parseAIMessageResponse } from './adapters/realApiAdapter'
import { parseSSEStream } from './adapters/sseParser'
import { useSessionContext } from '@/composables/useSessionContext'

// 是否使用 Mock 数据（可通过环境变量控制）
const USE_MOCK = false

/**
 * 发送消息（非流式）
 * @param {Object} data - 包含 messages, config, tools 等配置
 * @returns {Promise}
 */
export function sendMessage(data) {
  // 真实 API 调用
  const { messages, config, sessionId, systemPrompt } = data
  const { shouldSendSystemPrompt } = useSessionContext()

  // 判断是否需要发送 system_prompt
  const finalSystemPrompt = shouldSendSystemPrompt(sessionId) ? systemPrompt : null

  // 使用适配器构建请求
  const requestBody = buildChatRequest(messages, config, sessionId, finalSystemPrompt)

  return request({
    url: '/chat',
    method: 'post',
    data: requestBody
  }).then(response => {
    // 使用适配器解析响应
    return parseAIMessageResponse(response)
  })
}

/**
 * 流式发送消息
 * @param {Object} data - 包含 messages, config, sessionId, systemPrompt, tools 等配置
 * @param {Function} onChunk - 每次收到数据块时的回调
 * @param {Function} onComplete - 完成时的回调
 * @param {Function} onError - 错误时的回调
 * @returns {AbortController|Object} 用于取消请求
 */
export function sendMessageStream(data, onChunk, onComplete, onError) {
  // 真实 API 调用
  const { messages, config, sessionId, systemPrompt } = data
  const { shouldSendSystemPrompt, markSystemPromptSent } = useSessionContext()

  // 判断是否需要发送 system_prompt
  const finalSystemPrompt = shouldSendSystemPrompt(sessionId) ? systemPrompt : null

  // 使用适配器构建请求
  const requestBody = buildChatRequest(messages, config, sessionId, finalSystemPrompt)

  const controller = new AbortController()
  // 使用相对路径，通过 Vite 代理转发
  const url = '/api/chat/stream'

  // 构建请求头，添加 Authorization
  const headers = {
    'Content-Type': 'application/json'
  }

  // 添加 SP API Key 作为认证
  if (config?.sp?.apiKey) {
    headers.Authorization = `Bearer ${config.sp.apiKey}`
  }

  fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody),
    signal: controller.signal
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 使用 SSE 解析器处理流
      return parseSSEStream(
        response,
        (chunk) => {
          // 首个 chunk 可能携带 session_id
          if (chunk.session_id) {
            // 如果发送了 system_prompt，标记已发送
            if (finalSystemPrompt) {
              markSystemPromptSent(chunk.session_id, finalSystemPrompt)
            }
          }

          // 调用上层回调
          if (onChunk) {
            onChunk(chunk)
          }
        },
        onComplete,
        onError
      )
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Stream request error:', error)
        if (onError) {
          onError(error)
        }
      }
    })

  return controller
}

/**
 * 获取会话历史
 * @param {string} sessionId - 会话ID
 * @returns {Promise}
 */
export function getSessionHistory(sessionId) {
  return request({
    url: `/chat/session/${sessionId}`,
    method: 'get'
  })
}

/**
 * 保存会话
 * @param {string} sessionId - 会话ID
 * @param {Array} messages - 消息列表
 * @param {Object} metadata - 会话元数据
 * @returns {Promise}
 */
export function saveSession(sessionId, messages, metadata = {}) {
  return request({
    url: '/chat/session/save',
    method: 'post',
    data: {
      session_id: sessionId,
      messages,
      metadata
    }
  })
}

