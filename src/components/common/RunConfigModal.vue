<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="canClose && $emit('update:visible', false)">
        <div class="dialog">
          <div class="dialog-header">
            <span class="dialog-title">{{ dialogTitle }}</span>
            <button v-if="canClose" class="close-btn" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="dialog-body">
            <p class="intro">{{ introText }}</p>

            <div v-if="!showAddForm" class="key-picker">
              <label
                v-if="defaultKey"
                class="key-option"
                :class="{ active: selectedKeyId === DEFAULT_OPTION }"
              >
                <input v-model="selectedKeyId" type="radio" :value="DEFAULT_OPTION" />
                <div class="key-option-body">
                  <span class="key-alias">使用平台默认</span>
                  <span class="key-badge">{{ defaultKey.alias }}</span>
                </div>
              </label>

              <label
                v-for="key in alternatePlatformKeys"
                :key="key.id"
                class="key-option"
                :class="{ active: selectedKeyId === key.id }"
              >
                <input v-model="selectedKeyId" type="radio" :value="key.id" />
                <div class="key-option-body">
                  <span class="key-alias">{{ key.alias }}</span>
                </div>
              </label>

              <button type="button" class="link-btn" @click="showAddForm = true">+ 添加新凭证到密钥池</button>
              <p v-if="mode === 'select'" class="hint">仅选择本 App 使用的凭证，不会修改全局默认设置。</p>
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

              <p class="hint">新凭证将加入全局密钥池。修改平台默认请前往顶部「API 密钥配置」。</p>
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
 * App 级 API 凭证选用弹窗。
 * 仅将选择结果写入 App.credential_id，不修改全局密钥池的默认项。
 * mode=setup 时用于首次无密钥的 JIT 引导（添加后自动绑定到 App）。
 */
import { ref, computed, watch } from 'vue'
import { useApiConfig } from '@/composables/useApiConfig'
import { PLATFORM_NAMES } from '@/constants/platformModels'

const DEFAULT_OPTION = '__default__'

const props = defineProps({
  visible: { type: Boolean, default: false },
  platform: { type: String, default: 'claude' },
  credentialId: { type: String, default: null },
  appId: { type: String, required: true },
  canClose: { type: Boolean, default: true },
  confirmText: { type: String, default: '' },
  /** select：选用已有凭证；setup：无密钥时的首次配置引导 */
  mode: { type: String, default: 'select' },
})
const emit = defineEmits(['update:visible', 'confirm'])

const {
  getKeysForPlatform,
  getDefaultKeyForPlatform,
  getKeyById,
  addKey,
} = useApiConfig()

const showAddForm = ref(false)
const selectedKeyId = ref('')
const newCredential = ref({ alias: '', baseUrl: '', apiKey: '' })

const platformName = computed(() => PLATFORM_NAMES[props.platform] || props.platform)
const platformKeys = computed(() => getKeysForPlatform(props.platform))
const defaultKey = computed(() => getDefaultKeyForPlatform(props.platform))
/** 除平台默认外的其他可选密钥 */
const alternatePlatformKeys = computed(() => {
  const defaultId = defaultKey.value?.id
  return platformKeys.value.filter(k => k.id !== defaultId)
})

const dialogTitle = computed(() => {
  if (props.mode === 'setup') return `配置 API 凭证 (${platformName.value})`
  return `选择 API 凭证 (${platformName.value})`
})

const introText = computed(() => {
  if (showAddForm.value) {
    return `为 ${platformName.value} 平台添加新凭证（加入全局密钥池）`
  }
  if (props.mode === 'setup') {
    return `运行前需要配置 ${platformName.value} 平台凭证，请选择或添加`
  }
  return `选择本 App 在 ${platformName.value} 平台使用的凭证；未指定时将跟随平台默认`
})

const confirmLabel = computed(() => {
  if (props.confirmText) return props.confirmText
  if (showAddForm.value) return props.mode === 'setup' ? '保存并继续' : '添加并选用'
  return props.mode === 'setup' ? '确认并继续' : '确认选择'
})

const canConfirm = computed(() => {
  if (showAddForm.value) {
    return !!(newCredential.value.apiKey.trim() && newCredential.value.baseUrl.trim())
  }
  return !!selectedKeyId.value
})

/** 弹窗打开时根据 App.credential_id 回填选中项 */
watch(() => props.visible, (visible) => {
  if (!visible) return
  showAddForm.value = platformKeys.value.length === 0
  selectedKeyId.value = resolveInitialSelection()
  newCredential.value = { alias: '', baseUrl: '', apiKey: '' }
})

/** 根据 App 已绑定的 credential_id 确定初始选中项 */
function resolveInitialSelection() {
  if (props.credentialId) {
    const bound = getKeyById(props.credentialId)
    if (bound?.platform === props.platform && bound.apiKey) {
      if (props.credentialId === defaultKey.value?.id) {
        return DEFAULT_OPTION
      }
      return props.credentialId
    }
  }
  if (defaultKey.value) return DEFAULT_OPTION
  const defaultId = defaultKey.value?.id
  return platformKeys.value.find(k => k.id !== defaultId)?.id || ''
}

/** 将 UI 选中项转为 App.credential_id：选平台默认时存 null */
function resolveCredentialId(keyId) {
  if (!keyId || keyId === DEFAULT_OPTION) return null
  if (keyId === defaultKey.value?.id) return null
  return keyId
}

function confirm() {
  if (showAddForm.value) {
    const isFirstForPlatform = platformKeys.value.length === 0
    const created = addKey({
      alias: newCredential.value.alias.trim() || `我的 ${platformName.value} 密钥`,
      platform: props.platform,
      baseUrl: newCredential.value.baseUrl.trim(),
      apiKey: newCredential.value.apiKey.trim(),
      // 仅当该平台尚无密钥时自动成为平台默认；否则只加入密钥池
      isDefault: isFirstForPlatform,
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

.intro { font-size: 13px; color: var(--color-text-muted); margin: 0; line-height: 1.5; }

.hint {
  margin: 0;
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

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

.key-badge.muted {
  color: var(--color-text-muted);
  background: var(--color-bg-secondary);
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
