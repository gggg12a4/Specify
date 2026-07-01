<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click="handleCancel">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <span class="dialog-title">{{ title }}</span>
            <button class="close-btn" @click="handleCancel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="dialog-body">
            <input
              ref="inputRef"
              v-model="inputValue"
              type="text"
              class="dialog-input"
              :placeholder="placeholder"
              @keyup.enter="handleConfirm"
              @keyup.esc="handleCancel"
            />
            <span v-if="errorMessage" class="error-msg">{{ errorMessage }}</span>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-cancel" @click="handleCancel">取消</button>
            <button class="btn btn-confirm" @click="handleConfirm">确认</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * 单行文本输入弹窗。
 * 支持 defaultValue 回填、validator 校验与 Enter/Esc 快捷键。
 */
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '输入' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '请输入…' },
  defaultValue: { type: String, default: '' },
  validator: { type: Function, default: null }
})
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const inputRef = ref(null)
const inputValue = ref('')
const errorMessage = ref('')

/** 打开时填入默认值、清空错误并聚焦选中 */
watch(() => props.visible, (v) => {
  if (v) {
    inputValue.value = props.defaultValue
    errorMessage.value = ''
    nextTick(() => { inputRef.value?.focus(); inputRef.value?.select() })
  }
})

/** 校验通过后 emit confirm(trimmed value) */
function handleConfirm() {
  const value = inputValue.value.trim()
  if (props.validator) {
    const result = props.validator(value)
    if (result !== true) { errorMessage.value = result || '输入无效'; return }
  }
  emit('confirm', value)
  emit('update:visible', false)
}

/** 取消并关闭 */
function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column; overflow: hidden;
}

.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 0;
}
.dialog-title { font-size: 15px; font-weight: 600; color: var(--color-text); }

.close-btn {
  width: 28px; height: 28px; border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); border-radius: 6px; transition: all 0.15s;
}
.close-btn:hover { background: var(--color-bg-secondary); color: var(--color-text); }

.dialog-body { padding: 14px 20px 20px; display: flex; flex-direction: column; gap: 6px; }

.dialog-input {
  width: 100%; padding: 9px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: 8px; background: var(--color-bg);
  color: var(--color-text); font-size: 14px;
  font-family: inherit; outline: none; transition: all 0.15s;
  box-sizing: border-box;
}
.dialog-input::placeholder { color: var(--color-text-muted); }
.dialog-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.error-msg { font-size: 12px; color: var(--color-error); }

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.btn {
  padding: 7px 18px; border-radius: 8px;
  font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; transition: all 0.15s;
}
.btn-cancel {
  background: transparent; color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.btn-cancel:hover { background: var(--color-bg); color: var(--color-text); }
.btn-confirm { background: var(--color-primary); color: #fff; }
.btn-confirm:hover { background: var(--color-primary-hover); box-shadow: 0 3px 10px var(--color-primary-glow); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: scale(0.96) translateY(-6px); opacity: 0; }
</style>
