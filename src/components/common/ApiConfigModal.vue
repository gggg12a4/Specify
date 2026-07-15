<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleCancel">
        <div class="modal-container" :class="{ 'is-app-pick': appContext && !isEditing }" @click.stop>
          <!-- 标题栏 -->
          <div class="modal-header">
            <div class="modal-header-top">
              <h2 class="modal-title">{{ modalTitle }}</h2>
              <button type="button" class="close-btn" title="关闭" @click="handleCancel">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p class="modal-subtitle">{{ modalSubtitle }}</p>
          </div>

          <!-- 内容区 -->
          <div class="modal-content">
            <!-- 列表模式 -->
            <div v-if="!isEditing" class="key-list-view">
              <!-- App 选用模式 -->
              <template v-if="appContext">
                <div class="app-bind-section">
                  <p class="app-bind-status">
                    当前：{{ appCredentialSummary.label }}
                  </p>

                  <div v-if="appPlatformKeys.length" class="app-key-picker">
                    <label
                      v-if="appDefaultKey"
                      class="app-key-option"
                      :class="{ active: appSelectedKeyId === DEFAULT_OPTION }"
                    >
                      <input v-model="appSelectedKeyId" type="radio" :value="DEFAULT_OPTION" />
                      <div class="app-key-option-body">
                        <span class="app-key-alias">使用平台默认</span>
                        <span class="app-key-badge">{{ appDefaultKey.alias }}</span>
                      </div>
                    </label>
                    <label
                      v-for="key in appAlternateKeys"
                      :key="key.id"
                      class="app-key-option"
                      :class="{ active: appSelectedKeyId === key.id }"
                    >
                      <input v-model="appSelectedKeyId" type="radio" :value="key.id" />
                      <div class="app-key-option-body">
                        <span class="app-key-alias">{{ key.alias }}</span>
                      </div>
                    </label>
                  </div>

                  <div v-else class="app-bind-empty">
                    该平台尚无可用凭证，请先添加密钥后再选用。
                  </div>
                </div>
              </template>

              <!-- 全局密钥池 -->
              <template v-else>
                <div v-if="keys.length === 0" class="empty-state">
                  <p class="empty-text">暂无 API 密钥</p>
                  <p class="empty-subtext">为模型分组配置自带密钥后即可运行应用</p>
                </div>

                <div v-else class="key-row-list">
                  <div v-for="k in sortedKeys" :key="k.id" class="key-row">
                    <div class="key-row-main">
                      <div class="key-row-name">{{ platformLabel(k.platform) }}</div>
                      <div class="key-row-url" :title="displayUrl(k)">{{ displayUrl(k) }}</div>
                    </div>
                    <div class="key-row-actions">
                      <button type="button" class="row-btn" @click="openEdit(k)">编辑</button>
                      <button type="button" class="row-btn danger" @click="confirmDelete(k.id)">删除</button>
                    </div>
                  </div>
                </div>

                <button type="button" class="add-key-btn" @click="openAdd">
                  + 添加密钥
                </button>
              </template>
            </div>

            <!-- 编辑/添加模式 -->
            <div v-else class="form-view">
              <div class="form-group">
                <label class="form-label">模型分组 *</label>
                <select v-model="formData.platform" class="form-input form-select" @change="onPlatformChange">
                  <option v-for="p in PLATFORMS" :key="p.key" :value="p.key">{{ p.label }}</option>
                </select>
                <span v-if="errors.platform" class="form-error">{{ errors.platform }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">备注别名</label>
                <input
                  v-model="formData.alias"
                  type="text"
                  class="form-input"
                  placeholder="选填，便于区分同分组多条密钥"
                  @input="clearError('alias')"
                />
              </div>

              <div class="form-group">
                <label class="form-label">API 地址</label>
                <input
                  v-model="formData.baseUrl"
                  type="text"
                  class="form-input"
                  placeholder="留空则使用分组默认地址"
                  @input="clearError('baseUrl')"
                />
                <span v-if="errors.baseUrl" class="form-error">{{ errors.baseUrl }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">API Key *</label>
                <input
                  v-model="formData.apiKey"
                  type="password"
                  class="form-input"
                  placeholder="sk-xxxxxxxxxxxxx"
                  @input="clearError('apiKey')"
                />
                <span v-if="errors.apiKey" class="form-error">{{ errors.apiKey }}</span>
              </div>

              <label class="default-check">
                <input v-model="formData.isDefault" type="checkbox" />
                设为该分组默认凭证
              </label>
            </div>
          </div>

          <!-- 底部：仅 App 选用 / 编辑表单需要 -->
          <div v-if="isEditing || appContext" class="modal-footer">
            <template v-if="!isEditing && appContext">
              <button type="button" class="btn btn-ghost" @click="handleCancel">取消</button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!appSelectedKeyId"
                @click="confirmAppCredential"
              >
                确认选用
              </button>
            </template>
            <template v-else-if="isEditing">
              <button type="button" class="btn btn-ghost" @click="cancelEdit">取消</button>
              <button type="button" class="btn btn-primary" @click="handleSaveForm">保存</button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * API 密钥配置弹窗。
 * - 无 appContext：全局密钥池管理（我的模型 · API 密钥）
 * - 有 appContext：仅为当前 App 选用凭证
 */
import { ref, reactive, watch, computed } from 'vue'
import { useApiConfig } from '@/composables/useApiConfig'
import { PLATFORMS } from '@/constants/platforms'
import { PLATFORM_NAMES } from '@/constants/platformModels'
import { showSuccess, showConfirm } from '@/composables/useNotification'

const DEFAULT_OPTION = '__default__'

const PLATFORM_ORDER = PLATFORMS.map(p => p.key)

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  addMode: {
    type: Boolean,
    default: false,
  },
  /** 传入时展示 App 选用区：{ appId, appName, platform, credentialId } */
  appContext: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'saved', 'app-credential-selected'])

const {
  getKeys,
  addKey,
  updateKey,
  deleteKey,
  getKeysForPlatform,
  getDefaultKeyForPlatform,
  getKeyById,
  getAppCredentialSummary,
} = useApiConfig()

const keys = ref([])
const isEditing = ref(false)
const editId = ref(null)
const appSelectedKeyId = ref('')

const appPlatformLabel = computed(() =>
  PLATFORM_NAMES[props.appContext?.platform] || props.appContext?.platform || '',
)

const modalTitle = computed(() => {
  if (isEditing.value) return editId.value ? '编辑密钥' : '添加密钥'
  if (props.appContext) return '选择 API 凭证'
  return '我的模型 · API 密钥'
})

const modalSubtitle = computed(() => {
  if (isEditing.value) {
    return '为模型分组配置自带密钥 (BYOK)；可填写自定义 API 地址（留空用分组默认地址）。'
  }
  if (props.appContext) {
    return `为「${props.appContext.appName || '当前 App'}」选择 ${appPlatformLabel.value} 平台凭证；未指定时将跟随平台默认。`
  }
  return '为模型分组配置自带密钥 (BYOK)，每个分组一个密钥；可填自定义 API 地址（留空用分组默认地址）。'
})

const appPlatformKeys = computed(() =>
  props.appContext ? getKeysForPlatform(props.appContext.platform) : [],
)
const appDefaultKey = computed(() =>
  props.appContext ? getDefaultKeyForPlatform(props.appContext.platform) : null,
)
const appAlternateKeys = computed(() => {
  const defaultId = appDefaultKey.value?.id
  return appPlatformKeys.value.filter(k => k.id !== defaultId)
})
const appCredentialSummary = computed(() =>
  props.appContext
    ? getAppCredentialSummary(props.appContext.platform, props.appContext.credentialId)
    : { label: '' },
)

/** 按平台顺序排列密钥列表 */
const sortedKeys = computed(() => {
  return [...keys.value].sort((a, b) => {
    const ai = PLATFORM_ORDER.indexOf(a.platform)
    const bi = PLATFORM_ORDER.indexOf(b.platform)
    const ao = ai === -1 ? 999 : ai
    const bo = bi === -1 ? 999 : bi
    if (ao !== bo) return ao - bo
    return String(a.alias || '').localeCompare(String(b.alias || ''), 'zh')
  })
})

const formData = reactive({
  platform: 'claude',
  alias: '',
  baseUrl: '',
  apiKey: '',
  isDefault: false,
})

const errors = reactive({})

watch(() => props.visible, (visible) => {
  if (visible) {
    refreshKeys()
    syncAppSelection()
    if (props.addMode) {
      openAdd()
    } else {
      isEditing.value = false
    }
  }
})

watch(() => props.appContext, () => {
  if (props.visible) syncAppSelection()
}, { deep: true })

function platformLabel(platform) {
  return PLATFORM_NAMES[platform] || PLATFORMS.find(p => p.key === platform)?.label || platform
}

function displayUrl(k) {
  return k.baseUrl?.trim() || '使用分组默认地址'
}

function syncAppSelection() {
  if (!props.appContext) {
    appSelectedKeyId.value = ''
    return
  }
  const { platform, credentialId } = props.appContext
  if (credentialId) {
    const bound = getKeyById(credentialId)
    if (bound?.platform === platform && bound.apiKey) {
      if (credentialId === getDefaultKeyForPlatform(platform)?.id) {
        appSelectedKeyId.value = DEFAULT_OPTION
      } else {
        appSelectedKeyId.value = credentialId
      }
      return
    }
  }
  if (getDefaultKeyForPlatform(platform)) {
    appSelectedKeyId.value = DEFAULT_OPTION
    return
  }
  const defaultId = getDefaultKeyForPlatform(platform)?.id
  appSelectedKeyId.value = appPlatformKeys.value.find(k => k.id !== defaultId)?.id || ''
}

function resolveAppCredentialId(keyId) {
  if (!keyId || keyId === DEFAULT_OPTION) return null
  if (keyId === appDefaultKey.value?.id) return null
  return keyId
}

function confirmAppCredential() {
  emit('app-credential-selected', resolveAppCredentialId(appSelectedKeyId.value))
}

function refreshKeys() {
  keys.value = getKeys() || []
  if (props.appContext) syncAppSelection()
}

function onPlatformChange() {
  clearError('platform')
  if (!editId.value && !formData.alias.trim()) {
    formData.alias = platformLabel(formData.platform)
  }
}

function openAdd() {
  editId.value = null
  formData.platform = 'claude'
  formData.alias = platformLabel('claude')
  formData.baseUrl = ''
  formData.apiKey = ''
  formData.isDefault = false
  clearAllErrors()
  isEditing.value = true
}

function openEdit(k) {
  editId.value = k.id
  formData.platform = k.platform || 'claude'
  formData.alias = k.alias || ''
  formData.baseUrl = k.baseUrl || ''
  formData.apiKey = k.apiKey || ''
  formData.isDefault = !!k.isDefault
  clearAllErrors()
  isEditing.value = true
}

function cancelEdit() {
  if (props.addMode && keys.value.length === 0) {
    handleCancel()
  } else {
    isEditing.value = false
  }
}

async function confirmDelete(id) {
  const isConfirmed = await showConfirm({
    title: '删除确认',
    message: '确定要删除此密钥吗？',
    danger: true,
  })

  if (isConfirmed) {
    deleteKey(id)
    refreshKeys()
    showSuccess('密钥已删除')
  }
}

function validateForm() {
  clearAllErrors()
  let isValid = true

  if (!formData.platform) {
    errors.platform = '请选择模型分组'
    isValid = false
  }
  if (!formData.apiKey.trim()) {
    errors.apiKey = 'API Key 不能为空'
    isValid = false
  }

  return isValid
}

function clearAllErrors() {
  Object.keys(errors).forEach(key => delete errors[key])
}

function clearError(field) {
  delete errors[field]
}

function handleSaveForm() {
  if (!validateForm()) return

  const alias = formData.alias.trim() || platformLabel(formData.platform)
  const payload = {
    platform: formData.platform,
    alias,
    baseUrl: formData.baseUrl.trim(),
    apiKey: formData.apiKey.trim(),
    isDefault: formData.isDefault,
  }

  if (editId.value) {
    updateKey(editId.value, payload)
    showSuccess('更新成功')
  } else {
    addKey(payload)
    showSuccess('添加成功')
  }

  refreshKeys()
  isEditing.value = false

  if (props.addMode) {
    emit('saved')
    emit('update:visible', false)
  }
}

function handleCancel() {
  emit('update:visible', false)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
  font-family: var(--font-sans);
}

.modal-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  max-width: 480px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-container.is-app-pick {
  max-width: 420px;
}

.modal-header {
  padding: 18px 20px 0;
  flex-shrink: 0;
}

.modal-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
}

.modal-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
}

.close-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.modal-subtitle {
  margin: 8px 0 0;
  padding-right: 24px;
  font-size: 12px;
  line-height: 1.6;
  color: #b0b4ba;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 14px 20px 20px;
}

.key-list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-row-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 56px;
  padding: 10px 14px;
  background: var(--color-bg-secondary);
  border: none;
  border-radius: 10px;
  box-sizing: border-box;
}

.key-row-main {
  min-width: 0;
  flex: 1;
}

.key-row-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}

.key-row-url {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.row-btn {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: var(--color-surface);
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.row-btn:hover {
  background: var(--color-bg);
  border-color: #d1d5db;
  color: var(--color-text);
}

.row-btn.danger {
  color: var(--color-text-secondary);
  border-color: #e5e7eb;
}

.row-btn.danger:hover {
  color: var(--color-error-dark);
  background: var(--color-error-bg);
  border-color: #fecaca;
}

.add-key-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 32px;
  margin-top: 4px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.add-key-btn:hover {
  background: var(--color-bg);
  border-color: #d1d5db;
  color: var(--color-text);
}

.empty-state {
  padding: 28px 16px;
  text-align: center;
  background: var(--color-bg-secondary);
  border-radius: 10px;
}

.empty-text {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.empty-subtext {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

/* App 选用 */
.app-bind-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.app-bind-status {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.app-key-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-key-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.app-key-option.active {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.06);
}

.app-key-option input {
  margin: 0;
}

.app-key-option-body {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.app-key-alias {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.app-key-badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  padding: 2px 6px;
  border-radius: 999px;
}

.app-bind-empty {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 12px;
  border-radius: 8px;
  background: var(--color-bg-secondary);
  border: 1px dashed var(--color-border);
}

/* 表单 */
.form-view {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  color: var(--color-text);
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

.form-input:focus {
  border-color: var(--color-primary);
}

.form-select {
  font-family: inherit;
}

.form-error {
  display: block;
  font-size: 12px;
  color: var(--color-error-dark);
  margin-top: 4px;
}

.default-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-ghost:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.96) translateY(-8px);
}
</style>
