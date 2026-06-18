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
              <h2 class="modal-title">API 配置</h2>
            </div>
            <p class="modal-subtitle">请先配置 API 信息以使用应用</p>
          </div>

          <!-- 配置表单 -->
          <div class="modal-content">
            <!-- 大模型配置 -->
            <div class="config-section">
              <div class="config-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <span>大模型 API</span>
              </div>

              <div class="form-group">
                <label class="form-label">API Key *</label>
                <input
                  v-model="formData.qwen.apiKey"
                  type="text"
                  class="form-input"
                  placeholder="sk-xxxxxxxxxxxxx"
                  @input="clearError('qwen.apiKey')"
                />
                <span v-if="errors['qwen.apiKey']" class="form-error">{{ errors['qwen.apiKey'] }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Base URL *</label>
                <input
                  v-model="formData.qwen.baseUrl"
                  type="text"
                  class="form-input"
                  placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                  @input="clearError('qwen.baseUrl')"
                />
                <span v-if="errors['qwen.baseUrl']" class="form-error">{{ errors['qwen.baseUrl'] }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Model *</label>
                <input
                  v-model="formData.qwen.model"
                  type="text"
                  class="form-input"
                  placeholder="qwen3.5-flash"
                  @input="clearError('qwen.model')"
                />
                <span v-if="errors['qwen.model']" class="form-error">{{ errors['qwen.model'] }}</span>
              </div>
            </div>

            <!-- SP 工具族配置 -->
            <div class="config-section">
              <div class="config-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                <span>SP 工具族</span>
              </div>

              <div class="form-group">
                <label class="form-label">API Key *</label>
                <input
                  v-model="formData.sp.apiKey"
                  type="text"
                  class="form-input"
                  placeholder="sk-xxxxxxxxxxxxx"
                  @input="clearError('sp.apiKey')"
                />
                <span v-if="errors['sp.apiKey']" class="form-error">{{ errors['sp.apiKey'] }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Base URL *</label>
                <input
                  v-model="formData.sp.baseUrl"
                  type="text"
                  class="form-input"
                  placeholder="http://121.41.200.239:8000"
                  @input="clearError('sp.baseUrl')"
                />
                <span v-if="errors['sp.baseUrl']" class="form-error">{{ errors['sp.baseUrl'] }}</span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">App *</label>
                  <input
                    v-model="formData.sp.app"
                    type="text"
                    class="form-input"
                    placeholder="release_demo"
                    @input="clearError('sp.app')"
                  />
                  <span v-if="errors['sp.app']" class="form-error">{{ errors['sp.app'] }}</span>
                </div>

                <div class="form-group">
                  <label class="form-label">User *</label>
                  <input
                    v-model="formData.sp.user"
                    type="text"
                    class="form-input"
                    placeholder="demo_user"
                    @input="clearError('sp.user')"
                  />
                  <span v-if="errors['sp.user']" class="form-error">{{ errors['sp.user'] }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作按钮 -->
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleCancel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              取消
            </button>
            <button class="btn btn-primary" @click="handleSave">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              保存配置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useApiConfig } from '@/composables/useApiConfig'
import { showError } from '@/composables/useNotification'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const { getConfig, saveConfig, isConfigValid } = useApiConfig()

// 表单数据
const formData = reactive({
  qwen: {
    apiKey: '',
    baseUrl: '',
    model: ''
  },
  sp: {
    apiKey: '',
    baseUrl: '',
    app: '',
    user: ''
  }
})

// 错误信息
const errors = reactive({})

// 监听弹窗显示，加载当前配置
watch(() => props.visible, (visible) => {
  if (visible) {
    loadConfig()
    clearAllErrors()
  }
})

// 加载配置
function loadConfig() {
  const config = getConfig()
  if (config) {
    formData.qwen = { ...config.qwen }
    formData.sp = { ...config.sp }
  }
}

// 验证表单
function validateForm() {
  clearAllErrors()
  let isValid = true

  // 验证 Qwen 配置
  if (!formData.qwen.apiKey.trim()) {
    errors['qwen.apiKey'] = 'API Key 不能为空'
    isValid = false
  }
  if (!formData.qwen.baseUrl.trim()) {
    errors['qwen.baseUrl'] = 'Base URL 不能为空'
    isValid = false
  }
  if (!formData.qwen.model.trim()) {
    errors['qwen.model'] = 'Model 不能为空'
    isValid = false
  }

  // 验证 SP 配置
  if (!formData.sp.apiKey.trim()) {
    errors['sp.apiKey'] = 'API Key 不能为空'
    isValid = false
  }
  if (!formData.sp.baseUrl.trim()) {
    errors['sp.baseUrl'] = 'Base URL 不能为空'
    isValid = false
  }
  if (!formData.sp.app.trim()) {
    errors['sp.app'] = 'App 不能为空'
    isValid = false
  }
  if (!formData.sp.user.trim()) {
    errors['sp.user'] = 'User 不能为空'
    isValid = false
  }

  return isValid
}

// 清除所有错误
function clearAllErrors() {
  Object.keys(errors).forEach(key => {
    delete errors[key]
  })
}

// 清除单个字段错误
function clearError(field) {
  delete errors[field]
}

// 保存配置
function handleSave() {
  if (!validateForm()) {
    return
  }

  const config = {
    qwen: {
      apiKey: formData.qwen.apiKey.trim(),
      baseUrl: formData.qwen.baseUrl.trim(),
      model: formData.qwen.model.trim()
    },
    sp: {
      apiKey: formData.sp.apiKey.trim(),
      baseUrl: formData.sp.baseUrl.trim(),
      app: formData.sp.app.trim(),
      user: formData.sp.user.trim()
    }
  }

  if (saveConfig(config)) {
    emit('saved', config)
    emit('update:visible', false)
  } else {
    showError('保存配置失败，请重试')
  }
}

// 取消配置
function handleCancel() {
  emit('update:visible', false)
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
  background: rgba(0, 0, 0, 0.6);
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
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
  font-size: 20px;
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
}

/* 配置分组 */
.config-section {
  margin-bottom: 28px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.config-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 16px;
}

.config-section-title svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

/* 表单 */
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
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text);
  transition: all 0.2s;
  outline: none;
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

.form-input:focus {
  border-color: var(--color-primary);
  background: var(--color-surface);
}

.form-error {
  display: block;
  font-size: 12px;
  color: var(--color-error-dark);
  margin-top: 4px;
}

/* 表单行（并排） */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* 底部操作栏 */
.modal-footer {
  padding: 16px 28px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: var(--color-error);
  color: white;
}

.btn-secondary:hover {
  background: var(--color-error-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

.btn svg {
  flex-shrink: 0;
}

/* 弹窗动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}

/* 滚动条样式 */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
</style>
