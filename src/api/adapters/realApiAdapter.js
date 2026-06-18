/**
 * 真实 API 适配器
 * 负责将前端 Specify Message 格式转换为后端 ChatRequest 格式
 * 以及将后端响应转换为前端 AIMessage 格式
 */

import {
  TextContent,
  ReasoningContent,
  ToolCallContent,
  ImageContent,
  AudioContent,
  VideoContent,
  FileContent,
  AIMessage
} from '@/types/message'

/**
 * 构建 ChatRequest 请求体
 * @param {Array} messages - 前端 Message 数组
 * @param {Object} config - API 配置对象
 * @param {string|null} sessionId - 会话 ID
 * @param {string|null} systemPrompt - 系统提示词
 * @returns {Object} ChatRequest 对象
 */
export function buildChatRequest(messages, config, sessionId, systemPrompt) {
  // 提取最后一条用户消息
  const lastUserMessage = messages
    .slice()
    .reverse()
    .find(msg => msg.role === 'user')

  if (!lastUserMessage) {
    throw new Error('没有找到用户消息')
  }

  // 提取用户消息内容
  const content = extractUserContent(lastUserMessage)

  // 构建请求体
  const requestBody = {
    content: content
  }

  // 添加会话 ID（如果有）
  if (sessionId) {
    requestBody.session_id = sessionId
  }

  // 添加大模型配置
  if (config.qwen) {
    if (config.qwen.model) {
      requestBody.model = config.qwen.model
    }
    if (config.qwen.apiKey) {
      requestBody.api_key = config.qwen.apiKey
    }
    if (config.qwen.baseUrl) {
      requestBody.api_base = config.qwen.baseUrl
    }
  }

  // 添加 SP 工具族配置
  if (config.sp) {
    if (config.sp.apiKey) {
      requestBody.sp_api_key = config.sp.apiKey
    }
    if (config.sp.baseUrl) {
      requestBody.sp_base_url = config.sp.baseUrl
    }
    if (config.sp.app) {
      requestBody.sp_app = config.sp.app
    }
    if (config.sp.user) {
      requestBody.sp_user = config.sp.user
    }
  }

  // 添加 system_prompt（仅在需要时）
  if (systemPrompt) {
    requestBody.system_prompt = systemPrompt
  }

  // 添加工具列表
  if (config.tools && config.tools.length > 0) {
    requestBody.tools = config.tools
  }

  return requestBody
}

/**
 * 提取用户消息的 content
 * @param {Object} userMessage - UserMessage 对象
 * @returns {string|Array} 文本字符串或 ContentItem 数组
 */
export function extractUserContent(userMessage) {
  const { content } = userMessage

  if (!content || content.length === 0) {
    return ''
  }

  // 如果只有一个 TextContent，直接返回文本字符串
  if (content.length === 1 && content[0].type === 'text') {
    return content[0].text || ''
  }

  // 多模态内容，转换为 ContentItem 数组
  return content.map(part => {
    const contentItem = {
      type: part.type
    }

    switch (part.type) {
      case 'text':
        contentItem.text = part.text
        break

      case 'image':
        contentItem.mime_type = part.mime_type
        if (part.url) contentItem.url = part.url
        if (part.base64_data) contentItem.base64_data = part.base64_data
        if (part.file_uri) contentItem.file_uri = part.file_uri
        if (part.file_id) contentItem.file_id = part.file_id
        break

      case 'audio':
        contentItem.mime_type = part.mime_type
        if (part.url) contentItem.url = part.url
        if (part.base64_data) contentItem.base64_data = part.base64_data
        if (part.file_uri) contentItem.file_uri = part.file_uri
        if (part.file_id) contentItem.file_id = part.file_id
        break

      case 'video':
        contentItem.mime_type = part.mime_type
        if (part.url) contentItem.url = part.url
        if (part.base64_data) contentItem.base64_data = part.base64_data
        if (part.file_uri) contentItem.file_uri = part.file_uri
        if (part.file_id) contentItem.file_id = part.file_id
        if (part.frames_base64) contentItem.frames_base64 = part.frames_base64
        if (part.frames_url) contentItem.frames_url = part.frames_url
        break

      case 'file':
        contentItem.mime_type = part.mime_type
        contentItem.filename = part.filename
        if (part.url) contentItem.url = part.url
        if (part.base64_data) contentItem.base64_data = part.base64_data
        if (part.file_uri) contentItem.file_uri = part.file_uri
        if (part.file_id) contentItem.file_id = part.file_id
        break

      default:
        // 其他类型保持原样
        return part
    }

    return contentItem
  })
}

/**
 * 解析后端响应为 AIMessage 对象
 * @param {Object} responseData - ChatResponse 对象
 * @returns {AIMessage}
 */
export function parseAIMessageResponse(responseData) {
  const {
    content,
    finish_reason,
    input_tokens,
    output_tokens,
    model
  } = responseData

  // 转换 content 数组为 ContentPart 对象
  const contentParts = parseContentArray(content || [])

  // 创建 AIMessage 对象
  const aiMessage = new AIMessage({
    content: contentParts,
    finish_reason: finish_reason || 'stop',
    input_tokens: input_tokens || 0,
    output_tokens: output_tokens || 0,
    model: model || null
  })

  return aiMessage
}

/**
 * 解析 content 数组为 ContentPart 对象数组
 * @param {Array} contentArray - 后端返回的 content 数组
 * @returns {Array} ContentPart 对象数组
 */
function parseContentArray(contentArray) {
  return contentArray.map(item => {
    const { type } = item

    switch (type) {
      case 'text':
        return new TextContent(item.text || '')

      case 'reasoning':
        return new ReasoningContent(item.text || '')

      case 'tool_call':
        return new ToolCallContent(item.tool_call)

      case 'image':
        return new ImageContent({
          mime_type: item.mime_type,
          url: item.url,
          base64_data: item.base64_data,
          file_uri: item.file_uri,
          file_id: item.file_id
        })

      case 'audio':
        return new AudioContent({
          mime_type: item.mime_type,
          url: item.url,
          base64_data: item.base64_data,
          file_uri: item.file_uri,
          file_id: item.file_id
        })

      case 'video':
        return new VideoContent({
          mime_type: item.mime_type,
          url: item.url,
          base64_data: item.base64_data,
          file_uri: item.file_uri,
          file_id: item.file_id,
          frames_base64: item.frames_base64,
          frames_url: item.frames_url
        })

      case 'file':
        return new FileContent({
          mime_type: item.mime_type,
          filename: item.filename,
          url: item.url,
          base64_data: item.base64_data,
          file_uri: item.file_uri,
          file_id: item.file_id
        })

      default:
        // 未知类型，返回 TextContent
        console.warn('未知的 content type:', type)
        return new TextContent(JSON.stringify(item))
    }
  })
}
