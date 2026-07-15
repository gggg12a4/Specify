<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click="$emit('update:visible', false)">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <div class="tabs">
              <button
                class="tab"
                :class="{ active: activeTab === 'login' }"
                @click="activeTab = 'login'"
              >登录</button>
              <button
                class="tab"
                :class="{ active: activeTab === 'register' }"
                @click="activeTab = 'register'"
              >注册</button>
            </div>
            <button class="close-btn" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- 登录表单 -->
          <form v-if="activeTab === 'login'" class="dialog-body" @submit.prevent="handleLogin">
            <div class="field">
              <label class="field-label">手机号</label>
              <input v-model="loginForm.phone" class="field-input" placeholder="请输入手机号" type="tel" maxlength="11" autocomplete="username" />
            </div>
            <div class="field">
              <label class="field-label">密码</label>
              <input v-model="loginForm.password" class="field-input" placeholder="请输入密码" type="password" autocomplete="current-password" />
            </div>
            <div class="field">
              <label class="field-label">验证码</label>
              <div class="captcha-row">
                <input v-model="loginForm.captcha" class="field-input captcha-input" placeholder="请输入验证码" type="text" autocomplete="off" />
                <img
                  v-if="captchaImage"
                  :src="captchaImage"
                  class="captcha-img"
                  alt="验证码"
                  title="点击刷新"
                  @click="refreshCaptcha"
                />
                <button v-else type="button" class="captcha-placeholder" @click="refreshCaptcha">获取验证码</button>
              </div>
            </div>
            <span v-if="loginSuccess" class="form-success">{{ loginSuccess }}</span>
            <span v-if="loginError" class="form-error">{{ loginError }}</span>
          </form>

          <!-- 注册表单 -->
          <form v-else class="dialog-body" @submit.prevent="handleRegister">
            <div class="field">
              <label class="field-label">手机号</label>
              <input v-model="regForm.phone" class="field-input" placeholder="请输入手机号" type="tel" maxlength="11" autocomplete="username" />
            </div>
            <div class="field field-smscode-hidden">
              <label class="field-label">短信验证码</label>
              <input v-model="regForm.smscode" class="field-input" placeholder="请输入短信验证码" type="text" autocomplete="one-time-code" />
            </div>
            <div class="field">
              <label class="field-label">密码</label>
              <input v-model="regForm.password" class="field-input" placeholder="请设置密码（6位以上）" type="password" autocomplete="new-password" />
            </div>
            <div class="field">
              <label class="field-label">确认密码</label>
              <input v-model="regForm.confirm" class="field-input" placeholder="再次输入密码" type="password" autocomplete="new-password" />
            </div>
            <span v-if="regError" class="form-error">{{ regError }}</span>
          </form>

          <div class="dialog-footer">
            <button class="btn-primary full-width" :disabled="submitting" @click="activeTab === 'login' ? handleLogin() : handleRegister()">
              {{ submitting ? '处理中...' : (activeTab === 'login' ? '登录' : '注册') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * 登录/注册弹窗。
 * 登录：POST /sys/login；注册：POST /sys/user/register（成功后需另行登录）。
 */
import { ref, reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { login as loginApi, register as registerApi, getRandomImage } from '@/api/auth'
import { normalizeLoginSession } from '@/utils/loginSession'

/** 开发/测试环境短信万能码，对应后端 jeecg.firewall.smsMockCode */
const DEFAULT_SMS_CODE = '666666'

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialTab: { type: String, default: 'login' }
})
const emit = defineEmits(['update:visible', 'logged-in'])

const authStore = useAuthStore()
const activeTab = ref('login')
const submitting = ref(false)
const loginError = ref('')
const loginSuccess = ref('')
const regError = ref('')
const captchaImage = ref('')
const checkKey = ref('')

const loginForm = reactive({ phone: '', password: '', captcha: '' })
const regForm = reactive({ phone: '', smscode: DEFAULT_SMS_CODE, password: '', confirm: '' })

function resetRegForm() {
  regForm.phone = ''
  regForm.smscode = DEFAULT_SMS_CODE
  regForm.password = ''
  regForm.confirm = ''
  regError.value = ''
}

async function refreshCaptcha() {
  checkKey.value = Date.now().toString()
  captchaImage.value = ''
  try {
    const res = await getRandomImage(checkKey.value)
    if (res.code === 0) {
      captchaImage.value = res.data || ''
    }
  } catch {
    loginError.value = '验证码加载失败，请稍后重试'
  }
}

/** 弹窗打开时重置表单、错误信息与 tab */
watch(() => props.visible, (v) => {
  if (v) {
    activeTab.value = props.initialTab
    loginForm.phone = ''
    loginForm.password = ''
    loginForm.captcha = ''
    resetRegForm()
    loginError.value = ''
    loginSuccess.value = ''
    if (props.initialTab === 'login' || activeTab.value === 'login') {
      refreshCaptcha()
    }
  }
})

watch(activeTab, (tab) => {
  if (tab === 'login' && props.visible) {
    refreshCaptcha()
  }
})

/** 手机号密码登录（username 传手机号） */
async function handleLogin() {
  loginError.value = ''
  loginSuccess.value = ''
  if (!loginForm.phone || !loginForm.password) {
    loginError.value = '请输入手机号和密码'
    return
  }
  if (!loginForm.captcha) {
    loginError.value = '请输入验证码'
    return
  }
  submitting.value = true
  try {
    const res = await loginApi({
      username: loginForm.phone,
      password: loginForm.password,
      captcha: loginForm.captcha,
      checkKey: checkKey.value,
    })
    const session = normalizeLoginSession(res, {
      role: 'developer',
      fallbackUsername: loginForm.phone,
    })
    if (!session.ok) {
      loginError.value = session.message
      refreshCaptcha()
      loginForm.captcha = ''
      return
    }
    authStore.login({ token: session.token, user: session.user })
    emit('update:visible', false)
    emit('logged-in')
  } catch (error) {
    loginError.value = error.message || '登录失败，请稍后重试'
    refreshCaptcha()
    loginForm.captcha = ''
  } finally {
    submitting.value = false
  }
}

/** 注册：成功后切换到登录 tab，不自动登录 */
async function handleRegister() {
  regError.value = ''
  if (!regForm.phone) {
    regError.value = '请输入手机号'
    return
  }
  if (!regForm.smscode) {
    regError.value = '请输入短信验证码'
    return
  }
  if (regForm.password.length < 6) {
    regError.value = '密码至少6位'
    return
  }
  if (regForm.password !== regForm.confirm) {
    regError.value = '两次密码不一致'
    return
  }
  submitting.value = true
  try {
    const res = await registerApi({
      phone: regForm.phone,
      smscode: regForm.smscode || DEFAULT_SMS_CODE,
      password: regForm.password,
      username: regForm.phone,
    })
    if (res.code !== 0) {
      regError.value = res.msg || res.message || '注册失败'
      return
    }
    const phone = regForm.phone
    const password = regForm.password
    resetRegForm()
    loginForm.phone = phone
    loginForm.password = password
    loginForm.captcha = ''
    loginError.value = ''
    loginSuccess.value = '注册成功，请登录'
    activeTab.value = 'login'
    refreshCaptcha()
  } catch (error) {
    regError.value = error.message || '注册失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: -2px;
}
.tab {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.15s;
}
.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
.tab:hover:not(.active) {
  color: var(--color-text-secondary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  border-radius: 6px;
  transition: all 0.15s;
}
.close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.dialog-body {
  padding: 20px 20px 4px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-smscode-hidden {
  display: none;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}
.field-input {
  padding: 9px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.captcha-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-input {
  flex: 1;
  min-width: 0;
}

.captcha-img,
.captcha-placeholder {
  width: 96px;
  height: 38px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.captcha-img {
  object-fit: cover;
  background: var(--color-bg-secondary);
}

.captcha-placeholder {
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-bg-secondary);
}

.form-error {
  font-size: 12px;
  color: var(--color-error);
  margin-top: -4px;
}

.form-success {
  font-size: 12px;
  color: #16a34a;
  margin-top: -4px;
}

.dialog-footer {
  padding: 16px 20px 20px;
}

.btn-primary {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-primary.full-width {
  width: 100%;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-active .dialog,
.modal-leave-active .dialog {
  transition: transform 0.2s, opacity 0.2s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .dialog,
.modal-leave-to .dialog {
  transform: scale(0.96) translateY(-8px);
  opacity: 0;
}
</style>
