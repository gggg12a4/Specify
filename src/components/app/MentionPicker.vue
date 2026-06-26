<template>
  <div class="mention-picker" :style="style" @mousedown.prevent>
    <div v-if="folders.length" class="mention-group">
      <div class="mention-group-label">文件夹</div>
      <button
        v-for="(item, i) in folders"
        :key="'f-' + item.value"
        type="button"
        class="mention-item"
        :class="{ active: activeIndex === i }"
        @click="$emit('select', item)"
        @mouseenter="$emit('hover', i)"
      >
        <span class="mention-icon mention-icon-folder">
          <svg width="14" height="14" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M861.9 843.5c0 31.1-25.2 56.2-56.2 56.2H103.5l98.3-454.2c0-31 25-56.2 56.1-56.2h646.2c31 0 56.1 25.2 56.1 56.2l-98.3 398zM215.8 347.1h632v-55.2c0-31-25.2-56.2-56.2-56.2h-337v-50.9c0-31-25.2-56.2-56.2-56.2H117.6c-31 0-56.2 25.2-56.2 56.2v658.6l98.2-440.2c0-30.9 25.2-56.1 56.2-56.1z" fill="#fa9705"/>
          </svg>
        </span>
        <span class="mention-info">
          <span class="mention-name">{{ item.label }}</span>
          <span class="mention-path">@{{ item.value }}</span>
        </span>
      </button>
    </div>

    <div v-if="tools.length" class="mention-group">
      <div class="mention-group-label">已启用工具</div>
      <button
        v-for="(item, i) in tools"
        :key="'t-' + item.value"
        type="button"
        class="mention-item"
        :class="{ active: activeIndex === folders.length + i }"
        @click="$emit('select', item)"
        @mouseenter="$emit('hover', folders.length + i)"
      >
        <span class="mention-icon mention-icon-tool">🔧</span>
        <span class="mention-info">
          <span class="mention-name">{{ item.label }}</span>
          <span v-if="item.desc" class="mention-desc">{{ item.desc }}</span>
          <span v-else class="mention-path">@{{ item.value }}</span>
        </span>
      </button>
    </div>

    <div v-if="!folders.length && !tools.length" class="mention-empty">
      没有匹配的文件夹或工具
    </div>
  </div>
</template>

<script setup>
defineProps({
  folders: { type: Array, default: () => [] },
  tools: { type: Array, default: () => [] },
  activeIndex: { type: Number, default: 0 },
  style: { type: Object, default: () => ({}) },
})

defineEmits(['select', 'hover'])
</script>

<style scoped>
.mention-picker {
  position: absolute;
  z-index: 20;
  width: 280px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
  padding: 6px;
}

.mention-group + .mention-group {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--color-border);
}

.mention-group-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 4px 8px 6px;
  letter-spacing: 0.04em;
}

.mention-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}

.mention-item:hover,
.mention-item.active {
  background: var(--color-primary-muted, rgba(59, 130, 246, 0.06));
}

.mention-item.active {
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);
}

.mention-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 6px;
  background: var(--color-bg-secondary);
  font-size: 12px;
}

.mention-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mention-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.mention-path,
.mention-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mention-desc {
  font-family: inherit;
}

.mention-empty {
  padding: 16px 12px;
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
