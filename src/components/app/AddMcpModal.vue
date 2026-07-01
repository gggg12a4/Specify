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
              <div class="field-label-row">
                <label class="field-label">自定义 Header</label>
                <button class="btn-text" @click="addHeader">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  添加
                </button>
              </div>

              <div class="headers-list">
                <div v-for="(h, i) in form.headers" :key="i" class="header-row">
                  <input v-model="h.key" class="field-input header-key" placeholder="Header 名 (如 X-Api-Key)" />
                  <input v-model="h.value" class="field-input header-value" placeholder="Header 值" type="password" />
                  <button class="icon-btn-danger" title="删除" @click="removeHeader(i)" :disabled="form.headers.length === 1 && !h.key && !h.value">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>

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
/**
 * 添加 MCP 服务弹窗。
 * 填写 URL 与 Header 后必须先测试连接成功，才能将服务写入 App。
 */
import { ref, watch } from 'vue'
import * as mockApi from '@/api/mockApi'

const props = defineProps({
  visible: { type: Boolean, default: false },
  appId: { type: String, required: true }
})
const emit = defineEmits(['update:visible', 'created'])

const form = ref({ url: '', headers: [{ key: '', value: '' }] })
const errors = ref({ url: '' })
const connState = ref('idle')
const connError = ref('')
const foundTools = ref([])
const testing = ref(false)

const connStatusClass = {
  'conn-idle': true,
}

/** 弹窗打开时重置表单与连接状态 */
watch(() => props.visible, (v) => {
  if (v) resetForm()
})

/** 表单变更后重置连接测试结果（需重新测试） */
watch(() => [form.value.url, form.value.headers], () => {
  if (connState.value !== 'idle') {
    connState.value = 'idle'
    foundTools.value = []
  }
}, { deep: true })

/** 重置为初始空表单 */
function resetForm() {
  form.value = { url: '', headers: [{ key: '', value: '' }] }
  errors.value = { url: '' }
  connState.value = 'idle'
  connError.value = ''
  foundTools.value = []
}

/** 追加一行自定义 Header */
function addHeader() {
  form.value.headers.push({ key: '', value: '' })
}

/** 删除指定 Header 行，至少保留一行空行 */
function removeHeader(index) {
  form.value.headers.splice(index, 1)
  if (form.value.headers.length === 0) {
    form.value.headers.push({ key: '', value: '' })
  }
}

/** 校验 URL 非空且为 http(s) 格式 */
function validate() {
  errors.value = { url: '' }
  let ok = true
  if (!form.value.url.trim()) { errors.value.url = 'URL 不能为空'; ok = false }
  else if (!/^https?:\/\/.+/.test(form.value.url.trim())) { errors.value.url = '请输入有效的 URL'; ok = false }
  return ok
}

/** 调用 mockApi 测试 MCP 连通性并展示发现的 tools */
async function testConn() {
  if (!form.value.url.trim()) { errors.value.url = 'URL 不能为空'; return }
  testing.value = true
  connState.value = 'testing'
  connError.value = ''
  foundTools.value = []
  try {
    const res = await mockApi.testMcp(props.appId, { url: form.value.url, authType: 'header', headers: form.value.headers.filter(h => h.key.trim()) })
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

/** 校验通过后创建 MCP 服务并 emit created */
async function handleAdd() {
  if (!validate()) return
  const res = await mockApi.createMcp(props.appId, {
    url: form.value.url.trim(),
    authType: 'header',
    headers: form.value.headers.filter(h => h.key.trim()),
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

.field-label-row { display: flex; align-items: center; justify-content: space-between; }
.btn-text {
  background: none; border: none; font-size: 12px; color: var(--color-primary); cursor: pointer;
  display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-weight: 500;
}
.btn-text:hover { background: var(--color-primary-soft); }

.headers-list { display: flex; flex-direction: column; gap: 8px; }
.header-row { display: flex; gap: 8px; align-items: center; }
.header-key { flex: 1; min-width: 0; }
.header-value { flex: 1; min-width: 0; }
.icon-btn-danger {
  width: 28px; height: 28px; border: none; background: none; color: var(--color-text-muted);
  border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.15s;
}
.icon-btn-danger:hover:not(:disabled) { color: #ef4444; background: rgba(239,68,68,0.1); }
.icon-btn-danger:disabled { opacity: 0.3; cursor: not-allowed; }

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
