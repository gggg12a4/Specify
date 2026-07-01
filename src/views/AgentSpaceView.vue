<template>
  <div class="agent-space" @click="handleOuterClick">
    <!-- ── Content ── -->
    <main class="sp-content">
      <!-- 我创建的 App -->
      <section class="section">
        <div class="section-head">
          <h2 class="section-title">
            我的创作
            <span v-if="authStore.isAuthenticated && appStore.apps.length" class="count">{{ appStore.apps.length
              }}</span>
          </h2>
        </div>

        <!-- 未登录空状态 -->
        <div v-if="!authStore.isAuthenticated" class="empty-state">
          <p class="empty-title">登录后即可开始构建你的专属智能体</p>
          <button class="btn-primary mt-4" @click="showAuthModal = true">
            登录 / 注册
          </button>
        </div>

        <div v-else class="app-grid">
          <!-- 空数据引导提示 (仅在没数据时显示) -->
          <div v-if="appStore.apps.length === 0" class="empty-guide-message">
            看起来你还没有创建任何应用，试试从模板开始，或者从零开始构建吧！
          </div>

          <!-- 固定的从零创建卡片 -->
          <button class="create-app-card" @click="handleCreateApp">
            <div class="create-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span class="create-text">从零开始创建</span>
          </button>

          <!-- App 列表 (如果有数据) -->
          <AgentCard v-for="app in pagedApps" :key="app.id" :agent="app"
            @edit="(id) => router.push({ name: 'AppEdit', params: { id } })" @run="handleRunApp"
            @delete="handleDeleteApp" />

          <!-- 官方模板展示 (没数据时显示) -->
          <template v-if="appStore.apps.length === 0">
            <AgentCard v-for="tpl in officialTemplates" :key="tpl.id" :agent="tpl"
              @use-template="handleTemplateClick" />
          </template>
        </div>

        <!-- 分页器 -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
          <button v-for="p in totalPages" :key="p" class="page-btn" :class="{ active: p === currentPage }"
            @click="currentPage = p">{{ p }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
        </div>
      </section>
    </main>

    <!-- 强制添加 API Key 弹窗 (JIT Interception) -->
    <RunConfigModal v-if="pendingApp" v-model:visible="showApiConfigModal" :app-id="pendingApp.id"
      :platform="pendingApp.platform" @confirm="onApiKeyAdded" />

    <!-- 删除 App 确认弹窗 -->
    <DeleteAppModal v-if="deleteTarget" :app="deleteTarget" @confirm="confirmDeleteApp" @cancel="deleteTarget = null" />

    <!-- 登录/注册弹窗 -->
    <AuthModal v-model:visible="showAuthModal" @logged-in="onLoggedIn" />

  </div>
</template>

<script setup>
/**
 * 开发者工作空间首页（/developer/workspace）。
 *
 * 展示「我的创作」App 列表与官方模板；未登录时引导登录。
 * 运行 App 前通过 JIT 拦截检查 API Key，缺失时弹出 RunConfigModal。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useApiConfig } from '@/composables/useApiConfig'
import { showInfo } from '@/composables/useNotification'
import { PLATFORM_LABELS } from '@/constants/spTools'
import AgentCard from '@/components/agent/AgentCard.vue'
import DeleteAppModal from '@/components/app/DeleteAppModal.vue'
import AuthModal from '@/components/common/AuthModal.vue'
import RunConfigModal from '@/components/common/RunConfigModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { hasKeyForPlatform } = useApiConfig()

const PAGE_SIZE = 11       // 我创建的 App 每页条数 (留一个位置给创建卡片)

// ── 官方模板数据 ──
const officialTemplates = [
  {
    id: 'tpl_doc',
    name: 'document_analyzer',
    description: '上传长文档，快速提取核心观点、总结段落大意，并支持针对文档内容进行问答。',
    isTemplate: true,
    system_prompt: '你是一个专业的文档分析助手。你的主要任务是帮助用户快速理解长文档。请始终保持客观、准确，并能够从给定的文本中提取关键信息。',
    platform: 'claude',
    tools: {
      SPread: { enabled: true, config: { max_line_length: 2000, file: true, max_file_size: 20 } },
      SPglob: { enabled: true, config: {} }
    }
  },
  {
    id: 'tpl_web',
    name: 'web_summarizer',
    description: '输入任意网页链接，自动抓取网页正文内容并生成精炼的结构化总结。',
    isTemplate: true,
    system_prompt: '你是一个网页摘要专家。请在阅读网页内容后，提取出最重要的信息，并以结构化的方式（如要点、大纲）呈现给用户。',
    platform: 'qwen',
    tools: {
      SPread: { enabled: true, config: { file_url: true } }
    }
  },
  {
    id: 'tpl_code',
    name: 'code_reviewer',
    description: '专业的 Code Review 智能体，帮你检查代码规范、发现潜在 Bug 并提供优化建议。',
    isTemplate: true,
    system_prompt: '你是一个资深的软件工程师。请对用户提供的代码进行严格审查。指出潜在的性能问题、安全漏洞、不符合最佳实践的地方，并给出改进后的代码示例。',
    platform: 'claude',
    tools: {
      SPread: { enabled: true, config: { max_line_length: 2000 } },
      SPedit: { enabled: true, config: {} },
      SPglob: { enabled: true, config: {} }
    }
  }
]

// ── 弹窗 / 面板状态 ──
const deleteTarget = ref(null)
const showAuthModal = ref(false)
const showApiConfigModal = ref(false)
const currentPage = ref(1)

// JIT 拦截：记录待运行 App id，供 RunConfigModal 使用
const pendingRunAppId = ref(null)
/** 根据 pendingRunAppId 解析完整 App 对象 */
const pendingApp = computed(() => pendingRunAppId.value ? appStore.getApp(pendingRunAppId.value) : null)

/** 当前页 App 列表切片（每页 PAGE_SIZE 条，留一格给创建卡片） */
const pagedApps = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return appStore.apps.slice(start, start + PAGE_SIZE)
})
/** 总页数，基于 appStore.apps 长度计算 */
const totalPages = computed(() => Math.ceil(appStore.apps.length / PAGE_SIZE))

/** 顶部轮播微引导文案列表（首条在 onMounted 中按时段个性化） */
const banners = computed(() => {
  const name = authStore.currentUser?.nickname || authStore.currentUser?.phone || '开发者'
  return [
    { icon: '👋', text: `下午好，${name}。开始构建你的专属智能体吧。` },
    { icon: '💡', text: 'Tip: 在开发页的指令中输入 @ 可以快速引用文件库。' },
    { icon: '✨', text: 'Tip: 遇到问题？尝试查看官方提供的模板。' },
    { icon: '🚀', text: 'Tip: 给应用起一个清晰的名字，能让你的工作区更井井有条。' }
  ]
})

const currentBannerIndex = ref(0)
/** 当前展示的轮播 banner */
const currentBanner = computed(() => banners.value[currentBannerIndex.value])
let bannerTimer = null

/** 挂载时设置问候语并启动 10s 轮播定时器 */
onMounted(() => {
  const hour = new Date().getHours()
  let greeting = '你好'
  if (hour < 12) greeting = '上午好'
  else if (hour < 18) greeting = '下午好'
  else greeting = '晚上好'

  const name = authStore.currentUser?.nickname || authStore.currentUser?.phone || '开发者'
  banners.value[0].text = `${greeting}，${name}。开始构建你的专属智能体吧。`

  bannerTimer = setInterval(() => {
    currentBannerIndex.value = (currentBannerIndex.value + 1) % banners.value.length
  }, 10000)
})

/** 卸载时清除 banner 轮播定时器 */
onUnmounted(() => {
  if (bannerTimer) clearInterval(bannerTimer)
})

/** 外层点击占位（预留关闭浮层等交互） */
function handleOuterClick() { }

/** 平滑滚动到页面顶部 */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** 创建 App：未登录弹登录框，已登录跳转创建页 */
function handleCreateApp() {
  if (!authStore.isAuthenticated) {
    showAuthModal.value = true
    return
  }
  router.push({ name: 'AppCreate' })
}

/** JIT 拦截运行：无 API Key 时弹 RunConfigModal，否则直接跳转 */
function handleRunApp(appId) {
  const app = appStore.getApp(appId)
  if (!app) return

  // 检查是否配置了该平台模型
  if (!hasKeyForPlatform(app.platform)) {
    pendingRunAppId.value = appId
    showApiConfigModal.value = true // 这里弹出RunConfigModal
  } else {
    executeRunApp(appId)
  }
}

/** RunConfigModal 配置完成后继续执行待运行的 App */
function onApiKeyAdded(payload) {
  if (pendingRunAppId.value) {
    const appId = pendingRunAppId.value
    pendingRunAppId.value = null
    executeRunApp(appId)
  }
}

/** 跳转到 App 调试运行页（debug 模式） */
function executeRunApp(appId) {
  router.push({ name: 'AppDevRun', params: { id: appId }, query: { mode: 'debug' } })
}

/** 将官方模板写入 localStorage 并跳转创建页预填 */
function handleTemplateClick(tpl) {
  // 把模板存进 localStorage 或者通过 state 传递，因为 URL query 可能太长
  // 简单起见，这里先把整个 tpl 存起来传给 router state，或者直接通过 query 传 id
  localStorage.setItem('specify_template_clone', JSON.stringify(tpl))
  router.push({ name: 'AppCreate', query: { fromTemplate: 'true' } })
}

/** 打开指定 App 的高级配置（预留入口） */
function openAdvanced(app) {
  advancedApp.value = app
}

/** 打开删除确认弹窗，记录待删 App */
function handleDeleteApp(app) {
  deleteTarget.value = app
}

/** 确认删除后从 appStore 移除并关闭弹窗 */
function confirmDeleteApp() {
  if (deleteTarget.value) {
    appStore.deleteApp(deleteTarget.value.id)
    deleteTarget.value = null
  }
}

/** 登录成功后关闭 AuthModal */
function onLoggedIn() {
  showAuthModal.value = false
}

</script>

<style scoped>
.agent-space {
  width: 100%;
  min-height: 100%;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary.btn-sm {
  padding: 6px 14px;
  font-size: 12px;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

.btn-ghost {
  padding: 7px 14px;
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

.btn-logout:hover {
  color: var(--color-error);
  border-color: var(--color-error);
  background: rgba(239, 68, 68, 0.06);
}

.mt-4 {
  margin-top: 16px;
}

/* ── Content ── */
.sp-content {
  flex: 1;
  padding: 32px 40px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 48px;
  box-sizing: border-box;
  overflow-y: auto;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  font-size: 12px;
  font-weight: 500;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  padding: 2px 8px;
  border-radius: 20px;
}

.empty-guide-message {
  grid-column: 1 / -1;
  /* 跨越整个网格宽度 */
  background: rgba(99, 102, 241, 0.06);
  border: 1px solid var(--color-primary-soft);
  color: var(--color-primary);
  padding: 14px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  margin-bottom: 8px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  align-items: stretch;
}

/* 创建应用卡片：与同行 app-card 等高（由网格行拉伸） */
.create-app-card {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: transparent;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-secondary);
}

.create-app-card:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-primary-soft);
  color: var(--color-primary);
}

.create-icon {
  width: 48px;
  height: 48px;
  background: var(--color-surface);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.create-text {
  font-size: 14px;
  font-weight: 500;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 24px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Dynamic Banner (从顶层移入) */
.dynamic-banner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.dynamic-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-secondary);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.banner-icon {
  font-size: 14px;
}

.banner-text {
  font-weight: 500;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
