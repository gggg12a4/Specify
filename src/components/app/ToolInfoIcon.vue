<template>
  <span class="tool-info-icon-wrap">
    <button
      type="button"
      class="tool-info-btn"
      :aria-label="ariaLabel"
      @click.stop="$emit('click')"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    </button>
    <span class="tool-info-tooltip">{{ tooltip }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tooltip: { type: String, default: '点击查看使用说明' },
  label: { type: String, default: '工具' },
})

defineEmits(['click'])

const ariaLabel = computed(() => `查看 ${props.label} 使用说明`)
</script>

<style scoped>
.tool-info-icon-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.tool-info-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 1px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.tool-info-btn:hover,
.tool-info-icon-wrap:focus-within .tool-info-btn {
  color: #3b82f6;
  background: #eff6ff;
}

.tool-info-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  width: max-content;
  max-width: 220px;
  padding: 6px 10px;
  font-size: 11px;
  line-height: 1.45;
  font-weight: 400;
  color: #fff;
  background: #1f2937;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s, transform 0.15s, visibility 0.15s;
  z-index: 5;
  white-space: normal;
  text-align: center;
}

.tool-info-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1f2937;
}

.tool-info-icon-wrap:hover .tool-info-tooltip,
.tool-info-icon-wrap:focus-within .tool-info-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
</style>
