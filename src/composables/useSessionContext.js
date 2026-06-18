/**
 * 会话上下文管理 Composable
 * 负责管理会话的 system_prompt 发送状态，避免重复发送
 */

import { ref } from 'vue'

// 会话上下文映射表
// key: session_id, value: { systemPromptSent, lastSystemPrompt, timestamp }
const sessionContextMap = ref({})

/**
 * 判断是否需要发送 system_prompt
 * @param {string|null} sessionId - 会话 ID
 * @returns {boolean} true 表示需要发送，false 表示不需要
 */
export function shouldSendSystemPrompt(sessionId) {
  // 1. 没有 sessionId（新会话）→ 需要发送
  if (!sessionId) {
    return true
  }

  // 2. 会话存在但未发送过 system_prompt → 需要发送
  const context = sessionContextMap.value[sessionId]
  if (!context || !context.systemPromptSent) {
    return true
  }

  // 3. 已发送过 → 不需要再发送
  return false
}

/**
 * 标记 system_prompt 已发送
 * @param {string} sessionId - 会话 ID
 * @param {string} systemPrompt - 发送的 system_prompt 内容
 */
export function markSystemPromptSent(sessionId, systemPrompt) {
  if (!sessionId) {
    return
  }

  sessionContextMap.value[sessionId] = {
    systemPromptSent: true,
    lastSystemPrompt: systemPrompt,
    timestamp: Date.now()
  }

  // 打印日志用于调试
  console.log(`[SessionContext] 标记会话 ${sessionId} 的 system_prompt 已发送`)
}

/**
 * 重置会话上下文
 * 用于用户修改 system_prompt 后，下次需要重新发送
 * @param {string} sessionId - 会话 ID
 */
export function resetSessionContext(sessionId) {
  if (!sessionId) {
    return
  }

  delete sessionContextMap.value[sessionId]
  console.log(`[SessionContext] 重置会话 ${sessionId} 的上下文`)
}

/**
 * 获取会话上下文信息（用于调试）
 * @param {string} sessionId - 会话 ID
 * @returns {Object|null} 会话上下文对象
 */
export function getSessionContext(sessionId) {
  if (!sessionId) {
    return null
  }

  return sessionContextMap.value[sessionId] || null
}

/**
 * 清空所有会话上下文
 */
export function clearAllSessionContexts() {
  sessionContextMap.value = {}
  console.log('[SessionContext] 清空所有会话上下文')
}

/**
 * useSessionContext Composable
 * @returns {Object} 会话上下文管理方法集合
 */
export function useSessionContext() {
  return {
    shouldSendSystemPrompt,
    markSystemPromptSent,
    resetSessionContext,
    getSessionContext,
    clearAllSessionContexts
  }
}
