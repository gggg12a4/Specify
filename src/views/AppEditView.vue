<template>
  <div class="app-edit">
    <header class="edit-bar">
      <div class="bar-left">
        <router-link to="/" class="back-btn" @click.prevent="handleBack">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </router-link>
        <div class="bar-title">
          <span class="bar-label">App 开发</span>
          <span class="bar-sep">：</span>
          <span class="bar-app">{{ app?.name }}</span>
          <span v-if="platformLabel" class="bar-platform">{{ platformLabel }}</span>
          <span v-if="isDirty" class="unsaved-dot" title="有未保存的修改"></span>
        </div>
      </div>
      <div class="bar-right">
        <button class="btn-save" :class="{ 'is-saving': isSaving }" @click="handleSave()" :disabled="!isDirty || isSaving">
          <template v-if="isSaving">
            <span class="spinner"></span>
            保存中...
          </template>
          <template v-else>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            保存修改
          </template>
        </button>
        <button class="btn-debug ml-2" @click="handleDebug">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          开始调试
        </button>
      </div>
    </header>

    <div v-if="!app" class="not-found">App 不存在或已被删除</div>

    <div v-else class="edit-layout">
      <!-- 全局失效警告条 -->
      <div v-if="hasAnyEnabledError" class="global-error-banner">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>有工具已失效，请处理后再运行 App</span>
      </div>

      <div class="edit-content">
        <!-- 左侧文件空间 -->
        <aside class="file-panel">
          <AppFilePanel ref="filePanelRef" />
        </aside>

        <!-- 主编辑区 -->
        <div class="edit-main">
          <div class="edit-container">
            <!-- 底层模型 -->
            <section class="edit-section">
              <div class="section-header">
                <div>
                  <h2 class="section-title">底层模型</h2>
                  <p class="section-desc">选择该平台（{{ platformLabel }}）下用于调试与运行的模型。</p>
                </div>
              </div>
              <AppModelSection
                :platform="app.platform || 'claude'"
                :model-value="form.model"
                @update:model-value="(v) => { form.model = v; markDirty() }"
              />
            </section>

            <!-- 系统提示词 -->
            <section class="edit-section">
              <div class="section-header">
                <div>
                  <h2 class="section-title">系统提示词</h2>
                  <p class="section-desc">定义 App 的角色、行为边界以及如何使用工作区资源。</p>
                </div>
              </div>
              <div
                class="prompt-box prompt-trigger"
                role="button"
                tabindex="0"
                @click="openPromptModal"
                @keydown.enter.prevent="openPromptModal"
                @keydown.space.prevent="openPromptModal"
              >
                <div v-if="form.system_prompt.trim()" class="prompt-preview">{{ form.system_prompt }}</div>
                <div v-else class="prompt-placeholder">定义 App 的角色、行为和限制…</div>
                <span class="prompt-open-hint">点击展开编辑</span>
              </div>
            </section>

            <!-- 工具区 -->
            <section class="edit-section">
              <div class="section-header">
                <div>
                  <h2 class="section-title">工具</h2>
                  <p class="section-desc">配置 App 可调用的平台能力、特殊工具与自定义子 Agent。</p>
                </div>
              </div>
              <AppToolsSection
                ref="toolsSectionRef"
                :tools="form.tools"
                :custom-tools="form.custom_tools"
                :special-tools="form.special_tools"
                :platform="app.platform || 'claude'"
                @update:tools="(v) => { form.tools = v; markDirty() }"
                @update:custom-tools="(v) => { form.custom_tools = v; markDirty() }"
                @update:special-tools="(v) => { form.special_tools = v; markDirty() }"
                @show-info="infoTool = $event"
                @show-config="configTool = $event"
              />
            </section>

            <!-- MCP 服务区 -->
            <section class="edit-section">
              <div class="section-header">
                <div>
                  <h2 class="section-title">外部能力接入 (MCP)</h2>
                  <p class="section-desc">为 App 挂载外部 API 和本地服务能力。</p>
                </div>
                <button class="btn btn-outline" @click="showAddMcp = true">+ 添加服务</button>
              </div>

              <div v-if="!form.mcp_services.length" class="mcp-empty">
                还没有添加 MCP 服务，点击「添加服务」接入外部工具
              </div>

              <div v-else class="card-grid">
                <div
                  v-for="mcp in form.mcp_services"
                  :key="mcp.id"
                  class="tool-card"
                  :class="{ disabled: !mcp.enabled }"
                >
                  <div class="card-top">
                    <div class="card-icon-wrap">🔌</div>
                    <button
                      type="button"
                      class="card-toggle"
                      :class="{ off: !mcp.enabled }"
                      :aria-pressed="mcp.enabled"
                      title="启用 / 禁用"
                      @click="toggleMcp(mcp.id, !mcp.enabled)"
                    >
                      <div class="card-toggle-knob"></div>
                    </button>
                  </div>
                  <div>
                    <div class="card-title">{{ mcp.name }}</div>
                    <div class="card-meta">{{ mcp.tool_count || 0 }} tools · {{ truncateUrl(mcp.url) }}</div>
                  </div>
                  <div class="card-actions">
                    <button type="button" class="action-link" @click="openMcpConfig(mcp)">配置参数</button>
                    <button type="button" class="action-link action-remove" @click="removeMcp(mcp.id)">移除</button>
                  </div>
                  <span class="tool-type-badge type-mcp">MCP工具</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>

    <ToolInfoModal v-if="infoTool" :tool="infoTool" @close="infoTool = null" />
    <ToolConfigModal
      v-if="configTool"
      :tool="configTool.tool"
      :config="form.tools[configTool.tool.key]?.config || {}"
      :disabled-rules="configTool.disabledRules"
      @save="handleToolConfigSave"
      @close="configTool = null"
    />

    <!-- MCP 弹窗 -->
    <AddMcpModal
      v-model:visible="showAddMcp"
      :app-id="app?.id"
      @created="handleMcpCreated"
    />
    <McpConfigModal
      v-if="mcpConfigTarget"
      v-model:visible="showMcpConfig"
      :app-id="app?.id"
      :mcp="mcpConfigTarget"
      @updated="handleMcpUpdated"
    />

    <SystemPromptModal
      v-model:visible="showPromptModal"
      v-model="form.system_prompt"
      :file-refs="promptFileRefs"
      :tool-refs="promptToolRefs"
      @done="markDirty"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { PLATFORM_LABELS } from '@/constants/spTools'
import AppFilePanel from '@/components/app/AppFilePanel.vue'
import AppToolsSection from '@/components/app/AppToolsSection.vue'
import ToolInfoModal from '@/components/app/ToolInfoModal.vue'
import ToolConfigModal from '@/components/app/ToolConfigModal.vue'
import AddMcpModal from '@/components/app/AddMcpModal.vue'
import McpConfigModal from '@/components/app/McpConfigModal.vue'
import SystemPromptModal from '@/components/app/SystemPromptModal.vue'
import AppModelSection from '@/components/app/AppModelSection.vue'
import { SP_TOOLS } from '@/constants/spTools'
import { resolveAppModel, getDefaultModelForPlatform } from '@/constants/platformModels'
import { showSuccess, showConfirm } from '@/composables/useNotification'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const app = computed(() => appStore.getApp(route.params.id))
const platformLabel = computed(() => PLATFORM_LABELS[app.value?.platform] || '')

const toolsSectionRef = ref(null)
const filePanelRef = ref(null)

const form = reactive({
  system_prompt: '',
  model: '',
  tools: {},
  custom_tools: [],
  special_tools: {},
  mcp_services: [],
})
const infoTool = ref(null)
const configTool = ref(null)
const isDirty = ref(false)
const isSaving = ref(false)
const showLeaveConfirm = ref(false)
const showAddMcp = ref(false)
const showMcpConfig = ref(false)
const mcpConfigTarget = ref(null)
const showPromptModal = ref(false)
const hasAnyEnabledError = ref(false)
let pendingNav = null

const promptFileRefs = computed(() => {
  return filePanelRef.value?.getMentionFileItems?.() ?? [
    { label: 'shared / 核心知识库', value: 'shared/', kind: 'folder' },
    { label: 'mailbox / 用户传递', value: 'mailbox/', kind: 'folder' },
    { label: 'workspace / 工作目录', value: 'workspace/', kind: 'folder' },
    { label: 'assets / 用户上传', value: 'assets/', kind: 'folder' },
    { label: 'memory / 长期记忆', value: 'memory/', kind: 'folder' },
  ]
})

const promptToolRefs = computed(() => {
  const items = []

  for (const tool of SP_TOOLS) {
    if (form.tools[tool.key]?.enabled) {
      items.push({ label: tool.name, value: tool.key, desc: tool.desc, kind: 'tool' })
    }
  }

  for (const [key, cfg] of Object.entries(form.special_tools || {})) {
    if (cfg?.enabled) {
      items.push({ label: key, value: key, kind: 'tool' })
    }
  }

  for (const tool of form.custom_tools || []) {
    if (tool.enabled !== false) {
      items.push({ label: tool.name, value: tool.name, desc: tool.description, kind: 'tool' })
    }
  }

  return items
})

function openPromptModal() {
  showPromptModal.value = true
}

watch(app, (a) => {
  if (!a) return
  form.system_prompt = a.system_prompt || ''
  form.model = resolveAppModel(a)
  form.tools = JSON.parse(JSON.stringify(a.tools || {}))
  form.custom_tools = JSON.parse(JSON.stringify(a.custom_tools || []))
  form.special_tools = JSON.parse(JSON.stringify(a.special_tools || {}))
  form.mcp_services = JSON.parse(JSON.stringify(a.mcp_services || []))
  isDirty.value = false
}, { immediate: true })

watch(() => form, () => {
  if (!app.value) return // Don't trigger save on initial load if app is not ready
  isDirty.value = true
}, { deep: true })

function markDirty() {
  isDirty.value = true
  checkGlobalErrors()
}

function checkGlobalErrors() {
  if (toolsSectionRef.value) {
    const errors = toolsSectionRef.value.checkEnabledToolsErrors()
    hasAnyEnabledError.value = errors && errors.length > 0
  }
}

// Watch for changes that might affect error state
watch(() => [form.tools, form.special_tools, form.custom_tools], () => {
  // Use setTimeout to ensure DOM is updated and checkEnabledToolsErrors gets latest data
  setTimeout(checkGlobalErrors, 150)
}, { deep: true })

function handleSave(silent = false) {
  if (!isDirty.value) return Promise.resolve()

  return new Promise((resolve) => {
    isSaving.value = true

    // Simulate network request using async
    setTimeout(() => {
      appStore.updateApp(app.value.id, {
        system_prompt: form.system_prompt,
        model: form.model || getDefaultModelForPlatform(app.value.platform),
        tools: form.tools,
        custom_tools: form.custom_tools,
        special_tools: form.special_tools,
        mcp_services: form.mcp_services,
      })
      isDirty.value = false
      isSaving.value = false
      if (!silent) {
        showSuccess('保存成功')
      }
      resolve()
    }, 300) // Small delay to show the saving animation
  })
}

function handleToolConfigSave(config) {
  const key = configTool.value.tool.key
  form.tools = { ...form.tools, [key]: { ...form.tools[key], config } }
  configTool.value = null
  markDirty()
}

// ── MCP helpers ──────────────────────────────────────────────────────────────
function toggleMcp(id, enabled) {
  form.mcp_services = form.mcp_services.map(m => m.id === id ? { ...m, enabled } : m)
  markDirty()
}

function truncateUrl(url) {
  if (!url) return ''
  try {
    const u = new URL(url)
    return u.hostname + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url.length > 30 ? url.slice(0, 30) + '…' : url
  }
}

function openMcpConfig(mcp) {
  mcpConfigTarget.value = mcp
  showMcpConfig.value = true
}

function handleMcpCreated(mcp) {
  form.mcp_services = [...form.mcp_services, mcp]
  markDirty()
}

function handleMcpUpdated(updated) {
  form.mcp_services = form.mcp_services.map(m => m.id === updated.id ? updated : m)
  markDirty()
}

function removeMcp(id) {
  if (!confirm('确认删除此 MCP 服务？')) return
  form.mcp_services = form.mcp_services.filter(m => m.id !== id)
  markDirty()
}

// ── Navigation guards ────────────────────────────────────────────────────────
function handleBack() {
  router.push('/workspace')
}

async function handleDebug() {
  if (toolsSectionRef.value) {
    const errors = toolsSectionRef.value.checkEnabledToolsErrors()
    if (errors && errors.length > 0) {
      const msg = `发现以下启用的工具存在异常：\n\n${errors.map(e => `• ${e}`).join('\n')}\n\n是否继续调试？（异常功能将不可用）`
      const isConfirmed = await showConfirm({
        title: '⚠️ 运行时异常拦截',
        message: msg,
        confirmText: '继续调试',
        cancelText: '取消',
        danger: true
      })
      if (!isConfirmed) return // 用户取消，阻断进入调试
    }
  }

  if (isDirty.value) {
    // 方案 A: 发现有未保存修改，先静默执行保存
    await handleSave(true)
  }
  // 跳转到运行/调试页面 (AppDevRun 是带开发者视图侧边栏的运行页，或者是 AppRun，取决于你的路由设计。按照文档，从开发页面去运行应该是 AppRunView。如果是专门的调试模式，可能带 query 参数)
  router.push({ name: 'AppDevRun', params: { id: app.value.id }, query: { mode: 'debug' } })
}

// remove cancelLeave and confirmLeave as they're no longer used


onBeforeRouteLeave(async (to, from, next) => {
  if (isDirty.value) {
    const isConfirmed = await showConfirm({
      title: '未保存的修改',
      message: '有未保存的修改，确定要离开吗？未保存的修改将丢失。',
      confirmText: '离开',
      cancelText: '取消',
      danger: true
    })

    if (isConfirmed) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})
</script>

<style scoped>
.app-edit {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

/* ── Top bar ── */
.edit-bar {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all 0.15s;
  cursor: pointer;
}
.back-btn:hover {
  color: var(--color-text);
  border-color: var(--color-text-muted);
  background: var(--color-bg-secondary);
}

.bar-title {
  display: flex;
  align-items: center;
  gap: 4px;
}
.bar-label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
}
.bar-sep {
  font-size: 13px;
  color: var(--color-text-muted);
}
.bar-app {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}
.bar-platform {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  margin-left: 4px;
}
.unsaved-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-warning, #f59e0b);
  margin-left: 4px;
  flex-shrink: 0;
}

.bar-right {
  display: flex;
  align-items: center;
}

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-debug {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-success, #10b981);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-debug:hover {
  background: #059669; /* slightly darker green */
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.ml-2 {
  margin-left: 8px;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0,0,0,0.1);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 15px;
  color: var(--color-text-secondary);
}

/* ── Layout ── */
.edit-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.global-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 24px;
  background: #fefce8;
  color: #854d0e;
  font-size: 13px;
  font-weight: 400;
  flex-shrink: 0;
}
.global-error-banner svg {
  color: #ca8a04;
  flex-shrink: 0;
}

.edit-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.file-panel {
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 1px 0 2px rgba(0, 0, 0, 0.02);
  z-index: 5;
}
.file-panel::-webkit-scrollbar {
  display: none;
}

.edit-main {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 40px;
  background: var(--color-bg);
}
.edit-main::-webkit-scrollbar {
  display: none;
}

.edit-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.edit-section {
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
  gap: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.02em;
  margin: 0;
}

.section-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 4px 0 0;
  line-height: 1.5;
}

/* ── Prompt ── */
.prompt-box {
  width: 100%;
  min-height: 180px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.prompt-box:focus-visible {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px #dbeafe;
}

.prompt-trigger {
  position: relative;
  cursor: pointer;
  min-height: 180px;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.prompt-trigger:hover {
  border-color: #cbd5e1;
  background: #fafafa;
}

.prompt-preview {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text);
  max-height: 220px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 8;
  line-clamp: 8;
  -webkit-box-orient: vertical;
}

.prompt-placeholder {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.prompt-open-hint {
  position: absolute;
  right: 14px;
  bottom: 12px;
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0;
  transition: opacity 0.15s;
}

.prompt-trigger:hover .prompt-open-hint,
.prompt-trigger:focus-visible .prompt-open-hint {
  opacity: 1;
}

/* ── Buttons (sketch style) ── */
.btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.btn-outline {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.btn-outline:hover {
  border-color: var(--color-text-muted);
  background: var(--color-bg-secondary);
}

/* ── MCP cards ── */
.mcp-empty {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 24px 20px;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  text-align: center;
  background: var(--color-surface);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.tool-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.tool-type-badge {
  margin-top: auto;
  padding-top: 4px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
  align-self: flex-start;
  letter-spacing: 0.02em;
}
.tool-type-badge.type-mcp {
  color: #059669;
}
.tool-card:hover {
  border-color: var(--color-text-muted);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
.tool-card.disabled {
  background: var(--color-bg);
  border-style: dashed;
  box-shadow: none;
}
.tool-card.disabled:hover {
  transform: none;
}
.tool-card.disabled .card-title {
  color: var(--color-text-muted);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.tool-card.disabled .card-icon-wrap {
  opacity: 0.5;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.card-meta {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: var(--font-mono, monospace);
  margin-top: 6px;
}

.card-toggle {
  width: 36px;
  height: 20px;
  background: var(--color-text);
  border: none;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  padding: 0;
}
.card-toggle.off {
  background: var(--color-border);
}
.card-toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(16px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}
.card-toggle.off .card-toggle-knob {
  transform: translateX(0);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.action-link {
  font-size: 12px;
  color: var(--color-text-muted);
  background: none;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s;
  padding: 0;
}
.action-link:hover {
  color: var(--color-text);
}
.action-remove:hover {
  color: var(--color-error, #ef4444);
}

/* ── Confirm dialog ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}
.confirm-dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%;
  max-width: 360px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.confirm-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}
.confirm-body {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}
.btn-ghost {
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}
.btn-danger-sm {
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-error);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-danger-sm:hover {
  opacity: 0.88;
}
</style>
