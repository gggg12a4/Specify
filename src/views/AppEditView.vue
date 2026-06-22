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
      <!-- 左侧文件空间 -->
      <aside class="file-panel">
        <AppFilePanel />
      </aside>

      <!-- 主编辑区 -->
      <div class="edit-main">
        <!-- 系统提示词 -->
        <div class="field-group">
          <label class="field-label">系统提示词</label>
          <textarea
            v-model="form.system_prompt"
            class="prompt-box"
            placeholder="定义 App 的角色、行为和限制…"
            rows="8"
            @input="markDirty"
          ></textarea>
        </div>

        <!-- 工具区 -->
        <div class="field-group">
          <label class="field-label">工具</label>
          <AppToolsSection
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
        </div>

        <!-- MCP 服务区 -->
        <div class="field-group">
          <div class="field-label-row">
            <label class="field-label">MCP 服务</label>
            <button class="btn-add-mcp" @click="showAddMcp = true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              添加 MCP
            </button>
          </div>

          <div v-if="!form.mcp_services.length" class="mcp-empty">
            还没有添加 MCP 服务，点击「添加 MCP」接入外部工具
          </div>

          <div v-else class="mcp-list">
            <div v-for="mcp in form.mcp_services" :key="mcp.id" class="mcp-row">
              <label class="mcp-check">
                <input type="checkbox" :checked="mcp.enabled" @change="toggleMcp(mcp.id, $event.target.checked)" />
              </label>
              <div class="mcp-info">
                <span class="mcp-name">{{ mcp.name }}</span>
                <span class="mcp-meta">{{ mcp.tool_count || 0 }} 个工具 · {{ truncateUrl(mcp.url) }}</span>
              </div>
              <div class="mcp-btns">
                <button class="icon-btn" title="配置" @click="openMcpConfig(mcp)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
                <button class="icon-btn icon-btn-danger" title="删除" @click="removeMcp(mcp.id)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ToolInfoModal v-if="infoTool" :tool="infoTool" @close="infoTool = null" />
    <ToolConfigModal
      v-if="configTool"
      :tool="configTool"
      :config="form.tools[configTool.key]?.config || {}"
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
import { showSuccess, showConfirm } from '@/composables/useNotification'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const app = computed(() => appStore.getApp(route.params.id))
const platformLabel = computed(() => PLATFORM_LABELS[app.value?.platform] || '')

const form = reactive({
  system_prompt: '',
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
let pendingNav = null

watch(app, (a) => {
  if (!a) return
  form.system_prompt = a.system_prompt || ''
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
}

function handleSave(silent = false) {
  if (!isDirty.value) return Promise.resolve()

  return new Promise((resolve) => {
    isSaving.value = true

    // Simulate network request using async
    setTimeout(() => {
      appStore.updateApp(app.value.id, {
        system_prompt: form.system_prompt,
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
  const key = configTool.value.key
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
  overflow: hidden;
}

.file-panel {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  overflow-y: auto;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
}
.file-panel::-webkit-scrollbar {
  display: none;
}

.edit-main {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.edit-main::-webkit-scrollbar {
  display: none;
}

/* ── Fields ── */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prompt-box {
  padding: 12px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.65;
  resize: vertical;
  outline: none;
  font-family: inherit;
  min-height: 160px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.prompt-box:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

/* ── MCP ── */
.btn-add-mcp {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; font-size: 12px; font-weight: 500;
  background: transparent; color: var(--color-primary);
  border: 1px solid var(--color-primary); border-radius: var(--radius-md);
  cursor: pointer; transition: all 0.15s;
}
.btn-add-mcp:hover { background: var(--color-primary-soft); }

.mcp-empty {
  font-size: 13px; color: var(--color-text-muted); padding: 14px 12px;
  border: 1.5px dashed var(--color-border); border-radius: var(--radius-md);
  text-align: center;
}

.mcp-list { display: flex; flex-direction: column; gap: 2px; }

.mcp-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface); transition: all 0.15s;
}
.mcp-row:hover { border-color: var(--color-text-muted); }

.mcp-check input[type="checkbox"] {
  width: 15px; height: 15px; flex-shrink: 0;
  accent-color: var(--color-primary); cursor: pointer;
}

.mcp-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.mcp-name { font-size: 13px; font-weight: 600; color: var(--color-text); }
.mcp-meta { font-size: 11px; color: var(--color-text-muted); font-family: var(--font-mono); }

.mcp-btns { display: flex; gap: 2px; flex-shrink: 0; }
.icon-btn {
  width: 26px; height: 26px; border: none; background: none;
  cursor: pointer; color: var(--color-text-muted); border-radius: 6px;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.icon-btn:hover { color: var(--color-primary); background: var(--color-primary-soft); }
.icon-btn-danger:hover { color: var(--color-error) !important; background: rgba(239,68,68,0.1) !important; }

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
