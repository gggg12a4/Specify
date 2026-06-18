<template>
  <select :value="modelValue" class="lm-selector" @change="$emit('update:modelValue', $event.target.value)">
    <option value="">{{ placeholder }}</option>
    <option v-for="lm in lmStore.lms" :key="lm.id" :value="lm.id">
      {{ lm.alias }} ({{ lm.platform }} / {{ lm.model }})
    </option>
  </select>
</template>

<script setup>
import { useLmStore } from '@/stores/lm'
defineProps({ modelValue: { type: String, default: '' }, placeholder: { type: String, default: '选择大模型（留空使用默认）' } })
defineEmits(['update:modelValue'])
const lmStore = useLmStore()
</script>

<style scoped>
.lm-selector {
  width: 100%; padding: 9px 13px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 14px; outline: none; cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}
.lm-selector:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
</style>
