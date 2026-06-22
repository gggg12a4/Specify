<template>
  <div class="developer-layout" @click="closeDropdown">
    <!-- Header extracted from AgentSpaceView -->
    <header class="sp-header" @click.stop>
      <div class="header-left">
        <router-link to="/developer/workspace" class="brand" style="text-decoration: none;">
          <span class="brand-mark">S</span>
          <span class="brand-name">Specify <span class="role-badge">Dev</span></span>
        </router-link>
      </div>

      <!-- Dynamic Banner (动态微引导) -->
      <div class="header-center" v-if="authStore.isAuthenticated">
        <Transition name="fade" mode="out-in">
          <div class="dynamic-banner" :key="currentBannerIndex">
            <span class="banner-icon">{{ currentBanner.icon }}</span>
            <span class="banner-text">{{ currentBanner.text }}</span>
          </div>
        </Transition>
      </div>

      <div class="header-right">
        <template v-if="authStore.isAuthenticated">
          <div class="user-avatar-wrap" @click.stop="toggleDropdown">
            <div class="user-avatar">{{ userInitial }}</div>

            <div v-if="showDropdown" class="dropdown-menu">
              <div class="dropdown-header">
                <span class="dropdown-user">{{ authStore.currentUser?.nickname || authStore.currentUser?.phone }}</span>
              </div>
              <button class="dropdown-item" @click="openApiConfig">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                API 密钥配置
              </button>
              <button class="dropdown-item" @click="openAccountSettings">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                账号设置
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item danger" @click="openLogout">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                退出登录
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <!-- Should rarely hit this due to route guards, but keeping for safety -->
          <router-link to="/" class="btn-primary" style="text-decoration: none;">返回首页</router-link>
        </template>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="layout-main">
      <router-view />
    </main>

    <!-- Modals that are global to Developer Workspace -->
    <ApiConfigModal v-model:visible="showMyModels" />

    <!-- Logout Confirm -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showLogoutConfirm" class="overlay" @click="showLogoutConfirm = false">
          <div class="dialog" @click.stop>
            <div class="dialog-body" style="padding: 24px; text-align: center;">
              <h3 style="margin-top:0; font-size: 18px;">退出登录</h3>
              <p style="color: var(--color-text-secondary); margin: 12px 0 24px; font-size: 14px;">确定要退出当前账号吗？</p>
              <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="btn-ghost" @click="showLogoutConfirm = false" style="flex:1">取消</button>
                <button class="btn-primary" @click="handleLogout" style="flex:1; background: var(--color-error);">确定退出</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ApiConfigModal from '@/components/common/ApiConfigModal.vue'
import Toast from '@/components/common/Toast.vue'

const authStore = useAuthStore()
const showMyModels = ref(false)
const showLogoutConfirm = ref(false)
const showDropdown = ref(false)

// --- 动态微引导 (Dynamic Banner) Logic ---
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
const currentBanner = computed(() => banners.value[currentBannerIndex.value])
let bannerTimer = null

onMounted(() => {
  // 根据时间调整问候语
  const hour = new Date().getHours()
  let greeting = '你好'
  if (hour < 12) greeting = '上午好'
  else if (hour < 18) greeting = '下午好'
  else greeting = '晚上好'

  const name = authStore.currentUser?.nickname || authStore.currentUser?.phone || '开发者'
  banners.value[0].text = `${greeting}，${name}。开始构建你的专属智能体吧。`

  // Rotate banner every 10 seconds
  bannerTimer = setInterval(() => {
    currentBannerIndex.value = (currentBannerIndex.value + 1) % banners.value.length
  }, 10000)
})

onUnmounted(() => {
  if (bannerTimer) clearInterval(bannerTimer)
})
// ----------------------------------------

const userInitial = computed(() => {
  const name = authStore.currentUser?.nickname || authStore.currentUser?.phone || 'U'
  return String(name).charAt(0).toUpperCase()
})

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  showDropdown.value = false
}

function openApiConfig() {
  showMyModels.value = true
  closeDropdown()
}

function openAccountSettings() {
  // Placeholder for account settings
  Toast.info('账号设置模块开发中...')
  closeDropdown()
}

function openLogout() {
  showLogoutConfirm.value = true
  closeDropdown()
}

function handleLogout() {
  authStore.logout()
  showLogoutConfirm.value = false
}
</script>

<style scoped>
.developer-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
}

.sp-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  z-index: 10;
}

.brand { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.brand-mark { width: 28px; height: 28px; background: var(--color-text); color: var(--color-surface); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; font-family: monospace; }
.brand-name { font-size: 16px; font-weight: 600; color: var(--color-text); display: flex; align-items: center; gap: 6px; }
.role-badge { font-size: 10px; background: var(--color-primary-soft); color: var(--color-primary); padding: 2px 6px; border-radius: 4px; font-weight: 700; }

/* Dynamic Banner */
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
}

.dynamic-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  padding: 4px 16px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  white-space: nowrap;
  max-width: 100%;
}

.banner-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.header-right { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 14px; font-weight: 500; color: var(--color-text); }
.btn-ghost { padding: 6px 12px; font-size: 13px; font-weight: 500; color: var(--color-text-secondary); background: none; border: 1px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
.btn-ghost:hover { background: var(--color-bg-secondary); color: var(--color-text); }
.btn-primary { padding: 6px 16px; font-size: 13px; font-weight: 500; background: var(--color-primary); color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
.btn-primary:hover { background: var(--color-primary-hover); }

/* Dropdown */
.user-avatar-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.user-avatar-wrap:hover .user-avatar {
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 6px;
  display: flex;
  flex-direction: column;
  z-index: 100;
  animation: dropIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}

@keyframes dropIn {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.dropdown-header {
  padding: 8px 12px 10px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 4px;
}

.dropdown-user {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.dropdown-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.dropdown-item.danger {
  color: var(--color-error);
}

.dropdown-item.danger:hover {
  background: rgba(239, 68, 68, 0.08);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

.layout-main {
  flex: 1;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Modal styles for logout */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.dialog { background: var(--color-surface); border-radius: 16px; width: 100%; max-width: 320px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
</style>