/** 可选 AI 平台列表与说明（创建 App / 编辑页切换平台共用） */
export const PLATFORMS = [
  { key: 'claude', label: 'Claude' },
  { key: 'gemini', label: 'Gemini' },
  { key: 'gpt', label: 'GPT' },
  { key: 'deepseek', label: 'DeepSeek' },
  { key: 'qwen', label: 'Qwen' },
]

export const PLATFORM_INFO = {
  claude: {
    label: 'Claude',
    capabilities: '文本 · 图片理解 · 文档解析',
    models: 'Opus · Sonnet · Haiku',
    features: ['强推理能力，代码和分析任务表现优异', '支持文档解析和图片理解', '不支持绘图、视频和音频'],
  },
  gemini: {
    label: 'Gemini',
    capabilities: '文本 · 图片理解 · 绘图 · 视频 · 音频',
    models: '2.0 Pro · 1.5 Pro · 1.5 Flash',
    features: ['多模态能力最全，支持图片/视频/音频', '绘图能力（Imagen 系列）', '长上下文支持'],
  },
  gpt: {
    label: 'GPT',
    capabilities: '文本 · 图片理解 · 绘图 · 语音合成',
    models: '4o · 4o-mini · o1',
    features: ['综合能力强，生态成熟', '绘图（DALL-E）和语音合成（TTS）', '不支持视频和音频理解'],
  },
  deepseek: {
    label: 'DeepSeek',
    capabilities: '文本',
    models: 'V3 · R1',
    features: ['价格最低，适合纯文本场景', 'R1 推理增强，适合逻辑复杂任务', '不支持图片、视频、音频和绘图'],
  },
  qwen: {
    label: 'Qwen',
    capabilities: '文本 · 图片理解',
    models: 'Max · Plus · Turbo',
    features: ['中文理解能力强', '支持图片理解', '不支持绘图、视频和音频'],
  },
}

export function getPlatformInfo(platform) {
  return PLATFORM_INFO[platform] || PLATFORM_INFO.claude
}
