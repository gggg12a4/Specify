<template>
  <div class="app-edit">
    <header class="edit-bar">
      <div class="bar-left">
        <router-link to="/developer/workspace" class="brand">
          <span class="brand-mark">S</span>
          <span class="brand-name">Specify</span>
        </router-link>
        <span class="dev-badge">DEV</span>
        <span class="bar-divider" aria-hidden="true" />

        <button type="button" class="back-btn" aria-label="返回工作空间" @click="handleBack">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div class="bar-app-wrap">
          <h1 class="bar-app-name">{{ app?.name || 'App' }}</h1>
          <button
            v-if="app"
            type="button"
            class="bar-app-edit"
            aria-label="编辑 App 名称与描述"
            title="编辑 App 信息"
            @click="showMetaEditModal = true"
          >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
        </div>

        <div v-if="platformLabel" class="bar-platform">
          <span class="bar-platform-deco" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="12" cy="12" r="2.5" />
                </svg>
              </span>
          <span class="bar-platform-prefix">平台:</span>
          <strong class="bar-platform-name">{{ platformLabel }}</strong>
          <button type="button" class="bar-switch-link" @click="openPlatformSwitch">切换</button>
          </div>

        <div v-if="releaseMeta" class="version-select-wrap">
          <select v-model="versionView" class="version-select">
            <option value="draft">草稿(当前编辑)</option>
            <option v-if="releaseMeta.isPublished" value="live">
              {{ releaseMeta.liveVersionNumber != null ? `v${releaseMeta.liveVersionNumber} 线上` : '已发布' }}
            </option>
          </select>
        </div>
      </div>

      <div class="bar-right">
        <span v-if="isSaving" class="save-status saving">保存中…</span>
        <span v-else-if="!isDirty || showAutoSavedHint" class="save-status saved">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
            </svg>
          已保存
        </span>
        <span v-else-if="autoSavePending" class="save-status pending">{{ autoSaveCountdown }}s 后自动保存</span>

        <button
          type="button"
          class="btn-save-debug"
          :disabled="isSaving"
          @click="handleSaveAndDebug"
        >
          保存为草稿去调试
        </button>

        <span class="bar-divider" aria-hidden="true" />

        <button type="button" class="header-link" @click="openGlobalApiConfig">我的模型</button>
        <span class="header-phone">{{ maskedPhone }}</span>
        <button type="button" class="header-link logout" @click="handleLogout">退出登录</button>
      </div>
    </header>

    <div v-if="pageLoading" class="not-found">加载中…</div>
    <div v-else-if="pageError" class="not-found">{{ pageError }}</div>
    <div v-else-if="!app" class="not-found">App 不存在或已被删除</div>

    <div v-else class="edit-layout">
      <!-- 全局失效警告条 -->
      <div v-if="hasAnyEnabledError" class="global-error-banner">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>有工具已失效，请处理后再运行 App</span>
      </div>

      <div class="edit-content">
        <!-- 左侧文件空间 -->
        <aside class="file-panel" :class="{ 'is-collapsed': filePanelCollapsed }">
          <button
            type="button"
            class="file-panel-toggle"
            :title="filePanelCollapsed ? '展开文件栏' : '收起文件栏'"
            :aria-label="filePanelCollapsed ? '展开文件栏' : '收起文件栏'"
            :aria-expanded="!filePanelCollapsed"
            @click="filePanelCollapsed = !filePanelCollapsed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline v-if="filePanelCollapsed" points="9 18 15 12 9 6" />
              <polyline v-else points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div v-show="!filePanelCollapsed" class="file-panel-body">
            <AppFilePanel ref="filePanelRef" :app-name="app?.name || ''" />
          </div>
        </aside>

        <!-- 主编辑区 -->
        <div class="edit-main">
          <div class="edit-container">
            <header class="edit-page-head">
              <div class="page-breadcrumb">app / config / 草稿</div>
              <div class="page-title-row">
                <h1 class="page-title">{{ app.name }}</h1>
                <span class="page-tag">{{ pageStatusLabel }}</span>
                <span class="page-tag muted">当前编辑</span>
                </div>
              <p class="page-desc">
                配置主模型、系统提示词与推荐工具。左侧 shared/ 空间里面的文件与技能将在运行时注入。
              </p>
            </header>

            <!-- 主模型 -->
            <section class="edit-section">
              <h2 class="section-label">
                主模型 <span class="section-label-en">MODEL</span>
              </h2>
              <AppModelSection
                variant="compact"
                :platform="form.platform || 'claude'"
                :model-value="form.model"
                :available-models="editModels"
                @update:model-value="(v) => { form.model = v; markDirty() }"
              />
            </section>

            <!-- 系统提示词 -->
            <section class="edit-section prompt-section">
              <h2 class="section-label">
                系统提示词 <span class="section-label-en">PROMPT</span>
              </h2>
              <div
                class="prompt-row"
                role="button"
                tabindex="0"
                @click="openPromptModal"
                @keydown.enter.prevent="openPromptModal"
                @keydown.space.prevent="openPromptModal"
              >
                <div class="prompt-row-main">
                  <span class="prompt-row-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path d="M153.6 768h716.8a51.2 51.2 0 0 1 0 102.4H153.6a51.2 51.2 0 0 1 0-102.4zM153.6 153.6h716.8a51.2 51.2 0 0 1 0 102.4H153.6a51.2 51.2 0 0 1 0-102.4z m0 307.2h409.6a51.2 51.2 0 0 1 0 102.4H153.6a51.2 51.2 0 0 1 0-102.4z" fill="currentColor" />
                    </svg>
                  </span>
                  <span class="prompt-row-label">{{ promptRowLabel }}</span>
                </div>
                <span class="prompt-expand-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                  展开编辑
                </span>
              </div>
            </section>

            <!-- 推荐工具 -->
            <section class="edit-section tools-edit-section">
              <div class="tools-section-head">
                <h2 class="section-label">
                  推荐工具 <span class="section-label-en">TOOLS</span>
                </h2>
              </div>
              <AppToolsSection
                ref="toolsSectionRef"
                :tools="form.tools"
                :custom-tools="form.custom_tools"
                :special-tools="form.special_tools"
                :platform-mcp="form.platform_mcp"
                :platform="form.platform || 'claude'"
                :platform-tool-defs="platformToolDefs"
                @update:tools="(v) => { form.tools = v; markDirty() }"
                @update:special-tools="(v) => { form.special_tools = v; markDirty() }"
                @update:platform-mcp="(v) => { form.platform_mcp = v; markDirty() }"
                @show-info="infoTool = $event"
                @show-config="configTool = $event"
              />
            </section>

            <!-- MCP 服务区：仅开发者自建 MCP -->
            <section class="edit-section mcp-edit-section">
              <div class="tools-section-head">
                <h2 class="section-label">
                  服务 <span class="section-label-en">MCP</span>
                </h2>
                <button type="button" class="btn-section-link" @click="showAddMcp = true">
                  + 添加 MCP
                </button>
              </div>

              <div v-if="!form.mcp_services.length" class="mcp-empty">
                连接外部服务(如 GitHub、Notion)。点「添加 MCP」配置端点与凭证。
              </div>

              <div v-else class="mcp-card-grid">
                  <div
                    v-for="mcp in form.mcp_services"
                    :key="mcp.id"
                    class="mcp-card"
                    :class="{ 'is-off': !mcp.enabled }"
                  >
                    <div class="mcp-card-row">
                      <div class="mcp-card-info">
                        <div class="mcp-card-title">{{ mcp.name }}</div>
                        <div v-if="mcp.url" class="mcp-card-meta">
                          <span class="mcp-url" :title="mcp.url">{{ mcp.url }}</span>
                        </div>
                      </div>
                      <div class="mcp-card-controls">
                        <ToolConfigBtn title="配置参数" @click="openMcpConfig(mcp)" />
                        <button
                          type="button"
                          class="mcp-remove-btn"
                          title="移除"
                          @click="removeMcp(mcp.id)"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
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
                    </div>
                    <span class="tool-type-badge type-mcp">MCP工具</span>
                  </div>
              </div>
            </section>

            <!-- 你创建的工具 AGENTS -->
            <section class="edit-section">
              <AppCustomAgentsSection
                :custom-tools="form.custom_tools"
                :tools="form.tools"
                :special-tools="form.special_tools"
                :platform="form.platform || 'claude'"
                :app-name="app?.name || ''"
                :platform-tool-defs="platformToolDefs"
                :file-refs="promptFileRefs"
                :tool-refs="promptToolRefs"
                @update:custom-tools="(v) => { form.custom_tools = v; markDirty() }"
              />
            </section>
          </div>
        </div>
      </div>
    </div>

    <ToolInfoModal v-if="infoTool" :tool="infoTool" @close="infoTool = null" />
    <ToolConfigModal
      v-if="configTool"
      :tool="configTool.tool"
      :config="toolConfigValue"
      :disabled-rules="configTool.disabledRules"
      :model-group-id="form.modelGroupId"
      @save="handleToolConfigSave"
      @close="configTool = null"
    />

    <!-- MCP 弹窗 -->
    <AddMcpModal
      v-model:visible="showAddMcp"
      :app-id="app?.id"
      :templates="createableMcpTemplates"
      template-key="MCPServerStreamable"
      @created="handleMcpCreated"
    />
    <McpConfigModal
      v-if="mcpConfigTarget"
      v-model:visible="showMcpConfig"
      :app-id="app?.id"
      :mcp="mcpConfigTarget"
      :templates="createableMcpTemplates"
      @updated="handleMcpUpdated"
    />

    <SystemPromptModal v-model:visible="showPromptModal" v-model="form.system_prompt" :file-refs="promptFileRefs"
      :tool-refs="promptToolRefs" @done="markDirty" />

    <AppPlatformModal
      v-model:visible="showPlatformModal"
      :model-value="form.platform"
      :app-name="app?.name || ''"
      :current-model="form.model"
      @select="handlePlatformChange"
      @back="openPlatformSwitch"
    />

    <AppMetaEditModal v-if="app" v-model:visible="showMetaEditModal" :name="app.name"
      :description="app.description || ''" @save="handleMetaSave" />
  </div>
</template>

<script setup>
/**
 * App 开发编辑页（/developer/app/:id/edit）。
 *
 * 左侧为工作区文件面板，右侧编辑模型、系统提示词、工具与 MCP 服务。
 * form 为本地草稿，通过 isDirty 跟踪未保存修改；修改后 3 秒自动保存。
 * 调试入口会先校验已启用工具的失效状态，必要时静默保存后再跳转运行页。
 */
import { ref, reactive, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { PLATFORM_LABELS } from '@/constants/spTools'
import AppFilePanel from '@/components/app/AppFilePanel.vue'
import AppToolsSection from '@/components/app/AppToolsSection.vue'
import AppCustomAgentsSection from '@/components/app/AppCustomAgentsSection.vue'
import ToolInfoModal from '@/components/app/ToolInfoModal.vue'
import ToolConfigModal from '@/components/app/ToolConfigModal.vue'
import AddMcpModal from '@/components/app/AddMcpModal.vue'
import McpConfigModal from '@/components/app/McpConfigModal.vue'
import ToolConfigBtn from '@/components/app/ToolConfigBtn.vue'
import SystemPromptModal from '@/components/app/SystemPromptModal.vue'
import AppModelSection from '@/components/app/AppModelSection.vue'
import AppPlatformModal from '@/components/app/AppPlatformModal.vue'
import AppMetaEditModal from '@/components/app/AppMetaEditModal.vue'
import { API_CONFIG_MODAL_KEY } from '@/composables/useApiConfigModal'
import { useApiConfig } from '@/composables/useApiConfig'
import {
  applyPlatformMigration,
  PLATFORM_SWITCH_CONFIRM_MESSAGE,
} from '@/utils/platformMigration'
import { showSuccess, showConfirm, showError } from '@/composables/useNotification'
import { platformKeyToModelGroupId, resolveAppPublishStatus } from '@/utils/appAdapter'
import { getModelsForPlatform } from '@/constants/platformModels'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const { hasKeyForPlatform, hasKeyForApp } = useApiConfig()
const apiConfigModal = inject(API_CONFIG_MODAL_KEY, null)
/** 从路由 id 获取当前编辑的 App */
const app = computed(() => appStore.getApp(route.params.id))
/** 编辑页会话（含 models / draft / templates 等） */
const editSession = computed(() => appStore.getEditSession(route.params.id))
/** 推荐工具目录（基础工具 + Agent + 平台 MCP） */
const platformToolDefs = computed(() => editSession.value?.platformToolDefs || [])
/** 可创建 MCP 模板（createable，默认 MCPServerStreamable） */
const createableMcpTemplates = computed(() => editSession.value?.createableMcpTemplates || {})
/**
 * 主模型下拉选项。
 * 暂时使用前端写死的 PLATFORM_MODELS（按当前平台过滤）；
 * 编辑页接口 result.models 后续再切换接入。
 */
const editModels = computed(() => getModelsForPlatform(form.platform || 'claude'))

/** 发布/分享相关元数据 */
const releaseMeta = computed(() => {
  const session = editSession.value
  if (!session?.meta) return null
  const meta = session.meta
  const draft = session.draft || {}
  const versions = draft.versions || []
  const liveVersionId = meta.liveVersionId || ''
  const liveVersion = versions.find(v => (v.id || v.version_id || v.versionId) === liveVersionId)
  const liveVersionNumber = liveVersion?.version_number ?? liveVersion?.versionNumber ?? null
  const isPublished = !!liveVersionId
  const isPendingConfig = !!meta.isPendingConfig
  const serverHasDraft = !!draft.hasDraft
  const hasPendingDraft = serverHasDraft || isDirty.value
  const publishStatus = resolveAppPublishStatus({
    liveVersionId,
    isPendingConfig,
    hasDraft: hasPendingDraft,
  })

  return {
    isPublished,
    isPendingConfig,
    liveVersionId,
    liveVersionNumber,
    serverHasDraft,
    hasDraft: hasPendingDraft,
    isPublic: meta.isPublic,
    shareCode: meta.shareCode || '',
    draftUpdatedAt: draft.draftUpdatedAt || '',
    versions,
    publishLabel: isPublished
      ? (liveVersionNumber != null ? `v${liveVersionNumber} 线上` : '已发布')
      : publishStatus.label,
    publishBadgeClass: isPublished ? 'badge-live' : publishStatus.badgeClass,
    liveLabel: isPublished
      ? (liveVersionNumber != null ? `v${liveVersionNumber} 线上` : '已发布')
      : publishStatus.label,
  }
})

const pageLoading = ref(true)
const pageError = ref('')
/** 平台中文展示名 */
const platformLabel = computed(() => PLATFORM_LABELS[form.platform] || '')

const toolsSectionRef = ref(null)
const filePanelRef = ref(null)
const filePanelCollapsed = ref(false)
const showPlatformModal = ref(false)
const showMetaEditModal = ref(false)
const versionView = ref('draft')

const pageStatusLabel = computed(() => {
  if (!releaseMeta.value) return '草稿'
  if (releaseMeta.value.isPublished && releaseMeta.value.publishLabel.includes('线上')) {
    return releaseMeta.value.publishLabel
  }
  return releaseMeta.value.publishLabel || '草稿'
})

const maskedPhone = computed(() => {
  const phone = authStore.currentUser?.phone || authStore.currentUser?.nickname || ''
  const s = String(phone)
  if (s.length >= 7) return s.slice(0, 3) + '****' + s.slice(-4)
  return s
})

const form = reactive({
  platform: 'claude',
  modelGroupId: '',
  credential_id: null,
  system_prompt: '',
  model: '',
  tools: {},
  custom_tools: [],
  special_tools: {},
  platform_mcp: {},
  mcp_services: [],
})
const infoTool = ref(null)
const configTool = ref(null)
const isDirty = ref(false)

const toolConfigValue = computed(() => {
  if (!configTool.value?.tool?.key) return {}
  const key = configTool.value.tool.key
  if (configTool.value._platformMcp) return form.platform_mcp[key]?.config || {}
  const def = platformToolDefs.value.find(t => t.key === key)
  if (def?.category === 'agent' || configTool.value._agentTool) {
    return form.special_tools[key]?.config || {}
  }
  return form.tools[key]?.config || {}
})
const isSaving = ref(false)
const showLeaveConfirm = ref(false)
const showAddMcp = ref(false)
const showMcpConfig = ref(false)
const mcpConfigTarget = ref(null)
const showPromptModal = ref(false)
const pendingDebug = ref(false)
const hasAnyEnabledError = ref(false)
let pendingNav = null

const AUTO_SAVE_SECONDS = 3
const AUTO_SAVE_DELAY_MS = AUTO_SAVE_SECONDS * 1000
let autoSaveTimer = null
let autoSaveCountdownTimer = null
let autoSavedHintTimer = null
let suppressDirtyUntil = 0

const autoSavePending = ref(false)
const autoSaveCountdown = ref(0)
const showAutoSavedHint = ref(false)

function clearAutoSaveTimer() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
  if (autoSaveCountdownTimer) {
    clearInterval(autoSaveCountdownTimer)
    autoSaveCountdownTimer = null
  }
  autoSavePending.value = false
  autoSaveCountdown.value = 0
}

function flashAutoSavedHint() {
  showAutoSavedHint.value = true
  if (autoSavedHintTimer) clearTimeout(autoSavedHintTimer)
  autoSavedHintTimer = setTimeout(() => {
    showAutoSavedHint.value = false
    autoSavedHintTimer = null
  }, 2000)
}

/** 有未保存修改时，3 秒后静默自动保存 */
function scheduleAutoSave() {
  clearAutoSaveTimer()
  if (!app.value || !isDirty.value || isSaving.value) return

  autoSavePending.value = true
  autoSaveCountdown.value = AUTO_SAVE_SECONDS

  autoSaveCountdownTimer = setInterval(() => {
    if (autoSaveCountdown.value > 1) {
      autoSaveCountdown.value -= 1
    }
  }, 1000)

  autoSaveTimer = setTimeout(async () => {
    autoSaveTimer = null
    clearAutoSaveTimer()
    if (!isDirty.value || isSaving.value) return
    await handleSave(true, { auto: true })
  }, AUTO_SAVE_DELAY_MS)
}

/** 系统提示词 @ 引用：合并面板内真实路径与用户网盘虚拟路径 */
const promptFileRefs = computed(() => {
  return filePanelRef.value?.getMentionFileItems?.() ?? [
    { label: 'shared / 核心知识库', value: 'shared/', kind: 'folder' },
    { label: 'mailbox / 用户传递', value: 'mailbox/', kind: 'folder' },
    { label: 'workspace / 工作目录', value: 'workspace/', kind: 'folder' },
    { label: 'assets / 用户上传', value: 'assets/', kind: 'folder' },
    { label: 'memory / 长期记忆', value: 'memory/', kind: 'folder' },
  ]
})

/** 系统提示词 @ 引用：仅包含当前已启用的平台/特殊/自定义工具 */
const promptToolRefs = computed(() => {
  const items = []

  for (const tool of platformToolDefs.value) {
    const enabled = tool.category === 'mcp' || tool.kind === 'mcp'
      ? !!form.platform_mcp[tool.key]?.enabled
      : tool.category === 'agent' || tool.kind === 'special'
        ? !!form.special_tools[tool.key]?.enabled
        : !!form.tools[tool.key]?.enabled
    if (!enabled) continue
    items.push({
      label: tool.name,
      value: tool.key,
      desc: tool.desc,
      kind: 'tool',
    })
  }

  for (const tool of form.custom_tools || []) {
    if (tool.enabled !== false) {
      items.push({ label: tool.name, value: tool.name, desc: tool.description, kind: 'tool' })
    }
  }

  return items
})

/** 保存 App 名称与描述（走独立 API，不写入草稿） */
async function handleMetaSave({ name, description }) {
  try {
    await appStore.updateMeta(app.value.id, { name, description })
  showSuccess('App 信息已更新')
  } catch (err) {
    showError(err.message || '更新 App 信息失败')
  }
}

/** 打开全局 API 密钥配置，并带上当前 App 选用上下文 */
function openAppApiConfig() {
  if (!app.value || !apiConfigModal) return
  apiConfigModal.open({
    appContext: {
      appId: app.value.id,
      appName: app.value.name,
      platform: form.platform,
      credentialId: form.credential_id,
      onSelect: (credentialId) => {
        form.credential_id = credentialId
        markDirty()
        if (pendingDebug.value) {
          pendingDebug.value = false
          proceedDebug()
        }
      },
    },
  })
}

/** 点击「切换」：先弹出影响说明，确认后再打开平台选择 */
async function openPlatformSwitch() {
  const confirmed = await showConfirm({
    title: '切换平台',
    message: PLATFORM_SWITCH_CONFIRM_MESSAGE,
    confirmText: '确认切换',
    cancelText: '取消',
  })
  if (confirmed) {
    showPlatformModal.value = true
  }
}

/** 在平台弹窗中选中新平台后执行迁移 */
async function handlePlatformChange(newPlatform) {
  if (newPlatform === form.platform) {
    showPlatformModal.value = false
    return
  }

  showPlatformModal.value = false
  applyPlatformMigration(form, newPlatform)
  form.modelGroupId = platformKeyToModelGroupId(newPlatform, appStore.modelGroups)
  markDirty()
  checkGlobalErrors()
}

/** 打开系统提示词全屏编辑弹窗 */
function openPromptModal() {
  showPromptModal.value = true
}

/** 紧凑行展示：空时为 # Role，有内容时取首行 */
const promptRowLabel = computed(() => {
  const text = form.system_prompt.trim()
  if (!text) return '# Role'
  const firstLine = text.split('\n').map((line) => line.trim()).find(Boolean)
  return firstLine || '# Role'
})

/** 从编辑会话填充 form */
function applyEditSession(session) {
  if (!session) return
  suppressDirtyUntil = Date.now() + 100
  clearAutoSaveTimer()
  showAutoSavedHint.value = false
  showPlatformModal.value = false

  const a = session.form
  form.system_prompt = a.system_prompt || ''
  form.platform = a.platform || 'claude'
  form.modelGroupId = a.modelGroupId || session.meta?.modelGroupId || ''
  form.credential_id = a.credential_id ?? null
  // 写死模型列表阶段：仅保留当前平台 mock 列表中存在的模型 id
  const platformModels = getModelsForPlatform(form.platform)
  const incomingModel = a.model || ''
  form.model = platformModels.some(m => m.id === incomingModel) ? incomingModel : ''
  form.tools = JSON.parse(JSON.stringify(a.tools || {}))
  form.custom_tools = JSON.parse(JSON.stringify(a.custom_tools || []))
  form.special_tools = JSON.parse(JSON.stringify(a.special_tools || {}))
  form.platform_mcp = JSON.parse(JSON.stringify(a.platform_mcp || {}))
  form.mcp_services = JSON.parse(JSON.stringify(a.mcp_services || []))
  isDirty.value = false
}

async function loadEditPage(appId) {
  pageLoading.value = true
  pageError.value = ''
  try {
    await appStore.fetchModelGroups()
    const session = await appStore.fetchEditPage(appId)
    applyEditSession(session)
  } catch (err) {
    pageError.value = err.message || '加载编辑页失败'
  } finally {
    pageLoading.value = false
  }
}

onMounted(() => {
  if (route.params.id) {
    loadEditPage(route.params.id)
  }
})

watch(() => route.params.id, (id) => {
  if (id) loadEditPage(id)
})

/** App 数据加载后：深拷贝到 form 并重置 isDirty（兼容 editSession 更新） */
watch(editSession, (session) => {
  if (!session || pageLoading.value) return
  applyEditSession(session)
}, { immediate: false })

/** form 任意字段变更时标记为未保存（跳过 App 尚未就绪的初始阶段） */
watch(() => form, () => {
  if (!app.value || Date.now() < suppressDirtyUntil) return
  isDirty.value = true
  scheduleAutoSave()
}, { deep: true })

/** 标记草稿已修改，并刷新顶部「工具失效」警告条 */
function markDirty() {
  if (!app.value || Date.now() < suppressDirtyUntil) return
  isDirty.value = true
  checkGlobalErrors()
  scheduleAutoSave()
}

/** 调用子组件检查已启用工具的失效项，更新 hasAnyEnabledError */
function checkGlobalErrors() {
  if (toolsSectionRef.value) {
    const errors = toolsSectionRef.value.checkEnabledToolsErrors()
    hasAnyEnabledError.value = errors && errors.length > 0
  }
}

/** 工具配置变更后延迟复检，等待子组件 DOM 更新完成 */
watch(() => [form.tools, form.special_tools, form.custom_tools], () => {
  // Use setTimeout to ensure DOM is updated and checkEnabledToolsErrors gets latest data
  setTimeout(checkGlobalErrors, 150)
}, { deep: true })

/** 将 form 保存到后端草稿；silent 为 true 时不弹成功提示 */
async function handleSave(silent = false, options = {}) {
  if (!isDirty.value || !app.value) return Promise.resolve()

  clearAutoSaveTimer()
    isSaving.value = true

  try {
    await appStore.saveDraft(app.value.id, { ...form })
      isDirty.value = false
      if (options.auto) {
        flashAutoSavedHint()
      } else if (!silent) {
        showSuccess('保存成功')
      }
  } catch (err) {
    if (!silent) {
      showError(err.message || '保存失败')
    }
    throw err
  } finally {
    isSaving.value = false
  }
}

onUnmounted(() => {
  clearAutoSaveTimer()
  if (autoSavedHintTimer) clearTimeout(autoSavedHintTimer)
})

/** 保存平台工具 / 平台 MCP 参数配置 */
function handleToolConfigSave(config) {
  const key = configTool.value.tool.key
  const def = platformToolDefs.value.find(t => t.key === key)
  const isPlatformMcp = !!configTool.value._platformMcp
  const isAgent = !!configTool.value._agentTool || def?.category === 'agent'

  if (isPlatformMcp) {
    form.platform_mcp = {
      ...form.platform_mcp,
      [key]: {
        ...(form.platform_mcp[key] || {}),
        enabled: form.platform_mcp[key]?.enabled ?? false,
        config,
      },
    }
  } else if (isAgent) {
    form.special_tools = {
      ...form.special_tools,
      [key]: {
        ...(form.special_tools[key] || {}),
        enabled: form.special_tools[key]?.enabled ?? false,
        config,
      },
    }
  } else {
    form.tools = { ...form.tools, [key]: { ...form.tools[key], config } }
  }
  configTool.value = null
  markDirty()
}

// ── MCP helpers ──────────────────────────────────────────────────────────────
/** 切换 MCP 服务的启用/禁用状态 */
function toggleMcp(id, enabled) {
  form.mcp_services = form.mcp_services.map(m => m.id === id ? { ...m, enabled } : m)
  markDirty()
}

/** 打开 MCP 服务编辑弹窗 */
function openMcpConfig(mcp) {
  mcpConfigTarget.value = mcp
  showMcpConfig.value = true
}

/** AddMcpModal 创建成功后追加到 mcp_services 列表 */
function handleMcpCreated(mcp) {
  form.mcp_services = [...form.mcp_services, mcp]
  markDirty()
}

/** McpConfigModal 保存后按 id 替换对应服务项 */
function handleMcpUpdated(updated) {
  form.mcp_services = form.mcp_services.map(m => m.id === updated.id ? updated : m)
  markDirty()
}

/** 确认后从 mcp_services 中移除指定服务 */
function removeMcp(id) {
  if (!confirm('确认删除此 MCP 服务？')) return
  form.mcp_services = form.mcp_services.filter(m => m.id !== id)
  markDirty()
}

// ── Navigation guards ────────────────────────────────────────────────────────
/** 返回开发者工作空间首页 */
function handleBack() {
  router.push('/developer/workspace')
}

function openGlobalApiConfig() {
  apiConfigModal?.open()
}

async function handleLogout() {
  const ok = await showConfirm({
    title: '退出登录',
    message: '确定要退出当前账号吗？',
    confirmText: '确定退出',
    cancelText: '取消',
    danger: true,
  })
  if (ok) authStore.logout()
}

async function handleSaveAndDebug() {
  await handleDebug()
}

/** 进入调试运行页：先拦截失效工具，再处理未保存修改与 API Key */
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
      if (!isConfirmed) return
    }
  }

  if (!hasKeyForApp(form.platform, form.credential_id)) {
    pendingDebug.value = true
    openAppApiConfig()
    return
  }

  await proceedDebug()
}

async function proceedDebug() {
  if (isDirty.value) {
    await handleSave(true)
  }
  router.push({ name: 'AppDevRun', params: { id: app.value.id }, query: { mode: 'debug' } })
}

/** 路由离开守卫：有未保存修改时先静默保存再离开 */
onBeforeRouteLeave(async (to, from, next) => {
  clearAutoSaveTimer()
  if (isDirty.value) {
    await handleSave(true)
  }
  next()
})
</script>

<style scoped>
.app-edit {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  font-family: var(--font-sans);
}

/* ── Unified top bar ── */
.edit-bar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  gap: 16px;
}

.bar-left,
.bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.bar-left {
  flex: 1;
  overflow: hidden;
}

.bar-right {
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-mark {
  width: 28px;
  height: 28px;
  background: var(--color-text);
  color: var(--color-surface);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  font-family: monospace;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.dev-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.bar-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  flex-shrink: 0;
}

.back-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  transition: all 0.15s;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
}

.back-btn:hover {
  color: var(--color-text);
  border-color: #d1d5db;
  background: var(--color-bg-secondary);
}

.bar-app-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 180px;
  flex-shrink: 1;
}

.bar-app-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #000000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.bar-app-edit {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s, color 0.15s;
}

.bar-app-edit:hover {
  opacity: 1;
  color: var(--color-text-secondary);
}

.bar-platform {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  white-space: nowrap;
}

.bar-platform-deco {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
  pointer-events: none;
  line-height: 0;
  margin-right: -2px;
}

.bar-platform-prefix {
  color: var(--color-text-muted);
}

.bar-platform-name {
  color: #000000;
  font-weight: 600;
}

.bar-switch-link {
  padding: 0;
  margin-left: 2px;
  border: none;
  background: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.bar-switch-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.version-select-wrap {
  flex-shrink: 0;
}

.version-select {
  appearance: none;
  padding: 5px 28px 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-sans);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.version-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.save-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  flex-shrink: 0;
  white-space: nowrap;
}

.save-status.pending {
  color: #b45309;
}

.save-status.saved {
  color: #059669;
}

.save-status.saving {
  color: var(--color-text-muted);
}

.btn-save-debug {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-save-debug:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

.btn-save-debug:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.header-link {
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 500;
    color: var(--color-text-secondary);
    background: none;
  border: none;
    border-radius: 6px;
  cursor: pointer;
    transition: .15s;
    flex-shrink: 0;
}

.header-link:hover {
  color: var(--color-text);
}

.header-link.logout {
  color: var(--color-text-muted);
}

.header-phone {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
  white-space: nowrap;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
  position: relative;
  width: 279px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  overflow: visible;
  display: flex;
  flex-direction: column;
  box-shadow: 1px 0 2px rgba(0, 0, 0, 0.02);
  z-index: 5;
  transition: width 0.2s ease;
}

.file-panel.is-collapsed {
  width: 36px;
  overflow: visible;
}

.file-panel-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.file-panel-toggle {
  position: absolute;
  top: 14px;
  right: -12px;
  z-index: 8;
  width: 24px;
  height: 24px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: color 0.15s, background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.file-panel.is-collapsed .file-panel-toggle {
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
}

.file-panel-toggle:hover {
  color: var(--color-primary);
  border-color: #93c5fd;
  background: #eff6ff;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

.file-panel::-webkit-scrollbar {
  display: none;
}

.edit-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 24px 28px 36px;
  background: var(--color-surface);
}

.edit-main::-webkit-scrollbar {
  display: none;
}

.edit-container {
  width: 100%;
  max-width: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.edit-page-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 4px;
}

.page-breadcrumb {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: var(--font-mono, monospace);
}

.page-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #000000;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.page-tag {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  padding: 2px 10px;
  border-radius: 999px;
  line-height: 1.5;
}

.page-tag.muted {
  color: var(--color-text-muted);
}

.page-desc {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.6;
  max-width: 720px;
}

.edit-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.section-label-en {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.06em;
}

.tools-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.btn-section-link {
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: var(--color-primary, #3b82f6);
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s;
}

.btn-section-link:hover {
  color: var(--color-primary-hover, #2563eb);
}

.tools-edit-section {
  gap: 16px;
}

.mcp-edit-section {
  gap: 16px;
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
.prompt-section {
  width: 100%;
}

.prompt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid #eef0f3;
  border-radius: 8px;
  background: var(--color-surface);
  box-shadow: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.prompt-row:hover {
  border-color: #e5e7eb;
  background: #fafafa;
}

.prompt-row:focus-visible {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px #dbeafe;
}

.prompt-row-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.prompt-row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #9ca3af;
}

.prompt-row:hover .prompt-row-icon {
  color: #6b7280;
}

.prompt-row-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  font-family: var(--font-sans);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: var(--color-primary);
  line-height: 1;
  white-space: nowrap;
}

.prompt-expand-btn svg {
  flex-shrink: 0;
}

.prompt-row:hover .prompt-expand-btn {
  color: var(--color-primary-hover, #2563eb);
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

/* ── MCP 服务卡片（布局与 AppToolsSection 工具卡片对齐） ── */
.mcp-empty {
  font-size: 13px;
  color: #9ca3af;
  padding: 18px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
  line-height: 1.6;
  background: #f9fafb;
}

.mcp-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.mcp-card-grid.is-stacked {
  margin-top: 10px;
}

.mcp-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s;
}

.mcp-card:hover {
  border-color: var(--color-text-muted);
}

.mcp-card.is-off {
  opacity: 0.88;
}

.mcp-card-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.mcp-card-info {
  flex: 1;
  min-width: 0;
}

.mcp-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mcp-card.is-off .mcp-card-title {
  color: var(--color-text-muted);
}

.mcp-card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  min-width: 0;
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

/* URL 超出宽度时省略，完整地址通过 title 悬停查看 */
.mcp-url {
  font-family: var(--font-mono, monospace);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}

.mcp-card-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.mcp-remove-btn {
  width: 26px;
  height: 26px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.mcp-remove-btn:hover {
  color: #dc2626;
  background: #fef2f2;
}

.tool-type-badge {
  margin-top: 8px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
  align-self: flex-start;
  letter-spacing: 0.02em;
}

.tool-type-badge.type-mcp {
  color: #059669;
}

/* ── Confirm dialog ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
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
