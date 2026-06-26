export const PLATFORM_MODELS = {
  claude: [
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', desc: '平衡能力与速度' },
    { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', desc: '最强推理，速度较慢' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', desc: '最快最便宜' },
  ],
  gemini: [
    { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', desc: '最强多模态' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: '长上下文' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: '快速低成本' },
  ],
  gpt: [
    { id: 'gpt-4o', name: 'GPT-4o', desc: '旗舰模型，综合能力强' },
    { id: 'gpt-4o-mini', name: 'GPT-4o mini', desc: '轻量快速' },
    { id: 'o1', name: 'o1', desc: '深度推理' },
  ],
  deepseek: [
    { id: 'deepseek-v3', name: 'DeepSeek V3', desc: '综合能力' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', desc: '逻辑推理增强' },
  ],
  qwen: [
    { id: 'qwen-max', name: 'Qwen Max', desc: '最强能力' },
    { id: 'qwen-plus', name: 'Qwen Plus', desc: '平衡版' },
    { id: 'qwen-turbo', name: 'Qwen Turbo', desc: '速度优先' },
  ],
}

export const PLATFORM_NAMES = {
  claude: 'Claude',
  gemini: 'Gemini',
  gpt: 'GPT',
  deepseek: 'DeepSeek',
  qwen: 'Qwen',
}

export function getModelsForPlatform(platform) {
  return PLATFORM_MODELS[platform] || PLATFORM_MODELS.claude
}

export function getDefaultModelForPlatform(platform) {
  return getModelsForPlatform(platform)[0]?.id || ''
}

export function resolveAppModel(app) {
  if (!app) return ''
  if (app.model && getModelsForPlatform(app.platform).some(m => m.id === app.model)) {
    return app.model
  }
  const legacy = localStorage.getItem(`app_model_${app.id}`)
  if (legacy && getModelsForPlatform(app.platform).some(m => m.id === legacy)) {
    return legacy
  }
  return getDefaultModelForPlatform(app.platform)
}
