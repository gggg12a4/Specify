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
            <span v-if="loginError" class="form-error">{{ loginError }}</span>
          </form>

          <!-- 注册表单 -->
          <form v-else class="dialog-body" @submit.prevent="handleRegister">
            <div class="field">
              <label class="field-label">手机号</label>
              <input v-model="regForm.phone" class="field-input" placeholder="请输入手机号" type="tel" maxlength="11" autocomplete="username" />
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
import { ref, reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialTab: { type: String, default: 'login' }
})
const emit = defineEmits(['update:visible', 'logged-in'])

const authStore = useAuthStore()
const activeTab = ref('login')
const submitting = ref(false)
const loginError = ref('')
const regError = ref('')

const loginForm = reactive({ phone: '', password: '' })
const regForm = reactive({ phone: '', password: '', confirm: '', role: 'developer' })

watch(() => props.visible, (v) => {
  if (v) {
    activeTab.value = props.initialTab
    loginForm.phone = ''
    loginForm.password = ''
    regForm.phone = ''
    regForm.password = ''
    regForm.confirm = ''
    regForm.role = 'developer'
    loginError.value = ''
    regError.value = ''
  }
})

async function handleLogin() {
  loginError.value = ''
  if (!loginForm.phone || !loginForm.password) {
    loginError.value = '请输入手机号和密码'
    return
  }
  submitting.value = true
  try {
    const res = await mockApi.login(loginForm.phone, loginForm.password)
    if (res.code !== 0) { loginError.value = res.message; return }
    authStore.login(res.data)
    emit('update:visible', false)
    emit('logged-in')
  } finally {
    submitting.value = false
  }
}

async function handleRegister() {
  regError.value = ''
  if (!regForm.phone) { regError.value = '请输入手机号'; return }
  if (regForm.password.length < 6) { regError.value = '密码至少6位'; return }
  if (regForm.password !== regForm.confirm) { regError.value = '两次密码不一致'; return }
  submitting.value = true
  try {
    const res = await mockApi.register(regForm.phone, regForm.password, regForm.confirm, regForm.role)
    if (res.code !== 0) { regError.value = res.message; return }
    authStore.login(res.data)
    emit('update:visible', false)
    emit('logged-in')
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

.form-error {
  font-size: 12px;
  color: var(--color-error);
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

.role-selector {
  display: flex;
  gap: 10px;
}
.role-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.role-option input {
  display: none;
}
.role-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 500;
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
