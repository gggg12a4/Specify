<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <h2>{{ tool.name }} — 工具配置</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div v-for="param in configurableParams" :key="param.key" class="form-group">
          <label>
            {{ param.key }}
            <span class="param-desc">— {{ param.desc }}</span>
          </label>
          <!-- bool -->
          <label v-if="param.type === 'bool'" class="toggle">
            <input v-model="form[param.key]" type="checkbox" />
            <span class="toggle-track"></span>
            <span class="toggle-label">{{ form[param.key] ? '开启' : '关闭' }}</span>
          </label>
          <!-- int/null able -->
          <input
            v-else
            v-model.number="form[param.key]"
            type="number"
            class="input"
            :placeholder="param.default === null ? '(留空=使用默认值)' : String(param.default)"
          />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-save" @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'

const props = defineProps({
  tool: { type: Object, required: true },
  config: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['save', 'close'])

// timeout is universal — only show tool-specific (non-timeout) params + timeout
const configurableParams = computed(() => props.tool.params || [])

const form = reactive({ ...props.config })

function handleSave() {
  // Convert empty string to null for nullable ints
  const out = {}
  configurableParams.value.forEach(p => {
    out[p.key] = form[p.key] === '' ? null : form[p.key]
  })
  emit('save', out)
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: var(--color-bg); border-radius: 12px; width: 480px; max-width: 96vw; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 14px; border-bottom: 1px solid var(--color-border); }
.modal-header h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--color-text); }
.close-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: var(--color-text-secondary); }
.modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 13px; font-family: monospace; color: var(--color-text); font-weight: 500; }
.param-desc { font-family: sans-serif; font-size: 12px; color: var(--color-text-muted); font-weight: 400; }
.input { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg-secondary); color: var(--color-text); font-size: 14px; outline: none; }
.input:focus { border-color: var(--color-primary); }

.toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.toggle input { display: none; }
.toggle-track { position: relative; width: 36px; height: 20px; border-radius: 20px; background: var(--color-border); transition: background 0.2s; flex-shrink: 0; }
.toggle-track::before { content: ''; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: white; transition: transform 0.2s; }
.toggle input:checked ~ .toggle-track { background: var(--color-primary); }
.toggle input:checked ~ .toggle-track::before { transform: translateX(16px); }
.toggle-label { font-size: 13px; color: var(--color-text-secondary); font-family: sans-serif; }

.modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 14px 24px; border-top: 1px solid var(--color-border); }
.btn-cancel, .btn-save { padding: 8px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; }
.btn-cancel { background: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text-secondary); }
.btn-save { background: var(--color-primary); border: none; color: white; font-weight: 500; }
.btn-cancel:hover, .btn-save:hover { opacity: 0.82; }
</style>
