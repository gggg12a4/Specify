<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="canClose && $emit('update:visible', false)">
        <div class="dialog">
          <div class="dialog-header">
            <span class="dialog-title">API 凭证 ({{ platformName }})</span>
            <button v-if="canClose" class="close-btn" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="dialog-body">
            <p class="intro">{{ needsNewKey ? `初次运行需要配置 ${platformName} 平台的 API 凭证` : `已绑定 ${platformName} 凭证，可直接开始调试` }}</p>

            <div v-if="needsNewKey" class="credential-section">
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

            <div v-else class="credential-summary">
              <div class="summary-info">
                <span class="check-icon">✓</span>
                <span>已绑定 <strong>{{ existingKeyInfo?.alias || platformName + ' 密钥' }}</strong></span>
              </div>
              <button class="link-btn" @click="forceNewKey = true">使用其他密钥</button>
            </div>

            <p v-if="!needsNewKey" class="model-hint">
              底层模型请在 App 编辑页的「底层模型」区块中配置。
            </p>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-primary" :disabled="!canConfirm" @click="confirm">
              {{ needsNewKey ? '保存并继续' : '开始调试' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * 运行前 API Key 配置弹窗（JIT 拦截）。
 * 无对应平台密钥时要求填写并保存；已有密钥则直接确认继续。
 */
import { ref, computed, watch } from 'vue'
import { useApiConfig } from '@/composables/useApiConfig'
import { PLATFORM_NAMES } from '@/constants/platformModels'

const props = defineProps({
  visible: { type: Boolean, default: false },
  platform: { type: String, default: 'claude' },
  appId: { type: String, required: true },
  canClose: { type: Boolean, default: true },
})
const emit = defineEmits(['update:visible', 'confirm'])

const { hasKeyForPlatform, getDefaultKeyForPlatform, addKey } = useApiConfig()

const forceNewKey = ref(false)
const newCredential = ref({ alias: '', baseUrl: '', apiKey: '' })

/** 平台展示名 */
const platformName = computed(() => PLATFORM_NAMES[props.platform] || props.platform)
/** 是否需要录入新密钥（无密钥或用户主动修改） */
const needsNewKey = computed(() => !hasKeyForPlatform(props.platform) || forceNewKey.value)
/** 已有密钥的摘要信息 */
const existingKeyInfo = computed(() => getDefaultKeyForPlatform(props.platform))

/** 新密钥模式下 apiKey 与 baseUrl 必填 */
const canConfirm = computed(() => {
  if (needsNewKey.value && (!newCredential.value.apiKey.trim() || !newCredential.value.baseUrl.trim())) return false
  return true
})

/** 弹窗打开时重置强制新密钥状态与表单 */
watch(() => props.visible, (v) => {
  if (!v) return
  forceNewKey.value = false
  newCredential.value = { alias: '', baseUrl: '', apiKey: '' }
})

/** 必要时保存新密钥到配置池，然后 emit confirm */
async function confirm() {
  if (needsNewKey.value && newCredential.value.apiKey.trim()) {
    addKey({
      alias: newCredential.value.alias.trim() || `我的 ${platformName.value} 密钥`,
      platform: props.platform,
      baseUrl: newCredential.value.baseUrl.trim(),
      apiKey: newCredential.value.apiKey.trim(),
    })
  }

  emit('confirm', { platform: props.platform })
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

.credential-summary {
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 12px 16px; border-radius: var(--radius-md);
}
.summary-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #065f46; }
.check-icon { background: #10b981; color: white; border-radius: 50%; width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; }
.link-btn { background: none; border: none; font-size: 12px; color: var(--color-primary); cursor: pointer; }
.link-btn:hover { text-decoration: underline; }

.model-hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  padding: 10px 12px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

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
