<template>
  <div class="model-section">
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
  </div>
</template>

<script setup>
/**
 * 平台模型选择区：按 platform 展示可选模型卡片，v-model 绑定 model id。
 */
import { computed } from 'vue'
import { getModelsForPlatform, PLATFORM_NAMES } from '@/constants/platformModels'

const props = defineProps({
  platform: { type: String, default: 'claude' },
  modelValue: { type: String, default: '' },
})

defineEmits(['update:modelValue'])

/** 当前平台下的可选模型列表 */
const models = computed(() => getModelsForPlatform(props.platform))
/** 平台展示名称 */
const platformName = computed(() => PLATFORM_NAMES[props.platform] || props.platform)
</script>

<style scoped>
.model-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.model-name {
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
