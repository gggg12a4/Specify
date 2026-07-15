/** 应用入口：注册 Pinia / Router，初始化主题与本地持久化状态后挂载 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

// 样式
import '@/assets/styles/reset.css'
import '@/assets/styles/variables.css'
import '@/assets/styles/common.css'

// Highlight.js 代码高亮样式
import 'highlight.js/styles/atom-one-dark.css'

// 初始化主题
const { initTheme } = useTheme()
initTheme()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化认证状态（从 localStorage 加载已登录用户，未登录则保持 null）
// 必须在 pinia 注册后、mount 前执行，路由守卫才能正确读取 isAuthenticated
// Token 仅来自登录接口写入；不再使用 VITE_DEV_TOKEN 自动注入
const authStore = useAuthStore()
authStore.initAuth()

const appStore = useAppStore()

app.mount('#app')
