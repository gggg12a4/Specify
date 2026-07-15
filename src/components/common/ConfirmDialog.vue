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
            <p class="dialog-message" v-html="formattedMessage"></p>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-cancel" @click="handleCancel">{{ cancelText }}</button>
            <button class="btn" :class="danger ? 'btn-danger' : 'btn-confirm'" @click="handleConfirm">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/** 通用确认弹窗：支持危险操作样式与自定义按钮文案；消息支持换行与 **加粗** */
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '确认' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' },
  danger: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const formattedMessage = computed(() => {
  const escaped = String(props.message || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
})

/** 确认并关闭弹窗 */
function handleConfirm() { emit('confirm'); emit('update:visible', false) }
/** 取消并关闭弹窗 */
function handleCancel() { emit('cancel'); emit('update:visible', false) }
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 10001; padding: 20px;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column;
  overflow: hidden;
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

.dialog-body { padding: 12px 20px 20px; }
.dialog-message {
  font-size: 13px;
  line-height: 1.75;
  color: var(--color-text-secondary);
  margin: 0;
}
.dialog-message :deep(strong) {
  color: var(--color-text);
  font-weight: 600;
}

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
.btn-danger { background: var(--color-error); color: #fff; }
.btn-danger:hover { background: var(--color-error-dark); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: scale(0.96) translateY(-6px); opacity: 0; }
</style>
