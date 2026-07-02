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
            <McpSchemaFields
              :template-key="templateKey"
              mode="create"
              v-model="configValues"
              :errors="errors"
            />

            <div class="conn-status" :class="connState">
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
                <span>连接成功</span>
              </template>
              <template v-else-if="connState === 'fail'">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>{{ connError }}</span>
              </template>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-ghost" @click="$emit('update:visible', false)">取消</button>
            <button class="btn btn-outline" :disabled="testing" @click="testConn">
              {{ testing ? '测试中…' : '测试连接' }}
            </button>
            <button class="btn btn-primary" @click="handleAdd">
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
 * 按模板 config_schema 渲染表单，测试连接成功后写入 App。
 */
import { ref, reactive, watch } from 'vue'
import * as mockApi from '@/api/mockApi'
import McpSchemaFields from '@/components/app/McpSchemaFields.vue'
import { DEFAULT_MCP_TEMPLATE } from '@/constants/mcpTemplates'
import {
  createDefaultMcpConfig,
  validateMcpConfig,
  buildMcpPayload,
  headersObjectToRows,
} from '@/utils/mcpSchema'

const props = defineProps({
  visible: { type: Boolean, default: false },
  appId: { type: String, required: true },
  templateKey: { type: String, default: DEFAULT_MCP_TEMPLATE },
})
const emit = defineEmits(['update:visible', 'created'])

const configValues = reactive(createDefaultMcpConfig(props.templateKey, 'create'))
const errors = ref({})
const connState = ref('idle')
const connError = ref('')
const testing = ref(false)

watch(() => props.visible, (visible) => {
  if (visible) resetForm()
})

watch(configValues, () => {
  if (connState.value !== 'idle') {
    connState.value = 'idle'
  }
}, { deep: true })

function resetForm() {
  Object.assign(configValues, createDefaultMcpConfig(props.templateKey, 'create'))
  errors.value = {}
  connState.value = 'idle'
  connError.value = ''
}

function getTestPayload() {
  const payload = buildMcpPayload(props.templateKey, configValues)
  return {
    url: payload.url,
    authType: 'header',
    headers: headersObjectToRows(payload.headers).filter(h => h.key.trim()),
  }
}

async function testConn() {
  errors.value = validateMcpConfig(props.templateKey, 'create', configValues)
  if (Object.keys(errors.value).length) return

  testing.value = true
  connState.value = 'testing'
  connError.value = ''

  try {
    const res = await mockApi.testMcp(props.appId, getTestPayload())
    if (res.code === 0) {
      connState.value = 'success'
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
  errors.value = validateMcpConfig(props.templateKey, 'create', configValues)
  if (Object.keys(errors.value).length) return

  const payload = buildMcpPayload(props.templateKey, configValues)
  const res = await mockApi.createMcp(props.appId, {
    ...payload,
    authType: 'header',
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
