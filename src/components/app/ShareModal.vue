<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click="$emit('update:visible', false)">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <div class="dialog-title-block">
              <span class="dialog-title">分享设置</span>
              <span v-if="app" class="app-meta">{{ app.name }}<span v-if="platformLabel" class="app-platform">{{ platformLabel }}</span></span>
            </div>
            <button class="close-btn" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="dialog-body">
            <!-- 公开开关 -->
            <label class="toggle-row">
              <div class="toggle-wrap">
                <input type="checkbox" v-model="isPublic" class="toggle-input" />
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
              </div>
              <div class="toggle-text">
                <span class="toggle-label">公开分享</span>
                <span class="toggle-hint">允许平台推荐给其他用户</span>
              </div>
            </label>

            <!-- 分享链接 -->
            <div class="field">
              <label class="field-label">分享链接</label>
              <div class="link-row">
                <input class="link-input" readonly :value="shareLink" />
                <button class="copy-btn" @click="copyLink">
                  <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ copied ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <!-- LLM 算力计费 -->
            <div class="section">
              <div class="section-title">LLM 算力计费</div>
              <div class="billing-cards">
                <label class="billing-card" :class="{ selected: billingMode === 'user_pay' }">
                  <input type="radio" value="user_pay" v-model="billingMode" class="radio-input" />
                  <div class="billing-info">
                    <span class="billing-name">使用者付费</span>
                    <span class="billing-desc">使用者自行配置 API Key 或平台余额</span>
                  </div>
                </label>
                <label class="billing-card" :class="{ selected: billingMode === 'dev_pay' }">
                  <input type="radio" value="dev_pay" v-model="billingMode" class="radio-input" />
                  <div class="billing-info">
                    <span class="billing-name">开发者付费</span>
                    <span class="billing-desc">消耗你的 API 余额，使用者无需配置</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- MCP 服务凭证（仅当有 MCP 服务时显示） -->
            <div v-if="mcpServices.length" class="section">
              <div class="section-title">MCP 服务凭证</div>
              <div class="mcp-cred-list">
                <div v-for="mcp in mcpServices" :key="mcp.id" class="mcp-cred-row">
                  <span class="mcp-cred-name">{{ mcp.name }}</span>
                  <div class="cred-options">
                    <label class="cred-opt" :class="{ active: (credModes[mcp.id] || 'dev_share') === 'dev_share' }">
                      <input type="radio" :value="'dev_share'" v-model="credModes[mcp.id]" />
                      共享我的凭证
                    </label>
                    <label class="cred-opt" :class="{ active: (credModes[mcp.id] || 'dev_share') === 'user_fill' }">
                      <input type="radio" :value="'user_fill'" v-model="credModes[mcp.id]" />
                      使用者自行填写
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 配置摘要 -->
            <div class="summary-block">
              <div class="summary-title">分享说明</div>
              <ul class="summary-list">
                <li v-for="(line, i) in summaryLines" :key="i">{{ line }}</li>
              </ul>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-close" @click="$emit('update:visible', false)">关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useAppStore } from '@/stores/app'
import { PLATFORM_LABELS } from '@/constants/spTools'
import * as adminApi from '@/api/admin'

const props = defineProps({
  visible: { type: Boolean, default: false },
  app: { type: Object, default: null }
})
const emit = defineEmits(['update:visible'])

const appStore = useAppStore()
const isPublic = ref(false)
const billingMode = ref('user_pay')
const credModes = reactive({})
const copied = ref(false)

const platformLabel = computed(() => PLATFORM_LABELS[props.app?.platform] || '')
const mcpServices = computed(() => props.app?.mcp_services || [])

watch(() => props.visible, async (v) => {
  if (v && props.app) {
    isPublic.value = !!props.app.is_public
    billingMode.value = props.app.share_billing_mode || 'user_pay'
    // Load credential modes from share settings
    const res = await mockApi.getShareSettings(props.app.id)
    if (res.code === 0) {
      billingMode.value = res.data.billing_mode || billingMode.value
      const modes = res.data.mcp_credentials || {}
      mcpServices.value.forEach(m => {
        credModes[m.id] = modes[m.id] || 'dev_share'
      })
    } else {
      mcpServices.value.forEach(m => { credModes[m.id] = 'dev_share' })
    }
  }
})

watch(isPublic, (v) => {
  if (props.app) appStore.updateApp(props.app.id, { is_public: v })
})

watch(billingMode, async (v) => {
  if (!props.app) return
  appStore.updateApp(props.app.id, { share_billing_mode: v })
  await mockApi.updateShareSettings(props.app.id, { billing_mode: v, is_public: isPublic.value, mcp_credentials: { ...credModes } })
})

watch(credModes, async () => {
  if (!props.app) return
  await mockApi.updateShareSettings(props.app.id, { billing_mode: billingMode.value, is_public: isPublic.value, mcp_credentials: { ...credModes } })
}, { deep: true })

const shareLink = computed(() => {
  if (!props.app) return ''
  const code = props.app.share_code || props.app.id.slice(-6)
  return `https://specify.app/s/${code}`
})

const summaryLines = computed(() => {
  const lines = []
  if (billingMode.value === 'user_pay') {
    const platformName = PLATFORM_LABELS[props.app?.platform] || '平台'
    lines.push(`使用者需要配置 ${platformName} API Key 或平台余额`)
  } else {
    lines.push('使用者无需配置密钥，消耗你的 API 余额')
  }
  mcpServices.value.forEach(m => {
    const mode = credModes[m.id] || 'dev_share'
    if (mode === 'dev_share') {
      lines.push(`MCP "${m.name}": 使用你的凭证，使用者无需填写`)
    } else {
      lines.push(`MCP "${m.name}": 使用者需自行填写凭证`)
    }
  })
  return lines
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%; max-width: 440px;
  display: flex; flex-direction: column; overflow: hidden;
  max-height: 90vh;
}

.dialog-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px 0;
  flex-shrink: 0;
}
.dialog-title-block { display: flex; flex-direction: column; gap: 3px; }
.dialog-title { font-size: 15px; font-weight: 600; color: var(--color-text); }
.app-meta { font-size: 12px; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px; }
.app-platform {
  font-size: 10px; font-weight: 600; padding: 1px 7px; border-radius: 10px;
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}

.close-btn {
  width: 28px; height: 28px; border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); border-radius: 6px; transition: all 0.15s;
  flex-shrink: 0;
}
.close-btn:hover { background: var(--color-bg-secondary); color: var(--color-text); }

.dialog-body {
  padding: 18px 20px;
  display: flex; flex-direction: column; gap: 18px;
  overflow-y: auto;
}

.toggle-row {
  display: flex; align-items: center; gap: 14px; cursor: pointer;
}
.toggle-wrap { position: relative; flex-shrink: 0; }
.toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track {
  display: block; width: 40px; height: 22px; border-radius: 11px;
  background: var(--color-border); transition: background 0.2s; position: relative;
}
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: white; transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-input:checked ~ .toggle-track { background: var(--color-primary); }
.toggle-input:checked ~ .toggle-track .toggle-thumb { transform: translateX(18px); }

.toggle-text { display: flex; flex-direction: column; gap: 2px; }
.toggle-label { font-size: 14px; font-weight: 500; color: var(--color-text); }
.toggle-hint { font-size: 12px; color: var(--color-text-muted); }

.field { display: flex; flex-direction: column; gap: 7px; }
.field-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }

.link-row { display: flex; gap: 8px; }
.link-input {
  flex: 1; padding: 8px 12px;
  border: 1.5px solid var(--color-border); border-radius: 8px;
  background: var(--color-bg-secondary); color: var(--color-text-secondary);
  font-size: 13px; font-family: var(--font-mono); outline: none;
}

.copy-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent; color: var(--color-text-secondary);
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.copy-btn:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-soft); }

.section { display: flex; flex-direction: column; gap: 10px; }
.section-title { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

.billing-cards { display: flex; flex-direction: column; gap: 8px; }
.billing-card {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px; border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  cursor: pointer; transition: all 0.15s;
}
.billing-card.selected { border-color: var(--color-primary); background: var(--color-primary-muted); }
.billing-card:hover:not(.selected) { border-color: var(--color-text-muted); }
.radio-input { accent-color: var(--color-primary); flex-shrink: 0; }
.billing-info { display: flex; flex-direction: column; gap: 2px; }
.billing-name { font-size: 13px; font-weight: 500; color: var(--color-text); }
.billing-desc { font-size: 12px; color: var(--color-text-muted); }

.mcp-cred-list { display: flex; flex-direction: column; gap: 8px; }
.mcp-cred-row {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  padding: 9px 12px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border); background: var(--color-bg-secondary);
}
.mcp-cred-name { font-size: 13px; font-weight: 500; color: var(--color-text); }
.cred-options { display: flex; gap: 6px; }
.cred-opt {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--color-text-secondary); cursor: pointer;
  padding: 4px 9px; border-radius: 6px; border: 1px solid var(--color-border);
  transition: all 0.15s; white-space: nowrap; user-select: none;
}
.cred-opt.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-muted); }
.cred-opt input { accent-color: var(--color-primary); }

.summary-block {
  padding: 12px 14px; border-radius: var(--radius-md);
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
}
.summary-title { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.summary-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.summary-list li { font-size: 12px; color: var(--color-text-secondary); padding-left: 14px; position: relative; line-height: 1.5; }
.summary-list li::before { content: '·'; position: absolute; left: 3px; color: var(--color-text-muted); }

.dialog-footer {
  display: flex; justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

.btn { padding: 7px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.btn-close { background: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border); }
.btn-close:hover { background: var(--color-bg); color: var(--color-text); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: scale(0.96) translateY(-6px); opacity: 0; }
</style>
