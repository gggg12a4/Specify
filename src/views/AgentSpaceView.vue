<template>
  <div class="agent-space">
    <main class="sp-content">
      <!-- 未登录 -->
      <div v-if="!authStore.isAuthenticated" class="empty-state">
        <p class="empty-title">登录后即可开始构建你的专属智能体</p>
        <button class="btn-primary mt-4" @click="showAuthModal = true">登录 / 注册</button>
      </div>

      <template v-else>
        <!-- 我创建的 App -->
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">
              我创建的 App
              <span v-if="appStore.apps.length" class="count">{{ appStore.apps.length }}</span>
            </h2>
            <button class="btn-create" @click="handleCreateApp">+ 创建 App</button>
          </div>

          <div v-if="appStore.loading" class="section-loading">加载中…</div>
          <div v-else-if="!appStore.apps.length" class="section-empty dashed">
            <span>还没有创建 App，点击右上角开始创建</span>
          </div>
          <div v-else class="card-row">
            <AgentCard
              v-for="app in appStore.apps"
              :key="app.id"
              :agent="app"
              variant="workspace"
              @edit="(id) => router.push({ name: 'AppEdit', params: { id } })"
              @run="handleRunApp"
              @share="handleShareApp"
              @delete="handleDeleteApp"
            />
          </div>
        </section>

        <!-- 推荐 App -->
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">推荐 App</h2>
          </div>

          <div v-if="appStore.templatesLoading" class="section-loading">加载中…</div>
          <div v-else-if="!recommendedApps.length" class="section-empty dashed">
            <span>暂无推荐</span>
          </div>
          <div v-else class="card-row">
            <AgentCard
              v-for="tpl in recommendedApps"
              :key="tpl.id"
              :agent="tpl"
              variant="workspace"
              @use-template="handleTemplateClick"
            />
          </div>
        </section>

        <!-- 最近使用 -->
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">最近使用</h2>
          </div>
          <div class="section-empty dashed recent-empty">
            <span class="recent-icon">📬</span>
            <span>还没有使用过其他人的 App，去推荐区看看吧</span>
          </div>
        </section>
      </template>
    </main>

    <DeleteAppModal v-if="deleteTarget" :app="deleteTarget" @confirm="confirmDeleteApp" @cancel="deleteTarget = null" />
    <AuthModal v-model:visible="showAuthModal" @logged-in="onLoggedIn" />

    <AppShareModal
      v-model:visible="showShareModal"
      :is-public="shareTarget?.isPublic ?? false"
      :share-code="shareTarget?.shareCode ?? ''"
      :is-published="!!shareTarget?.liveVersionId"
      :toggling="togglingPublic"
      @toggle="handleTogglePublic"
    />
  </div>
</template>

<script setup>
/**
 * 开发者工作空间首页（/developer/workspace）。
 */
import { ref, computed, watch, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useApiConfig } from '@/composables/useApiConfig'
import { showError, showSuccess } from '@/composables/useNotification'
import AgentCard from '@/components/agent/AgentCard.vue'
import DeleteAppModal from '@/components/app/DeleteAppModal.vue'
import AppShareModal from '@/components/app/AppShareModal.vue'
import AuthModal from '@/components/common/AuthModal.vue'
import { API_CONFIG_MODAL_KEY } from '@/composables/useApiConfigModal'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { hasKeyForApp } = useApiConfig()
const apiConfigModal = inject(API_CONFIG_MODAL_KEY, null)

const deleteTarget = ref(null)
const showAuthModal = ref(false)
const showShareModal = ref(false)
const shareTarget = ref(null)
const togglingPublic = ref(false)
const pendingRunAppId = ref(null)

const recommendedApps = computed(() => appStore.templates)

async function loadWorkspace() {
  if (!authStore.isAuthenticated) return
  try {
    await appStore.fetchMyApps({ pageNo: 1, pageSize: 100 })
    await appStore.fetchTemplates({ pageNo: 1, pageSize: 20 })
  } catch (err) {
    showError(err.message || '加载工作空间失败')
  }
}

watch(() => authStore.isAuthenticated, (loggedIn) => {
  if (loggedIn) loadWorkspace()
})

onMounted(() => {
  loadWorkspace()
})

function handleCreateApp() {
  if (!authStore.isAuthenticated) {
    showAuthModal.value = true
    return
  }
  router.push({ name: 'AppCreate' })
}

function handleRunApp(appId) {
  const app = appStore.getApp(appId) || appStore.apps.find(a => a.id === appId)
  if (!app) return

  if (!hasKeyForApp(app.platform, app.credential_id)) {
    pendingRunAppId.value = appId
    openAppApiConfig(app)
    return
  }
  executeRunApp(appId)
}

function openAppApiConfig(app) {
  if (!apiConfigModal) return
  apiConfigModal.open({
    appContext: {
      appId: app.id,
      appName: app.name,
      platform: app.platform,
      credentialId: app.credential_id,
      onSelect: (credentialId) => {
        appStore.updateAppLocal(app.id, { credential_id: credentialId })
        if (pendingRunAppId.value === app.id) {
          const id = pendingRunAppId.value
          pendingRunAppId.value = null
          executeRunApp(id)
        }
      },
    },
  })
}

function executeRunApp(appId) {
  router.push({ name: 'AppDevRun', params: { id: appId }, query: { mode: 'debug' } })
}

function handleTemplateClick(tpl) {
  localStorage.setItem('specify_template_clone', JSON.stringify(tpl))
  router.push({ name: 'AppCreate', query: { fromTemplate: 'true' } })
}

function handleShareApp(app) {
  shareTarget.value = app
  showShareModal.value = true
}

async function handleTogglePublic(nextPublic) {
  if (!shareTarget.value) return
  togglingPublic.value = true
  try {
    await appStore.togglePublic(shareTarget.value.id, nextPublic)
    shareTarget.value = {
      ...shareTarget.value,
      isPublic: nextPublic,
    }
    showSuccess(nextPublic ? '已设为公开' : '已设为私有')
  } catch (err) {
    showError(err.message || '切换可见性失败')
  } finally {
    togglingPublic.value = false
  }
}

function handleDeleteApp(app) {
  deleteTarget.value = app
}

async function confirmDeleteApp() {
  if (!deleteTarget.value) return
  try {
    await appStore.removeApp(deleteTarget.value.id)
    deleteTarget.value = null
    await loadWorkspace()
  } catch (err) {
    showError(err.message || '删除失败')
  }
}

function onLoggedIn() {
  showAuthModal.value = false
  loadWorkspace()
}
</script>

<style scoped>
.agent-space {
  width: 100%;
  min-height: 100%;
  background: var(--color-bg-secondary);
}

.sp-content {
  flex: 1;
  padding: 28px 40px 48px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 36px;
  box-sizing: border-box;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  border-radius: 10px;
}

.btn-create {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-create:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

.card-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}

.section-empty {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: var(--color-surface);
  border-radius: 12px;
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
}

.section-empty.dashed {
  border: 1px dashed var(--color-border);
  background: var(--color-surface);
}

.recent-empty {
  flex-direction: column;
  gap: 10px;
  min-height: 140px;
}

.recent-icon {
  font-size: 28px;
  line-height: 1;
}

.section-loading {
  padding: 24px;
  font-size: 14px;
  color: var(--color-text-muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.mt-4 {
  margin-top: 16px;
}
</style>
