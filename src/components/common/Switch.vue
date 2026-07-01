<template>
  <div
    class="switch-container"
    :class="{
      'is-active': modelValue,
      'is-disabled': disabled
    }"
    @click="toggle"
  >
    <div class="switch-core">
      <div class="switch-thumb"></div>
      <span v-if="activeText && modelValue" class="switch-text text-active">{{ activeText }}</span>
      <span v-if="inactiveText && !modelValue" class="switch-text text-inactive">{{ inactiveText }}</span>
    </div>
  </div>
</template>

<script setup>
/** 开关组件：v-model 布尔值，可选显示开/关文字 */
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  activeText: {
    type: String,
    default: ''
  },
  inactiveText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

/** 切换开关状态并 emit update:modelValue 与 change */
function toggle() {
  if (props.disabled) return
  const newValue = !props.modelValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>

<style scoped>
.switch-container {
  display: inline-flex;
  align-items: center;
  position: relative;
  height: 20px;
  line-height: 20px;
  vertical-align: middle;
  cursor: pointer;
  margin: 0 auto;
}

.switch-container.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.switch-core {
  margin: 0;
  display: inline-block;
  position: relative;
  width: 36px;
  height: 20px;
  border: 1px solid #dcdfe6;
  outline: none;
  border-radius: 10px;
  box-sizing: border-box;
  background: #e2e8f0; /* default inactive gray */
  cursor: inherit;
  transition: border-color .3s, background-color .3s;
}

.switch-container.is-active .switch-core {
  border-color: var(--color-success, #10b981);
  background-color: var(--color-success, #10b981);
}

.switch-thumb {
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 100%;
  transition: all .3s;
  width: 16px;
  height: 16px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.switch-container.is-active .switch-thumb {
  left: 100%;
  margin-left: -17px;
}

.switch-text {
  position: absolute;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  user-select: none;
  top: 50%;
  transform: translateY(-50%);
}

.text-active {
  left: 6px;
}

.text-inactive {
  right: 6px;
  color: #64748b; /* slightly darker text for contrast on gray */
}
</style>
