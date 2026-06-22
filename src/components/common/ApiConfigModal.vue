<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleCancel">
        <div class="modal-container" @click.stop>
          <!-- 标题栏 -->
          <div class="modal-header">
            <div class="modal-title-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <h2 class="modal-title">{{ isEditing ? (editId ? '编辑 API 密钥' : '添加 API 密钥') : 'API 密钥配置' }}</h2>
            </div>
            <p class="modal-subtitle">
              {{ isEditing ? '配置你的大模型 API 凭证' : '集中管理你的 API 凭证池。运行应用时将自动使用这里的凭证。' }}
            </p>
          </div>

          <!-- 内容区：列表模式 or 编辑模式 -->
          <div class="modal-content">
            <!-- 列表模式 -->
            <div v-if="!isEditing" class="key-list-view">
              <div v-if="keys.length === 0" class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <p class="empty-text">暂无 API 密钥</p>
                <p class="empty-subtext">请添加一个 API 密钥以运行你的应用</p>
                <button class="btn btn-primary mt-4" @click="openAdd">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  添加密钥
                </button>
              </div>

              <div v-else class="key-grid">
                <div v-for="k in keys" :key="k.id" class="key-card">
                  <div class="key-card-header">
                    <span class="key-alias">{{ k.alias }}</span>
                    <div class="key-actions">
                      <button class="icon-btn" title="编辑" @click="openEdit(k)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button class="icon-btn danger" title="删除" @click="confirmDelete(k.id)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="key-card-body">
                    <div class="key-field">
                      <span class="field-label">Base URL:</span>
                      <span class="field-value">{{ k.baseUrl || '-' }}</span>
                    </div>
                    <div class="key-field">
                      <span class="field-label">API Key:</span>
                      <span class="field-value masked">{{ maskKey(k.apiKey) }}</span>
                    </div>
                  </div>
                </div>

                <!-- 添加按钮卡片 -->
                <button class="add-key-card" @click="openAdd">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>添加新密钥</span>
                </button>
              </div>
            </div>

            <!-- 编辑/添加模式 -->
            <div v-else class="form-view">
              <div class="form-group">
                <label class="form-label">备注别名 *</label>
                <input
                  v-model="formData.alias"
                  type="text"
                  class="form-input"
                  placeholder="例如：Qwen 默认模型"
                  @input="clearError('alias')"
                />
                <span v-if="errors.alias" class="form-error">{{ errors.alias }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Base URL *</label>
                <input
                  v-model="formData.baseUrl"
                  type="text"
                  class="form-input"
                  placeholder="例如：https://dashscope.aliyuncs.com/compatible-mode/v1"
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
            </div>
          </div>

          <!-- 底部操作按钮 -->
          <div class="modal-footer">
            <template v-if="!isEditing">
              <button class="btn btn-ghost" @click="handleCancel">关闭</button>
            </template>
            <template v-else>
              <button class="btn btn-ghost" @click="cancelEdit">
                取消
              </button>
              <button class="btn btn-primary" @click="handleSaveForm">
                保存配置
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useApiConfig } from '@/composables/useApiConfig'
import Toast from '@/components/common/Toast.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  addMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const { getKeys, addKey, updateKey, deleteKey } = useApiConfig()

const keys = ref([])
const isEditing = ref(false)
const editId = ref(null)

// 表单数据
const formData = reactive({
  alias: '',
  baseUrl: '',
  apiKey: ''
})

// 错误信息
const errors = reactive({})

// 监听弹窗显示
watch(() => props.visible, (visible) => {
  if (visible) {
    refreshKeys()
    if (props.addMode) {
      openAdd()
    } else {
      isEditing.value = false
    }
  }
})

function refreshKeys() {
  keys.value = getKeys() || []
}

function openAdd() {
  editId.value = null
  formData.alias = ''
  formData.baseUrl = ''
  formData.apiKey = ''
  clearAllErrors()
  isEditing.value = true
}

function openEdit(k) {
  editId.value = k.id
  formData.alias = k.alias || ''
  formData.baseUrl = k.baseUrl || ''
  formData.apiKey = k.apiKey || ''
  clearAllErrors()
  isEditing.value = true
}

function cancelEdit() {
  if (props.addMode && keys.value.length === 0) {
    // 如果是强制添加模式且没有其他 key，取消则直接关闭弹窗
    handleCancel()
  } else {
    isEditing.value = false
  }
}

function confirmDelete(id) {
  if (confirm('确定要删除此密钥吗？')) {
    deleteKey(id)
    refreshKeys()
    Toast.success('密钥已删除')
  }
}

// 验证表单
function validateForm() {
  clearAllErrors()
  let isValid = true

  if (!formData.alias.trim()) {
    errors.alias = '备注别名不能为空'
    isValid = false
  }
  if (!formData.baseUrl.trim()) {
    errors.baseUrl = 'Base URL 不能为空'
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

// 保存配置
function handleSaveForm() {
  if (!validateForm()) return

  if (editId.value) {
    updateKey(editId.value, {
      alias: formData.alias.trim(),
      baseUrl: formData.baseUrl.trim(),
      apiKey: formData.apiKey.trim()
    })
    Toast.success('更新成功')
  } else {
    addKey({
      alias: formData.alias.trim(),
      baseUrl: formData.baseUrl.trim(),
      apiKey: formData.apiKey.trim()
    })
    Toast.success('添加成功')
  }

  refreshKeys()
  isEditing.value = false

  if (props.addMode) {
    // 如果是从 JIT 拦截过来的，添加完直接关闭弹窗并触发 saved
    emit('saved')
    emit('update:visible', false)
  }
}

// 取消/关闭配置
function handleCancel() {
  emit('update:visible', false)
}

function maskKey(key) {
  if (!key) return '-'
  if (key.length <= 8) return '****'
  return key.substring(0, 4) + '****' + key.substring(key.length - 4)
}
</script>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

/* 弹窗容器 */
.modal-container {
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标题栏 */
.modal-header {
  padding: 24px 28px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.modal-title-wrapper svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

/* 内容区 */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  background: var(--color-bg-secondary);
}

/* 列表模式 */
.key-list-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px dashed var(--color-border);
}

.empty-icon {
  color: var(--color-text-muted);
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 6px 0;
}

.empty-subtext {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.mt-4 {
  margin-top: 16px;
}

.key-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.key-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.key-card:hover {
  border-color: var(--color-primary-soft);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.key-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.key-alias {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.key-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.icon-btn.danger:hover {
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.08);
}

.key-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-field {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.field-label {
  color: var(--color-text-muted);
  width: 80px;
  flex-shrink: 0;
}

.field-value {
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-value.masked {
  letter-spacing: 1px;
}

.add-key-card {
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-key-card:hover {
  background: rgba(99, 102, 241, 0.04);
  border-color: var(--color-primary-soft);
}

/* 编辑模式 */
.form-view {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text);
  transition: all 0.2s;
  outline: none;
  font-family: var(--font-mono);
}

.form-input::placeholder {
  color: var(--color-text-muted);
  font-family: var(--font-sans);
}

.form-input:focus {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.form-error {
  display: block;
  font-size: 12px;
  color: var(--color-error-dark);
  margin-top: 4px;
}

/* 底部操作栏 */
.modal-footer {
  padding: 16px 28px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  background: var(--color-surface);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-ghost:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

/* 弹窗动画 */
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
  transform: scale(0.96) translateY(-10px);
}
</style>