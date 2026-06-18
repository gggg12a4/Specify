<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <h2>{{ tool.name }} — 工具说明</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <p class="summary">{{ tool.detail?.summary }}</p>

        <div v-if="tool.params?.length" class="params-section">
          <h3 class="sub-title">参数列表</h3>
          <div class="params-table">
            <div class="param-header">
              <span>参数名</span>
              <span>类型</span>
              <span>默认值</span>
              <span>说明</span>
            </div>
            <div v-for="p in tool.params" :key="p.key" class="param-row">
              <span class="param-key">{{ p.key }}</span>
              <span class="param-type">{{ p.type }}</span>
              <span class="param-default">{{ p.default === null ? '(空)' : String(p.default) }}</span>
              <span class="param-desc">{{ p.desc }}</span>
            </div>
          </div>
        </div>

        <div class="example-section">
          <h3 class="sub-title">示例</h3>
          <code class="example-code">{{ tool.detail?.example }}</code>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-close" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ tool: { type: Object, required: true } })
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: var(--color-bg); border-radius: 12px; width: 560px; max-width: 96vw; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 14px; border-bottom: 1px solid var(--color-border); }
.modal-header h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--color-text); }
.close-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: var(--color-text-secondary); }
.modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
.summary { font-size: 14px; color: var(--color-text-secondary); line-height: 1.6; margin: 0; }
.sub-title { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.params-section, .example-section { display: flex; flex-direction: column; }
.params-table { display: flex; flex-direction: column; gap: 1px; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
.param-header, .param-row { display: grid; grid-template-columns: 1.4fr 0.6fr 0.8fr 2fr; gap: 0; padding: 8px 12px; font-size: 12px; }
.param-header { background: var(--color-bg-secondary); color: var(--color-text-muted); font-weight: 600; }
.param-row { border-top: 1px solid var(--color-border); color: var(--color-text-secondary); }
.param-key { font-family: monospace; color: var(--color-text); font-weight: 500; }
.param-type { color: var(--color-primary); }
.param-default { font-family: monospace; }
.example-code { display: block; padding: 12px 16px; background: var(--color-bg-secondary); border-radius: 8px; font-size: 13px; font-family: monospace; color: var(--color-text); white-space: pre-wrap; word-break: break-all; }
.modal-footer { display: flex; justify-content: flex-end; padding: 14px 24px; border-top: 1px solid var(--color-border); }
.btn-close { padding: 8px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; background: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text-secondary); }
.btn-close:hover { opacity: 0.8; }
</style>
