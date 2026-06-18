<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click="$emit('update:visible', false)">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <span class="dialog-title">添加 MCP 服务</span>
            <button class="close-btn" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="dialog-body">
            <div class="field">
              <label class="field-label">端点 URL <span class="req">*</span></label>
              <input
                v-model="form.url"
                class="field-input"
                :class="{ error: errors.url }"
                placeholder="https://example.com/mcp"
              />
              <span v-if="errors.url" class="field-error">{{ errors.url }}</span>
            </div>

            <div class="field">
              <label class="field-label">认证方式</label>
              <div class="radio-group">
                <label class="radio-item" :class="{ active: form.authType === 'bearer' }">
                  <input type="radio" value="bearer" v-model="form.authType" />
                  Bearer Token
                </label>
                <label class="radio-item" :class="{ active: form.authType === 'header' }">
                  <input type="radio" value="header" v-model="form.authType" />
                  自定义 Header
                </label>
              </div>
            </div>

            <div v-if="form.authType === 'bearer'" class="field">
              <label class="field-label">Token</label>
              <input v-model="form.token" class="field-input" placeholder="Bearer token 值" type="password" />
            </div>

            <template v-if="form.authType === 'header'">
              <div class="field">
                <label class="field-label">Header 名</label>
                <input v-model="form.headerName" class="field-input" placeholder="X-Api-Key" />
              </div>
              <div class="field">
                <label class="field-label">Header 值</label>
                <input v-model="form.headerValue" class="field-input" placeholder="Header 值" type="password" />
              </div>
            </template>

            <!-- 连接状态 -->
            <div class="conn-status" :class="connStatusClass">
              <template v-if="connState === 'idle'">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>填写信息后点击「测试连接」验证</span>
              </template>
              <template v-else-if="connState === 'testing'">
                <span class="spin">◌</span>
                <span>连接中…</span>
              </template>
              <template v-else-if="connState === 'success'">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>连接成功，发现 {{ foundTools.length }} 个工具</span>
              </template>
              <template v-else-if="connState === 'fail'">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>{{ connError }}</span>
              </template>
            </div>

            <!-- 工具列表 -->
            <div v-if="connState === 'success' && foundTools.length" class="tool-list">
              <div v-for="t in foundTools" :key="t.name" class="tool-item">
                <span class="tool-item-name">{{ t.name }}</span>
                <span class="tool-item-desc">{{ t.description }}</span>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-ghost" @click="$emit('update:visible', false)">取消</button>
            <button class="btn btn-outline" :disabled="testing" @click="testConn">
              {{ testing ? '测试中…' : '测试连接' }}
            </button>
            <button class="btn btn-primary" :disabled="connState !== 'success'" @click="handleAdd">
              添加
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import * as adminApi from '@/api/admin'

const props = defineProps({
  visible: { type: Boolean, default: false },
  appId: { type: String, required: true }
})
const emit = defineEmits(['update:visible', 'created'])

const form = ref({ url: '', authType: 'bearer', token: '', headerName: '', headerValue: '' })
const errors = ref({ url: '' })
const connState = ref('idle')
const connError = ref('')
const foundTools = ref([])
const testing = ref(false)

const connStatusClass = {
  'conn-idle': true,
}

watch(() => props.visible, (v) => {
  if (v) resetForm()
})

watch(() => [form.value.url, form.value.authType, form.value.token, form.value.headerName, form.value.headerValue], () => {
  if (connState.value !== 'idle') {
    connState.value = 'idle'
    foundTools.value = []
  }
}, { deep: true })

function resetForm() {
  form.value = { url: '', authType: 'bearer', token: '', headerName: '', headerValue: '' }
  errors.value = { url: '' }
  connState.value = 'idle'
  connError.value = ''
  foundTools.value = []
}

function validate() {
  errors.value = { url: '' }
  let ok = true
  if (!form.value.url.trim()) { errors.value.url = 'URL 不能为空'; ok = false }
  else if (!/^https?:\/\/.+/.test(form.value.url.trim())) { errors.value.url = '请输入有效的 URL'; ok = false }
  return ok
}

async function testConn() {
  if (!form.value.url.trim()) { errors.value.url = 'URL 不能为空'; return }
  testing.value = true
  connState.value = 'testing'
  connError.value = ''
  foundTools.value = []
  try {
    const res = await mockApi.testMcp(props.appId, { url: form.value.url, authType: form.value.authType, token: form.value.token, headerName: form.value.headerName, headerValue: form.value.headerValue })
    if (res.code === 0) {
      connState.value = 'success'
      foundTools.value = res.data.tools || []
    } else {
      connState.value = 'fail'
      connError.value = res.message || '连接失败'
    }
  } catch {
    connState.value = 'fail'
    connError.value = '网络错误，请检查 URL'
  } finally {
    testing.value = false
  }
}

async function handleAdd() {
  if (!validate()) return
  const res = await mockApi.createMcp(props.appId, {
    url: form.value.url.trim(),
    authType: form.value.authType,
    token: form.value.token,
    headerName: form.value.headerName,
    headerValue: form.value.headerValue,
    tool_count: foundTools.value.length,
    enabled: true,
  })
  if (res.code === 0) {
    emit('created', res.data)
    emit('update:visible', false)
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%; max-width: 460px;
  display: flex; flex-direction: column; overflow: hidden;
  max-height: 90vh;
}

.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 0; flex-shrink: 0;
}
.dialog-title { font-size: 15px; font-weight: 600; color: var(--color-text); }

.close-btn {
  width: 28px; height: 28px; border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); border-radius: 6px; transition: all 0.15s;
}
.close-btn:hover { background: var(--color-bg-secondary); color: var(--color-text); }

.dialog-body {
  padding: 14px 20px 20px;
  display: flex; flex-direction: column; gap: 14px;
  overflow-y: auto;
}

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.req { color: #ef4444; }
.field-input {
  padding: 8px 12px; font-size: 13px;
  background: var(--color-bg); border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md); color: var(--color-text); outline: none;
  font-family: inherit; transition: border-color 0.15s;
}
.field-input:focus { border-color: var(--color-primary); }
.field-input.error { border-color: #ef4444; }
.field-error { font-size: 11px; color: #ef4444; }

.radio-group { display: flex; gap: 8px; }
.radio-item {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  cursor: pointer; font-size: 13px; color: var(--color-text-secondary);
  transition: all 0.15s; user-select: none;
}
.radio-item.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-muted); }
.radio-item input { accent-color: var(--color-primary); }

.conn-status {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 12px; border-radius: var(--radius-md);
  font-size: 12px; border: 1px solid var(--color-border);
  background: var(--color-bg-secondary); color: var(--color-text-muted);
}
.conn-status.success { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.05); color: #16a34a; }
.conn-status.fail { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.05); color: #dc2626; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { display: inline-block; animation: spin 1s linear infinite; }

.tool-list {
  display: flex; flex-direction: column; gap: 4px;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  overflow: hidden;
}
.tool-item {
  display: flex; align-items: baseline; gap: 10px;
  padding: 7px 12px; font-size: 12px;
  border-bottom: 1px solid var(--color-border);
}
.tool-item:last-child { border-bottom: none; }
.tool-item-name { font-weight: 600; color: var(--color-text); font-family: var(--font-mono); white-space: nowrap; }
.tool-item-desc { color: var(--color-text-muted); }

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

.btn { padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.btn-ghost { background: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border); }
.btn-ghost:hover { background: var(--color-bg); color: var(--color-text); }
.btn-outline { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); }
.btn-outline:hover:not(:disabled) { background: var(--color-bg-secondary); }
.btn-primary { background: var(--color-primary); color: #fff; border: none; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: scale(0.96) translateY(-6px); opacity: 0; }
</style>
