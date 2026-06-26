<template>
  <svg
    class="plus-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 5v14M5 12h14" stroke="currentColor" :stroke-width="strokeWidth" stroke-linecap="round"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 13 },
  strokeWidth: { type: [Number, String], default: 2.5 },
})
</script>

<style scoped>
.plus-icon {
  flex-shrink: 0;
  display: block;
}
</style>
