<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click="$emit('update:visible', false)">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <span class="dialog-title">创建 App</span>
            <button class="close-btn" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="dialog-body">
            <div class="field">
              <label class="field-label">App 名称 <span class="required">*</span></label>
              <input
                ref="nameInputRef"
                v-model="form.name"
                class="field-input"
                :class="{ error: errors.name }"
                placeholder="给你的 App 起个名字"
                maxlength="50"
                @keydown.enter="handleSubmit"
              />
              <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
            </div>

            <div class="field">
              <label class="field-label">App 描述</label>
              <textarea
                v-model="form.description"
                class="field-textarea"
                placeholder="描述一下这个 App 的用途（选填）"
                rows="3"
                maxlength="200"
              ></textarea>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn-ghost" @click="$emit('update:visible', false)">取消</button>
            <button class="btn-primary" :disabled="submitting" @click="handleSubmit">
              {{ submitting ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { useAppStore } from '@/stores/app'

const props = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible', 'created'])

const appStore = useAppStore()
const nameInputRef = ref(null)
const submitting = ref(false)

const form = reactive({ name: '', description: '' })
const errors = reactive({ name: '' })

watch(() => props.visible, async (v) => {
  if (v) {
    form.name = ''
    form.description = ''
    errors.name = ''
    await nextTick()
    nameInputRef.value?.focus()
  }
})

async function handleSubmit() {
  errors.name = ''
  if (!form.name.trim()) {
    errors.name = 'App 名称不能为空'
    return
  }

  submitting.value = true
  try {
    const app = appStore.addApp({
      name: form.name.trim(),
      description: form.description.trim()
    })
    emit('update:visible', false)
    emit('created', app)
  } finally {
    submitting.value = false
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
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}
.required {
  color: var(--color-error);
}
.field-input,
.field-textarea {
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
.field-input:focus,
.field-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.field-input.error {
  border-color: var(--color-error);
}
.field-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.55;
}
.field-error {
  font-size: 12px;
  color: var(--color-error);
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

.btn-primary {
  padding: 7px 20px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  transform: scale(0.96) translateY(-8px);
  opacity: 0;
}
</style>
