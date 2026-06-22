/**
 * 用户认证状态（Pinia）。
 *
 * 角色与 API 层对应关系：
 * - admin     → @/api/admin.js（真实后端登录，见 HomepageView 管理入口）
 * - developer → @/api/mockApi.js（开发者门户，创建/编辑 App）
 * - user      → @/api/mockApi.js（终端用户门户，运行 App）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'specify_token'
const USER_KEY = 'specify_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const currentUser = ref(null)

  const isAuthenticated = computed(() => !!token.value && currentUser.value !== null)

  const userRole = computed(() => currentUser.value?.role || null)

  const isAdmin = computed(() => userRole.value === 'admin')
  const isDeveloper = computed(() => userRole.value === 'developer')
  const isUser = computed(() => userRole.value === 'user')

  /** 非 admin 的门户用户（developer 或 user） */
  const isPortalUser = computed(() => isDeveloper.value || isUser.value)

  /** 头像占位首字：英文取大写，中文等直接取首字符 */
  const userInitial = computed(() => {
    const name = currentUser.value?.nickname
    if (!name) return 'U'
    const first = name.trim()[0]
    return /[a-zA-Z]/.test(first) ? first.toUpperCase() : first
  })

  /** 应用启动时从 localStorage 恢复登录态；无缓存则保持未登录 */
  function initAuth() {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUser = localStorage.getItem(USER_KEY)
      if (storedToken && storedUser) {
        token.value = storedToken
        currentUser.value = JSON.parse(storedUser)
      }
    } catch {
      // ignore
    }
  }

  /** 登录成功后写入内存并持久化，入参格式：{ token, user } */
  function login({ token: t, user }) {
    token.value = t
    currentUser.value = user
    _persist()
  }

  /** 清除本地登录态并硬跳转首页，确保各门户状态重置 */
  function logout() {
    token.value = null
    currentUser.value = null
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      // ignore
    }
    window.location.href = '/'
  }

  /** 局部更新用户资料（如昵称），并同步到 localStorage */
  function updateUser(updates) {
    if (!currentUser.value) return
    Object.assign(currentUser.value, updates)
    _persist()
  }

  function _persist() {
    try {
      localStorage.setItem(TOKEN_KEY, token.value)
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser.value))
    } catch {
      // ignore
    }
  }

  return {
    token,
    currentUser,
    userRole,
    isAuthenticated,
    isAdmin,
    isDeveloper,
    isUser,
    isPortalUser,
    userInitial,
    initAuth,
    login,
    logout,
    updateUser
  }
})
