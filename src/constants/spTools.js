/**
 * SP 工具定义
 * 来源：产品流程.md 第四章 Tab1 + 第五章参数清单
 */
export const SP_TOOLS = [
  {
    key: 'SPread',
    name: 'SPread',
    desc: '读取文件内容',
    hasConfig: true,
    params: [
      { key: 'max_output_length', type: 'int', default: null, desc: '文本输出总字符预算（空=使用workspace默认值）' },
      { key: 'max_line_length', type: 'int', default: 2000, desc: '文本单行字符上限' },
      { key: 'image', type: 'bool', default: false, desc: '开启云盘图片读取' },
      { key: 'video', type: 'bool', default: false, desc: '开启云盘视频读取' },
      { key: 'audio', type: 'bool', default: false, desc: '开启云盘音频读取' },
      { key: 'file', type: 'bool', default: false, desc: '开启云盘文件读取（PDF）' },
      { key: 'image_url', type: 'bool', default: false, desc: '开启网络URL图片读取' },
      { key: 'video_url', type: 'bool', default: false, desc: '开启网络URL视频读取' },
      { key: 'audio_url', type: 'bool', default: false, desc: '开启网络URL音频读取' },
      { key: 'file_url', type: 'bool', default: false, desc: '开启网络URL文件读取' },
      { key: 'max_image_size', type: 'int', default: 20, desc: '图片大小上限（MB，仅云盘）' },
      { key: 'max_video_size', type: 'int', default: 50, desc: '视频大小上限（MB，仅云盘）' },
      { key: 'max_audio_size', type: 'int', default: 50, desc: '音频大小上限（MB，仅云盘）' },
      { key: 'max_file_size', type: 'int', default: 20, desc: '文件大小上限（MB，仅云盘）' },
      { key: 'timeout', type: 'int', default: null, desc: 'HTTP超时（秒，空=使用workspace默认值）' },
    ],
    detail: {
      summary: '读取 workspace 中的文件内容，支持文本、图片、视频、音频、PDF等多种格式。',
      example: 'SPread("workspace/doc.md") → 返回文件文本内容'
    }
  },
  {
    key: 'SPglob',
    name: 'SPglob',
    desc: '浏览目录/搜索文件',
    hasConfig: true,
    params: [
      { key: 'max_output_length', type: 'int', default: null, desc: '输出长度上限，超过则保存到temp并返回预览' },
      { key: 'timeout', type: 'int', default: null, desc: 'HTTP超时（秒）' },
    ],
    detail: {
      summary: '列出目录内容或按 glob 模式搜索文件，用于了解 workspace 结构。',
      example: 'SPglob("workspace/**/*.txt") → 返回所有txt文件路径列表'
    }
  },
  {
    key: 'SPgrep',
    name: 'SPgrep',
    desc: '按关键字搜索文件内容',
    hasConfig: true,
    params: [
      { key: 'max_output_length', type: 'int', default: null, desc: '输出长度上限，超过则保存到temp并返回预览' },
      { key: 'timeout', type: 'int', default: null, desc: 'HTTP超时（秒）' },
    ],
    detail: {
      summary: '在 workspace 文件中按关键字或正则表达式搜索内容，返回匹配行。',
      example: 'SPgrep("workspace/", "关键词") → 返回包含关键词的文件行'
    }
  },
  {
    key: 'SPedit',
    name: 'SPedit',
    desc: '编辑文件（替换内容）',
    hasConfig: false,
    params: [
      { key: 'timeout', type: 'int', default: null, desc: 'HTTP超时（秒）' },
    ],
    detail: {
      summary: '精准替换文件中的指定内容，适合对已有文件进行局部修改。',
      example: 'SPedit("workspace/doc.md", old_text, new_text)'
    }
  },
  {
    key: 'SPwrite',
    name: 'SPwrite',
    desc: '创建/覆写文件',
    hasConfig: false,
    params: [
      { key: 'timeout', type: 'int', default: null, desc: 'HTTP超时（秒）' },
    ],
    detail: {
      summary: '创建新文件或完全覆写已有文件内容。若文件不存在则新建。',
      example: 'SPwrite("workspace/output.md", content)'
    }
  },
  {
    key: 'SPmake',
    name: 'SPmake',
    desc: '创建文件（不覆盖已有）',
    hasConfig: false,
    params: [
      { key: 'timeout', type: 'int', default: null, desc: 'HTTP超时（秒）' },
    ],
    detail: {
      summary: '安全地创建新文件，若文件已存在则报错而不覆盖，避免意外丢失数据。',
      example: 'SPmake("workspace/new.md", content)'
    }
  },
  {
    key: 'SPcreatedir',
    name: 'SPcreatedir',
    desc: '创建文件夹',
    hasConfig: false,
    params: [
      { key: 'timeout', type: 'int', default: null, desc: 'HTTP超时（秒）' },
    ],
    detail: {
      summary: '在 workspace 中创建新目录，支持递归创建多层目录。',
      example: 'SPcreatedir("workspace/reports/2026/")'
    }
  },
  {
    key: 'SPupload',
    name: 'SPupload',
    desc: '上传文件到网盘',
    hasConfig: true,
    params: [
      { key: 'max_file_size', type: 'int', default: 10, desc: '允许的最大文件大小（MB）' },
      { key: 'timeout', type: 'int', default: 60, desc: 'HTTP超时（秒），上传大文件需更长' },
      { key: 'use_magic_bytes', type: 'bool', default: true, desc: '是否启用文件头魔数检测自动修正扩展名' },
    ],
    detail: {
      summary: '将本地或URL文件上传到 workspace 网盘，支持自动检测文件类型。',
      example: 'SPupload("https://example.com/file.pdf", "workspace/file.pdf")'
    }
  },
  {
    key: 'SPrm',
    name: 'SPrm',
    desc: '删除文件/文件夹',
    hasConfig: false,
    params: [
      { key: 'timeout', type: 'int', default: null, desc: 'HTTP超时（秒）' },
    ],
    detail: {
      summary: '删除 workspace 中的文件或文件夹，支持递归删除目录。',
      example: 'SPrm("workspace/temp/old_file.md")'
    }
  },
  {
    key: 'SPSkillManager',
    name: '技能管理器',
    desc: '加载技能目录中的技能',
    hasConfig: true,
    params: [
      { key: 'skills_dir', type: 'str', default: 'shared/skills/', desc: '技能文件夹路径' },
      { key: 'max_content_length', type: 'int', default: -1, desc: '返回内容最大字符数（-1=不截断）' },
      { key: 'max_desc_length', type: 'int', default: 250, desc: '技能列表中每条描述最大字符数' },
      { key: 'timeout', type: 'int', default: null, desc: 'HTTP超时（秒）' },
    ],
    detail: {
      summary: '从指定目录加载技能文件，让 AI 能够动态调用已定义的技能。',
      example: 'SPSkillManager(skills_dir="shared/skills/")'
    }
  },
]

export const SP_TOOL_MAP = Object.fromEntries(SP_TOOLS.map(t => [t.key, t]))

// 特殊工具（按平台显示）
export const SPECIAL_TOOLS = [
  {
    key: 'draw',
    name: '绘图',
    desc: 'AI 图片生成',
    hasConfig: false,
    hasSubModel: true,
    platforms: ['gemini', 'gpt'],
    detail: { summary: '使用 AI 模型生成图片，根据文字描述创作各种风格的图像。' }
  },
  {
    key: 'image_understanding',
    name: '图片理解',
    desc: '识别分析图片内容',
    hasConfig: false,
    hasSubModel: false,
    platforms: ['claude', 'gemini', 'gpt', 'qwen'],
    detail: { summary: '分析图片内容，理解图像中的文字、物体、场景等信息。' }
  },
  {
    key: 'document_parsing',
    name: '文档解析',
    desc: 'PDF/图片文档理解',
    hasConfig: false,
    hasSubModel: false,
    platforms: ['claude', 'gemini', 'gpt'],
    detail: { summary: '解析 PDF 或图片形式的文档，提取文字内容和结构信息。' }
  },
  {
    key: 'video_understanding',
    name: '视频理解',
    desc: '分析视频内容',
    hasConfig: false,
    hasSubModel: false,
    platforms: ['gemini'],
    detail: { summary: '理解视频内容，分析画面、对话和时间线信息。' }
  },
  {
    key: 'audio_understanding',
    name: '音频理解',
    desc: '分析音频内容',
    hasConfig: false,
    hasSubModel: false,
    platforms: ['gemini'],
    detail: { summary: '分析音频内容，支持语音识别和声音理解。' }
  },
  {
    key: 'tts',
    name: '语音合成',
    desc: '文字转语音',
    hasConfig: false,
    hasSubModel: true,
    platforms: ['gpt'],
    detail: { summary: '将文字转换为自然语音，支持多种声音风格。' }
  },
]

export const SPECIAL_TOOL_MAP = Object.fromEntries(SPECIAL_TOOLS.map(t => [t.key, t]))

// 平台 → 支持的工具 key 列表（SP 工具全平台共有，特殊工具按平台）
const SP_KEYS = SP_TOOLS.map(t => t.key)

export const PLATFORM_TOOLS = {
  claude:   [...SP_KEYS, 'image_understanding', 'document_parsing'],
  gemini:   [...SP_KEYS, 'draw', 'image_understanding', 'document_parsing', 'video_understanding', 'audio_understanding'],
  gpt:      [...SP_KEYS, 'draw', 'image_understanding', 'document_parsing', 'tts'],
  deepseek: [...SP_KEYS],
  qwen:     [...SP_KEYS, 'image_understanding'],
}

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
