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
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PLATFORMS, getPlatformInfo } from '@/constants/platforms'

const props = defineProps({
  modelValue: { type: String, default: 'claude' },
})

defineEmits(['update:modelValue'])

const currentInfo = computed(() => getPlatformInfo(props.modelValue))
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
</style>
