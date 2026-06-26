<template>
  <svg
    class="folder-type-icon"
    :width="size"
    :height="size"
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M861.9 843.5c0 31.1-25.2 56.2-56.2 56.2H103.5l98.3-454.2c0-31 25-56.2 56.1-56.2h646.2c31 0 56.1 25.2 56.1 56.2l-98.3 398zM215.8 347.1h632v-55.2c0-31-25.2-56.2-56.2-56.2h-337v-50.9c0-31-25.2-56.2-56.2-56.2H117.6c-31 0-56.2 25.2-56.2 56.2v658.6l98.2-440.2c0-30.9 25.2-56.1 56.2-56.1z"
      fill="#fa9705"
    />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 15 },
})
</script>

<style scoped>
.folder-type-icon {
  flex-shrink: 0;
  display: block;
}
</style>
