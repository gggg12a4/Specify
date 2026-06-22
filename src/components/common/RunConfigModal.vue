<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="canClose && $emit('update:visible', false)">
        <div class="dialog">
          <div class="dialog-header">
            <span class="dialog-title">运行配置</span>
            <button v-if="canClose" class="close-btn" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="dialog-body">
            <p class="intro">{{ needsApiKey ? '填写 API Key 并选择模型' : '选择此次运行的模型' }}</p>

            <div v-if="showBillingSection" class="section">
              <div class="section-label">算力来源</div>
              <div class="billing-cards">
                <label
                  v-if="!isOwner && appShareBilling === 'dev_pay'"
                  class="billing-card selected"
                >
                  <input type="radio" value="platform" v-model="billingMode" class="radio-input" />
                  <div class="billing-info">
                    <div class="billing-name">由开发者付费</div>
                    <div class="billing-desc">该应用的开发者承担了本次运行的算力费用</div>
                  </div>
                </label>

                <label
                  v-if="needsApiKey"
                  class="billing-card"
                  :class="{ selected: billingMode === 'self_key' }"
                >
                  <input type="radio" value="self_key" v-model="billingMode" class="radio-input" />
                  <div class="billing-info">
                    <div class="billing-name">使用自有密钥</div>
                    <div class="billing-desc">填写 {{ platformName }} API Key，直连官方接口</div>
                    <input
                      v-if="billingMode === 'self_key'"
                      v-model="apiKey"
                      class="key-input"
                      type="password"
                      :placeholder="`粘贴 ${platformName} API Key`"
                      autocomplete="off"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div v-else-if="needsApiKey" class="section">
              <div class="section-label">API Key</div>
              <input
                v-model="apiKey"
                class="key-input standalone"
                type="password"
                :placeholder="`粘贴 ${platformName} API Key`"
                autocomplete="off"
              />
            </div>

            <div class="section">
              <div class="section-label">模型</div>
              <div class="model-select-row">
                <select v-model="selectedModel" class="model-select">
                  <option v-for="m in models" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
                <span v-if="currentModelDesc" class="model-desc">{{ currentModelDesc }}</span>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-primary" :disabled="!canConfirm" @click="confirm">
              确认并运行
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import * as mockApi from '@/api/mockApi'

const PLATFORM_MODELS = {
  claude:   [{ id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', desc: '平衡能力与速度' }, { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', desc: '最强推理，速度较慢' }, { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', desc: '最快最便宜' }],
  gemini:   [{ id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', desc: '最强多模态' }, { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: '长上下文' }, { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: '快速低成本' }],
  gpt:      [{ id: 'gpt-4o', name: 'GPT-4o', desc: '旗舰模型，综合能力强' }, { id: 'gpt-4o-mini', name: 'GPT-4o mini', desc: '轻量快速' }, { id: 'o1', name: 'o1', desc: '深度推理' }],
  deepseek: [{ id: 'deepseek-v3', name: 'DeepSeek V3', desc: '综合能力' }, { id: 'deepseek-r1', name: 'DeepSeek R1', desc: '逻辑推理增强' }],
  qwen:     [{ id: 'qwen-max', name: 'Qwen Max', desc: '最强能力' }, { id: 'qwen-plus', name: 'Qwen Plus', desc: '平衡版' }, { id: 'qwen-turbo', name: 'Qwen Turbo', desc: '速度优先' }],
}

const props = defineProps({
  visible: { type: Boolean, default: false },
  platform: { type: String, default: 'claude' },
  appId: { type: String, required: true },
  canClose: { type: Boolean, default: true },
  isOwner: { type: Boolean, default: true },
})
const emit = defineEmits(['update:visible', 'confirm'])

const billingMode = ref('self_key')
const appShareBilling = ref('user_pay')
const apiKey = ref('')
const selectedModel = ref('')

const platformName = computed(() => ({ claude: 'Claude', gemini: 'Gemini', gpt: 'GPT', deepseek: 'DeepSeek', qwen: 'Qwen' })[props.platform] || props.platform)
const models = computed(() => PLATFORM_MODELS[props.platform] || [])
const currentModelDesc = computed(() => models.value.find(m => m.id === selectedModel.value)?.desc || '')
const needsApiKey = computed(() => props.isOwner || appShareBilling.value === 'user_pay')
const showBillingSection = computed(() => !props.isOwner && appShareBilling.value === 'dev_pay')

const canConfirm = computed(() => {
  if (billingMode.value === 'self_key' && !apiKey.value.trim()) return false
  return true
})

watch(() => props.visible, async (v) => {
  if (!v) return
  apiKey.value = ''
  const defaultModel = models.value[0]?.id || ''
  const res = await mockApi.getRunConfig(props.appId)
  appShareBilling.value = res.data?.app_share_billing || 'user_pay'
  if (res.code === 0 && res.data?.configured) {
    const savedMode = res.data.billing_mode || 'self_key'
    billingMode.value = props.isOwner && savedMode === 'platform' ? 'self_key' : savedMode
    selectedModel.value = res.data.model || defaultModel
  } else {
    if (!props.isOwner && appShareBilling.value === 'dev_pay') {
      billingMode.value = 'platform'
    } else {
      billingMode.value = 'self_key'
    }
    selectedModel.value = defaultModel
  }
})

async function confirm() {
  const payload = {
    billing_mode: billingMode.value,
    model: selectedModel.value,
    ...(billingMode.value === 'self_key' && apiKey.value.trim() ? { api_key: apiKey.value.trim() } : {}),
  }
  await mockApi.saveRunConfig(props.appId, payload)
  emit('confirm', payload)
  emit('update:visible', false)
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.16);
  width: 100%; max-width: 440px;
  display: flex; flex-direction: column; overflow: hidden;
}

.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 0;
}
.dialog-title { font-size: 15px; font-weight: 600; color: var(--color-text); }

.close-btn {
  width: 28px; height: 28px; border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); border-radius: 6px; transition: all 0.15s;
}
.close-btn:hover { background: var(--color-bg-secondary); color: var(--color-text); }

.dialog-body { padding: 14px 20px 20px; display: flex; flex-direction: column; gap: 18px; }

.intro { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.section { display: flex; flex-direction: column; gap: 10px; }
.section-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

.billing-cards { display: flex; flex-direction: column; gap: 8px; }
.billing-card {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px; border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  cursor: pointer; transition: all 0.15s;
}
.billing-card.selected { border-color: var(--color-primary); background: var(--color-primary-muted); }
.radio-input { accent-color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }
.billing-info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.billing-name { font-size: 13px; font-weight: 500; color: var(--color-text); }
.billing-desc { font-size: 12px; color: var(--color-text-muted); }
.key-input {
  margin-top: 6px; width: 100%; padding: 7px 10px; font-size: 13px;
  background: var(--color-bg); border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md); color: var(--color-text); outline: none;
  font-family: inherit; transition: border-color 0.15s; box-sizing: border-box;
}
.key-input:focus { border-color: var(--color-primary); }
.key-input.standalone { margin-top: 0; }

.model-select-row { display: flex; flex-direction: column; gap: 6px; }
.model-select {
  padding: 8px 32px 8px 12px; font-size: 13px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md); color: var(--color-text); outline: none;
  cursor: pointer; width: 100%; font-family: inherit;
  transition: border-color 0.15s;
  appearance: none;
  background-color: var(--color-bg);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}
.model-select:focus { border-color: var(--color-primary); }
.model-desc { font-size: 12px; color: var(--color-text-muted); }

.dialog-footer {
  display: flex; justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.btn { padding: 8px 22px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.btn-primary { background: var(--color-primary); color: #fff; border: none; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); box-shadow: 0 3px 10px var(--color-primary-glow); }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: scale(0.96) translateY(-6px); opacity: 0; }
</style>
