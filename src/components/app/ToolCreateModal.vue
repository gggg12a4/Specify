<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click="handleCancel">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <span class="dialog-title">{{ mode === 'edit' ? '编辑工具' : '创建工具' }}</span>
            <button class="close-btn" @click="handleCancel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="dialog-body">
            <!-- 被引用提示（仅编辑时） -->
            <div v-if="mode === 'edit' && referencedBy.length" class="ref-warn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              该工具被引用：{{ referencedBy.join('、') }}
            </div>

            <div class="field">
              <label class="field-label">工具名称 <span class="req">*</span></label>
              <input v-model="form.name" class="input" placeholder="DocSearcher" />
            </div>

            <div class="field">
              <label class="field-label">工具描述（AI 根据此描述判断何时使用这个工具）<span class="req">*</span></label>
              <textarea v-model="form.description" class="textarea" rows="2" placeholder="文档检索助手，当用户需要查找文档内容时调用此工具"></textarea>
            </div>

            <div class="field">
              <label class="field-label">系统提示词（这个工具被调用时的执行指令）<span class="req">*</span></label>
              <textarea v-model="form.system_prompt" class="textarea" rows="4" placeholder="你是一个文档检索专家，用户会给你一个问题和文档目录，你需要：&#10;1. 浏览目录找到相关文件&#10;2. 读取文件内容&#10;3. 提取关键信息回答问题"></textarea>
            </div>

            <div class="field">
              <label class="field-label">嵌套工具（Tools-within-Tools）</label>
              <div class="field-hint">你可以让这个工具调用其他工具。只需在上方「系统提示词」中写明何时调用它们，这里勾选的工具将对这个 AI 助手可用。</div>

              <!-- 推荐工具组：全部 SP 工具 + 当前平台特殊工具 -->
              <div class="tools-group">
                <div class="tools-group-label">推荐工具</div>
                <div class="tools-list">
                  <div v-for="t in availableRecommendedTools" :key="t.key" class="check-item">
                    <label class="check-inner">
                      <input type="checkbox" :value="t.key" v-model="form.tools" />
                      <span class="check-name">{{ t.name }}</span>
                      <span class="check-desc">{{ t.desc }}</span>
                    </label>
                    <!-- 在 App 中已配置：锁定，不可修改 -->
                    <span v-if="t.hasConfig && isInApp(t)" class="app-cfg-tag" title="使用 App 中的配置，不可在此修改">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      App配置
                    </span>
                    <!-- 未在 App 中：可自定义配置 -->
                    <button v-else-if="t.hasConfig" class="cfg-btn" :class="{ configured: !!form.toolConfigs[t.key] }" @click.stop="openConfig(t)" title="配置参数">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 已创建的工具组：排除自身 -->
              <div v-if="otherCustomTools.length" class="tools-group tools-group-sep">
                <div class="tools-group-label">你创建的工具</div>
                <div class="tools-list">
                  <div v-for="t in otherCustomTools" :key="t.id" class="check-item">
                    <label class="check-inner">
                      <input type="checkbox" :value="t.id" v-model="form.tools" />
                      <span class="check-name">{{ t.name }}</span>
                      <span class="check-desc">{{ t.description }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <span v-if="errorMsg" class="error-msg">{{ errorMsg }}</span>

            <label class="share-check">
              <input type="checkbox" v-model="form.is_public" />
              <span class="share-label">分享给其他开发者使用</span>
              <span class="share-hint">（平台可能将此工具推荐给其他开发者）</span>
            </label>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-cancel" @click="handleCancel">取消</button>
            <button class="btn btn-confirm" @click="handleConfirm">{{ mode === 'edit' ? '保存' : '创建' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 工具配置弹窗（z-index 需高于主弹窗） -->
  <Teleport to="body">
    <div v-if="configTool" class="cfg-overlay" @click.self="configTool = null">
      <div class="cfg-box" @click.stop>
        <div class="cfg-header">
          <span class="cfg-title">{{ configTool.name }} — 配置参数</span>
          <button class="close-btn" @click="configTool = null">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="cfg-body">
          <div v-for="param in configTool.params" :key="param.key" class="cfg-param">
            <label class="cfg-param-label">
              <code>{{ param.key }}</code>
              <span class="cfg-param-desc">{{ param.desc }}</span>
            </label>
            <label v-if="param.type === 'bool'" class="bool-row">
              <input type="checkbox" v-model="pendingConfig[param.key]" />
              <span>{{ pendingConfig[param.key] ? '开启' : '关闭' }}</span>
            </label>
            <input v-else v-model.number="pendingConfig[param.key]" type="number" class="cfg-input"
              :placeholder="param.default === null ? '留空=使用默认值' : String(param.default)" />
          </div>
        </div>
        <div class="cfg-footer">
          <button class="btn btn-cancel" @click="configTool = null">取消</button>
          <button class="btn btn-confirm" @click="saveConfig">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import { SP_TOOLS, SPECIAL_TOOLS } from '@/constants/spTools'

const props = defineProps({
  visible:             { type: Boolean, default: false },
  mode:                { type: String,  default: 'create' },
  initial:             { type: Object,  default: null },
  existingCustomTools: { type: Array,   default: () => [] },
  platform:            { type: String,  default: 'claude' },
  enabledTools:        { type: Object,  default: () => ({}) },
  enabledSpecialTools: { type: Object,  default: () => ({}) },
})
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const form = reactive({ name: '', description: '', system_prompt: '', tools: [], toolConfigs: {}, is_public: false })
const errorMsg = ref('')
const configTool = ref(null)
const pendingConfig = reactive({})

// 全部推荐工具：所有 SP 工具 + 当前平台支持的特殊工具
const availableRecommendedTools = computed(() => {
  const special = SPECIAL_TOOLS.filter(t => t.platforms.includes(props.platform))
  return [...SP_TOOLS, ...special]
})

// 其他自创工具（排除自身）
const otherCustomTools = computed(() =>
  props.existingCustomTools.filter(t => t.id !== props.initial?.id)
)

// 被引用的工具名列表
const referencedBy = computed(() => {
  const refs = props.initial?.referenced_by || []
  return refs.map(r => {
    if (typeof r === 'string') return r
    return r.name || r.tool_name || String(r)
  })
})

// 判断工具是否已在 App 中启用（配置锁定）
function isInApp(tool) {
  const isSp = SP_TOOLS.some(t => t.key === tool.key)
  return isSp
    ? !!props.enabledTools[tool.key]?.enabled
    : !!props.enabledSpecialTools[tool.key]?.enabled
}

function openConfig(tool) {
  configTool.value = tool
  // 初始化待配置表单：用已保存的值，没有则用参数默认值
  const saved = form.toolConfigs[tool.key] || {}
  tool.params?.forEach(p => {
    pendingConfig[p.key] = p.key in saved ? saved[p.key] : p.default
  })
}

function saveConfig() {
  const cfg = {}
  configTool.value.params?.forEach(p => {
    cfg[p.key] = pendingConfig[p.key] === '' ? null : pendingConfig[p.key]
  })
  form.toolConfigs[configTool.value.key] = cfg
  configTool.value = null
}

watch(() => props.visible, v => {
  if (v) {
    errorMsg.value = ''
    configTool.value = null
    if (props.initial) {
      form.name          = props.initial.name || ''
      form.description   = props.initial.description || ''
      form.system_prompt = props.initial.system_prompt || ''
      form.tools         = subToolsToFlat(props.initial.sub_tools || props.initial.tools || [])
      form.toolConfigs   = { ...(props.initial.tool_configs || {}) }
      form.is_public     = !!props.initial.is_public
    } else {
      form.name = ''; form.description = ''; form.system_prompt = ''
      form.tools = []; form.toolConfigs = {}; form.is_public = false
    }
  }
})

function subToolsToFlat(subTools = []) {
  return subTools.map(t => t.type === 'recommended' ? t.name : t.custom_tool_id)
}

function flatToSubTools(ids = []) {
  const spKeys = new Set(SP_TOOLS.map(t => t.key))
  const specialKeys = new Set(SPECIAL_TOOLS.map(t => t.key))
  return ids.map(id => {
    if (spKeys.has(id) || specialKeys.has(id)) return { type: 'recommended', name: id }
    const ct = props.existingCustomTools.find(t => t.id === id)
    return { type: 'custom', custom_tool_id: id, name: ct?.name || id }
  })
}

function handleConfirm() {
  if (!form.name.trim())         { errorMsg.value = '工具名称不能为空'; return }
  if (!form.description.trim())  { errorMsg.value = '工具描述不能为空'; return }
  if (!form.system_prompt.trim()){ errorMsg.value = '系统提示词不能为空'; return }
  emit('confirm', {
    name:          form.name.trim(),
    description:   form.description.trim(),
    system_prompt: form.system_prompt.trim(),
    sub_tools:     flatToSubTools(form.tools),
    tool_configs:  { ...form.toolConfigs },
    is_public:     form.is_public,
  })
  emit('update:visible', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;
}
.dialog {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%; max-width: 520px; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 0; flex-shrink: 0;
}
.dialog-title { font-size: 15px; font-weight: 600; color: var(--color-text); }
.close-btn {
  width: 28px; height: 28px; border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); border-radius: 6px; transition: all 0.15s;
}
.close-btn:hover { background: var(--color-bg-secondary); }

.dialog-body {
  flex: 1; overflow-y: auto; padding: 14px 20px 20px;
  display: flex; flex-direction: column; gap: 16px;
}

.ref-warn {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 12px; border-radius: var(--radius-md);
  background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25);
  font-size: 13px; color: #92400e; line-height: 1.5;
}
.ref-warn svg { flex-shrink: 0; color: #ca8a04; margin-top: 1px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.field-hint { font-size: 12px; color: var(--color-text-muted); line-height: 1.4; margin-bottom: 4px; }
.req { color: var(--color-error); }

.input, .textarea {
  padding: 9px 12px; border: 1.5px solid var(--color-border); border-radius: 8px;
  background: var(--color-bg); color: var(--color-text); font-size: 14px;
  font-family: inherit; outline: none; transition: border-color 0.15s;
}
.input:focus, .textarea:focus { border-color: var(--color-primary); }
.textarea { resize: vertical; min-height: 80px; }

/* 可用工具 */
.tools-group { display: flex; flex-direction: column; gap: 6px; }
.tools-group-sep { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--color-border); }
.tools-group-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
.tools-list { display: flex; flex-direction: column; gap: 4px; }

.check-item {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 10px; border: 1px solid var(--color-border); border-radius: 7px;
  transition: all 0.15s; background: var(--color-bg);
}
.check-item:hover { border-color: var(--color-primary); background: var(--color-primary-muted); }

.check-inner {
  display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; cursor: pointer;
}
.check-inner input { accent-color: var(--color-primary); flex-shrink: 0; }
.check-name { font-size: 12px; font-weight: 600; color: var(--color-text); font-family: var(--font-mono); white-space: nowrap; }
.check-desc { font-size: 12px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* App 配置锁定标签 */
.app-cfg-tag {
  display: flex; align-items: center; gap: 3px; flex-shrink: 0;
  font-size: 10px; font-weight: 600; color: var(--color-text-muted);
  padding: 2px 6px; border-radius: 4px;
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
  white-space: nowrap;
}

/* 配置按钮 */
.cfg-btn {
  width: 24px; height: 24px; flex-shrink: 0; border: none; border-radius: 5px;
  background: none; cursor: pointer; color: var(--color-text-muted);
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.cfg-btn:hover { color: var(--color-primary); background: var(--color-primary-soft); }
.cfg-btn.configured { color: var(--color-primary); }

.error-msg { font-size: 12px; color: var(--color-error); }

.share-check { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.share-check input { accent-color: var(--color-primary); width: 14px; height: 14px; flex-shrink: 0; }
.share-label { font-size: 13px; color: var(--color-text); }
.share-hint { font-size: 12px; color: var(--color-text-muted); }

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary); flex-shrink: 0;
}
.btn { padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; }
.btn-cancel { background: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border); }
.btn-cancel:hover { background: var(--color-bg); }
.btn-confirm { background: var(--color-primary); color: #fff; }
.btn-confirm:hover { background: var(--color-primary-hover); }

/* 内嵌配置弹窗 */
.cfg-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;
}
.cfg-box {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  width: 100%; max-width: 460px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden;
}
.cfg-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 0; flex-shrink: 0;
}
.cfg-title { font-size: 14px; font-weight: 600; color: var(--color-text); }
.cfg-body { flex: 1; overflow-y: auto; padding: 14px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
.cfg-param { display: flex; flex-direction: column; gap: 5px; }
.cfg-param-label { font-size: 13px; color: var(--color-text); display: flex; flex-direction: column; gap: 2px; }
.cfg-param-label code { font-size: 12px; font-family: var(--font-mono); font-weight: 600; }
.cfg-param-desc { font-size: 11px; color: var(--color-text-muted); font-family: inherit; }
.bool-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-secondary); cursor: pointer; }
.bool-row input { accent-color: var(--color-primary); }
.cfg-input {
  padding: 7px 10px; border: 1.5px solid var(--color-border); border-radius: 7px;
  background: var(--color-bg); color: var(--color-text); font-size: 13px;
  font-family: inherit; outline: none; transition: border-color 0.15s;
}
.cfg-input:focus { border-color: var(--color-primary); }
.cfg-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 20px; border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary); flex-shrink: 0;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: scale(0.96) translateY(-6px); opacity: 0; }
</style>
