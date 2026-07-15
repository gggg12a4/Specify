<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="close">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="share-modal-title" @click.stop>
          <div class="dialog-header">
            <span id="share-modal-title" class="dialog-title">分享设置</span>
            <button type="button" class="close-btn" aria-label="关闭" @click="close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="dialog-body">
            <div class="visibility-card">
              <div class="visibility-head">
                <div>
                  <div class="visibility-title">可见性</div>
                  <div class="visibility-desc">
                    {{ isPublic ? '任何人可通过分享链接访问此 App' : '仅你自己可见和使用' }}
                  </div>
                </div>
                <button
                  type="button"
                  class="visibility-toggle"
                  :class="{ public: isPublic }"
                  :disabled="toggling"
                  @click="handleToggle"
                >
                  <span class="toggle-knob"></span>
                  <span class="toggle-label">{{ isPublic ? '公开' : '私有' }}</span>
                </button>
              </div>
            </div>

            <div v-if="!isPublished" class="hint-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>App 尚未发布到线上。公开后，访客也只能在发布后才能正常运行。</span>
            </div>

            <div v-if="isPublic && shareCode" class="link-box">
              <label class="link-label">分享链接</label>
              <div class="link-row">
                <input class="link-input" :value="shareUrl" readonly />
                <button type="button" class="btn-copy" :disabled="copying" @click="copyLink">
                  {{ copied ? '已复制' : '复制' }}
                </button>
              </div>
              <p class="link-hint">分享码：<code>{{ shareCode }}</code></p>
            </div>

            <div v-else-if="isPublic && !shareCode" class="hint-box muted">
              已设为公开，分享链接将在服务端分配后显示。
            </div>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn btn-confirm" @click="close">完成</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * 公开/私有与分享链接弹窗。
 * 对应 PUT /specify/specifyuser/app/{appId}/public
 */
import { ref, computed } from 'vue'
import { showSuccess, showError } from '@/composables/useNotification'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  shareCode: { type: String, default: '' },
  isPublished: { type: Boolean, default: false },
  toggling: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'toggle'])

const copied = ref(false)
const copying = ref(false)

const shareUrl = computed(() => {
  if (!props.shareCode) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/share/${props.shareCode}`
})

function close() {
  emit('update:visible', false)
  copied.value = false
}

function handleToggle() {
  emit('toggle', !props.isPublic)
}

async function copyLink() {
  if (!shareUrl.value) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    showSuccess('分享链接已复制')
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    showError('复制失败，请手动选择链接')
  } finally {
    copying.value = false
  }
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
  max-width: 460px;
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
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-muted);
  border-radius: 6px;
}

.dialog-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.visibility-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.visibility-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.visibility-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.visibility-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.visibility-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 72px;
  height: 32px;
  padding: 0 10px 0 34px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.visibility-toggle.public {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.35);
}

.visibility-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-knob {
  position: absolute;
  left: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.visibility-toggle.public .toggle-knob {
  transform: translateX(38px);
}

.toggle-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.visibility-toggle.public .toggle-label {
  color: #059669;
}

.hint-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.hint-box.muted {
  color: var(--color-text-muted);
}

.link-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.link-row {
  display: flex;
  gap: 8px;
}

.link-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.btn-copy {
  flex-shrink: 0;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
}

.btn-copy:hover:not(:disabled) {
  background: var(--color-bg-secondary);
}

.link-hint {
  margin: 0;
  font-size: 11px;
  color: var(--color-text-muted);
}

.link-hint code {
  font-family: ui-monospace, monospace;
  font-size: 11px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.btn-confirm {
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
