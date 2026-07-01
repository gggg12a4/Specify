<template>
  <button
    type="button"
    class="tool-config-btn"
    :title="title"
    :aria-label="title"
    @click.stop="$emit('click')"
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  </button>
</template>

<script setup>
/** 工具卡片上的齿轮配置按钮，点击 emit click */
defineProps({
  title: { type: String, default: '配置参数' },
})

defineEmits(['click'])
</script>

<style scoped>
.tool-config-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.tool-config-btn:hover {
  color: #3b82f6;
  background: #eff6ff;
}
</style>
