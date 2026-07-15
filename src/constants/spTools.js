/**
 * 平台显示名、工具子模型等编辑页辅助常量。
 * 推荐工具目录改由编辑页接口 templates.platform_tools 下发，不再使用本地工具清单。
 */

// 工具子模型列表（仅 draw / tts 有子模型选择）
export const TOOL_SUB_MODELS = {
  draw: {
    gemini: [
      { id: 'imagen-3', name: 'Imagen 3', desc: '最新一代，质量最高，支持多风格', default: true },
      { id: 'imagen-2', name: 'Imagen 2', desc: '上一代，速度更快，价格更低', default: false },
    ],
    gpt: [
      { id: 'dall-e-3', name: 'DALL-E 3', desc: '最新一代，质量最高', default: true },
      { id: 'dall-e-2', name: 'DALL-E 2', desc: '速度快，价格低', default: false },
    ],
  },
  tts: {
    gpt: [
      { id: 'tts-1-hd', name: 'TTS-1-HD', desc: '高质量语音，适合正式场景', default: true },
      { id: 'tts-1',    name: 'TTS-1',    desc: '标准质量，速度快，价格低', default: false },
    ],
  },
}

// 平台显示名
export const PLATFORM_LABELS = {
  claude: 'Claude', gemini: 'Gemini', gpt: 'GPT', deepseek: 'DeepSeek', qwen: 'Qwen',
}

/** @deprecated 推荐工具已改走接口 templates；保留空导出避免旧引用报错 */
export const SP_TOOLS = []
export const SPECIAL_TOOLS = []
export const SP_TOOL_MAP = {}
export const SPECIAL_TOOL_MAP = {}
export const PLATFORM_TOOLS = {}

export function isToolError() {
  return false
}

export function getToolErrorMsg() {
  return ''
}
