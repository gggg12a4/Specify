<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="canClose && $emit('update:visible', false)">
        <div class="dialog">
          <div class="dialog-header">
            <span class="dialog-title">运行配置 ({{ platformName }})</span>
            <button v-if="canClose" class="close-btn" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="dialog-body">
            <p class="intro">{{ needsNewKey ? `初次运行需要配置 ${platformName} 平台的凭证及模型` : `请确认此次运行的 ${platformName} 模型` }}</p>

            <!-- 1. 填写密钥区（仅当全局池中没有该平台的key，或用户点击强制新建时展示） -->
            <div v-if="needsNewKey" class="credential-section">
              <div class="section-label">1. 配置 API 凭证</div>

              <div class="field">
                <label>备注别名</label>
                <input
                  v-model="newCredential.alias"
                  class="key-input"
                  type="text"
                  :placeholder="`例如：我的 ${platformName} 密钥`"
                />
              </div>

              <div class="field">
                <label>Base URL <span class="required">*</span></label>
                <input
                  v-model="newCredential.baseUrl"
                  class="key-input"
                  type="text"
                  placeholder="请输入中转代理地址或官方默认地址"
                />
              </div>

              <div class="field">
                <label>API Key <span class="required">*</span></label>
                <input
                  v-model="newCredential.apiKey"
                  class="key-input"
                  type="password"
                  :placeholder="`请输入 ${platformName} API Key`"
                  autocomplete="off"
                />
              </div>
            </div>

            <!-- 如果已经有Key，展示一个极简提示，并允许重新输入 -->
            <div v-else class="credential-summary">
              <div class="summary-info">
                <span class="check-icon">✓</span>
                <span>已绑定 <strong>{{ existingKeyInfo?.alias || platformName + ' 密钥' }}</strong></span>
              </div>
              <button class="link-btn" @click="forceNewKey = true">使用其他密钥</button>
            </div>

            <!-- 2. 模型选择区 -->
            <div class="section" style="margin-top: 8px;">
              <div class="section-label">{{ needsNewKey ? '2. 选择底层模型' : '选择底层模型' }}</div>
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
import { useApiConfig } from '@/composables/useApiConfig'

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
})
const emit = defineEmits(['update:visible', 'confirm'])

const { hasKeyForPlatform, getDefaultKeyForPlatform, addKey } = useApiConfig()

const selectedModel = ref('')
const forceNewKey = ref(false)
const newCredential = ref({ alias: '', baseUrl: '', apiKey: '' })

const platformName = computed(() => ({ claude: 'Claude', gemini: 'Gemini', gpt: 'GPT', deepseek: 'DeepSeek', qwen: 'Qwen' })[props.platform] || props.platform)
const models = computed(() => PLATFORM_MODELS[props.platform] || [])
const currentModelDesc = computed(() => models.value.find(m => m.id === selectedModel.value)?.desc || '')

// 是否需要展示填写密钥的表单
const needsNewKey = computed(() => !hasKeyForPlatform(props.platform) || forceNewKey.value)
// 获取已经存在的当前平台 Key 信息用于展示
const existingKeyInfo = computed(() => getDefaultKeyForPlatform(props.platform))

const canConfirm = computed(() => {
  if (needsNewKey.value && (!newCredential.value.apiKey.trim() || !newCredential.value.baseUrl.trim())) return false
  if (!selectedModel.value) return false
  return true
})

watch(() => props.visible, (v) => {
  if (!v) return
  // 初始化状态
  forceNewKey.value = false
  newCredential.value = { alias: '', baseUrl: '', apiKey: '' }

  // 尝试从 localStorage 读取该 app 之前选过的模型
  const savedModel = localStorage.getItem(`app_model_${props.appId}`)
  if (savedModel && models.value.some(m => m.id === savedModel)) {
    selectedModel.value = savedModel
  } else {
    // 默认选中该平台第一个模型
    selectedModel.value = models.value[0]?.id || ''
  }
}, { immediate: true })

async function confirm() {
  // 1. 如果是在需要新填 Key 的状态下，保存 Key 到全局池
  if (needsNewKey.value && newCredential.value.apiKey.trim()) {
    addKey({
      alias: newCredential.value.alias.trim() || `我的 ${platformName.value} 密钥`,
      platform: props.platform,
      baseUrl: newCredential.value.baseUrl.trim(),
      apiKey: newCredential.value.apiKey.trim()
    })
  }

  // 2. 缓存本次为该 App 选定的模型
  localStorage.setItem(`app_model_${props.appId}`, selectedModel.value)

  // 3. 将最终确定的模型传出
  const payload = {
    model: selectedModel.value,
    platform: props.platform
  }

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
.section-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }

/* 新填密钥区 */
.credential-section {
  display: flex; flex-direction: column; gap: 12px;
  background: var(--color-bg-secondary);
  padding: 16px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 12px; color: var(--color-text-secondary); font-weight: 500;}
.required { color: var(--color-error); }

.key-input {
  width: 100%; padding: 8px 12px; font-size: 13px;
  background: var(--color-surface); border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md); color: var(--color-text); outline: none;
  font-family: inherit; transition: border-color 0.15s; box-sizing: border-box;
}
.key-input:focus { border-color: var(--color-primary); }

/* 已有密钥提示区 */
.credential-summary {
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(16, 185, 129, 0.08); /* success soft */
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 12px 16px; border-radius: var(--radius-md);
}
.summary-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #065f46; }
.check-icon { background: #10b981; color: white; border-radius: 50%; width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; }
.link-btn { background: none; border: none; font-size: 12px; color: var(--color-primary); cursor: pointer; }
.link-btn:hover { text-decoration: underline; }

/* 模型选择区 */
.model-select-row { display: flex; flex-direction: column; gap: 6px; }
.model-select {
  padding: 9px 32px 9px 12px; font-size: 13px; font-weight: 500;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md); color: var(--color-text); outline: none;
  cursor: pointer; width: 100%; font-family: inherit;
  transition: border-color 0.15s;
  appearance: none;
  background-color: var(--color-surface);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
.model-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-soft); }
.model-desc { font-size: 12px; color: var(--color-text-muted); padding-left: 4px;}

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
