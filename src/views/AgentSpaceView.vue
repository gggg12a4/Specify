<template>
  <div class="agent-space" @click="handleOuterClick">
    <!-- ── Content ── -->
    <main class="sp-content">
      <!-- 我创建的 App -->
      <section class="section">
        <div class="section-head">
          <h2 class="section-title">
            我创建的 App
            <span v-if="authStore.isAuthenticated && appStore.apps.length" class="count">{{ appStore.apps.length
              }}</span>
          </h2>
          <button class="btn-primary btn-sm" @click="handleCreateApp">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            创建 App
          </button>
        </div>

        <!-- 未登录空状态 -->
        <div v-if="!authStore.isAuthenticated" class="empty-state">
          <p class="empty-title">还没有创建过 App，点击右上角创建你的第一个 App</p>
        </div>
        <!-- 已登录空状态 -->
        <div v-else-if="!appStore.apps.length" class="empty-state">
          <div class="empty-illus">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"
              stroke-linecap="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <p class="empty-title">还没有创建过 App，点击右上角创建你的第一个 App</p>
        </div>

        <div v-else class="app-grid">
          <AgentCard v-for="app in pagedApps" :key="app.id" :agent="app"
            @edit="(id) => router.push({ name: 'AppEdit', params: { id } })"
            @run="(id) => router.push({ name: 'AppRun', params: { id } })" @share="openShare" @advanced="openAdvanced"
            @delete="handleDeleteApp" />
        </div>

        <!-- 分页器 -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
          <button v-for="p in totalPages" :key="p" class="page-btn" :class="{ active: p === currentPage }"
            @click="currentPage = p">{{ p }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
        </div>
      </section>

      <!-- 推荐 App -->
      <section class="section">
        <div class="section-head">
          <h2 class="section-title">推荐 App</h2>
        </div>

        <div v-if="!visibleRecommended.length" class="empty-state empty-state-sm">
          <p class="empty-title">暂无推荐</p>
        </div>

        <div v-else class="app-grid">
          <div v-for="rapp in visibleRecommended" :key="rapp.id" class="rec-card">
            <div class="rec-card-body">
              <div class="rec-top">
                <h3 class="rec-name">{{ rapp.name }}</h3>
                <span v-if="rapp.platform" class="rec-platform">{{ PLATFORM_LABELS[rapp.platform] || rapp.platform }}</span>
              </div>
              <p class="rec-desc">{{ rapp.description }}</p>
              <div class="rec-from">来自: {{ rapp.creator_nickname }}</div>
            </div>
            <button class="act-btn act-use" @click="handleUseApp(rapp.id)">使用</button>
          </div>
        </div>

        <div v-if="hasMoreRecommended" class="load-more-wrap">
          <button class="btn-ghost btn-load-more" @click="loadMoreRecommended">查看更多</button>
        </div>
      </section>

      <!-- 最近使用 -->
      <section class="section">
        <div class="section-head">
          <h2 class="section-title">最近使用</h2>
        </div>

        <!-- 未登录提示 -->
        <div v-if="!authStore.isAuthenticated" class="empty-state empty-state-sm">
          <p class="empty-title">登录后可查看最近使用的 App</p>
        </div>
        <!-- 已登录空状态 -->
        <div v-else-if="!appStore.recentApps.length" class="empty-state empty-state-sm">
          <div class="empty-illus" style="font-size:32px;opacity:0.3;margin-bottom:10px">📭</div>
          <p class="empty-title">还没有使用过其他人的 App，去推荐区看看吧</p>
        </div>

        <div v-else class="app-grid">
          <div v-for="rapp in appStore.recentApps" :key="rapp.id" class="rec-card">
            <div class="rec-card-body">
              <div class="rec-top">
                <h3 class="rec-name">{{ rapp.name }}</h3>
              </div>
              <div class="rec-from">来自: {{ rapp.creator_nickname }}</div>
            </div>
            <button class="act-btn act-use"
              @click="router.push({ name: 'AppRun', params: { id: rapp.id }, query: { mode: 'formal' } })">
              打开
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- 创建 App 弹窗 -->
    <CreateAppModal v-model:visible="showCreateApp" @created="handleAppCreated" />

    <!-- 高级配置 -->
    <AppAdvancedConfigModal v-if="advancedApp" :app="advancedApp"
      @save="(d) => { appStore.updateApp(advancedApp.id, d); advancedApp = null; }" @close="advancedApp = null" />

    <!-- 分享弹窗 -->
    <ShareModal v-model:visible="showShare" :app="shareApp" />

    <!-- 删除 App 确认弹窗 -->
    <DeleteAppModal v-if="deleteTarget" :app="deleteTarget" @confirm="confirmDeleteApp" @cancel="deleteTarget = null" />

    <!-- 登录/注册弹窗 -->
    <AuthModal v-model:visible="showAuthModal" @logged-in="onLoggedIn" />

  </div>
</template>

<script setup>
/**
 * 开发者工作空间首页（/developer/workspace）。
 * 展示三块内容：我创建的 App、平台推荐 App、最近使用的 App。
 * 未登录时可浏览推荐区，创建/使用 App 需先登录。
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { PLATFORM_LABELS } from '@/constants/spTools'
import AgentCard from '@/components/agent/AgentCard.vue'
import AppAdvancedConfigModal from '@/components/app/AppAdvancedConfigModal.vue'
import ShareModal from '@/components/app/ShareModal.vue'
import CreateAppModal from '@/components/app/CreateAppModal.vue'
import DeleteAppModal from '@/components/app/DeleteAppModal.vue'
import AuthModal from '@/components/common/AuthModal.vue'
import * as adminApi from '@/api/admin'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const PAGE_SIZE = 12       // 我创建的 App 每页条数
const REC_PAGE_SIZE = 6    // 推荐 App 每次「加载更多」增量

// ── 弹窗 / 面板状态 ──
const showCreateApp = ref(false)
const advancedApp = ref(null)
const showShare = ref(false)
const shareApp = ref(null)
const deleteTarget = ref(null)
const showAuthModal = ref(false)
const currentPage = ref(1)
const visibleRecCount = ref(REC_PAGE_SIZE)

// 我创建的 App 分页
const pagedApps = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return appStore.apps.slice(start, start + PAGE_SIZE)
})
const totalPages = computed(() => Math.ceil(appStore.apps.length / PAGE_SIZE))

// 推荐 App 加载更多
const visibleRecommended = computed(() => appStore.recommendedApps.slice(0, visibleRecCount.value))
const hasMoreRecommended = computed(() => visibleRecCount.value < appStore.recommendedApps.length)

function loadMoreRecommended() {
  visibleRecCount.value += REC_PAGE_SIZE
}

function handleOuterClick() { }

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** 创建 App：未登录先弹登录框，已登录跳转创建页 */
function handleCreateApp() {
  if (!authStore.isAuthenticated) {
    showAuthModal.value = true
    return
  }
  router.push({ name: 'AppCreate' })
}

/** 创建完成后进入引导页，介绍文件空间用法 */
function handleAppCreated(app) {
  router.push({ name: 'AppIntro', params: { id: app.id } })
}

/** 使用他人 App：正式模式运行（mode=formal） */
function handleUseApp(id) {
  if (!authStore.isAuthenticated) {
    showAuthModal.value = true
    return
  }
  router.push({ name: 'AppRun', params: { id }, query: { mode: 'formal' } })
}

function openAdvanced(app) {
  advancedApp.value = app
}

function openShare(app) {
  shareApp.value = app
  showShare.value = true
}

function handleDeleteApp(app) {
  deleteTarget.value = app
}

function confirmDeleteApp() {
  if (deleteTarget.value) {
    appStore.deleteApp(deleteTarget.value.id)
    deleteTarget.value = null
  }
}

function onLoggedIn() {
  showAuthModal.value = false
  loadPageData()
}

onMounted(loadPageData)

async function loadPageData() {
  // 推荐 App
  const recRes = await mockApi.getRecommendedApps(0, 6)
  if (recRes.code === 0) {
    appStore.setRecommendedApps(recRes.data.items)
    _recHasMore.value = recRes.data.has_more
  }
  // 最近使用（需登录）
  if (authStore.isAuthenticated) {
    const recentRes = await mockApi.getRecentApps()
    if (recentRes.code === 0) appStore.setRecentApps(recentRes.data)
  }
}

const _recHasMore = ref(false)
</script>

<style scoped>
.agent-space {
  width: 100%;
  min-height: 100%; /* Changed from 100vh since it's now inside a layout */
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

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.empty-state-sm {
  padding: 28px 24px;
}

.empty-illus {
  color: var(--color-text-muted);
  opacity: 0.4;
  margin-bottom: 18px;
}

.empty-title {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Rec card */
.rec-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.18s;
}

.rec-card:hover {
  border-color: var(--color-text-muted);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.rec-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.rec-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rec-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.rec-platform {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--color-hover);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.rec-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rec-from {
  font-size: 12px;
  color: var(--color-text-muted);
}

.act-btn {
  padding: 7px 0;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
}

.act-use {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.act-use:hover {
  background: var(--color-primary-hover);
}

/* 加载更多 */
.load-more-wrap {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.btn-load-more {
  min-width: 120px;
}

/* 分页器 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 8px;
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

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
