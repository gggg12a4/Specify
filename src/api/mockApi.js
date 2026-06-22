/**
 * 开发者 / 终端用户门户 Mock API（localStorage 持久化）。
 *
 * 平台管理后台请使用 @/api/admin.js 对接真实后端，勿在此模块扩展 admin 接口。
 */

const USERS_KEY = 'specify_mock_users'
const FILES_PREFIX = 'specify_mock_files_'
const RUN_CONFIG_PREFIX = 'specify_mock_run_config_'
const SHARE_PREFIX = 'specify_mock_share_'
const MCP_PREFIX = 'specify_mock_mcp_'
const RECOMMENDED_KEY = 'specify_mock_recommended'
const RECENT_KEY = 'specify_mock_recent'

function ok(data) {
  return { code: 0, data, message: 'ok' }
}

function fail(message) {
  return { code: 1, message, data: null }
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function genToken() {
  return 'mock_token_' + Date.now()
}

function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function getUsers() {
  const users = readJson(USERS_KEY, [])
  if (!users.length) {
    const defaults = [
      { phone: '13800000001', password: '123456', nickname: '开发者小明', role: 'developer' },
      { phone: '13800000002', password: '123456', nickname: '用户小红', role: 'user' },
    ]
    writeJson(USERS_KEY, defaults)
    return defaults
  }
  return users
}

function saveUsers(users) {
  writeJson(USERS_KEY, users)
}

function defaultFileTree() {
  return {
    workspace: [],
    temp: [],
    memory: [],
    assets: [],
    shared: [
      { path: 'shared/readme.md', name: 'readme.md', isDir: false, size: 128 },
    ],
  }
}

function flattenFiles(tree, base = '') {
  const list = []
  for (const [dir, items] of Object.entries(tree)) {
    for (const item of items || []) {
      const path = item.path || `${dir}/${item.name}`
      list.push({ ...item, path, dir })
    }
  }
  return list
}

function ensureRecommended() {
  const items = readJson(RECOMMENDED_KEY, null)
  if (items) return items
  const defaults = [
    { id: 'rec_1', name: '面试助手', description: '帮你准备技术面试', creator_nickname: '官方', is_public: true },
    { id: 'rec_2', name: '英语老师', description: '全英文沉浸式对话', creator_nickname: 'TomEnglish', is_public: true },
  ]
  writeJson(RECOMMENDED_KEY, defaults)
  return defaults
}

/** 开发者 / 用户登录（手机号 + 密码） */
export async function login(phone, password) {
  const user = getUsers().find((u) => u.phone === phone && u.password === password)
  if (!user) return fail('手机号或密码错误')
  return ok({
    token: genToken(),
    user: {
      id: user.phone,
      phone: user.phone,
      nickname: user.nickname,
      role: user.role || 'developer',
    },
  })
}

/** 注册新账号，role 为 developer 或 user */
export async function register(phone, password, confirm, role = 'developer') {
  if (!phone) return fail('请输入手机号')
  if (password.length < 6) return fail('密码至少 6 位')
  if (password !== confirm) return fail('两次密码不一致')
  const allowedRoles = ['developer', 'user']
  const finalRole = allowedRoles.includes(role) ? role : 'developer'
  const users = getUsers()
  if (users.some((u) => u.phone === phone)) return fail('该手机号已注册')
  users.push({ phone, password, nickname: phone, role: finalRole })
  saveUsers(users)
  return ok({
    token: genToken(),
    user: { id: phone, phone, nickname: phone, role: finalRole },
  })
}

export async function getRecommendedApps(offset = 0, limit = 6) {
  const all = ensureRecommended()
  const items = all.slice(offset, offset + limit)
  return ok({ items, has_more: offset + limit < all.length })
}

export async function getRecentApps() {
  return ok(readJson(RECENT_KEY, []))
}

export async function getFiles(appId, scope = 'user') {
  const key = FILES_PREFIX + appId
  const tree = readJson(key, defaultFileTree())
  return ok({ tree, files: flattenFiles(tree), scope })
}

export async function mkdir(appId, path) {
  const key = FILES_PREFIX + appId
  const tree = readJson(key, defaultFileTree())
  const normalized = path.replace(/\/+$/, '')
  const parts = normalized.split('/')
  const dir = parts[0]
  const name = parts.slice(1).join('/') || parts[0]
  if (!tree[dir]) tree[dir] = []
  const fullPath = normalized.includes('/') ? normalized : `${dir}/${name}`
  if (!tree[dir].some((f) => f.path === fullPath)) {
    tree[dir].push({ path: fullPath, name: name.split('/').pop(), isDir: true })
  }
  writeJson(key, tree)
  return ok({ path: fullPath })
}

export async function uploadFile(appId, file, targetPath = 'workspace/') {
  const key = FILES_PREFIX + appId
  const tree = readJson(key, defaultFileTree())
  const dir = targetPath.replace(/\/+$/, '').split('/')[0] || 'workspace'
  const fileName = file.name
  const path = `${targetPath.replace(/\/+$/, '')}/${fileName}`.replace(/\/+/g, '/')
  if (!tree[dir]) tree[dir] = []
  tree[dir].push({ path, name: fileName, isDir: false, size: file.size || 0 })
  writeJson(key, tree)
  return ok({ path, name: fileName })
}

export async function deleteFile(appId, path) {
  const key = FILES_PREFIX + appId
  const tree = readJson(key, defaultFileTree())
  for (const dir of Object.keys(tree)) {
    tree[dir] = (tree[dir] || []).filter((f) => f.path !== path && !f.path?.startsWith(path + '/'))
  }
  writeJson(key, tree)
  return ok({ path })
}

export async function downloadFile(appId, path) {
  return ok({ path, blob: null, url: '#' })
}

export async function testMcp(appId, config) {
  if (!config?.url?.trim()) return fail('URL 不能为空')
  return ok({
    tools: [
      { name: 'search', description: '搜索工具' },
      { name: 'fetch', description: '获取网页内容' },
    ],
  })
}

export async function createMcp(appId, data) {
  const key = MCP_PREFIX + appId
  const list = readJson(key, [])
  const mcp = { id: genId('mcp'), ...data, name: data.url?.split('/').pop() || 'MCP 服务' }
  list.push(mcp)
  writeJson(key, list)
  return ok(mcp)
}

export async function updateMcp(appId, mcpId, updates) {
  const key = MCP_PREFIX + appId
  const list = readJson(key, [])
  const idx = list.findIndex((m) => m.id === mcpId)
  if (idx === -1) return fail('MCP 不存在')
  Object.assign(list[idx], updates)
  writeJson(key, list)
  return ok(list[idx])
}

export async function getShareSettings(appId) {
  const key = SHARE_PREFIX + appId
  return ok(readJson(key, { billing_mode: 'user_pay', is_public: false, mcp_credentials: {} }))
}

export async function updateShareSettings(appId, settings) {
  const key = SHARE_PREFIX + appId
  const current = readJson(key, {})
  writeJson(key, { ...current, ...settings })
  return ok(readJson(key, settings))
}

export async function getRunConfig(appId) {
  const key = RUN_CONFIG_PREFIX + appId
  const data = readJson(key, { configured: false })
  const share = readJson(SHARE_PREFIX + appId, {})
  return ok({ ...data, app_share_billing: share.billing_mode || 'user_pay' })
}

export async function saveRunConfig(appId, payload) {
  const key = RUN_CONFIG_PREFIX + appId
  writeJson(key, { configured: true, ...payload })
  return ok(readJson(key, payload))
}

export async function getPlatformToolsConstraints(platformId) {
  // 模拟从后端数据库实时查出的平台底层能力约束
  const allTools = [
    'SPread', 'SPglob', 'SPgrep', 'SPedit', 'SPwrite',
    'SPmake', 'SPcreatedir', 'SPupload', 'SPrm', 'SPSkillManager'
  ]

  let allowedTools = [...allTools]
  let disabledConfigs = {} // 记录需要置灰的工具配置项

  if (platformId === 'deepseek') {
    allowedTools = [...allTools]
    disabledConfigs['SPread'] = {
      image: "当前 DeepSeek 模型为纯文本模型，不支持图片读取能力。",
      video: "当前 DeepSeek 模型为纯文本模型，不支持视频读取能力。",
      audio: "当前 DeepSeek 模型不支持音频读取能力。",
      image_url: "当前 DeepSeek 模型不支持网络图片读取。",
      video_url: "当前 DeepSeek 模型不支持网络视频读取。",
      audio_url: "当前 DeepSeek 模型不支持网络音频读取。"
    }
  } else if (platformId === 'claude') {
    allowedTools = [...allTools, 'image_understanding', 'document_parsing']
    disabledConfigs['SPread'] = {
      video: "Claude 目前暂不支持直接解析视频文件。",
      audio: "Claude 目前暂不支持直接解析音频文件。",
      video_url: "Claude 目前暂不支持解析网络视频。",
      audio_url: "Claude 目前暂不支持解析网络音频。"
    }
  } else if (platformId === 'gemini') {
    allowedTools = [...allTools, 'draw', 'image_understanding', 'document_parsing', 'video_understanding', 'audio_understanding']
  } else if (platformId === 'gpt') {
    allowedTools = [...allTools, 'draw', 'image_understanding', 'document_parsing', 'tts']
    disabledConfigs['SPread'] = {
      video: "GPT 目前不支持直接读取视频文件。",
      audio: "GPT 不支持直接读取音频文件。"
    }
  } else if (platformId === 'qwen') {
    allowedTools = [...allTools, 'image_understanding']
    disabledConfigs['SPread'] = {
      video: "Qwen 目前不支持读取视频文件。",
      audio: "Qwen 不支持读取音频文件。"
    }
  }

  return ok({
    allowed_tools: allowedTools,
    disabled_configs: disabledConfigs
  })
}

/** 默认导出，便于 import mockApi from '@/api/mockApi' */
export default {
  login,
  register,
  getRecommendedApps,
  getRecentApps,
  getFiles,
  mkdir,
  uploadFile,
  deleteFile,
  downloadFile,
  testMcp,
  createMcp,
  updateMcp,
  getShareSettings,
  updateShareSettings,
  getRunConfig,
  saveRunConfig,
  getPlatformToolsConstraints,
}
