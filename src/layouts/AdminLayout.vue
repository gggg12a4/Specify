<template>
  <div class="admin-layout">
    <!-- Header -->
    <header class="sp-header" @click.stop>
      <div class="header-left">
        <router-link to="/admin" class="brand" style="text-decoration: none;">
          <span class="brand-mark">S</span>
          <span class="brand-name">Specify <span class="role-badge">Admin</span></span>
        </router-link>
      </div>

      <div class="header-right">
        <template v-if="authStore.isAuthenticated">
          <span class="user-name">{{ authStore.currentUser?.nickname || authStore.currentUser?.phone }}</span>
          <button class="btn-ghost btn-logout" @click="handleLogout">退出登录</button>
        </template>
      </div>
    </header>

    <!-- Content -->
    <div class="layout-body">
      <!-- Admin Sidebar (Optional for future) -->
      <aside class="admin-sidebar">
        <nav class="admin-nav">
          <div class="nav-group">
            <div class="nav-group-title" @click="toggleGroup('model')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>模型管理</span>
              <svg :style="{ transform: expandedGroups.model ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div v-show="expandedGroups.model" class="nav-group-items">
              <router-link to="/admin/platforms" class="nav-item">平台管理</router-link>
              <router-link to="/admin/models" class="nav-item">模型列表</router-link>
            </div>
          </div>

          <div class="nav-group" style="margin-top: 16px;">
            <div class="nav-group-title" @click="toggleGroup('tool')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>工具管理</span>
              <svg :style="{ transform: expandedGroups.tool ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div v-show="expandedGroups.tool" class="nav-group-items">
              <router-link to="/admin/basetools" class="nav-item">基础工具</router-link>
              <router-link to="/admin/agent-tools" class="nav-item">Agent 工具</router-link>
              <router-link to="/admin/mcp-tools" class="nav-item">MCP 工具</router-link>
              <router-link to="/admin/templates" class="nav-item">表单模板</router-link>
            </div>
          </div>

          <div class="nav-group" style="margin-top: 16px; display: none;">
            <div class="nav-group-title" @click="toggleGroup('auth')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>权限管理</span>
              <svg :style="{ transform: expandedGroups.auth ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div v-show="expandedGroups.auth" class="nav-group-items">
              <router-link to="/admin/accounts" class="nav-item">管理员账号</router-link>
              <router-link to="/admin/roles" class="nav-item">角色管理</router-link>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Main Router View -->
      <main class="layout-main">
        <router-view @toast="handleToast" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { showToast } from '@/composables/useNotification'

const authStore = useAuthStore()
const router = useRouter()

const expandedGroups = reactive({
  model: true,
  tool: true,
  auth: true
})

function toggleGroup(group) {
  expandedGroups[group] = !expandedGroups[group]
}

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    authStore.logout()
  }
}

function handleToast(event) {
  if (typeof event === 'string') {
    showToast({ type: 'info', message: event })
  } else if (event && typeof event === 'object') {
    showToast({
      type: event.type || 'info',
      message: event.msg || event.message || '操作成功'
    })
  }
}
</script>

<style scoped>
.admin-layout {
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
.role-badge { font-size: 10px; background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: 700; }

.header-right { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 14px; font-weight: 500; color: var(--color-text); }
.btn-ghost { padding: 6px 12px; font-size: 13px; font-weight: 500; color: var(--color-text-secondary); background: none; border: 1px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
.btn-ghost:hover { background: var(--color-bg-secondary); color: var(--color-text); }

.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.admin-sidebar {
  width: 220px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: 20px 0;
}

.admin-nav {
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  gap: 4px;
}

.nav-group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 16px;
  margin-bottom: 4px;
}

.nav-item {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.nav-item.router-link-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 500;
}

.layout-main {
  flex: 1;
  overflow-y: auto;
  position: relative;
  background: var(--color-bg); /* Add background so it doesn't flicker transparently */
}

.nav-group-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>