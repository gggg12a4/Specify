<template>
  <div class="homepage-wrapper">
    <div class="hp-page">

    <!-- ══ NAV ══ -->
    <nav class="nav">
      <a class="nav-logo" href="#" @click.prevent="openLogin">
        <div class="nav-mark">S</div>
        <span class="nav-name">Specify</span>
      </a>
      <div class="nav-space"></div>
      <div class="nav-links">
        <a class="nav-link" href="#features">功能</a>
        <a class="nav-link" href="#steps">上手流程</a>
      </div>
      <template v-if="authStore.isAuthenticated">
        <span class="nav-user">{{ authStore.currentUser?.nickname || authStore.currentUser?.phone }}</span>
        <a class="btn btn-ghost" href="#" @click.prevent="authStore.logout" style="margin-left:8px">退出登录</a>
        <a class="btn btn-primary" href="#" @click.prevent="goToWorkspace" style="margin-left:8px">进入工作区</a>
      </template>
      <template v-else>
        <a class="btn btn-ghost" href="#" @click.prevent="openLogin">登录</a>
        <a class="btn btn-primary" href="#" @click.prevent="openRegister">注册 / 开始使用</a>
        <a class="btn btn-ghost" href="#" @click.prevent="openAdminLogin" style="margin-left:8px">管理入口</a>
      </template>
    </nav>


    <!-- ══ HERO ══ -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          无代码 · 可组合 · 真落地
        </div>
        <h1 class="hero-h1">
          搭 Agent，<br />
          <span class="grad">像搭积木一样简单</span>
        </h1>
        <p class="hero-sub">
          不需要写代码，不需要拖节点。<br />
          用自然语言描述你的想法，<strong>任何人</strong>都能做出
          <strong>真正能用、能跑、能分享</strong>的 AI 产品。
        </p>
        <div class="hero-ctas">
          <a class="btn-hero btn-hero-primary" href="#" @click.prevent="handleCreateAgent">
            <span>创建 agent</span>
            <span>→</span>
          </a>
        </div>

        <!-- product mockup -->
        <div class="hero-product">
          <div class="hp-bar">
            <div class="hp-dots">
              <div class="hp-dot r"></div>
              <div class="hp-dot y"></div>
              <div class="hp-dot g"></div>
            </div>
            <div class="hp-bar-title">Specify — Agent Editor</div>
          </div>
          <div class="hp-body">
            <div class="hp-sidebar">
              <div style="margin-bottom:20px;">
                <span class="hp-section-label">我的 agent</span>
                <div class="hp-item active">
                  <div class="hp-dot-sm dot-p"></div>数据分析助手
                </div>
                <div class="hp-item">
                  <div class="hp-dot-sm dot-g"></div>英语老师
                </div>
                <div class="hp-item">
                  <div class="hp-dot-sm dot-o"></div>代码审查器
                </div>
              </div>
              <div>
                <span class="hp-section-label">子 Agent</span>
                <div class="hp-item">
                  <div class="hp-dot-sm dot-b"></div>报告生成器
                </div>
                <div class="hp-item">
                  <div class="hp-dot-sm dot-dim"></div>数据清洗器
                </div>
              </div>
            </div>
            <div class="hp-main">
              <div class="hp-card">
                <span class="hp-card-label">系统 Prompt</span>
                <div class="hp-prompt">你是一位专业的数据分析助手。用户上传 CSV 文件后，<br />分析数据趋势，生成报告保存到 workspace/report.md<span class="hp-cursor"></span></div>
              </div>
              <div class="hp-card">
                <span class="hp-card-label">工具 · 子 Agent</span>
                <div class="hp-chips">
                  <div class="hp-chip chip-p">📖 SPread</div>
                  <div class="hp-chip chip-g">✏️ SPwrite</div>
                  <div class="hp-chip chip-b">🔍 SPgrep</div>
                  <div class="hp-chip chip-o">🤖 报告生成器</div>
                </div>
              </div>
              <div class="hp-card hp-status">
                <div class="hp-status-dot"></div>
                <div class="hp-status-text">Agent 运行中 → workspace/report.md 已生成</div>
                <div class="hp-status-badge">✓ 完成</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>


    <!-- ══ AUDIENCE ══ -->
    <section class="section audience-section" id="start">
      <div class="section-inner">
        <div class="centered">
          <span class="sec-label">适合所有人</span>
          <h2 class="sec-h2">不管你是<strong>想用</strong>，还是<strong>想做</strong></h2>
          <p class="sec-body">使用现成 agent 解决问题，或者搭出你自己的 Agent——Specify 都给你准备好了。</p>
        </div>
        <div class="audience-grid">
          <div class="aud-card">
            <div class="aud-icon-wrap v1">🎯</div>
            <h3 class="aud-h3">适合任何角色</h3>
            <p class="aud-body">无论你是产品经理、运营人员、还是独立开发者。只要你有想法，这里就是让想法落地的最佳工具台。</p>
          </div>
          <div class="aud-card">
            <div class="aud-icon-wrap v2">🔧</div>
            <h3 class="aud-h3">搭出你自己的 Agent</h3>
            <p class="aud-body">有个想法却不知道怎么落地？在 Specify 上，写下你的想法就是第一步。几分钟内，一个有真实能力的 AI 产品就成形了。</p>
            <a class="link-arrow" href="#steps">了解搭建流程 <span>→</span></a>
          </div>
        </div>
      </div>
    </section>


    <!-- ══ FEATURES ══ -->
    <section class="section features-section" id="features">
      <div class="section-inner">
        <div class="centered">
          <span class="sec-label">核心能力</span>
          <h2 class="sec-h2">不只是聊天框<br /><strong>是真正能做事的 Agent</strong></h2>
          <p class="sec-body">Specify 让 Agent 拥有记忆、工具、文件空间，还能互相调用、组合成复杂工作流。</p>
        </div>
        <div class="feat-grid">
          <div class="feat-card">
            <div class="feat-icon fi-1">🧩</div>
            <h3 class="feat-h3">积木式组合</h3>
            <p class="feat-body">一个 Agent 可以调用另一个 Agent。把复杂任务拆成小模块，用自然语言描述协作关系，工作流自然成形，无需拖拽，无需代码。</p>
          </div>
          <div class="feat-card">
            <div class="feat-icon fi-2">🗂️</div>
            <h3 class="feat-h3">文件空间驱动</h3>
            <p class="feat-body">每个 agent 都有专属文件空间。上传资料、保存报告、积累记忆——全部有地方放，每个用户数据彼此隔离。</p>
          </div>
          <div class="feat-card">
            <div class="feat-icon fi-3">🧠</div>
            <h3 class="feat-h3">长期记忆</h3>
            <p class="feat-body">memory 目录让 Agent 记住用户偏好和关键结论，下次对话直接参考，越用越懂你，不再每次从零开始。</p>
          </div>
          <div class="feat-card">
            <div class="feat-icon fi-4">⚡</div>
            <h3 class="feat-h3">丰富工具集</h3>
            <p class="feat-body">内置 SPread、SPwrite、SPgrep 等文件操作工具，按需勾选启用，无需手写工具调用代码，开箱即用。</p>
          </div>
          <div class="feat-card">
            <div class="feat-icon fi-5">🤖</div>
            <h3 class="feat-h3">多模型支持</h3>
            <p class="feat-body">支持 Claude、Gemini、OpenAI 三大平台，可使用平台提供的模型，也可自带密钥（BYOK）使用自己的 API。</p>
          </div>
        </div>

        <div class="evo-card">
          <div>
            <span class="sec-label">可进化的设计</span>
            <h3 class="evo-h3">越用越好用<br />不是搭完就放着</h3>
            <p class="evo-body" style="margin-top:12px;">Skills 叠加复用；memory 随对话积累；子 Agent 独立优化迭代。你的 Agent 是持续成长的资产，而不是搭好就开始慢慢过时的工具。</p>
          </div>
          <div class="file-tree">
            <div class="ft-root">我的 app/</div>
            <div>&nbsp;&nbsp;<span class="ft-t">├──</span> <span class="ft-dir">shared/</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="ft-comment">← 知识库，所有用户共享</span></div>
            <div>&nbsp;&nbsp;<span class="ft-t">└──</span> <span class="ft-dir">users/</span></div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="ft-t">└──</span> <span class="ft-dir">[user-id]/</span></div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="ft-t">├──</span> <span class="ft-dir">workspace/</span>&nbsp;&nbsp;<span class="ft-comment">← 产出文件</span></div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="ft-t">├──</span> <span class="ft-dir">memory/</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="ft-comment">← 长期记忆</span></div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="ft-t">├──</span> <span class="ft-dir">temp/</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="ft-comment">← 临时文件</span></div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="ft-t">└──</span> <span class="ft-dir">assets/</span>&nbsp;&nbsp;&nbsp;<span class="ft-comment">← 用户上传内容</span></div>
          </div>
        </div>
      </div>
    </section>


    <!-- ══ STEPS ══ -->
    <section class="section steps-section" id="steps">
      <div class="section-inner">
        <div class="centered">
          <span class="sec-label">三步上手</span>
          <h2 class="sec-h2">从想法到产品<br /><strong>三步走完</strong></h2>
          <p class="sec-body">不需要技术背景，不需要提前配置。打开浏览器，就能开始。</p>
        </div>
        <div class="steps-grid">
          <div class="step-card">
            <span class="step-num">Step 01</span>
            <h3 class="step-h3">写下你的想法</h3>
            <p class="step-body">用自然语言告诉 Agent 它是谁、能做什么、遇到问题怎么处理。就像给新同事写工作说明书，没有门槛。</p>
          </div>
          <div class="step-card">
            <span class="step-num">Step 02</span>
            <h3 class="step-h3">搭上你需要的能力</h3>
            <p class="step-body">勾选工具（读文件、写报告、搜索内容……），或者创建子 Agent 处理复杂子任务。积木一块块加上去，工作流自然成形。</p>
          </div>
          <div class="step-card">
            <span class="step-num">Step 03</span>
            <h3 class="step-h3">运行、调试与固化</h3>
            <p class="step-body">在调试模式里测到满意，固化配置，投入你的真实业务流程之中发挥价值。</p>
          </div>
        </div>
      </div>
    </section>


    <!-- ══ CTA ══ -->
    <section class="cta-section">
      <div class="cta-inner">
        <h2 class="cta-h2">你的第一个 Agent<br /><strong>从现在开始</strong></h2>
        <p class="cta-body">不需要技术背景，不需要提前配置任何东西。写下你的想法，Specify 把它变成现实。</p>
        <div class="cta-btns">
          <a class="btn-cta-primary" href="#" @click.prevent="handleCreateAgent">创建我的第一个 agent →</a>
        </div>
        <p class="cta-note">快速上手 · 构建私有工具</p>
      </div>
    </section>


    <!-- ══ FOOTER ══ -->
    <footer class="footer">
      <div class="footer-brand">
        <div class="nav-mark">S</div>
        <span>Specify</span>
      </div>
      <p class="footer-copy">搭 Agent，像搭积木一样简单</p>
      <p class="footer-copy">© 2026 Specify · lancex.ai</p>
    </footer>

  </div>

  <AuthModal
    v-model:visible="showAuthModal"
    :initial-tab="authInitialTab"
    @logged-in="onLoggedIn"
  />

  <!-- 管理员登录弹窗 -->
  <div v-if="showAdminLogin" class="admin-login-overlay" @click.self="showAdminLogin = false">
    <form class="admin-login-box" @submit.prevent="doAdminLogin">
      <h3>管理后台登录</h3>
      <input v-model="adminUsername" type="text" placeholder="用户名" class="admin-input" autocomplete="username" />
      <input v-model="adminPassword" type="password" placeholder="密码" class="admin-input" autocomplete="current-password" />

      <select v-model="adminLoginOrgCode" class="admin-input admin-select">
        <option value="">请选择登录部门 (选填)</option>
        <option value="OPERATOR">运营人员</option>
        <option value="MODEL_ADMIN">模型管理员</option>
        <option value="TOOL_ADMIN">工具管理员</option>
        <option value="SUPER_ADMIN">超级管理员</option>
      </select>

      <div class="captcha-row">
        <input v-model="adminCaptcha" type="text" placeholder="验证码" class="admin-input captcha-input" autocomplete="off" />
        <img v-if="captchaImage" :src="captchaImage" class="captcha-img" @click="refreshCaptcha" alt="验证码" title="点击刷新" />
        <div v-else class="captcha-img-placeholder" @click="refreshCaptcha">获取验证码</div>
      </div>

      <p v-if="adminError" class="admin-error">{{ adminError }}</p>
      <button class="admin-btn" type="submit">登录</button>
    </form>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { login as loginApi, getRandomImage } from '@/api/auth'
import { normalizeLoginSession } from '@/utils/loginSession'
import AuthModal from '@/components/common/AuthModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showAuthModal = ref(false)
const authInitialTab = ref('login')

// 管理员登录
const showAdminLogin = ref(false)
const adminUsername = ref('')
const adminPassword = ref('')
const adminLoginOrgCode = ref('')
const adminCaptcha = ref('')
const captchaImage = ref('')
const checkKey = ref('')
const adminError = ref('')

// 获取验证码
async function refreshCaptcha() {
  checkKey.value = Date.now().toString()
  try {
    const res = await getRandomImage(checkKey.value)
    if (res.success || res.code === 0) {
      captchaImage.value = res.result || res.data
    }
  } catch (error) {
    console.error('Failed to get captcha:', error)
  }
}

onMounted(() => {
  if (route.query.loggedOut) {
    router.replace({ path: '/', query: {} })
  }
})

function openLogin() {
  authInitialTab.value = 'login'
  showAuthModal.value = true
}

function openRegister() {
  authInitialTab.value = 'register'
  showAuthModal.value = true
}

function portalPath() {
  const role = authStore.userRole
  if (role === 'admin') return '/admin'
  if (role === 'user') return '/user/home'
  return '/developer/workspace'
}

function onLoggedIn() {
  window.open(portalPath(), '_blank')
}

function goToWorkspace() {
  window.open(portalPath(), '_blank')
}

function openAdminLogin() {
  adminUsername.value = ''
  adminPassword.value = ''
  adminLoginOrgCode.value = ''
  adminCaptcha.value = ''
  adminError.value = ''
  showAdminLogin.value = true
  refreshCaptcha()
}

async function doAdminLogin() {
  adminError.value = ''
  if (!adminUsername.value || !adminPassword.value) {
    adminError.value = '请输入用户名和密码'
    return
  }

  try {
    const res = await loginApi({
      username: adminUsername.value,
      password: adminPassword.value,
      loginOrgCode: adminLoginOrgCode.value,
      captcha: adminCaptcha.value,
      checkKey: checkKey.value
    })

    const session = normalizeLoginSession(res, {
      role: 'admin',
      fallbackUsername: adminUsername.value,
    })
    if (session.ok) {
      authStore.login({ token: session.token, user: session.user })
      showAdminLogin.value = false
      router.push('/admin')
    } else {
      adminError.value = session.message
      refreshCaptcha()
    }
  } catch (error) {
    console.error('Admin login error:', error)
    adminError.value = error.message || '网络或服务器错误，请稍后重试'
    refreshCaptcha()
  }
}

function handleCreateAgent() {
  if (!authStore.isAuthenticated) { openLogin(); return }
  window.open(portalPath(), '_blank')
}

</script>

<style scoped>
.hp-page {
  --ink: #0a0e2d;
  --ink-2: #1e2a3a;
  --body: #4a5568;
  --muted: #8896ab;
  --faint: #b0bac8;

  --purple: #5a4af4;
  --purple-2: #4434d4;
  --purple-3: #7c6ef8;
  --purple-bg: rgba(90, 74, 244, 0.07);
  --purple-bg2: rgba(90, 74, 244, 0.12);

  --canvas: #ffffff;
  --surface: #f8f9fc;
  --surface-2: #f1f3f9;

  --border: #e2e8f0;
  --border-2: rgba(90, 74, 244, 0.18);

  --shadow-sm: 0 2px 6px rgba(50, 50, 93, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 6px 24px rgba(50, 50, 93, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 13px 48px rgba(50, 50, 93, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 30px 80px rgba(50, 50, 93, 0.18), 0 8px 24px rgba(0, 0, 0, 0.1);

  --font: 'Inter', -agentle-system, 'PingFang SC', 'Helvetica Neue', sans-serif;
  --mono: 'SF Mono', 'Fira Code', Menlo, monospace;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;

  background: var(--canvas);
  color: var(--ink);
  font-family: var(--font);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  scroll-behavior: smooth;
  padding-top: 62px;
}

/* ─── NAV ─── */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  height: 62px;
  display: flex;
  align-items: center;
  padding: 0 40px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.nav-mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--purple), #8b6ef8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  box-shadow: 0 3px 10px rgba(90, 74, 244, 0.35);
}

.nav-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.nav-user {
  font-size: 14px;
  font-weight: 500;
  color: var(--body);
  margin-right: 4px;
}

.nav-space {
  flex: 1;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  font-size: 14px;
  color: var(--body);
  text-decoration: none;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  transition: background .12s, color .12s;
}

.nav-link:hover {
  background: var(--surface);
  color: var(--ink);
}

.btn {
  display: inline-flex;
  align-items: center;
  font-family: var(--font);
  cursor: pointer;
  text-decoration: none;
  transition: all .15s;
  white-space: nowrap;
  border: none;
}

.btn-ghost {
  background: transparent;
  color: var(--body);
  font-size: 14px;
  font-weight: 400;
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.btn-ghost:hover {
  border-color: var(--purple-3);
  color: var(--purple);
}

.btn-primary {
  background: var(--purple);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 9px 20px;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(90, 74, 244, 0.3);
  margin-left: 8px;
}

.btn-primary:hover {
  background: var(--purple-2);
  box-shadow: 0 4px 14px rgba(90, 74, 244, 0.4);
  transform: translateY(-1px);
}

/* ─── HERO ─── */
.hero {
  position: relative;
  padding: 100px 40px 80px;
  text-align: center;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 900px;
  height: 700px;
  background: radial-gradient(ellipse at 50% 40%,
      rgba(130, 110, 248, 0.14) 0%,
      rgba(90, 74, 244, 0.06) 40%,
      transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.hero::after {
  content: '';
  position: absolute;
  top: 60px;
  left: 15%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(147, 112, 255, 0.09) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 820px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--purple-bg);
  border: 1px solid var(--border-2);
  border-radius: 100px;
  padding: 5px 14px 5px 9px;
  font-size: 13px;
  font-weight: 500;
  color: var(--purple);
  margin-bottom: 36px;
}

.hero-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--purple);
  box-shadow: 0 0 0 3px rgba(90, 74, 244, 0.2);
}

.hero-h1 {
  font-size: clamp(44px, 6vw, 76px);
  font-weight: 300;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: var(--ink);
  margin-bottom: 22px;
}

.hero-h1 .grad {
  font-weight: 500;
  background: linear-gradient(135deg, var(--purple) 0%, #a78bfa 55%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub {
  font-size: clamp(17px, 2vw, 20px);
  font-weight: 300;
  color: var(--body);
  line-height: 1.65;
  max-width: 520px;
  margin: 0 auto 44px;
}

.hero-sub strong {
  color: var(--ink-2);
  font-weight: 500;
}

.hero-ctas {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 72px;
}

.btn-hero {
  font-size: 16px;
  font-weight: 500;
  font-family: var(--font);
  padding: 13px 30px;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
  transition: all .15s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-hero-primary {
  background: linear-gradient(135deg, var(--purple), #7c6ef8);
  color: #fff;
  box-shadow: 0 4px 18px rgba(90, 74, 244, 0.35), 0 1px 4px rgba(0, 0, 0, 0.1);
}

.btn-hero-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(90, 74, 244, 0.4);
}

.btn-hero-secondary {
  background: var(--canvas);
  color: var(--ink-2);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.btn-hero-secondary:hover {
  border-color: var(--purple-3);
  color: var(--purple);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.hero-product {
  max-width: 900px;
  margin: 0 auto;
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  position: relative;
}

.hero-product::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--purple), #a78bfa, #60a5fa);
}

.hp-bar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 13px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hp-dots {
  display: flex;
  gap: 5px;
}

.hp-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.hp-dot.r { background: #ff5f57; }
.hp-dot.y { background: #febc2e; }
.hp-dot.g { background: #28c840; }

.hp-bar-title {
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.02em;
}

.hp-body {
  display: grid;
  grid-template-columns: 210px 1fr;
  min-height: 280px;
}

.hp-sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 16px 0;
}

.hp-section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
  padding: 0 16px 8px;
  display: block;
}

.hp-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: var(--body);
  transition: background .1s, color .1s;
}

.hp-item:hover {
  background: rgba(90, 74, 244, 0.05);
  color: var(--ink);
}

.hp-item.active {
  background: var(--purple-bg);
  color: var(--purple);
  font-weight: 500;
  border-right: 2px solid var(--purple);
}

.hp-dot-sm {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-p { background: var(--purple); }
.dot-g { background: #22c55e; }
.dot-o { background: #f97316; }
.dot-b { background: #3b82f6; }
.dot-dim { background: var(--border); }

.hp-main {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hp-card {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  box-shadow: var(--shadow-sm);
}

.hp-card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
  margin-bottom: 9px;
  display: block;
}

.hp-prompt {
  font-size: 12.5px;
  font-family: var(--mono);
  color: var(--body);
  line-height: 1.8;
}

.hp-cursor {
  display: inline-block;
  width: 2px;
  height: 13px;
  background: var(--purple);
  vertical-align: middle;
  margin-left: 1px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.hp-chips {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.hp-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-family: var(--mono);
  border-radius: 6px;
  padding: 5px 11px;
  border: 1px solid;
}

.chip-p { color: var(--purple); background: rgba(90, 74, 244, 0.07); border-color: rgba(90, 74, 244, 0.2); }
.chip-g { color: #16a34a; background: rgba(34, 197, 94, 0.07); border-color: rgba(34, 197, 94, 0.2); }
.chip-o { color: #ea580c; background: rgba(249, 115, 22, 0.08); border-color: rgba(249, 115, 22, 0.2); }
.chip-b { color: #2563eb; background: rgba(59, 130, 246, 0.07); border-color: rgba(59, 130, 246, 0.2); }

.hp-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hp-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2); }
  50% { box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.1); }
}

.hp-status-text {
  font-size: 13px;
  font-family: var(--mono);
  color: var(--body);
  flex: 1;
}

.hp-status-badge {
  font-size: 11px;
  font-weight: 600;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  color: #16a34a;
  border-radius: 5px;
  padding: 3px 9px;
  letter-spacing: 0.02em;
}

/* ─── SECTION COMMON ─── */
.section {
  padding: 96px 40px;
}

.section-inner {
  max-width: 1040px;
  margin: 0 auto;
}

.sec-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--purple);
  background: var(--purple-bg);
  border: 1px solid var(--border-2);
  border-radius: 100px;
  padding: 4px 12px;
  margin-bottom: 20px;
}

.sec-h2 {
  font-size: clamp(30px, 3.5vw, 48px);
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.025em;
  color: var(--ink);
  margin-bottom: 14px;
}

.sec-h2 strong {
  font-weight: 600;
}

.sec-body {
  font-size: 18px;
  font-weight: 300;
  color: var(--body);
  line-height: 1.65;
  max-width: 480px;
  margin-bottom: 56px;
}

.centered {
  text-align: center;
}

.centered .sec-body {
  margin-left: auto;
  margin-right: auto;
}

/* ─── AUDIENCE ─── */
.audience-section {
  background: var(--surface);
}

.audience-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.aud-card {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 44px;
  box-shadow: var(--shadow-md);
  transition: transform .2s, box-shadow .2s;
}

.aud-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.aud-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.aud-icon-wrap.v1 { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }
.aud-icon-wrap.v2 { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }

.aud-h3 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.022em;
  line-height: 1.2;
  color: var(--ink);
  margin-bottom: 12px;
}

.aud-body {
  font-size: 16px;
  font-weight: 300;
  color: var(--body);
  line-height: 1.7;
  margin-bottom: 28px;
}

.link-arrow {
  font-size: 14px;
  font-weight: 500;
  color: var(--purple);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: gap .15s;
}

.link-arrow:hover {
  gap: 9px;
}

/* ─── FEATURES ─── */
.features-section {
  background: var(--canvas);
}

.feat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.feat-card {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-sm);
  transition: transform .2s, box-shadow .2s, border-color .2s;
}

.feat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: rgba(90, 74, 244, 0.2);
}

.feat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 18px;
}

.fi-1 { background: linear-gradient(135deg, #ede9fe, #c4b5fd); }
.fi-2 { background: linear-gradient(135deg, #e0f2fe, #bae6fd); }
.fi-3 { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.fi-4 { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.fi-5 { background: linear-gradient(135deg, #fce7f3, #fbcfe8); }
.fi-6 { background: linear-gradient(135deg, #f0fdf4, #bbf7d0); }

.feat-h3 {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.018em;
  color: var(--ink);
  margin-bottom: 9px;
}

.feat-body {
  font-size: 14px;
  font-weight: 300;
  color: var(--body);
  line-height: 1.7;
}

.evo-card {
  margin-top: 16px;
  background: linear-gradient(135deg, #faf8ff 0%, #f0f4ff 100%);
  border: 1px solid rgba(90, 74, 244, 0.12);
  border-radius: var(--radius-xl);
  padding: 48px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
  box-shadow: var(--shadow-md);
}

.evo-h3 {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--ink);
  margin-bottom: 12px;
  line-height: 1.25;
}

.evo-body {
  font-size: 15px;
  font-weight: 300;
  color: var(--body);
  line-height: 1.75;
}

.file-tree {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 22px 26px;
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 2.1;
  color: var(--muted);
  box-shadow: var(--shadow-sm);
}

.ft-root { color: var(--ink); font-weight: 600; }
.ft-dir { color: var(--purple); font-weight: 500; }
.ft-comment { color: var(--faint); }
.ft-t { color: var(--border); }

/* ─── STEPS ─── */
.steps-section {
  background: var(--surface);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 56px;
}

.step-card {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 36px 32px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.step-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0.7;
}

.step-card:nth-child(1)::after { background: linear-gradient(90deg, #5a4af4, #a78bfa); }
.step-card:nth-child(2)::after { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.step-card:nth-child(3)::after { background: linear-gradient(90deg, #22c55e, #86efac); }

.step-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--purple);
  letter-spacing: 0.08em;
  margin-bottom: 20px;
  display: block;
  text-transform: uppercase;
}

.step-h3 {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-bottom: 10px;
}

.step-body {
  font-size: 14px;
  font-weight: 300;
  color: var(--body);
  line-height: 1.75;
}

/* ─── CTA ─── */
.cta-section {
  background: linear-gradient(140deg, #0f0a2e 0%, #1a1060 40%, #0d1a4a 100%);
  padding: 120px 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-section::before {
  content: '';
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 500px;
  background: radial-gradient(ellipse, rgba(130, 110, 248, 0.25) 0%, transparent 65%);
  pointer-events: none;
}

.cta-section::after {
  content: '';
  position: absolute;
  bottom: -80px;
  right: 10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, transparent 65%);
  pointer-events: none;
}

.cta-inner {
  position: relative;
  z-index: 1;
  max-width: 620px;
  margin: 0 auto;
}

.cta-h2 {
  font-size: clamp(36px, 5vw, 60px);
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #fff;
  margin-bottom: 18px;
}

.cta-h2 strong {
  font-weight: 600;
  background: linear-gradient(135deg, #c4b5fd, #93c5fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cta-body {
  font-size: 18px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.65;
  margin-bottom: 44px;
}

.cta-btns {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-cta-primary {
  font-size: 16px;
  font-weight: 500;
  font-family: var(--font);
  padding: 14px 32px;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  text-decoration: none;
  background: linear-gradient(135deg, #7c6ef8, #60a5fa);
  color: #fff;
  box-shadow: 0 4px 20px rgba(124, 110, 248, 0.4);
  transition: all .15s;
}

.btn-cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(124, 110, 248, 0.5);
}

.btn-cta-ghost {
  font-size: 16px;
  font-weight: 400;
  font-family: var(--font);
  padding: 13px 28px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all .15s;
}

.btn-cta-ghost:hover {
  border-color: rgba(255, 255, 255, 0.45);
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.cta-note {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 22px;
  letter-spacing: 0.02em;
}

/* ─── FOOTER ─── */
.footer {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 28px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 9px;
}

.footer-brand .nav-mark {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  font-size: 11px;
}

.footer-brand span {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.footer-copy {
  font-size: 13px;
  color: var(--muted);
}

/* ─── RESPONSIVE ─── */
@media (max-width: 960px) {
  .hero-product { display: none; }
  .audience-grid { grid-template-columns: 1fr; }
  .feat-grid { grid-template-columns: 1fr 1fr; }
  .evo-card { grid-template-columns: 1fr; gap: 32px; }
  .steps-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
  .section { padding: 72px 24px; }
  .hero { padding: 72px 24px 64px; }
}

@media (max-width: 600px) {
  .feat-grid { grid-template-columns: 1fr; }
  .hero-ctas { flex-direction: column; align-items: center; }
  .cta-btns { flex-direction: column; align-items: center; }
  .nav { padding: 0 20px; }
  .footer { padding: 20px 24px; }
}

.admin-login-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.admin-login-box {
  background: #fff; border-radius: 12px; padding: 32px; width: 340px;
  display: flex; flex-direction: column; gap: 16px;
}
.admin-login-box h3 { margin: 0; font-size: 18px; text-align: center; }
.admin-input {
  padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;
  outline: none; transition: border-color 0.2s;
}
.admin-input:focus { border-color: #4f46e5; }
.admin-select {
  color: #333;
  background-color: #fff;
  cursor: pointer;
}
.admin-select:invalid {
  color: #999;
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.captcha-input {
  flex: 1;
}
.captcha-img, .captcha-img-placeholder {
  width: 100px;
  height: 40px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.captcha-img {
  object-fit: contain;
  background-color: #f9fafb;
}
.captcha-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #888;
  background-color: #eee;
}

.admin-btn {
  width: 100%; padding: 10px; font-size: 14px; cursor: pointer;
  background: #6c5ce7; color: #fff; border: none; border-radius: 8px; font-weight: 500;
}
.admin-btn:hover { background: #5a4bd1; }
.admin-error { color: #e53e3e; font-size: 13px; margin: 0; text-align: center; }
</style>
