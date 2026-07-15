<template>
  <div class="developer-layout">
    <header v-if="!hideHeader" class="sp-header">
      <div class="header-left">
        <router-link to="/developer/workspace" class="brand" style="text-decoration: none;">
          <span class="brand-mark">S</span>
          <span class="brand-name">Specify</span>
        </router-link>
      </div>

      <div class="header-right">
        <template v-if="authStore.isAuthenticated">
          <button type="button" class="header-link" @click="openApiConfig">我的模型</button>
          <span class="header-phone">{{ maskedPhone }}</span>
          <button type="button" class="header-link logout" @click="openLogout">退出登录</button>
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
    <ApiConfigModal
      :visible="apiConfigModal.state.visible"
      :app-context="apiConfigModal.state.appContext"
      @update:visible="onApiConfigVisibleChange"
      @app-credential-selected="apiConfigModal.handleAppCredentialSelected"
    />

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
import { ref, computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ApiConfigModal from '@/components/common/ApiConfigModal.vue'
import { createApiConfigModalApi, API_CONFIG_MODAL_KEY } from '@/composables/useApiConfigModal'

const route = useRoute()
const authStore = useAuthStore()
const apiConfigModal = createApiConfigModalApi()
provide(API_CONFIG_MODAL_KEY, apiConfigModal)
const showLogoutConfirm = ref(false)

/** 编辑页使用自带统一顶栏，隐藏布局层头部避免重复 */
const hideHeader = computed(() => route.name === 'AppEdit')

const maskedPhone = computed(() => {
  const phone = authStore.currentUser?.phone || authStore.currentUser?.nickname || ''
  const s = String(phone)
  if (s.length >= 7) return s.slice(0, 3) + '****' + s.slice(-4)
  return s
})

function openApiConfig() {
  apiConfigModal.open()
}

function onApiConfigVisibleChange(visible) {
  if (visible) {
    apiConfigModal.state.visible = true
  } else {
    apiConfigModal.close()
  }
}

function openLogout() {
  showLogoutConfirm.value = true
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

.header-right { display: flex; align-items: center; gap: 20px; }

.header-link {
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
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
}
.btn-ghost { padding: 6px 12px; font-size: 13px; font-weight: 500; color: var(--color-text-secondary); background: none; border: 1px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
.btn-ghost:hover { background: var(--color-bg-secondary); color: var(--color-text); }
.btn-primary { padding: 6px 16px; font-size: 13px; font-weight: 500; background: var(--color-primary); color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
.btn-primary:hover { background: var(--color-primary-hover); }

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