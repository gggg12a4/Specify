/**
 * SSE (Server-Sent Events) 流式响应解析器
 * 负责解析后端的 SSE 格式流式响应，并标准化为前端可用的 chunk 格式
 */

/**
 * 解析 SSE 流式响应
 * @param {Response} response - Fetch API 的 Response 对象
 * @param {Function} onChunk - 收到数据块时的回调 (chunk) => void
 * @param {Function} onComplete - 完成时的回调 () => void
 * @param {Function} onError - 错误时的回调 (error) => void
 * @returns {Promise<void>}
 */
export async function parseSSEStream(response, onChunk, onComplete, onError) {
  try {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let chunkCount = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // 流结束
        if (onComplete) {
          onComplete()
        }
        break
      }

      // 解码数据
      buffer += decoder.decode(value, { stream: true })

      // 按行分割处理
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个不完整的行

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        try {
          // 解析 SSE 行
          const chunk = parseSSELine(trimmedLine)
          if (chunk) {
            // 标准化 chunk 格式
            const normalizedChunk = normalizeStreamChunk(chunk)

            if (normalizedChunk) {
              // normalizedChunk 可能是单个对象或数组
              if (Array.isArray(normalizedChunk)) {
                // 完整响应转换的多个 chunks
                for (const c of normalizedChunk) {
                  chunkCount++
                  if (onChunk) {
                    // ✅ 关键修复：await onChunk + 延迟，实现真正的逐字显示
                    await onChunk(c)
                    // ✅ 每个 chunk 处理后延迟 20ms，确保浏览器有时间渲染
                    // 这是因为后端发送的是完整响应对象，前端拆分后需要降低处理速度
                    await new Promise(resolve => setTimeout(resolve, 20))
                  }
                }
              } else {
                // 单个 chunk（真正的流式 chunk，不需要延迟）
                chunkCount++
                if (onChunk) {
                  await onChunk(normalizedChunk)
                }
              }
            }
          }

          // 检查是否结束
          if (trimmedLine === 'data: [DONE]' || chunk === '[DONE]') {
            if (onComplete) {
              onComplete()
            }
            return
          }
        } catch (error) {
          console.error('[SSE Parser] 解析 SSE 行失败:', error, trimmedLine)
          // 继续处理下一行，不中断流
        }
      }
    }
  } catch (error) {
    console.error('[SSE Parser] SSE 流读取错误:', error)
    if (onError) {
      onError(error)
    }
  }
}

/**
 * 解析单行 SSE 数据
 * @param {string} line - SSE 行字符串
 * @returns {Object|null} 解析后的数据对象，如果不是有效数据则返回 null
 */
function parseSSELine(line) {
  // SSE 格式：data: {...}
  if (line.startsWith('data: ')) {
    const dataStr = line.substring(6) // 移除 "data: " 前缀

    // 检查特殊标记
    if (dataStr === '[DONE]') {
      return '[DONE]'
    }

    // 解析 JSON
    try {
      return JSON.parse(dataStr)
    } catch (error) {
      console.error('解析 JSON 失败:', error, dataStr)
      return null
    }
  }

  // 其他 SSE 字段（id, event, retry 等）暂时忽略
  return null
}

/**
 * 标准化流式 chunk 为前端统一格式
 * 将后端的多种 chunk 格式转换为 Mock 兼容的格式
 * @param {Object} rawChunk - 原始 chunk 对象
 * @returns {Object|Array|null} 标准化后的 chunk 对象或 chunk 数组
 */
export function normalizeStreamChunk(rawChunk) {
  if (!rawChunk || typeof rawChunk !== 'object') {
    return null
  }

  // 检查特殊标记
  if (rawChunk === '[DONE]') {
    return null
  }

  const { type } = rawChunk

  // 情况 1: 标准流式 chunk (有 type 字段)
  if (type === 'content') {
    const { content_type, text, session_id } = rawChunk

    const normalizedChunk = {
      type: 'content',
      content_type: content_type || 'text',
      text: text || ''
    }

    // 首个 chunk 可能携带 session_id
    if (session_id) {
      normalizedChunk.session_id = session_id
    }

    return normalizedChunk
  }

  // 元数据类型的 chunk
  if (type === 'metadata') {
    const { finish_reason, input_tokens, output_tokens, model } = rawChunk

    return {
      type: 'metadata',
      finish_reason: finish_reason || 'stop',
      input_tokens: input_tokens || 0,
      output_tokens: output_tokens || 0,
      model: model || null
    }
  }

  // 错误类型的 chunk
  if (type === 'error') {
    return {
      type: 'error',
      error: rawChunk.error || '未知错误',
      message: rawChunk.message || ''
    }
  }

  // 情况 2: 完整的 ChatResponse 对象 (后端一次性返回所有内容)
  // 特征: 有 content 数组, finish_reason, session_id 等字段，但没有 type
  if (!type && rawChunk.content && Array.isArray(rawChunk.content)) {
    const chunks = []
    const { session_id, content, finish_reason, input_tokens, output_tokens, model } = rawChunk

    // 1. 处理 session_id
    let firstChunkSent = false

    // 2. 处理 content 数组
    for (const item of content) {
      if (item.type === 'text' && item.text) {
        // 文本内容 - 模拟逐字输出
        const text = item.text
        const chunkSize = 5 // 每个 chunk 包含 5 个字符

        for (let i = 0; i < text.length; i += chunkSize) {
          const chunk = {
            type: 'content',
            content_type: 'text',
            text: text.substring(i, i + chunkSize)
          }

          // 第一个 chunk 携带 session_id
          if (!firstChunkSent && session_id) {
            chunk.session_id = session_id
            firstChunkSent = true
          }

          chunks.push(chunk)
        }
      } else {
        // 非文本内容（reasoning, tool_call 等）
        const chunk = {
          type: 'content',
          content_type: item.type || 'text',
          text: item.text || ''
        }

        if (!firstChunkSent && session_id) {
          chunk.session_id = session_id
          firstChunkSent = true
        }

        chunks.push(chunk)
      }
    }

    // 3. 发送元数据
    chunks.push({
      type: 'metadata',
      finish_reason: finish_reason || 'stop',
      input_tokens: input_tokens || 0,
      output_tokens: output_tokens || 0,
      model: model || null
    })

    return chunks // 返回 chunk 数组
  }

  // 未知类型
  console.warn('[SSE Parser] 未知的 chunk 类型:', type, rawChunk)
  return null
}

/**
 * 处理 SSE 错误
 * @param {Error} error - 错误对象
 * @returns {Object} 错误信息对象
 */
export function handleSSEError(error) {
  console.error('SSE 错误:', error)

  return {
    type: 'error',
    error: error.name || 'SSEError',
    message: error.message || 'SSE 流式传输失败'
  }
}
