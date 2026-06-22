/**
 * 应用路由配置。
 *
 * 三套门户相互隔离：
 * - /admin     平台管理员（模型、工具、账号等后台管理）
 * - /developer 开发者（创建/编辑 App、工作空间）
 * - /user      终端用户（运行 App）
 *
 * 旧路径通过 Legacy Redirects 兼容，避免外链失效。
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomepageView from '@/views/HomepageView.vue'

const routes = [
  // ── Public Routes ──
  {
    path: '/',
    name: 'Home',
    component: HomepageView,
    meta: { requiresAuth: false }
  },
  {
    path: '/share/:code',
    name: 'AppShare',
    component: () => import('@/views/AppRunView.vue'),
    meta: { requiresAuth: false }
  },

  // ── Admin Routes ──
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '', redirect: '/admin/platforms' },
      { path: 'platforms', name: 'AdminPlatforms', component: () => import('@/views/admin/PlatformManagement.vue') },
      { path: 'models', name: 'AdminModels', component: () => import('@/views/admin/ModelList.vue') },
      { path: 'basetools', name: 'AdminBaseTools', component: () => import('@/views/admin/BaseToolManagement.vue') },
      { path: 'agent-tools', name: 'AdminAgentTools', component: () => import('@/views/admin/AgentToolManagement.vue') },
      { path: 'agent-tools/create', name: 'AdminAgentToolCreate', component: () => import('@/views/admin/AgentToolEdit.vue') },
      { path: 'agent-tools/:id/edit', name: 'AdminAgentToolEdit', component: () => import('@/views/admin/AgentToolEdit.vue') },
      { path: 'mcp-tools', name: 'AdminMcpTools', component: () => import('@/views/admin/McpToolManagement.vue') },
      { path: 'templates', name: 'AdminTemplates', component: () => import('@/views/admin/TemplateManagement.vue') },
      { path: 'accounts', name: 'AdminAccounts', component: () => import('@/views/admin/AdminAccountManagement.vue') },
      { path: 'roles', name: 'AdminRoles', component: () => import('@/views/admin/RoleManagement.vue') }
    ]
  },

  // ── Developer Routes ──
  {
    path: '/developer',
    component: () => import('@/layouts/DeveloperLayout.vue'),
    meta: { requiresAuth: true, role: 'developer' },
    children: [
      { path: '', redirect: '/developer/workspace' },
      {
        path: 'workspace',
        name: 'AgentSpace',
        component: () => import('@/views/AgentSpaceView.vue')
      },
      {
        path: 'app/create',
        name: 'AppCreate',
        component: () => import('@/views/CreateAppView.vue')
      },
      {
        path: 'app/:id/intro',
        name: 'AppIntro',
        component: () => import('@/views/AppIntroView.vue')
      },
      {
        path: 'app/:id/edit',
        name: 'AppEdit',
        component: () => import('@/views/AppEditView.vue')
      },
      {
        path: 'app/:id/run',
        name: 'AppDevRun',
        component: () => import('@/views/AppRunView.vue'),
        meta: { requiresAuth: true, role: 'developer' }
      }
    ]
  },

  // ── User Routes ──
  {
    path: '/user',
    component: () => import('@/layouts/UserLayout.vue'),
    meta: { requiresAuth: true, role: 'user' },
    children: [
      { path: '', redirect: '/user/home' },
      {
        path: 'home',
        name: 'UserHome',
        // For now, users can just see the homepage (which is public anyway) but in a logged-in state.
        // Or you can build a specific User Dashboard here.
        component: { template: '<div style="padding: 24px;"><h1>User Portal</h1><p>Here you will see your recently used Apps and recommendations.</p></div>' }
      },
      {
        path: 'app/:id/run',
        name: 'AppRun',
        component: () => import('@/views/AppRunView.vue')
      }
    ]
  },

  // ── Legacy Compatibility Redirects ──
  { path: '/workspace',   redirect: '/developer/workspace' },
  { path: '/app/create',  redirect: '/developer/app/create' },
  { path: '/app/:id/edit',redirect: '/developer/app/:id/edit' },
  { path: '/app/:id/run', redirect: '/user/app/:id/run' },

  { path: '/home',        redirect: '/' },
  { path: '/agent-space', redirect: '/developer/workspace' },
  { path: '/login',       redirect: '/' },
  { path: '/lm-config',   redirect: '/developer/workspace' },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

function portalHomePath(role) {
  if (role === 'admin') return '/admin'
  if (role === 'user') return '/user/home'
  return '/developer/workspace'
}

router.beforeEach((to) => {
  const authStore = useAuthStore()

  // 1. 受保护路由：未登录回首页
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/' }
  }

  // 2. 角色隔离：admin / developer / user 各进各的门户
  if (to.meta.requiresAuth && authStore.isAuthenticated) {
    const userRole = authStore.userRole || 'developer'
    const requiredRole = to.meta.role

    if (requiredRole && userRole !== requiredRole) {
      return { path: portalHomePath(userRole) }
    }
  }

  // 3. 已登录用户访问首页时，自动跳转到对应门户
  if (to.path === '/' && authStore.isAuthenticated) {
    return { path: portalHomePath(authStore.userRole || 'developer') }
  }

  return true
})

export default router