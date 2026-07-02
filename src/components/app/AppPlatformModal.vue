<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="$emit('update:visible', false)">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="platform-modal-title" @click.stop>
          <div class="dialog-header">
            <span id="platform-modal-title" class="dialog-title">AI 平台</span>
            <button type="button" class="close-btn" aria-label="关闭" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="dialog-body">
            <p class="intro">切换平台会影响底层模型、平台专属工具与 API 凭证，请确认后再切换。</p>
            <AppPlatformSection
              :model-value="selectedPlatform"
              :api-key-configured="apiKeyConfigured"
              @update:model-value="onPlatformSelect"
              @configure-api-key="$emit('configure-api-key', selectedPlatform)"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppPlatformSection from '@/components/app/AppPlatformSection.vue'
import { useApiConfig } from '@/composables/useApiConfig'

const props = defineProps({
  visible: { type: Boolean, default: false },
  modelValue: { type: String, default: 'claude' },
})

const emit = defineEmits(['update:visible', 'select', 'configure-api-key'])

const selectedPlatform = ref(props.modelValue)
const { hasKeyForPlatform } = useApiConfig()
const apiKeyConfigured = computed(() => hasKeyForPlatform(selectedPlatform.value))

watch(
  () => props.visible,
  (visible) => {
    if (visible) selectedPlatform.value = props.modelValue
  },
)

watch(
  () => props.modelValue,
  (platform) => {
    selectedPlatform.value = platform
  },
)

function onPlatformSelect(platform) {
  selectedPlatform.value = platform
  if (platform !== props.modelValue) {
    emit('select', platform)
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
  max-width: 520px;
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
  padding: 14px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.intro {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-muted);
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
