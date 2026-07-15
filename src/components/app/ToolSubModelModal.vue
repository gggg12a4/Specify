<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click="$emit('update:visible', false)">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <span class="dialog-title">配置子模型 · {{ toolInfo?.name }}</span>
            <button class="close-btn" @click="$emit('update:visible', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="dialog-body">
            <p class="hint">选择此工具使用的子模型</p>
            <div class="model-list">
              <label
                v-for="m in subModels"
                :key="m.id"
                class="model-item"
                :class="{ selected: selected === m.id }"
              >
                <input type="radio" :value="m.id" v-model="selected" class="radio-input" />
                <div class="model-info">
                  <span class="model-name">{{ m.name }}</span>
                  <span class="model-desc">{{ m.desc }}</span>
                </div>
                <span v-if="m.default" class="default-badge">默认</span>
              </label>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-ghost" @click="$emit('update:visible', false)">取消</button>
            <button class="btn btn-primary" @click="confirm">确认</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * 特殊工具子模型选择弹窗。
 * 按 toolKey + platform 展示可选子模型列表。
 */
import { ref, computed, watch } from 'vue'
import { TOOL_SUB_MODELS } from '@/constants/spTools'

const props = defineProps({
  visible: { type: Boolean, default: false },
  toolKey: { type: String, required: true },
  platform: { type: String, required: true },
  currentSubModel: { type: String, default: null }
})
const emit = defineEmits(['update:visible', 'confirm'])

const selected = ref(null)

/** 特殊工具显示名 */
const toolInfo = computed(() => ({ name: props.toolKey }))
/** 当前平台下该工具可用的子模型列表 */
const subModels = computed(() => TOOL_SUB_MODELS[props.toolKey]?.[props.platform] || [])

/** 打开时预选当前子模型或平台默认值 */
watch(() => props.visible, (v) => {
  if (v) {
    const defaultModel = subModels.value.find(m => m.default)
    selected.value = props.currentSubModel || defaultModel?.id || null
  }
})

/** 确认选中子模型并关闭弹窗 */
function confirm() {
  emit('confirm', selected.value)
  emit('update:visible', false)
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}

.dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%; max-width: 420px;
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

.dialog-body { padding: 14px 20px 20px; display: flex; flex-direction: column; gap: 12px; }

.hint { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.model-list { display: flex; flex-direction: column; gap: 8px; }

.model-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  cursor: pointer; transition: all 0.15s;
}
.model-item:hover { border-color: var(--color-primary-soft); background: var(--color-primary-muted); }
.model-item.selected { border-color: var(--color-primary); background: var(--color-primary-muted); }

.radio-input { accent-color: var(--color-primary); flex-shrink: 0; }

.model-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.model-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
.model-desc { font-size: 12px; color: var(--color-text-muted); }

.default-badge {
  font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 10px;
  background: var(--color-primary-soft); color: var(--color-primary);
  flex-shrink: 0;
}

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.btn { padding: 7px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.btn-ghost { background: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border); }
.btn-ghost:hover { background: var(--color-bg); color: var(--color-text); }
.btn-primary { background: var(--color-primary); color: #fff; border: none; }
.btn-primary:hover { background: var(--color-primary-hover); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: scale(0.96) translateY(-6px); opacity: 0; }
</style>
