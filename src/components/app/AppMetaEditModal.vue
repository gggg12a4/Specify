<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="close">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="meta-modal-title" @click.stop>
          <div class="dialog-header">
            <span id="meta-modal-title" class="dialog-title">编辑 App 信息</span>
            <button type="button" class="close-btn" aria-label="关闭" @click="close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="dialog-body">
            <div class="field">
              <label class="field-label" for="meta-app-name">App 名称 <span class="required">*</span></label>
              <input
                id="meta-app-name"
                ref="nameRef"
                v-model="draft.name"
                class="field-input"
                :class="{ error: errors.name }"
                placeholder="输入 App 名称，例如：智能客服助手"
                maxlength="50"
                @keydown.enter.prevent="confirm"
              />
              <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
            </div>

            <div class="field">
              <label class="field-label" for="meta-app-desc">App 描述</label>
              <textarea
                id="meta-app-desc"
                v-model="draft.description"
                class="field-textarea"
                placeholder="描述一下这个 App 的用途（选填）"
                rows="3"
                maxlength="200"
              />
            </div>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn btn-cancel" @click="close">取消</button>
            <button type="button" class="btn btn-confirm" @click="confirm">保存</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * App 元信息编辑弹窗：修改名称与描述。
 */
import { ref, reactive, watch, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  name: { type: String, default: '' },
  description: { type: String, default: '' },
})

const emit = defineEmits(['update:visible', 'save'])

const nameRef = ref(null)
const draft = reactive({ name: '', description: '' })
const errors = reactive({ name: '' })

/** 弹窗打开时同步 props 到草稿并聚焦名称输入框 */
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    draft.name = props.name
    draft.description = props.description
    errors.name = ''
    nextTick(() => nameRef.value?.focus())
  },
)

/** 校验名称非空 */
function validate() {
  errors.name = ''
  const trimmed = draft.name.trim()
  if (!trimmed) {
    errors.name = 'App 名称不能为空'
    return false
  }
  return true
}

/** 关闭弹窗 */
function close() {
  emit('update:visible', false)
}

/** 校验通过后 emit save 并关闭 */
function confirm() {
  if (!validate()) {
    nameRef.value?.focus()
    return
  }
  emit('save', {
    name: draft.name.trim(),
    description: draft.description.trim(),
  })
  close()
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  width: 100%;
  max-width: 420px;
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
  padding: 16px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.required {
  color: var(--color-error, #ef4444);
}

.field-input,
.field-textarea {
  width: 100%;
  box-sizing: border-box;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  color: var(--color-text);
  font-size: 14px;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  resize: vertical;
}

.field-input:focus,
.field-textarea:focus {
  border-color: var(--color-primary);
}

.field-input.error {
  border-color: var(--color-error, #ef4444);
}

.field-error {
  font-size: 12px;
  color: var(--color-error, #ef4444);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.btn {
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn-cancel {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-cancel:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.btn-confirm {
  background: var(--color-primary);
  color: #fff;
}

.btn-confirm:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 3px 10px var(--color-primary-glow);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-active .dialog,
.modal-leave-active .dialog {
  transition: transform 0.2s, opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .dialog,
.modal-leave-to .dialog {
  transform: scale(0.96) translateY(-6px);
  opacity: 0;
}
</style>
