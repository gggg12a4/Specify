/**
 * Specify 框架消息类型定义
 * 完全符合教程中的消息格式规范
 */

// ==================== Content Part 类型 ====================

/**
 * 文本内容
 */
export class TextContent {
  constructor(text = '') {
    this.type = 'text'
    this.text = text
    this.extra = {}
    this.internal_meta = {}
  }
}

/**
 * 推理/思考过程内容
 */
export class ReasoningContent {
  constructor(text = '') {
    this.type = 'reasoning'
    this.text = text
    this.extra = {}
    this.internal_meta = {}
  }
}

/**
 * 工具调用内容
 */
export class ToolCallContent {
  constructor(toolCall = null) {
    this.type = 'tool_call'
    this.tool_call = toolCall || {
      id: '',
      name: '',
      arguments: {}
    }
    this.extra = {}
    this.internal_meta = {}
  }
}

/**
 * 图片内容
 */
export class ImageContent {
  constructor(options = {}) {
    this.type = 'image'
    this.mime_type = options.mime_type || 'image/jpeg'
    // 四选一：url、base64_data、file_uri、file_id
    this.url = options.url || null
    this.base64_data = options.base64_data || null
    this.file_uri = options.file_uri || null
    this.file_id = options.file_id || null
    this.extra = {}
    this.internal_meta = {}
  }
}

/**
 * 音频内容
 */
export class AudioContent {
  constructor(options = {}) {
    this.type = 'audio'
    this.mime_type = options.mime_type || 'audio/mp3'
    this.url = options.url || null
    this.base64_data = options.base64_data || null
    this.file_uri = options.file_uri || null
    this.file_id = options.file_id || null
    this.extra = {}
    this.internal_meta = {}
  }
}

/**
 * 视频内容
 */
export class VideoContent {
  constructor(options = {}) {
    this.type = 'video'
    this.mime_type = options.mime_type || 'video/mp4'
    this.url = options.url || null
    this.base64_data = options.base64_data || null
    this.file_uri = options.file_uri || null
    this.file_id = options.file_id || null
    this.frames_base64 = options.frames_base64 || null
    this.frames_url = options.frames_url || null
    this.extra = {}
    this.internal_meta = {}
  }
}

/**
 * 文件内容
 */
export class FileContent {
  constructor(options = {}) {
    this.type = 'file'
    this.mime_type = options.mime_type || 'application/pdf'
    this.filename = options.filename || ''
    this.url = options.url || null
    this.base64_data = options.base64_data || null
    this.file_uri = options.file_uri || null
    this.file_id = options.file_id || null
    this.extra = {}
    this.internal_meta = {}
  }
}

// ==================== 消息类型 ====================

/**
 * 系统消息 - 设定角色和行为规则
 */
export class SystemMessage {
  constructor(content = []) {
    this.role = 'system'
    this.content = Array.isArray(content) ? content : [new TextContent(content)]
    this.cache_end = false
    this.meta = {}
    this.internal_meta = {}
    this.raw_meta = {}
  }
}

/**
 * 用户消息 - 用户输入
 */
export class UserMessage {
  constructor(content = []) {
    this.role = 'user'
    this.content = Array.isArray(content) ? content : [new TextContent(content)]
    this.cache_end = false
    this.meta = {}
    this.internal_meta = {}
    this.raw_meta = {}
  }
}

/**
 * AI 消息 - 大模型回复
 */
export class AIMessage {
  constructor(options = {}) {
    this.role = 'ai'
    this.content = options.content || []
    this.finish_reason = options.finish_reason || 'stop' // stop, tool_calls, length, content_filter
    this.input_tokens = options.input_tokens || 0
    this.output_tokens = options.output_tokens || 0
    this.model = options.model || ''
    this.cache_end = false
    this.meta = {}
    this.internal_meta = options.internal_meta || {}
    this.raw_meta = options.raw_meta || {}
  }
}

/**
 * 工具消息 - 工具执行结果
 */
export class ToolMessage {
  constructor(toolResults = []) {
    this.role = 'tool'
    this.tool_results = toolResults // Array of ToolResult
    this.cache_end = false
    this.meta = {}
    this.internal_meta = {}
    this.raw_meta = {}
  }
}

/**
 * 工具执行结果
 */
export class ToolResult {
  constructor(options = {}) {
    this.tool_call_id = options.tool_call_id || ''
    this.name = options.name || ''
    this.content = options.content || '' // str 或 List[ContentPart]
  }
}

// ==================== 工具函数 ====================

/**
 * 从后端响应构建 AIMessage
 */
export function buildAIMessageFromResponse(data) {
  const content = []

  // 解析 content 数组
  if (data.content && Array.isArray(data.content)) {
    data.content.forEach(part => {
      switch (part.type) {
        case 'text':
          content.push(new TextContent(part.text))
          break
        case 'reasoning':
          content.push(new ReasoningContent(part.text))
          break
        case 'tool_call':
          content.push(new ToolCallContent(part.tool_call))
          break
        case 'image':
          content.push(new ImageContent(part))
          break
        case 'audio':
          content.push(new AudioContent(part))
          break
        case 'video':
          content.push(new VideoContent(part))
          break
        case 'file':
          content.push(new FileContent(part))
          break
      }
    })
  }

  return new AIMessage({
    content,
    finish_reason: data.finish_reason,
    input_tokens: data.input_tokens,
    output_tokens: data.output_tokens,
    model: data.model,
    internal_meta: data.internal_meta,
    raw_meta: data.raw_meta
  })
}

/**
 * 序列化消息为可存储格式
 */
export function serializeMessage(message) {
  return JSON.stringify(message)
}

/**
 * 修复文本中被错误转义的换行符
 * @param {string} text - 可能包含转义换行符的文本
 * @returns {string} 修复后的文本
 */
function fixEscapedNewlines(text) {
  if (typeof text !== 'string') return text

  // 如果文本中包含字面量的 \n（两个字符），替换为真实的换行符
  if (text.includes('\\n')) {
    return text.replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
  }

  return text
}

/**
 * 反序列化单个 Content Part
 */
function deserializeContentPart(data) {
  switch (data.type) {
    case 'text':
      const textContent = Object.assign(new TextContent(), data)
      // ✅ 修复可能被转义的换行符
      if (textContent.text) {
        textContent.text = fixEscapedNewlines(textContent.text)
      }
      return textContent
    case 'reasoning':
      const reasoningContent = Object.assign(new ReasoningContent(), data)
      // ✅ 修复可能被转义的换行符
      if (reasoningContent.text) {
        reasoningContent.text = fixEscapedNewlines(reasoningContent.text)
      }
      return reasoningContent
    case 'tool_call':
      return Object.assign(new ToolCallContent(), data)
    case 'image':
      return Object.assign(new ImageContent(), data)
    case 'audio':
      return Object.assign(new AudioContent(), data)
    case 'video':
      return Object.assign(new VideoContent(), data)
    case 'file':
      return Object.assign(new FileContent(), data)
    default:
      console.warn('[Message] Unknown content type:', data.type)
      return data
  }
}

/**
 * 合并消息中连续的 TextContent
 * 在流式输出时，可能产生多个连续的 TextContent，需要合并成一个
 * @param {Message} message - 消息对象
 */
function mergeConsecutiveTextContent(message) {
  if (!message.content || !Array.isArray(message.content)) {
    return message
  }

  const merged = []
  let currentText = null

  for (const part of message.content) {
    if (part.type === 'text') {
      if (currentText) {
        // 合并到当前文本
        currentText.text += part.text
      } else {
        // 开始新的文本块
        currentText = part
        merged.push(currentText)
      }
    } else {
      // 非文本内容，结束当前文本块
      currentText = null
      merged.push(part)
    }
  }

  message.content = merged
  return message
}

/**
 * 反序列化消息
 * @param {Object|string} dataOrJsonStr - 消息对象或JSON字符串
 * @returns {Message} 反序列化后的消息对象
 */
export function deserializeMessage(dataOrJsonStr) {
  // 兼容处理：支持对象或字符串
  const data = typeof dataOrJsonStr === 'string' ? JSON.parse(dataOrJsonStr) : dataOrJsonStr

  // ✅ 重建 content 数组中的 Content 对象
  if (data.content && Array.isArray(data.content)) {
    data.content = data.content.map(part => deserializeContentPart(part))
  }

  let message
  switch (data.role) {
    case 'system':
      message = Object.assign(new SystemMessage(), data)
      break
    case 'user':
      message = Object.assign(new UserMessage(), data)
      break
    case 'ai':
      message = Object.assign(new AIMessage(), data)
      break
    case 'tool':
      message = Object.assign(new ToolMessage(), data)
      break
    default:
      throw new Error(`Unknown message role: ${data.role}`)
  }

  // ✅ 合并连续的 TextContent
  if (message.role === 'ai' || message.role === 'user') {
    mergeConsecutiveTextContent(message)
  }

  return message
}

/**
 * 序列化消息列表
 */
export function serializeMessages(messages) {
  return JSON.stringify(messages)
}

/**
 * 反序列化消息列表
 * @param {Array|string} listOrJsonStr - 消息数组或JSON字符串
 * @returns {Array<Message>} 反序列化后的消息数组
 */
export function deserializeMessages(listOrJsonStr) {
  // 兼容处理：支持数组或字符串
  const list = typeof listOrJsonStr === 'string' ? JSON.parse(listOrJsonStr) : listOrJsonStr

  // 直接传递对象，避免二次序列化
  return list.map(data => deserializeMessage(data))
}

/**
 * 从文本快速创建 UserMessage
 */
export function createUserMessage(text, additionalContent = []) {
  const content = [new TextContent(text), ...additionalContent]
  return new UserMessage(content)
}

/**
 * 从文本快速创建 SystemMessage
 */
export function createSystemMessage(text) {
  return new SystemMessage([new TextContent(text)])
}

/**
 * 提取 AI 消息中的文本内容（忽略推理过程）
 */
export function extractAIText(aiMessage) {
  return aiMessage.content
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('')
}

/**
 * 检查消息是否包含推理过程
 */
export function hasReasoning(aiMessage) {
  return aiMessage.content.some(part => part.type === 'reasoning')
}

/**
 * 检查消息是否为工具调用
 */
export function isToolCall(aiMessage) {
  return aiMessage.finish_reason === 'tool_calls'
}
