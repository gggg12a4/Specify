<template>
  <div class="run-layout">
    <!-- 主区域 -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="run-header">
        <div class="header-left">
          <button class="back-btn" @click="router.push('/workspace')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 class="app-title">{{ app?.name || 'App' }}</h1>
          <span v-if="isDebugMode" class="mode-badge debug">调试</span>
          <span v-else class="mode-badge formal">正式</span>
        </div>
        <div class="header-center">
          <span class="token-stat">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            ↑{{ formatToken(inputTokens) }} ↓{{ formatToken(outputTokens) }}
          </span>
          <span v-if="!isDebugMode && runConfigMode" class="billing-badge" :title="runConfigMode === 'dev_pay' ? '由开发者付费' : '自备密钥运行'">
            {{ runConfigMode === 'dev_pay' ? '开发者支持' : '自备凭据' }}
          </span>
        </div>
        <div class="header-right">
          <button class="hdr-btn" title="重置对话" :disabled="!messages.length || streaming" @click="showResetConfirm = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
            重置
          </button>
          <button v-if="isDebugMode" class="hdr-btn" title="模型配置" @click="showRunConfig = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            模型
          </button>
        </div>
      </header>

      <div v-if="!app" class="not-found">App 不存在或已被删除</div>

      <template v-else>
        <!-- 工作区：文件面板 + 对话区 -->
        <div class="work-area">

          <!-- 左侧文件面板 -->
          <aside class="file-panel">
            <FileTree :app-id="app.id" :is-owner="isOwner" />
          </aside>

          <!-- 右侧对话区 -->
          <div class="chat-section">
            <!-- 欢迎页 -->
            <div v-if="!messages.length" class="welcome-screen">
              <div class="welcome-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <h2 class="welcome-title">你好，我能帮你什么？</h2>
              <p class="welcome-sub">{{ app.name }}</p>

              <div class="welcome-input-wrapper" :class="{ focused: inputFocused }">
                <FilePreviewList v-if="uploadedFiles.length" :files="uploadedFiles" @remove="handleRemoveFile" />
                <div class="input-row">
                  <UploadSelector @file-selected="handleFileSelected" />
                  <textarea ref="textareaRef" v-model="inputText" class="chat-input"
                    placeholder="Ask Specify" rows="1"
                    @focus="inputFocused = true" @blur="inputFocused = false"
                    @keydown="handleKeydown" @input="adjustHeight($event, textareaRef)">
                  </textarea>
                  <button v-if="streaming" class="stop-btn" @click="stopStreaming">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  </button>
                  <button v-else class="send-btn" :class="{ active: canSend }" :disabled="!canSend" @click="send">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </div>
              </div>

              <div class="example-prompts">
                <button v-for="(ex, i) in examples" :key="i" class="example-card" @click="fillExample(ex)">
                  <span class="example-icon">{{ ex.icon }}</span>
                  <p class="example-text">{{ ex.text }}</p>
                </button>
              </div>
            </div>

            <!-- 消息列表 -->
            <div v-else class="messages-container" ref="scrollEl">
              <div class="messages-inner">
                <div v-for="(msg, i) in messages" :key="i" class="message-row" :class="`message-${msg.role}`">

                  <!-- AI 消息 -->
                  <template v-if="msg.role === 'ai'">
                    <div class="msg-avatar avatar-ai"><span>S</span></div>
                    <div class="msg-content">
                      <!-- 调试模式：每个工具调用单独一行 -->
                      <template v-if="isDebugMode">
                        <div v-for="(tc, ti) in (msg.toolCalls || [])" :key="ti" class="tool-call-row">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tc-icon"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                          <span class="tc-label">调用 <code>{{ tc.name }}</code></span>
                          <span class="tc-status" :class="tc.status">
                            {{ tc.status === 'done' ? '✅' : tc.status === 'cancelled' ? '❌' : '⏳' }}
                          </span>
                          <!-- hover 详情浮层 -->
                          <div v-if="tc.params || tc.result" class="tc-details">
                            <div v-if="tc.params" class="tc-detail-block">
                              <span class="tc-detail-label">参数</span>
                              <pre class="tc-detail-pre">{{ JSON.stringify(tc.params, null, 2) }}</pre>
                            </div>
                            <div v-if="tc.result" class="tc-detail-block">
                              <span class="tc-detail-label">结果</span>
                              <pre class="tc-detail-pre">{{ tc.result }}</pre>
                            </div>
                          </div>
                        </div>
                      </template>
                      <!-- 正式模式：合并为一行 -->
                      <template v-else-if="msg.toolCalls && msg.toolCalls.length">
                        <div class="tool-call-row tool-call-formal">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tc-icon"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                          <span v-if="msg.toolCalls.every(tc => tc.status === 'done' || tc.status === 'cancelled')" class="tc-label">思考完成</span>
                          <span v-else class="tc-label">正在思考...</span>
                          <span class="tc-status done">✅</span>
                        </div>
                      </template>

                      <!-- 加载动画 -->
                      <div v-if="msg.loading" class="msg-body is-loading">
                        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                      </div>
                      <!-- 文本 -->
                      <div v-else-if="msg.text" class="msg-body">{{ msg.text }}</div>

                      <!-- 系统通知（仅调试模式） -->
                      <div v-if="isDebugMode && msg.notification" class="sys-notification">
                        ℹ️ {{ msg.notification }}
                      </div>
                      <!-- 错误卡片 -->
                      <div v-if="msg.error" class="error-card">
                        <div class="error-card-title">❌ LM 调用失败</div>
                        <div class="error-card-body">
                          <div class="error-raw">{{ msg.error }}</div>
                          <div class="error-hints">
                            <p class="hints-title">常见原因：</p>
                            <ul>
                              <li>工具配置了多模态能力，但当前模型不支持该类型</li>
                              <li>API Key 无效或已过期</li>
                              <li>上下文长度超出模型限制</li>
                              <li>API 服务暂时不可用</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                  <!-- 用户消息 -->
                  <template v-else-if="msg.role === 'user'">
                    <div class="msg-content-user">
                      <div class="msg-body-user" :class="{ pending: msg.pending }">
                        <div v-if="(msg.files && msg.files.length) || (msg.fileNames && msg.fileNames.length)" class="msg-attachments">
                          <img v-for="f in (msg.files || []).filter(f => f.contentType === 'image')" :key="f.id" :src="f.previewUrl" class="att-image" />
                          <div v-for="f in (msg.files || []).filter(f => f.contentType !== 'image')" :key="f.id" class="att-file">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                            {{ f.file.name }}
                          </div>
                          <div v-for="name in (msg.fileNames || [])" :key="name" class="att-file">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                            {{ name }}
                          </div>
                        </div>
                        <span v-if="msg.text">{{ msg.text }}</span>
                        <span v-if="msg.pending" class="pending-tag">待发送</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- 审批面板（代替输入区） -->
            <div v-if="messages.length && approvalVisible" class="approval-panel">
              <div class="approval-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span class="approval-title">AI 请求执行以下操作，需要你的批准</span>
              </div>
              <div class="approval-items">
                <div v-for="item in approvalItems" :key="item.tool_call_id" class="approval-item">
                  <code class="approval-tool">{{ item.tool_name }}</code>
                  <span class="approval-desc">{{ item.description }}</span>
                </div>
              </div>
              <div class="approval-actions">
                <button class="approval-btn-reject" @click="submitApproval(false)">拒绝</button>
                <button class="approval-btn-approve" @click="submitApproval(true)">批准</button>
              </div>
            </div>

            <!-- 底部输入区 -->
            <footer v-else-if="messages.length" class="input-area">
              <div class="input-wrapper" :class="{ focused: inputFocused }">
                <FilePreviewList v-if="uploadedFiles.length" :files="uploadedFiles" @remove="handleRemoveFile" />
                <div class="input-row">
                  <UploadSelector @file-selected="handleFileSelected" />
                  <textarea ref="textareaRef2" v-model="inputText" class="chat-input"
                    placeholder="Ask Specify" rows="1"
                    @focus="inputFocused = true" @blur="inputFocused = false"
                    @keydown="handleKeydown" @input="adjustHeight($event, textareaRef2)">
                  </textarea>
                  <button v-if="streaming" class="stop-btn" @click="stopStreaming">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  </button>
                  <button v-else class="send-btn" :class="{ active: canSend }" :disabled="!canSend" @click="send">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </div>
              </div>
              <p class="disclaimer">Specify 可能会出现错误，请核实重要信息。</p>
            </footer>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- 重置确认弹窗 -->
  <ConfirmDialog
    v-model:visible="showResetConfirm"
    title="确认重置对话？"
    message="将清除当前所有对话记录，系统提示词保留不变。Token 累计值不会重置。"
    confirm-text="确认重置"
    :danger="true"
    @confirm="handleReset"
  />

  <!-- 重命名弹窗 -->
  <InputDialog
    v-model:visible="renameDialog.visible"
    title="重命名对话"
    placeholder="请输入新的对话标题"
    :default-value="renameDialog.current"
    :validator="v => v.trim() ? true : '标题不能为空'"
    @confirm="handleRenameConfirm"
  />

  <!-- 强制添加 API Key 弹窗 (JIT Interception) -->
  <ApiConfigModal
    v-model:visible="showApiConfigModal"
    :addMode="true"
    @saved="onApiKeyAdded"
  />

  <!-- 运行配置弹窗 -->
  <RunConfigModal
    v-model:visible="showRunConfig"
    :platform="app?.platform || 'claude'"
    :app-id="app?.id || ''"
    :has-existing-key="hasExistingKey"
    :can-close="runConfigured"
    :is-owner="isOwner"
    :mcp-services="app?.mcp_services || []"
    @confirm="onRunConfigConfirm"
  />
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useApiConfig } from '@/composables/useApiConfig'
import FileTree from '@/components/app/FileTree.vue'
import UploadSelector from '@/components/common/UploadSelector.vue'
import FilePreviewList from '@/components/common/FilePreviewList.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import InputDialog from '@/components/common/InputDialog.vue'
import RunConfigModal from '@/components/common/RunConfigModal.vue'
import ApiConfigModal from '@/components/common/ApiConfigModal.vue'
import { createPreviewURL, revokePreviewURL, detectContentType, fileToBase64 } from '@/utils/file'
import * as chatApi from '@/api/chat'
import * as sessionApi from '@/api/session'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { hasKeys } = useApiConfig()

const app = computed(() => appStore.getApp(route.params.id))

const isDebugMode = computed(() => route.query.mode !== 'formal')
const isOwner = computed(() => true) // In a real app, this checks if currentUser.id === app.author_id. Mocking as owner by default for workspace, but normally share mode determines this.

const inputText = ref('')
const inputFocused = ref(false)
const streaming = ref(false)
const messages = ref([])
const uploadedFiles = ref([])
const sessions = ref([])
const currentSessionId = ref(null)
const scrollEl = ref(null)
const textareaRef = ref(null)
const textareaRef2 = ref(null)
const renameDialog = ref({ visible: false, sessionId: null, current: '' })
const showResetConfirm = ref(false)
const showRunConfig = ref(false)
const showApiConfigModal = ref(false)
const runConfigured = ref(false)
const hasExistingKey = ref(false)
const runConfigMode = ref('') // 'dev_pay' or 'self_key'

const inputTokens = ref(0)
const outputTokens = ref(0)

// Approval flow state
const approvalItems = ref([])
const approvalVisible = ref(false)
let _pendingFormItems = []
let _currentStream = null

const canSend = computed(() =>
  (inputText.value.trim().length > 0 || uploadedFiles.value.length > 0) &&
  !streaming.value && !approvalVisible.value
)

const examples = [
  { icon: '💡', text: '解释量子计算的基本原理' },
  { icon: '✍️', text: '帮我写一封正式的商务邮件' },
  { icon: '🎨', text: '设计一个现代化的网页布局方案' },
  { icon: '📊', text: '分析这组数据并给出趋势预测' },
]

function formatToken(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function makeTitle(text) {
  const t = text?.trim() || '新对话'
  return t.length > 20 ? t.slice(0, 20) + '…' : t
}
function timeLabel() { return '刚刚' }

// ── localStorage 持久化 ──────────────────────────────────────────
function storageKey() { return `specify_sessions_${route.params.id}` }
function activeKey()  { return `specify_active_${route.params.id}` }

function serializeMessages(msgs) {
  return msgs
    .filter(m => !m.loading)
    .map(m => ({
      role: m.role,
      text: m.text || '',
      fileNames: (m.files || []).map(f => f.file?.name).filter(Boolean),
      thinking: m.thinking || null,
      toolCalls: m.toolCalls || null,
      notification: m.notification || null,
      error: m.error || null,
      pending: m.pending || false
    }))
}

function deserializeMessages(raw) {
  return (raw || []).map(m => ({
    role: m.role,
    text: m.text,
    files: [],
    fileNames: m.fileNames || [],
    thinking: m.thinking || null,
    toolCalls: m.toolCalls || null,
    notification: m.notification || null,
    error: m.error || null,
    pending: m.pending || false
  }))
}

function saveSessions() {
  try {
    const toSave = sessions.value.map(s => ({ ...s, messages: serializeMessages(s.messages) }))
    localStorage.setItem(storageKey(), JSON.stringify(toSave))
    if (currentSessionId.value) localStorage.setItem(activeKey(), currentSessionId.value)
  } catch { /* storage full */ }
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(storageKey())
    if (raw) {
      const parsed = JSON.parse(raw)
      sessions.value = parsed.map(s => ({ ...s, messages: deserializeMessages(s.messages) }))
    }
    const activeId = localStorage.getItem(activeKey())
    if (activeId) {
      const target = sessions.value.find(s => s.id === activeId)
      if (target) { currentSessionId.value = activeId; messages.value = [...target.messages] }
    }
  } catch { /* parse error */ }
}

onMounted(async () => {
  loadSessions()

  // JIT Interception check on mount
  if (!hasKeys()) {
    showApiConfigModal.value = true
  }

  if (app.value) {
    try {
      inputTokens.value = 0
      outputTokens.value = 0

      // Mock run config logic
      const cfgRes = { code: 0, data: { configured: true, billing_mode: 'platform' } }
      if (cfgRes.code === 0 && cfgRes.data.configured) {
        runConfigured.value = true
        hasExistingKey.value = !!cfgRes.data.api_key
        runConfigMode.value = cfgRes.data.billing_mode
      } else {
        // showRunConfig.value = true
      }
    } catch (e) {
      console.error(e)
    }
  }
})

function onApiKeyAdded() {
  // Key was added via JIT interception, we can proceed or just let the user stay on the screen
  hasExistingKey.value = true
}

function onRunConfigConfirm(cfg) {
  runConfigured.value = true
  hasExistingKey.value = !!(cfg.api_key)
  runConfigMode.value = cfg.billing_mode
}

watch(messages, () => {
  if (currentSessionId.value) {
    const s = sessions.value.find(s => s.id === currentSessionId.value)
    if (s) s.messages = messages.value
  }
  saveSessions()
}, { deep: true })

watch(sessions, saveSessions, { deep: true })

watch(currentSessionId, () => {
  if (currentSessionId.value) localStorage.setItem(activeKey(), currentSessionId.value)
  else localStorage.removeItem(activeKey())
})

// ── 输入 ──────────────────────────────────────────────────────────
function fillExample(ex) {
  inputText.value = ex.text
  nextTick(() => textareaRef.value?.focus())
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
}

function adjustHeight(e, elRef) {
  const el = elRef?.value || e.target
  if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px' }
}

async function handleFileSelected({ file }) {
  const previewUrl = createPreviewURL(file)
  const contentType = detectContentType(file)
  const item = { id: Date.now() + '_' + Math.random().toString(36).substr(2, 9), file, contentType, previewUrl, base64Data: null }
  uploadedFiles.value.push(item)
  item.base64Data = await fileToBase64(file)
}

function handleRemoveFile(id) {
  const idx = uploadedFiles.value.findIndex(f => f.id === id)
  if (idx > -1) {
    revokePreviewURL(uploadedFiles.value[idx].previewUrl)
    uploadedFiles.value.splice(idx, 1)
  }
}

// ── 发送 ──────────────────────────────────────────────────────────
async function send() {
  if (!canSend.value) return

  // JIT Interception at send time
  if (!hasKeys()) {
    showApiConfigModal.value = true
    return
  }

  const text = inputText.value.trim()
  inputText.value = ''
  ;[textareaRef.value, textareaRef2.value].forEach(el => { if (el) el.style.height = 'auto' })

  // AI 执行期间 → 缓存为待发送消息
  if (streaming.value) {
    messages.value.push({ role: 'user', text, files: [...uploadedFiles.value], pending: true })
    uploadedFiles.value = []
    await scroll()
    return
  }

  messages.value.push({ role: 'user', text, files: [...uploadedFiles.value], pending: false })
  uploadedFiles.value.forEach(f => revokePreviewURL(f.previewUrl))
  uploadedFiles.value = []

  if (!currentSessionId.value) {
    const id = genId()
    currentSessionId.value = id
    sessions.value.unshift({ id, title: makeTitle(text), time: timeLabel(), pinned: false, messages: messages.value })
  } else {
    const s = sessions.value.find(s => s.id === currentSessionId.value)
    if (s) s.time = timeLabel()
  }

  await scroll()
  await doStream(app.value.id, text)
}

// ── SSE 流式对话 ──────────────────────────────────────────────────
async function doStream(appId, content) {
  streaming.value = true

  const aiMsgIdx = messages.value.length
  messages.value.push({ role: 'ai', text: '', loading: true, toolCalls: [], notification: null, error: null })
  await scroll()

  _pendingFormItems = []

  const controller = chatApi.sendMessageStream(
    {
      messages: messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.text })),
      config: {},
      sessionId: currentSessionId.value,
      systemPrompt: app.value?.system_prompt
    },
    (chunk) => {
      const aiMsg = messages.value[aiMsgIdx]
      const { event, data } = chunk

      if (event === 'notification') {
        aiMsg.loading = false
        if (isDebugMode.value) {
          if (data.type === 'lm_start') aiMsg.notification = `步骤 ${data.step} 开始`
          else if (data.type === 'tool_start') aiMsg.notification = `调用工具: ${(data.tools || []).join(', ')}`
        }

      } else if (event === 'ai_chunk') {
        aiMsg.loading = false
        const textPart = data.content?.find(c => c.type === 'text')
        if (textPart) aiMsg.text += textPart.text
        scroll()

      } else if (event === 'ai_message') {
        const textParts = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('')
        if (textParts) aiMsg.text = textParts
        const toolCalls = (data.content || []).filter(c => c.type === 'tool_call')
        toolCalls.forEach(tc => {
          if (!aiMsg.toolCalls.find(t => t.callId === tc.tool_call.id)) {
            aiMsg.toolCalls.push({
              callId: tc.tool_call.id,
              name: tc.tool_call.name,
              params: tc.tool_call.arguments,
              status: 'pending',
              result: null,
            })
          }
        })

      } else if (event === 'tool_result') {
        const tc = messages.value[aiMsgIdx].toolCalls?.find(t => t.callId === data.tool_call_id)
        if (tc) { tc.status = 'done'; tc.result = data.content }

      } else if (event === 'form') {
        _pendingFormItems = data.items || []

      } else if (event === 'suspended') {
        approvalItems.value = _pendingFormItems
        approvalVisible.value = true
        streaming.value = false
        _currentStream = null
        scroll()

      } else if (event === 'completed') {
        if (data.total_input_tokens) inputTokens.value = data.total_input_tokens
        if (data.total_output_tokens) outputTokens.value = data.total_output_tokens

      } else if (event === 'error') {
        messages.value[aiMsgIdx].loading = false
        messages.value[aiMsgIdx].error = data.message || '未知错误'
      }
    },
    async () => {
      // Completed callback
      if (streaming.value) streaming.value = false
      _currentStream = null
      const aiMsg = messages.value[aiMsgIdx]
      if (aiMsg) aiMsg.loading = false
      await scroll()

      // 发送期间缓存的待发送消息
      const pending = messages.value.filter(m => m.pending)
      if (pending.length && !approvalVisible.value) {
        pending.forEach(m => { m.pending = false })
        const mergedText = pending.map(m => m.text).filter(Boolean).join('\n')
        await doStream(appId, mergedText || '（继续）')
      }
    },
    (error) => {
      // Error callback
      messages.value[aiMsgIdx].loading = false
      messages.value[aiMsgIdx].error = error.message || '连接中断'
      if (streaming.value) streaming.value = false
      _currentStream = null
    }
  )

  _currentStream = {
    cancel: () => controller.abort()
  }
}

// ── 审批流 ────────────────────────────────────────────────────────
async function submitApproval(allApproved) {
  const items = approvalItems.value.map(i => ({ ...i, approved: allApproved }))
  approvalVisible.value = false
  approvalItems.value = []

  // Mocking submit approval since chatApi doesn't have an explicit approve method exposed right now
  // We'll append a user message saying "Approved" or "Rejected" and send it
  const msgText = allApproved ? '批准执行' : '拒绝执行'
  messages.value.push({ role: 'user', text: msgText, files: [], pending: false })
  await doStream(app.value.id, msgText)
}

function stopStreaming() {
  _currentStream?.cancel()
  _currentStream = null
  streaming.value = false
  approvalVisible.value = false
  const last = messages.value[messages.value.length - 1]
  if (last?.loading) { last.loading = false; last.text = last.text || '（已停止生成）' }
  messages.value.filter(m => m.pending).forEach(m => { m.pending = false })
}

// ── 重置对话 ─────────────────────────────────────────────────────
function handleReset() {
  _currentStream?.cancel()
  _currentStream = null
  streaming.value = false
  approvalVisible.value = false
  approvalItems.value = []

  if (currentSessionId.value) {
    // Delete session from backend
    sessionApi.deleteSession(currentSessionId.value).catch(console.error)
    sessions.value = sessions.value.filter(s => s.id !== currentSessionId.value)
    currentSessionId.value = null
  }
  messages.value = []
}

// ── 会话管理 ─────────────────────────────────────────────────────
function newChat() {
  if (currentSessionId.value) {
    const s = sessions.value.find(s => s.id === currentSessionId.value)
    if (s) s.messages = [...messages.value]
  }
  messages.value = []
  inputText.value = ''
  currentSessionId.value = null
}

function selectSession(item) {
  if (item.id === currentSessionId.value) return
  if (currentSessionId.value) {
    const cur = sessions.value.find(s => s.id === currentSessionId.value)
    if (cur) cur.messages = [...messages.value]
  }
  const target = sessions.value.find(s => s.id === item.id)
  messages.value = target ? [...target.messages] : []
  currentSessionId.value = item.id
  nextTick(() => scroll())
}

function deleteSession(item) {
  sessions.value = sessions.value.filter(s => s.id !== item.id)
  if (currentSessionId.value === item.id) { messages.value = []; currentSessionId.value = null }
}

function pinSession(item) {
  const s = sessions.value.find(s => s.id === item.id)
  if (s) s.pinned = !s.pinned
}

function renameSession(item) {
  renameDialog.value = { visible: true, sessionId: item.id, current: item.title }
}

function handleRenameConfirm(newTitle) {
  const s = sessions.value.find(s => s.id === renameDialog.value.sessionId)
  if (s && newTitle) s.title = newTitle
  renameDialog.value.visible = false
}

async function scroll() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}
</script>

<style scoped>
.run-layout {
  width: 100vw; height: 100vh;
  display: flex; background: var(--color-surface); overflow: hidden;
}

/* ── Main area ── */
.main-area {
  flex: 1; display: flex; flex-direction: column;
  height: 100vh; min-width: 0;
}

/* ── Header ── */
.run-header {
  height: 54px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px 0 14px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.header-center { display: flex; align-items: center; justify-content: center; flex: 1; }
.header-right { display: flex; align-items: center; gap: 6px; flex: 1; justify-content: flex-end; }

.back-btn {
  width: 30px; height: 30px; border-radius: 50%;
  background: transparent; border: none;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.back-btn:hover { background: var(--color-bg-secondary); color: var(--color-primary); }

.app-title { font-size: 15px; font-weight: 600; color: var(--color-text); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.mode-badge {
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 0.4px; flex-shrink: 0;
}
.mode-badge.debug { background: rgba(234,179,8,0.15); color: #ca8a04; }
.mode-badge.formal { background: rgba(34,197,94,0.12); color: #16a34a; }

.token-stat {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.billing-badge {
  font-size: 10px; font-weight: 500;
  padding: 1px 6px; border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  margin-left: 8px;
}

.hdr-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; font-size: 12px; font-weight: 500;
  background: transparent; color: var(--color-text-secondary);
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.hdr-btn:hover:not(:disabled) { background: var(--color-bg-secondary); color: var(--color-text); }
.hdr-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.not-found {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 15px; color: var(--color-text-secondary);
}

/* ── Work area ── */
.work-area {
  flex: 1; display: flex; overflow: hidden; min-height: 0;
}

/* ── File panel ── */
.file-panel {
  width: 200px; flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface); overflow: hidden;
}

/* ── Chat section ── */
.chat-section {
  flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden;
}

/* ── Welcome ── */
.welcome-screen {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 20px;
  max-width: 760px; margin: 0 auto; width: 100%;
}
.welcome-icon { color: var(--color-primary); opacity: 0.85; margin-bottom: 18px; }
.welcome-title { font-size: 28px; font-weight: 400; color: var(--color-text); margin: 0 0 6px; }
.welcome-sub { font-size: 14px; color: var(--color-text-muted); margin: 0 0 24px; }

/* ── Shared input styles ── */
.welcome-input-wrapper,
.input-wrapper {
  width: 100%; max-width: 720px;
  display: flex; flex-direction: column; gap: 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border); border-radius: 20px;
  padding: 10px 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.welcome-input-wrapper.focused, .input-wrapper.focused {
  border-color: var(--color-primary);
  box-shadow: 0 2px 12px var(--color-primary-glow);
}
.welcome-input-wrapper { margin-bottom: 20px; }

.input-row { display: flex; align-items: center; gap: 6px; }

.chat-input {
  flex: 1; min-width: 0;
  max-height: 200px;
  padding: 0 4px; background: transparent;
  border: none; outline: none; resize: none;
  color: var(--color-text); font-size: 15px;
  font-family: inherit; line-height: 1.5;
  align-self: center;
}
.chat-input::placeholder { color: var(--color-text-muted); }

.send-btn {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-border); color: white;
  cursor: not-allowed; transition: all 0.2s; opacity: 0.6; flex-shrink: 0;
}
.send-btn.active { background: var(--color-primary); cursor: pointer; opacity: 1; }
.send-btn.active:hover { background: var(--color-primary-hover); transform: scale(1.05); }

.stop-btn {
  width: 34px; height: 34px; border-radius: 50%; border: none; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-error); color: white; cursor: pointer; transition: all 0.2s;
}
.stop-btn:hover { background: var(--color-error-dark); transform: scale(1.05); }

/* ── Examples ── */
.example-prompts { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; width: 100%; max-width: 720px; }
.example-card {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; text-align: left; cursor: pointer;
  background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 10px; transition: all 0.2s;
}
.example-card:hover { background: var(--color-bg); border-color: var(--color-primary); }
.example-icon { font-size: 15px; flex-shrink: 0; }
.example-text { font-size: 13px; color: var(--color-text); line-height: 1.5; margin: 0; }

/* ── Messages ── */
.messages-container {
  flex: 1; overflow-y: auto; padding: 20px 0; min-height: 0;
  scrollbar-width: none;
}
.messages-container::-webkit-scrollbar { display: none; }
.messages-inner { max-width: 720px; margin: 0 auto; padding: 0 20px; }

.message-row { display: flex; margin-bottom: 24px; }
.message-ai { flex-direction: row; gap: 14px; align-items: flex-start; }
.message-user { justify-content: flex-end; }

.msg-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
.avatar-ai { background: var(--color-bg-secondary); color: var(--color-primary); }

.msg-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.msg-body { font-size: 15px; line-height: 1.7; color: var(--color-text); }
.msg-body.is-loading { display: flex; align-items: center; gap: 5px; padding: 4px 0; }

.dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--color-text-muted);
  animation: dot-pulse 1.2s ease-in-out infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes dot-pulse {
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.85); }
  30% { opacity: 1; transform: scale(1.15); }
}

/* ── Tool call row ── */
.tool-call-row {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 5px 10px; border-radius: 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  font-size: 13px; color: var(--color-text-secondary);
  position: relative; cursor: default;
  transition: border-color 0.15s;
  max-width: fit-content;
}
.tool-call-row:hover { border-color: var(--color-text-muted); }

.tc-icon { flex-shrink: 0; color: var(--color-text-muted); }
.tc-label { white-space: nowrap; }
.tc-label code { font-family: var(--font-mono); font-size: 12px; color: var(--color-text); font-weight: 600; }
.tc-status { font-size: 13px; }

/* hover 详情浮层 */
.tc-details {
  display: none; position: absolute; top: calc(100% + 6px); left: 0;
  z-index: 100; background: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  min-width: 280px; max-width: 420px;
  padding: 12px; flex-direction: column; gap: 10px;
}
.tool-call-row:hover .tc-details { display: flex; }

.tc-detail-block { display: flex; flex-direction: column; gap: 5px; }
.tc-detail-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
.tc-detail-pre {
  margin: 0; padding: 8px 10px;
  background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 6px;
  font-size: 12px; font-family: var(--font-mono); color: var(--color-text-secondary);
  white-space: pre-wrap; word-break: break-all; max-height: 150px; overflow-y: auto;
}

/* ── User message ── */
.msg-content-user { display: flex; justify-content: flex-end; }
.msg-body-user {
  background: var(--color-bg-secondary);
  padding: 12px 16px; border-radius: 18px;
  max-width: 80%; font-size: 15px; line-height: 1.6; color: var(--color-text);
  position: relative;
}
.msg-body-user.pending { opacity: 0.6; border: 1.5px dashed var(--color-border); background: transparent; }
.pending-tag { font-size: 11px; color: var(--color-text-muted); display: block; margin-top: 4px; }

.msg-attachments { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.att-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--color-border); }
.att-file {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--color-text-secondary);
  background: var(--color-bg); border: 1px solid var(--color-border);
  border-radius: 6px; padding: 4px 8px;
}

/* ── Notifications / Errors ── */
.sys-notification {
  font-size: 12px; color: var(--color-text-muted);
  padding: 4px 0; line-height: 1.5;
}

.error-card {
  border: 1.5px solid rgba(239,68,68,0.3); border-radius: 10px; overflow: hidden;
  background: rgba(239,68,68,0.04);
}
.error-card-title {
  padding: 10px 14px; font-size: 13px; font-weight: 600; color: var(--color-error);
  border-bottom: 1px solid rgba(239,68,68,0.15);
}
.error-card-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.error-raw { font-size: 13px; color: var(--color-text-secondary); font-family: var(--font-mono); }
.error-hints { font-size: 12px; color: var(--color-text-muted); }
.hints-title { margin: 0 0 4px; font-weight: 600; }
.error-hints ul { margin: 0; padding-left: 16px; line-height: 1.8; }

/* ── Approval panel ── */
.approval-panel {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 14px 16px 12px;
  display: flex; flex-direction: column; gap: 10px;
}
.approval-header {
  display: flex; align-items: center; gap: 8px;
  color: #ca8a04; font-size: 13px; font-weight: 600;
}
.approval-title { color: var(--color-text); font-weight: 600; font-size: 13px; }
.approval-items {
  display: flex; flex-direction: column; gap: 6px;
  max-width: 720px;
}
.approval-item {
  display: flex; align-items: flex-start; gap: 10px;
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 8px 12px;
  font-size: 13px;
}
.approval-tool {
  font-family: var(--font-mono); font-size: 12px; font-weight: 600;
  color: var(--color-primary); background: rgba(99,102,241,0.08);
  padding: 1px 6px; border-radius: 4px; flex-shrink: 0; white-space: nowrap;
}
.approval-desc { color: var(--color-text-secondary); line-height: 1.5; }
.approval-actions {
  display: flex; gap: 8px; justify-content: flex-end;
  max-width: 720px;
}
.approval-btn-reject {
  padding: 7px 18px; font-size: 13px; font-weight: 500;
  background: transparent; color: var(--color-error);
  border: 1px solid var(--color-error); border-radius: var(--radius-md);
  cursor: pointer; transition: all 0.15s;
}
.approval-btn-reject:hover { background: rgba(239,68,68,0.06); }
.approval-btn-approve {
  padding: 7px 18px; font-size: 13px; font-weight: 500;
  background: var(--color-primary); color: #fff; border: none;
  border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s;
}
.approval-btn-approve:hover { background: var(--color-primary-hover); }

/* ── Footer ── */
.input-area {
  flex-shrink: 0;
  background: linear-gradient(to top, var(--color-surface) 70%, transparent);
  padding: 16px 16px 12px;
}
.input-area .input-wrapper { margin: 0 auto; }

.disclaimer {
  text-align: center; margin-top: 8px;
  font-size: 11px; color: var(--color-text-muted);
  max-width: 720px; margin-left: auto; margin-right: auto;
}
</style>
