<template>
  <div class="model-section" :class="{ compact: variant === 'compact' }">
    <template v-if="variant === 'compact'">
      <div ref="compactWrapRef" class="model-compact-wrap">
        <div
          class="model-summary-card"
          :class="{
            'is-picker-open': showPicker,
            'is-default': isDefaultModel && !showPicker,
          }"
        >
          <div class="model-summary-main">
            <div class="model-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div class="model-summary-text">
              <div class="model-name">{{ selectedModel?.name || '未选择模型' }}</div>
              <p v-if="isDefaultModel" class="model-hint">{{ defaultModelHint }}</p>
              <div v-else class="model-id">{{ selectedModel?.id }}</div>
            </div>
          </div>
          <button
            type="button"
            class="model-switch-btn"
            :class="{ active: showPicker }"
            @click="showPicker = !showPicker"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            切换
          </button>
        </div>

        <div v-if="showPicker" class="model-picker-dropdown">
          <button
            type="button"
            class="model-picker-option"
            :class="{ selected: isDefaultModel }"
            @click="selectModel('')"
          >
            请选择模型
          </button>
          <button
            v-for="item in models"
            :key="item.id"
            type="button"
            class="model-picker-option"
            :class="{ selected: modelValue === item.id }"
            @click="selectModel(item.id)"
          >
            {{ formatModelOption(item) }}
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="platform-badge">{{ platformName }}</div>
      <div class="model-grid">
        <button
          v-for="item in models"
          :key="item.id"
          type="button"
          class="model-card"
          :class="{ selected: modelValue === item.id }"
          @click="$emit('update:modelValue', item.id)"
        >
          <div class="model-card-top">
            <span class="model-radio" :class="{ checked: modelValue === item.id }"></span>
            <span class="model-name">{{ item.name }}</span>
          </div>
          <p class="model-desc">{{ item.desc }}</p>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * 平台模型选择区：compact 为单卡片 + 切换；default 为网格卡片。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getModelsForPlatform, PLATFORM_NAMES } from '@/constants/platformModels'

const props = defineProps({
  platform: { type: String, default: 'claude' },
  modelValue: { type: String, default: '' },
  availableModels: { type: Array, default: null },
  variant: { type: String, default: 'default' },
})

const emit = defineEmits(['update:modelValue'])

const showPicker = ref(false)
const compactWrapRef = ref(null)

function handleDocumentClick(event) {
  if (!showPicker.value) return
  const wrap = compactWrapRef.value
  if (wrap && !wrap.contains(event.target)) {
    showPicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

const models = computed(() => {
  if (props.availableModels?.length) return props.availableModels
  return getModelsForPlatform(props.platform)
})

const platformName = computed(() => PLATFORM_NAMES[props.platform] || props.platform)

const selectedModel = computed(() =>
  props.modelValue ? models.value.find(m => m.id === props.modelValue) ?? null : null
)

const isDefaultModel = computed(() => !props.modelValue)

const defaultModelHint =
  '选择本 App 对话使用的模型(需在「我的模型」配置该分组的 Key)'

function selectModel(id) {
  emit('update:modelValue', id)
  showPicker.value = false
}

function formatModelOption(item) {
  if (!item) return ''
  return `${item.name} (${item.id})`
}
</script>

<style scoped>
.model-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-section.compact {
  gap: 0;
  width: auto;
  max-width: 520px;
  min-width: 320px;
}

.model-compact-wrap {
  position: relative;
  width: 100%;
}

.model-section.compact .model-summary-card {
  padding: 16px 18px;
}

.model-summary-card.is-picker-open {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: transparent;
  box-shadow: none;
  z-index: 31;
  position: relative;
}

.model-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.model-summary-card.is-default {
  border-style: dashed;
  border-color: #d1d5db;
  box-shadow: none;
}

.model-summary-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.model-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.model-summary-text {
  min-width: 0;
}

.model-summary-text .model-name {
  font-size: 15px;
  font-weight: 600;
  color: #000000;
  line-height: 1.3;
}

.model-hint {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.model-id {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: var(--font-mono, monospace);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-switch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: var(--color-primary);
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  line-height: 1;
  transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
}

.model-switch-btn svg {
  flex-shrink: 0;
}

.model-switch-btn:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  color: var(--color-primary-hover);
}

.model-switch-btn.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
}

.model-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 30;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.model-picker-option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  border: none;
  background: var(--color-surface);
  font-size: 13px;
  font-family: var(--font-sans);
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  line-height: 1.4;
}

.model-picker-option:hover,
.model-picker-option.selected {
  background: var(--color-primary);
  color: #ffffff;
}

.platform-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 999px;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.model-card {
  text-align: left;
  padding: 14px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.model-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.model-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-muted, rgba(59, 130, 246, 0.06));
  box-shadow: 0 0 0 2px var(--color-primary-soft, rgba(59, 130, 246, 0.12));
}

.model-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.model-radio {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  flex-shrink: 0;
  position: relative;
  transition: all 0.15s;
}

.model-radio.checked {
  border-color: var(--color-primary);
}

.model-radio.checked::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--color-primary);
}

.model-card .model-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.model-desc {
  margin: 0;
  padding-left: 24px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-muted);
}
</style>
