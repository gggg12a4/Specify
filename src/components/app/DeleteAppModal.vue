<template>
  <Teleport to="body">
    <div class="overlay" @click="$emit('cancel')">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <span class="dialog-title">删除 App</span>
          <button class="close-btn" @click="$emit('cancel')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="dialog-body">
          <p class="warn-text">
            此操作不可撤销，将删除 App「<strong>{{ app?.name }}</strong>」的所有配置和数据。
          </p>
          <div class="field">
            <label class="field-label">请输入 App 名称确认：</label>
            <input
              ref="inputRef"
              v-model="inputName"
              class="field-input"
              :placeholder="app?.name"
              @keydown.enter="handleConfirm"
            />
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-ghost" @click="$emit('cancel')">取消</button>
          <button
            class="btn-danger"
            :disabled="inputName !== app?.name"
            @click="handleConfirm"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * 删除 App 二次确认弹窗。
 * 要求用户手动输入 App 名称匹配后才允许删除。
 */
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  app: { type: Object, required: true }
})
const emit = defineEmits(['confirm', 'cancel'])
const inputRef = ref(null)
const inputName = ref('')

/** 切换目标 App 时清空输入并聚焦 */
watch(() => props.app, async () => {
  inputName.value = ''
  await nextTick()
  inputRef.value?.focus()
}, { immediate: true })

/** 名称匹配后 emit confirm */
function handleConfirm() {
  if (inputName.value === props.app?.name) {
    emit('confirm')
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 0;
}
.dialog-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}
.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  border-radius: 6px;
  transition: all 0.15s;
}
.close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.dialog-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.warn-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
  padding: 10px 12px;
  background: rgba(239,68,68,0.06);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: var(--radius-md);
}
.warn-text strong {
  color: var(--color-text);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.field-input {
  padding: 9px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field-input:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.btn-ghost {
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.btn-danger {
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-error);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-danger:hover:not(:disabled) {
  opacity: 0.88;
}
.btn-danger:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
