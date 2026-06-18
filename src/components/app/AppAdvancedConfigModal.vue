<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <h2>高级配置 — {{ app.name }}</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- 全局配置 -->
        <div class="config-section">
          <h3 class="section-title">全局配置</h3>
          <div class="form-row">
            <div class="form-group">
              <label>工具超时（秒）</label>
              <input v-model.number="form.tool_timeout" type="number" min="1" class="input" />
            </div>
            <div class="form-group">
              <label>最大步骤数</label>
              <input v-model.number="form.max_steps" type="number" min="1" class="input" />
            </div>
          </div>
          <div class="form-group">
            <label>步骤上限行为</label>
            <select v-model="form.steps_limit_behavior" class="input">
              <option value="auto">自动停止（auto）</option>
              <option value="ask">询问用户（ask）</option>
            </select>
          </div>
        </div>

        <!-- 压缩配置 -->
        <div class="config-section">
          <h3 class="section-title">上下文压缩</h3>
          <div class="form-row">
            <div class="form-group">
              <label>压缩阈值（token）</label>
              <input v-model.number="form.compress_threshold" type="number" min="1000" class="input" />
            </div>
            <div class="form-group">
              <label>压缩方式</label>
              <select v-model="form.compress_behavior" class="input">
                <option value="form">表单模式（form）</option>
                <option value="auto">自动压缩（auto）</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 安全配置 -->
        <div class="config-section">
          <h3 class="section-title">安全配置</h3>
          <div class="form-group toggle-group">
            <label>启用安全检查</label>
            <label class="toggle">
              <input v-model="form.safety_enabled" type="checkbox" />
              <span class="toggle-track"></span>
            </label>
          </div>

          <template v-if="form.safety_enabled">
            <div class="form-group">
              <label>默认策略</label>
              <select v-model="form.default_safety_policy" class="input">
                <option value="ASK">询问（ASK）</option>
                <option value="ALLOW">允许（ALLOW）</option>
                <option value="DENY">拒绝（DENY）</option>
              </select>
            </div>
            <div class="form-group">
              <label>允许的路径（每行一个）</label>
              <textarea v-model="allowedPathsText" class="input textarea" rows="3" placeholder="workspace/"></textarea>
            </div>
            <div class="form-group">
              <label>允许的URL（每行一个）</label>
              <textarea v-model="allowedUrlsText" class="input textarea" rows="2" placeholder="https://api.example.com/"></textarea>
            </div>
          </template>
        </div>

        <!-- 工作空间 -->
        <div class="config-section">
          <h3 class="section-title">工作空间</h3>
          <div class="form-group">
            <label>Base URL</label>
            <input v-model="form.workspace_base_url" type="text" class="input" placeholder="留空使用平台默认" />
          </div>
          <div class="form-group">
            <label>API Key</label>
            <input v-model="form.workspace_api_key" type="password" class="input" placeholder="留空使用平台分配" autocomplete="off" />
          </div>
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
import { reactive, ref, computed } from 'vue'

const props = defineProps({ app: { type: Object, required: true } })
const emit = defineEmits(['save', 'close'])

const form = reactive({
  tool_timeout: props.app.tool_timeout ?? 30,
  max_steps: props.app.max_steps ?? 20,
  steps_limit_behavior: props.app.steps_limit_behavior ?? 'auto',
  compress_threshold: props.app.compress_threshold ?? 80000,
  compress_behavior: props.app.compress_behavior ?? 'form',
  safety_enabled: props.app.safety_enabled ?? false,
  default_safety_policy: props.app.default_safety_policy ?? 'ASK',
  workspace_base_url: props.app.workspace_base_url ?? '',
  workspace_api_key: props.app.workspace_api_key ?? '',
})

const allowedPathsText = ref((props.app.allowed_paths || []).join('\n'))
const allowedUrlsText = ref((props.app.allowed_urls || []).join('\n'))

function handleSave() {
  emit('save', {
    ...form,
    allowed_paths: allowedPathsText.value.split('\n').map(s => s.trim()).filter(Boolean),
    allowed_urls: allowedUrlsText.value.split('\n').map(s => s.trim()).filter(Boolean),
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-box {
  background: var(--color-bg);
  border-radius: 12px; width: 520px; max-width: 96vw; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px 14px; border-bottom: 1px solid var(--color-border);
}
.modal-header h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--color-text); }
.close-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: var(--color-text-secondary); }

.modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }

.config-section { display: flex; flex-direction: column; gap: 12px; }
.section-title { margin: 0; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 13px; color: var(--color-text-secondary); }
.input {
  padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg-secondary); color: var(--color-text);
  font-size: 14px; outline: none;
}
.input:focus { border-color: var(--color-primary); }
.textarea { resize: vertical; font-family: inherit; }

.toggle-group { flex-direction: row; align-items: center; justify-content: space-between; }

.toggle { position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-track {
  position: absolute; inset: 0; border-radius: 20px;
  background: var(--color-border); transition: background 0.2s;
}
.toggle-track::before {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 14px; height: 14px; border-radius: 50%;
  background: white; transition: transform 0.2s;
}
.toggle input:checked ~ .toggle-track { background: var(--color-primary); }
.toggle input:checked ~ .toggle-track::before { transform: translateX(16px); }

.modal-footer {
  display: flex; gap: 12px; justify-content: flex-end;
  padding: 14px 24px; border-top: 1px solid var(--color-border);
}
.btn-cancel, .btn-save {
  padding: 8px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; transition: opacity 0.2s;
}
.btn-cancel { background: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text-secondary); }
.btn-save { background: var(--color-primary); border: none; color: white; font-weight: 500; }
.btn-cancel:hover, .btn-save:hover { opacity: 0.82; }
</style>
