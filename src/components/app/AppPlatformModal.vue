<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="close">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="platform-modal-title" @click.stop>
          <div class="dialog-header">
            <span id="platform-modal-title" class="dialog-title">
              切换平台<span v-if="appName" class="dialog-app-name">{{ appName }}</span>
            </span>
            <button type="button" class="close-btn" aria-label="关闭" @click="close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="dialog-body">
            <p class="status-line">
              当前平台: <strong>{{ currentPlatformLabel }}</strong>。选择要切换到的新平台:
            </p>

            <div class="switch-layout">
              <div class="platform-list" role="radiogroup" aria-label="可选平台">
                <button
                  v-for="p in availablePlatforms"
                  :key="p.key"
                  type="button"
                  class="platform-option"
                  :class="{ active: selectedPlatform === p.key }"
                  role="radio"
                  :aria-checked="selectedPlatform === p.key"
                  @click="selectedPlatform = p.key"
                >
                  <span class="radio-ui" aria-hidden="true"></span>
                  <span class="platform-option-label">{{ p.label }}</span>
                </button>
              </div>

              <div v-if="selectedInfo" class="platform-preview">
                <h3 class="preview-title">{{ selectedInfo.label }}</h3>
                <p class="preview-models">
                  <span class="preview-models-label">可用模型</span>
                  {{ modelNamesText }}
                </p>
                <div class="impact-box">
                  <div class="impact-title">切换影响</div>
                  <ul class="impact-list">
                    <li v-for="(line, idx) in impactLines" :key="idx">{{ line }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn-back" @click="goBack">← 上一步</button>
            <button
              type="button"
              class="btn-confirm"
              :disabled="!selectedPlatform || selectedPlatform === modelValue"
              @click="confirmSwitch"
            >
              确认切换
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * 切换平台弹窗：平台列表暂时写死；当前平台不出现在可选列表中。
 * 后续可改为从后端拉取平台与模型列表。
 */
import { ref, computed, watch } from 'vue'
import { PLATFORMS, getPlatformInfo } from '@/constants/platforms'
import { getModelsForPlatform, PLATFORM_NAMES } from '@/constants/platformModels'

const props = defineProps({
  visible: { type: Boolean, default: false },
  /** 当前已选中的平台 key */
  modelValue: { type: String, default: 'claude' },
  /** App 名称，展示在标题旁 */
  appName: { type: String, default: '' },
  /** 当前主模型 id，用于切换影响文案 */
  currentModel: { type: String, default: '' },
})

const emit = defineEmits(['update:visible', 'select', 'back'])

const selectedPlatform = ref('')

/** 可选平台：排除当前平台 */
const availablePlatforms = computed(() =>
  PLATFORMS.filter((p) => p.key !== props.modelValue)
)

const currentPlatformLabel = computed(
  () => PLATFORM_NAMES[props.modelValue] || props.modelValue
)

const selectedInfo = computed(() =>
  selectedPlatform.value ? getPlatformInfo(selectedPlatform.value) : null
)

const selectedModels = computed(() =>
  selectedPlatform.value ? getModelsForPlatform(selectedPlatform.value) : []
)

const modelNamesText = computed(() =>
  selectedModels.value.map((m) => m.name).join(' · ') || '—'
)

const impactLines = computed(() => {
  const modelText = props.currentModel?.trim()
    ? `主模型 '${props.currentModel}' 将被清除，需重选`
    : '主模型将被清除，需重新选择'
  return [
    modelText,
    '已启用工具将重置到新平台',
  ]
})

function pickDefaultTarget() {
  const list = availablePlatforms.value
  selectedPlatform.value = list[0]?.key || ''
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) pickDefaultTarget()
  }
)

watch(
  () => props.modelValue,
  () => {
    if (props.visible) pickDefaultTarget()
  }
)

function close() {
  emit('update:visible', false)
}

function goBack() {
  emit('update:visible', false)
  emit('back')
}

function confirmSwitch() {
  if (!selectedPlatform.value || selectedPlatform.value === props.modelValue) return
  emit('select', selectedPlatform.value)
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 0;
}

.dialog-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.dialog-app-name {
  margin-left: 6px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  border-radius: 6px;
  transition: all 0.15s;
}

.close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.dialog-body {
  padding: 14px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-line {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.status-line strong {
  color: var(--color-text);
  font-weight: 600;
}

.switch-layout {
  display: grid;
  grid-template-columns: 168px 1fr;
  gap: 16px;
  min-height: 220px;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.platform-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.platform-option:hover {
  border-color: #93c5fd;
}

.platform-option.active {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.06);
}

.radio-ui {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #d1d5db;
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.15s;
}

.platform-option.active .radio-ui {
  border-color: var(--color-primary);
}

.platform-option.active .radio-ui::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--color-primary);
}

.platform-option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.platform-preview {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 16px;
  background: var(--color-bg-secondary, #f9fafb);
  min-width: 0;
}

.preview-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.preview-models {
  margin: 0 0 14px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.preview-models-label {
  display: inline-block;
  margin-right: 6px;
  color: var(--color-text-muted);
}

.impact-box {
  padding: 12px;
  border-radius: 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.impact-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.impact-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary, #f9fafb);
}

.btn-back {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-back:hover {
  border-color: #cbd5e1;
  color: var(--color-text);
}

.btn-confirm {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-confirm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-active .dialog,
.modal-leave-active .dialog {
  transition: transform 0.2s, opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .dialog,
.modal-leave-to .dialog {
  transform: scale(0.96) translateY(-6px);
  opacity: 0;
}

@media (max-width: 640px) {
  .switch-layout {
    grid-template-columns: 1fr;
  }
}
</style>
