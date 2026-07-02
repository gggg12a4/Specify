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
            <p class="intro">
              {{ showAddForm
                ? `为 ${platformName} 平台添加 API 凭证`
                : `选择 ${platformName} 平台凭证，或添加新的密钥` }}
            </p>

            <div v-if="!showAddForm" class="key-picker">
              <label
                v-for="key in platformKeys"
                :key="key.id"
                class="key-option"
                :class="{ active: selectedKeyId === key.id }"
              >
                <input v-model="selectedKeyId" type="radio" :value="key.id" />
                <div class="key-option-body">
                  <span class="key-alias">{{ key.alias }}</span>
                  <span v-if="key.isDefault" class="key-badge">平台默认</span>
                </div>
              </label>
              <button type="button" class="link-btn" @click="showAddForm = true">+ 添加新凭证</button>
            </div>

            <div v-else class="credential-section">
              <button
                v-if="platformKeys.length"
                type="button"
                class="link-btn back-link"
                @click="showAddForm = false"
              >
                ← 返回选用已有凭证
              </button>

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

              <label class="default-check">
                <input v-model="newCredential.setAsDefault" type="checkbox" />
                设为 {{ platformName }} 平台默认凭证
              </label>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-primary" :disabled="!canConfirm" @click="confirm">
              {{ confirmLabel }}
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
 * 支持选用已有平台凭证、添加新凭证，以及设置平台默认凭证。
 */
import { ref, computed, watch } from 'vue'
import { useApiConfig } from '@/composables/useApiConfig'
import { PLATFORM_NAMES } from '@/constants/platformModels'

const props = defineProps({
  visible: { type: Boolean, default: false },
  platform: { type: String, default: 'claude' },
  credentialId: { type: String, default: null },
  appId: { type: String, required: true },
  canClose: { type: Boolean, default: true },
  confirmText: { type: String, default: '' },
})
const emit = defineEmits(['update:visible', 'confirm'])

const {
  getKeysForPlatform,
  getDefaultKeyForPlatform,
  resolveKeyForApp,
  addKey,
} = useApiConfig()

const showAddForm = ref(false)
const selectedKeyId = ref('')
const newCredential = ref({ alias: '', baseUrl: '', apiKey: '', setAsDefault: true })

const platformName = computed(() => PLATFORM_NAMES[props.platform] || props.platform)
const platformKeys = computed(() => getKeysForPlatform(props.platform))
const defaultKey = computed(() => getDefaultKeyForPlatform(props.platform))

const confirmLabel = computed(() => {
  if (props.confirmText) return props.confirmText
  return showAddForm.value ? '保存并继续' : '确认并继续'
})

const canConfirm = computed(() => {
  if (showAddForm.value) {
    return !!(newCredential.value.apiKey.trim() && newCredential.value.baseUrl.trim())
  }
  return !!selectedKeyId.value
})

watch(() => props.visible, (visible) => {
  if (!visible) return
  showAddForm.value = platformKeys.value.length === 0
  const resolved = resolveKeyForApp(props.platform, props.credentialId)
  selectedKeyId.value = resolved?.id || defaultKey.value?.id || ''
  newCredential.value = {
    alias: '',
    baseUrl: '',
    apiKey: '',
    setAsDefault: platformKeys.value.length === 0,
  }
})

function resolveCredentialId(keyId) {
  if (!keyId) return null
  if (keyId === defaultKey.value?.id) return null
  return keyId
}

function confirm() {
  if (showAddForm.value) {
    const created = addKey({
      alias: newCredential.value.alias.trim() || `我的 ${platformName.value} 密钥`,
      platform: props.platform,
      baseUrl: newCredential.value.baseUrl.trim(),
      apiKey: newCredential.value.apiKey.trim(),
      isDefault: newCredential.value.setAsDefault,
    })
    emit('confirm', {
      platform: props.platform,
      credentialId: resolveCredentialId(created.id),
    })
  } else {
    emit('confirm', {
      platform: props.platform,
      credentialId: resolveCredentialId(selectedKeyId.value),
    })
  }

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

.dialog-body { padding: 14px 20px 20px; display: flex; flex-direction: column; gap: 14px; }

.intro { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.key-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.key-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft, rgba(59, 130, 246, 0.08));
}

.key-option input {
  margin: 0;
}

.key-option-body {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.key-alias {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.key-badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  padding: 2px 6px;
  border-radius: 999px;
}

.credential-section {
  display: flex; flex-direction: column; gap: 12px;
  background: var(--color-bg-secondary);
  padding: 16px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.back-link { align-self: flex-start; }

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

.default-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.link-btn { background: none; border: none; font-size: 12px; color: var(--color-primary); cursor: pointer; padding: 0; }
.link-btn:hover { text-decoration: underline; }

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
