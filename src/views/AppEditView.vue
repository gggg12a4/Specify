<template>
  <div class="app-edit">
    <header class="edit-bar">
      <div class="bar-left">
        <router-link to="/" class="back-btn" @click.prevent="handleBack">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </router-link>
        <div class="bar-title">
          <span class="bar-label">App 开发</span>
          <!-- <span class="bar-sep">：</span> -->
          <div class="bar-app-row">
            <span class="bar-app-wrap">
              <span class="bar-app">{{ app?.name }}</span>
              <button v-if="app" type="button" class="bar-app-edit" aria-label="编辑 App 名称与描述" title="编辑 App 信息"
                @click="showMetaEditModal = true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            </span>
            <button v-if="platformLabel" type="button" class="bar-platform" :class="{ active: showPlatformModal }"
              :aria-label="`当前平台 ${platformLabel}，点击切换 AI 平台`" title="点击切换 AI 平台" @click="showPlatformModal = true">
              <span class="bar-platform-label">{{ platformLabel }}</span>
              <span class="bar-platform-hint">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                切换平台
              </span>
            </button>
          </div>
          <span v-if="showAutoSavedHint" class="save-status saved">已自动保存</span>
          <span v-else-if="autoSavePending" class="save-status pending">{{ autoSaveCountdown }}s 后自动保存</span>
          <span v-else-if="isDirty" class="unsaved-dot" title="有未保存的修改"></span>
        </div>
      </div>
      <div class="bar-right">
        <button class="btn-save" :class="{ 'is-saving': isSaving }" @click="handleSave()"
          :disabled="!isDirty || isSaving">
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
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
              <AppModelSection :platform="form.platform || 'claude'" :model-value="form.model"
                @update:model-value="(v) => { form.model = v; markDirty() }" />
            </section>

            <!-- 系统提示词 -->
            <section class="edit-section">
              <div class="section-header">
                <div>
                  <h2 class="section-title">系统提示词</h2>
                  <p class="section-desc">定义 App 的角色、行为边界以及如何使用工作区资源。</p>
                </div>
              </div>
              <div class="prompt-box prompt-trigger" role="button" tabindex="0" @click="openPromptModal"
                @keydown.enter.prevent="openPromptModal" @keydown.space.prevent="openPromptModal">
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
              <AppToolsSection ref="toolsSectionRef" :tools="form.tools" :custom-tools="form.custom_tools"
                :special-tools="form.special_tools" :platform="form.platform || 'claude'" :file-refs="promptFileRefs"
                :tool-refs="promptToolRefs" @update:tools="(v) => { form.tools = v; markDirty() }"
                @update:custom-tools="(v) => { form.custom_tools = v; markDirty() }"
                @update:special-tools="(v) => { form.special_tools = v; markDirty() }" @show-info="infoTool = $event"
                @show-config="configTool = $event" />
            </section>

            <!-- MCP 服务区 -->
            <section class="edit-section">
              <div class="section-header">
                <div>
                  <h2 class="section-title">MCP工具 (MCP)</h2>
                  <p class="section-desc">为 App 挂载外部 API 和本地服务能力。</p>
                </div>
                <button class="btn btn-outline" @click="showAddMcp = true">+ 添加服务</button>
              </div>

              <div v-if="!form.mcp_services.length" class="mcp-empty">
                还没有添加 MCP 服务，点击「添加服务」接入外部工具
              </div>

              <!-- MCP 服务卡片：名称 + URL（省略号截断，title 悬停查看完整地址） -->
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
          </div>
        </div>
      </div>
    </div>

    <ToolInfoModal v-if="infoTool" :tool="infoTool" @close="infoTool = null" />
    <ToolConfigModal v-if="configTool" :tool="configTool.tool" :config="form.tools[configTool.tool.key]?.config || {}"
      :disabled-rules="configTool.disabledRules" @save="handleToolConfigSave" @close="configTool = null" />

    <!-- MCP 弹窗 -->
    <AddMcpModal v-model:visible="showAddMcp" :app-id="app?.id" @created="handleMcpCreated" />
    <McpConfigModal v-if="mcpConfigTarget" v-model:visible="showMcpConfig" :app-id="app?.id" :mcp="mcpConfigTarget"
      @updated="handleMcpUpdated" />

    <SystemPromptModal v-model:visible="showPromptModal" v-model="form.system_prompt" :file-refs="promptFileRefs"
      :tool-refs="promptToolRefs" @done="markDirty" />

    <AppPlatformModal v-model:visible="showPlatformModal" :model-value="form.platform" @select="handlePlatformChange"
      @configure-api-key="openApiKeyModal" />

    <RunConfigModal
      v-if="app"
      v-model:visible="showApiKeyModal"
      :app-id="app.id"
      :platform="apiKeyModalPlatform"
      :credential-id="form.credential_id"
      :confirm-text="apiKeyModalConfirmText"
      @confirm="onApiKeyConfigured"
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
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { PLATFORM_LABELS } from '@/constants/spTools'
import AppFilePanel from '@/components/app/AppFilePanel.vue'
import AppToolsSection from '@/components/app/AppToolsSection.vue'
import ToolInfoModal from '@/components/app/ToolInfoModal.vue'
import ToolConfigModal from '@/components/app/ToolConfigModal.vue'
import AddMcpModal from '@/components/app/AddMcpModal.vue'
import McpConfigModal from '@/components/app/McpConfigModal.vue'
import ToolConfigBtn from '@/components/app/ToolConfigBtn.vue'
import SystemPromptModal from '@/components/app/SystemPromptModal.vue'
import AppModelSection from '@/components/app/AppModelSection.vue'
import AppPlatformModal from '@/components/app/AppPlatformModal.vue'
import AppMetaEditModal from '@/components/app/AppMetaEditModal.vue'
import RunConfigModal from '@/components/common/RunConfigModal.vue'
import { useApiConfig } from '@/composables/useApiConfig'
import {
  analyzePlatformMigration,
  applyPlatformMigration,
  buildPlatformSwitchMessage,
} from '@/utils/platformMigration'
import { SP_TOOLS } from '@/constants/spTools'
import { resolveAppModel, getDefaultModelForPlatform } from '@/constants/platformModels'
import { showSuccess, showConfirm } from '@/composables/useNotification'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { hasKeyForPlatform, hasKeyForApp } = useApiConfig()
/** 从路由 id 获取当前编辑的 App */
const app = computed(() => appStore.getApp(route.params.id))
/** 平台中文展示名 */
const platformLabel = computed(() => PLATFORM_LABELS[form.platform] || '')

const toolsSectionRef = ref(null)
const filePanelRef = ref(null)
const showPlatformModal = ref(false)
const showMetaEditModal = ref(false)

const form = reactive({
  platform: 'claude',
  credential_id: null,
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
const showApiKeyModal = ref(false)
const apiKeyModalPlatform = ref('claude')
const apiKeyModalConfirmText = ref('保存凭证')
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

/** 保存 App 名称与描述（独立于 form 草稿，立即写入 store） */
function handleMetaSave({ name, description }) {
  appStore.updateApp(app.value.id, { name, description })
  showSuccess('App 信息已更新')
}

function openApiKeyModal(platform = form.platform) {
  apiKeyModalPlatform.value = platform
  apiKeyModalConfirmText.value = hasKeyForApp(platform, form.credential_id) ? '完成' : '保存凭证'
  showApiKeyModal.value = true
}

function onApiKeyConfigured(payload = {}) {
  showApiKeyModal.value = false
  if (payload.credentialId !== undefined) {
    form.credential_id = payload.credentialId
    markDirty()
  }
  if (pendingDebug.value) {
    pendingDebug.value = false
    proceedDebug()
  }
}

/** 切换平台：先确认影响范围，确认后再迁移并视情况提示配置 API Key */
async function handlePlatformChange(newPlatform) {
  if (newPlatform === form.platform) return

  const analysis = analyzePlatformMigration(form, form.platform, newPlatform)
  const message = buildPlatformSwitchMessage(analysis)

  showPlatformModal.value = false

  const confirmed = await showConfirm({
    title: `切换到 ${PLATFORM_LABELS[newPlatform] || newPlatform}？`,
    message,
    confirmText: '确认切换',
    cancelText: '取消',
  })
  if (!confirmed) {
    showPlatformModal.value = true
    return
  }

  applyPlatformMigration(form, newPlatform)
  markDirty()
  checkGlobalErrors()

  if (!hasKeyForPlatform(newPlatform)) {
    apiKeyModalPlatform.value = newPlatform
    apiKeyModalConfirmText.value = '保存凭证'
    showApiKeyModal.value = true
  }
}

/** 打开系统提示词全屏编辑弹窗 */
function openPromptModal() {
  showPromptModal.value = true
}

/** App 数据加载后：深拷贝到 form 并重置 isDirty */
watch(app, (a) => {
  if (!a) return
  suppressDirtyUntil = Date.now() + 100
  clearAutoSaveTimer()
  showAutoSavedHint.value = false
  showPlatformModal.value = false
  form.system_prompt = a.system_prompt || ''
  form.platform = a.platform || 'claude'
  form.credential_id = a.credential_id ?? null
  form.model = resolveAppModel(a)
  form.tools = JSON.parse(JSON.stringify(a.tools || {}))
  form.custom_tools = JSON.parse(JSON.stringify(a.custom_tools || []))
  form.special_tools = JSON.parse(JSON.stringify(a.special_tools || {}))
  form.mcp_services = JSON.parse(JSON.stringify(a.mcp_services || []))
  isDirty.value = false
}, { immediate: true })

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

/** 将 form 写回 appStore；silent 为 true 时不弹成功提示 */
function handleSave(silent = false, options = {}) {
  if (!isDirty.value) return Promise.resolve()

  clearAutoSaveTimer()

  return new Promise((resolve) => {
    isSaving.value = true

    setTimeout(() => {
      appStore.updateApp(app.value.id, {
        platform: form.platform,
        credential_id: form.credential_id,
        system_prompt: form.system_prompt,
        model: form.model || getDefaultModelForPlatform(form.platform),
        tools: form.tools,
        custom_tools: form.custom_tools,
        special_tools: form.special_tools,
        mcp_services: form.mcp_services,
      })
      isDirty.value = false
      isSaving.value = false
      if (options.auto) {
        flashAutoSavedHint()
      } else if (!silent) {
        showSuccess('保存成功')
      }
      resolve()
    }, 300)
  })
}

onUnmounted(() => {
  clearAutoSaveTimer()
  if (autoSavedHintTimer) clearTimeout(autoSavedHintTimer)
})

/** 保存平台工具参数配置到 form.tools[key].config */
function handleToolConfigSave(config) {
  const key = configTool.value.tool.key
  form.tools = { ...form.tools, [key]: { ...form.tools[key], config } }
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
  router.push('/workspace')
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
    apiKeyModalPlatform.value = form.platform
    apiKeyModalConfirmText.value = '保存并开始调试'
    showApiKeyModal.value = true
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

.bar-app-row {
  display: inline-flex;
  align-items: baseline;
  min-width: 0;
}

.bar-app-wrap {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  max-width: 240px;
}

.bar-app {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-app-edit {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  opacity: 0.5;
  transform: translateY(2px);
  transition: opacity 0.15s, color 0.15s;
}

.bar-app-edit svg {
  display: block;
}

.bar-app-edit:hover {
  opacity: 1;
  color: var(--color-text-secondary);
}

.bar-platform {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary-hover);
  padding: 3px 8px 3px 10px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary);
  border-radius: 10px;
  margin-left: 6px;
  flex-shrink: 0;
  transform: translateY(1px);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s;
}

.bar-platform-label {
  font-weight: 600;
  color: var(--color-primary-hover);
}

.bar-platform-hint {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-primary);
  padding-left: 6px;
  border-left: 1px solid var(--color-primary);
  opacity: 0.85;
  transition: opacity 0.15s, color 0.15s;
}

.bar-platform:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary-hover);
  box-shadow: 0 2px 8px var(--color-primary-glow);
}

.bar-platform:hover .bar-platform-hint {
  color: var(--color-primary-hover);
  opacity: 1;
}

.bar-platform.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary-hover);
  box-shadow: 0 0 0 2px var(--color-primary-muted);
}

.bar-platform.active .bar-platform-hint {
  color: var(--color-primary-hover);
  opacity: 1;
}

.unsaved-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-warning, #f59e0b);
  margin-left: 4px;
  flex-shrink: 0;
}

.save-status {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  flex-shrink: 0;
}

.save-status.pending {
  color: #b45309;
}

.save-status.saved {
  color: #059669;
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
  background: #059669;
  /* slightly darker green */
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
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
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

/* ── MCP 服务卡片（布局与 AppToolsSection 工具卡片对齐） ── */
.mcp-empty {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 20px 16px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  text-align: center;
  background: var(--color-bg-secondary);
}

.mcp-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
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
