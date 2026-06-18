<template>
  <div class="developer-layout">
    <!-- Header extracted from AgentSpaceView -->
    <header class="sp-header" @click.stop>
      <div class="header-left">
        <router-link to="/developer/workspace" class="brand" style="text-decoration: none;">
          <span class="brand-mark">S</span>
          <span class="brand-name">Specify <span class="role-badge">Dev</span></span>
        </router-link>
      </div>

      <div class="header-right">
        <template v-if="authStore.isAuthenticated">
          <button class="btn-ghost" @click="showMyModels = true">我的模型</button>
          <span class="user-name">{{ authStore.currentUser?.nickname || authStore.currentUser?.phone }}</span>
          <button class="btn-ghost btn-logout" @click="showLogoutConfirm = true">退出登录</button>
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
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ApiConfigModal from '@/components/common/ApiConfigModal.vue'

const authStore = useAuthStore()
const showMyModels = ref(false)
const showLogoutConfirm = ref(false)

function handleLogout() {
  authStore.logout()
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

.header-right { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 14px; font-weight: 500; color: var(--color-text); }
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