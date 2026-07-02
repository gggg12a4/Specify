<template>
  <div class="platform-section">
    <div class="platform-picker">
      <button
        v-for="p in PLATFORMS"
        :key="p.key"
        type="button"
        class="platform-chip"
        :class="{ active: modelValue === p.key }"
        @click="$emit('update:modelValue', p.key)"
      >
        {{ p.label }}
      </button>
    </div>

    <div v-if="currentInfo" class="platform-detail">
      <div class="detail-row">
        <span class="detail-label">支持能力</span>
        <span class="detail-value">{{ currentInfo.capabilities }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">可用模型</span>
        <span class="detail-value">{{ currentInfo.models }}</span>
      </div>

      <div class="api-key-row" :class="{ ok: apiKeyConfigured, warn: !apiKeyConfigured }">
        <span class="api-key-icon">{{ apiKeyConfigured ? '✓' : '!' }}</span>
        <span class="api-key-text">
          {{ apiKeyConfigured ? `已配置 ${platformLabel} API Key` : `尚未配置 ${platformLabel} API Key` }}
        </span>
        <button type="button" class="api-key-btn" @click="$emit('configure-api-key')">
          {{ apiKeyConfigured ? '管理凭证' : '去配置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PLATFORMS, getPlatformInfo } from '@/constants/platforms'
import { PLATFORM_LABELS } from '@/constants/spTools'

const props = defineProps({
  modelValue: { type: String, default: 'claude' },
  apiKeyConfigured: { type: Boolean, default: false },
})

defineEmits(['update:modelValue', 'configure-api-key'])

const currentInfo = computed(() => getPlatformInfo(props.modelValue))
const platformLabel = computed(() => PLATFORM_LABELS[props.modelValue] || props.modelValue)
</script>

<style scoped>
.platform-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.platform-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-chip {
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;
}

.platform-chip:hover {
  border-color: #cbd5e1;
  color: var(--color-text);
}

.platform-chip.active {
  color: var(--color-primary);
  background: var(--color-primary-muted, rgba(59, 130, 246, 0.08));
  border-color: var(--color-primary);
  font-weight: 600;
}

.platform-detail {
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  gap: 10px;
  font-size: 12px;
  line-height: 1.5;
}

.detail-label {
  flex-shrink: 0;
  width: 64px;
  color: var(--color-text-muted);
}

.detail-value {
  color: var(--color-text-secondary);
}

.api-key-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
}

.api-key-row.ok {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #047857;
}

.api-key-row.warn {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #b45309;
}

.api-key-icon {
  font-weight: 700;
  flex-shrink: 0;
}

.api-key-text {
  flex: 1;
  min-width: 0;
}

.api-key-btn {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: inherit;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid currentColor;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.9;
  transition: opacity 0.15s;
}

.api-key-btn:hover {
  opacity: 1;
}
</style>
