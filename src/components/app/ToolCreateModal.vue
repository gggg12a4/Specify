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
              <div
                class="prompt-box prompt-trigger"
                role="button"
                tabindex="0"
                @click="openPromptModal"
                @keydown.enter.prevent="openPromptModal"
                @keydown.space.prevent="openPromptModal"
              >
                <div v-if="form.system_prompt.trim()" class="prompt-preview">{{ form.system_prompt }}</div>
                <div v-else class="prompt-placeholder">定义该工具被调用时的角色、行为与执行步骤…</div>
                <span class="prompt-open-hint">点击展开编辑</span>
              </div>
            </div>

            <div class="field">
              <label class="field-label">嵌套工具（Tools-within-Tools）</label>
              <div class="field-hint">你可以让这个工具调用其他工具。只需在上方「系统提示词」中写明何时调用它们，这里勾选的工具将对这个 AI 助手可用。</div>

              <!-- 推荐工具组：全部 SP 工具 + 当前平台特殊工具 -->
              <div class="tools-group">
                <div class="tools-group-label">推荐工具</div>
                <div class="tools-list">
                  <div v-for="t in availableRecommendedTools" :key="t.key" class="check-item" :class="{ 'is-error-platform': isToolError(t.key) }">
                    <template v-if="isToolError(t.key)">
                      <div class="check-inner disabled-error-inner">
                        <span class="error-icon">❌</span>
                        <span class="check-name">{{ t.name }}</span>
                        <span class="check-desc">该平台工具已下架或失效</span>
                      </div>
                      <button class="btn-close-error" @click.stop="removeToolDep(t.key)" v-if="form.tools.includes(t.key)">
                        关闭
                      </button>
                    </template>
                    <template v-else>
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
                    </template>
                  </div>
                </div>
              </div>

              <!-- 已创建的工具组：排除自身 -->
              <div v-if="otherCustomTools.length" class="tools-group tools-group-sep">
                <div class="tools-group-label">你创建的工具</div>
                <div class="tools-list">
                  <div v-for="t in otherCustomTools" :key="t.id" class="check-item" :class="{ 'is-circular': isCircularDependency(t.id), 'is-error-agent': isCustomToolInError(t) }">
                    <label class="check-inner" :title="isCircularDependency(t.id) ? '无法挂载。因为该工具内部已经（直接或间接）依赖了当前工具，挂载将导致死循环。' : (isCustomToolInError(t) ? '建议修改该创建的工具，或移除引用' : '')">
                      <input type="checkbox" :value="t.id" v-model="form.tools" :disabled="isCircularDependency(t.id)" />
                      <span v-if="isCustomToolInError(t)" class="error-icon warn">⚠️</span>
                      <span class="check-name">{{ t.name }}</span>
                      <span class="check-desc">{{ isCustomToolInError(t) ? '该创建工具存在异常，建议修改或移除引用' : t.description }}</span>
                      <span v-if="isCircularDependency(t.id)" class="circular-badge">🚫 循环引用</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-cancel" @click="handleCancel">取消</button>
            <button class="btn btn-confirm" @click="handleConfirm">{{ mode === 'edit' ? '保存' : '创建' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <SystemPromptModal
    v-model:visible="showPromptModal"
    v-model="form.system_prompt"
    :file-refs="fileRefs"
    :tool-refs="toolRefs"
    title="工具系统提示词"
    placeholder="定义该工具被调用时的角色、行为边界以及如何使用嵌套工具…"
  />

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
/**
 * 创建/编辑自定义 Agent 工具弹窗。
 * 支持嵌套平台工具与其他 Agent 工具，编辑模式下 DFS 检测循环依赖。
 */
import { reactive, ref, watch, computed } from 'vue'
import { SP_TOOLS, SPECIAL_TOOLS, isToolError, getToolErrorMsg } from '@/constants/spTools'
import { isCustomToolOrDepError } from '@/utils/customToolErrors'
import { showError } from '@/composables/useNotification'
import SystemPromptModal from './SystemPromptModal.vue'

const props = defineProps({
  visible:             { type: Boolean, default: false },
  mode:                { type: String,  default: 'create' },
  initial:             { type: Object,  default: null },
  existingCustomTools: { type: Array,   default: () => [] },
  platform:            { type: String,  default: 'claude' },
  enabledTools:        { type: Object,  default: () => ({}) },
  enabledSpecialTools: { type: Object,  default: () => ({}) },
  fileRefs:            { type: Array,   default: () => [] },
  toolRefs:            { type: Array,   default: () => [] },
})
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const form = reactive({ name: '', description: '', system_prompt: '', tools: [], toolConfigs: {} })
const configTool = ref(null)
const pendingConfig = reactive({})
const showPromptModal = ref(false)

function openPromptModal() {
  showPromptModal.value = true
}

/** 可选推荐工具：SP 工具 + 当前平台特殊工具 */
const availableRecommendedTools = computed(() => {
  const special = SPECIAL_TOOLS.filter(t => t.platforms.includes(props.platform))
  return [...SP_TOOLS, ...special]
})

/** 其他自定义工具（排除当前正在编辑的自身） */
const otherCustomTools = computed(() =>
  props.existingCustomTools.filter(t => t.id !== props.initial?.id)
)

function isCustomToolInError(tool) {
  return isCustomToolOrDepError(tool, props.existingCustomTools)
}

/**
 * DFS 检测嵌套 Agent 工具是否形成循环依赖。
 * 从候选工具出发沿 sub_tools 向下搜索，能否回到当前编辑中的工具 id。
 */
function isCircularDependency(targetId, visited = new Set()) {
  // 如果是创建模式，因为当前工具还没有 ID 且还没被其他工具依赖，所以不可能形成循环
  if (props.mode === 'create') return false;

  const currentEditingId = props.initial?.id;
  if (!currentEditingId) return false;

  // 如果顺藤摸瓜找到了当前正在编辑的 ID，说明闭环了！
  if (targetId === currentEditingId) return true;

  // 避免重复检测同一个节点，防止死循环
  if (visited.has(targetId)) return false;
  visited.add(targetId);

  const targetAgent = props.existingCustomTools.find(t => t.id === targetId);
  if (!targetAgent || !targetAgent.sub_tools || targetAgent.sub_tools.length === 0) {
    return false;
  }

  // 递归检查它依赖的那些工具
  for (const childRef of targetAgent.sub_tools) {
    // sub_tools 里可能是包含 custom_tool_id 的对象
    const childId = childRef.custom_tool_id || childRef.name || childRef;
    // 如果子工具还是一个自建工具，则继续向下挖掘
    const childAgent = props.existingCustomTools.find(t => t.id === childId);
    if (childAgent) {
      if (isCircularDependency(childId, visited)) return true;
    }
  }

  return false;
}

/** 引用当前工具的其他 Agent 名称列表（编辑模式警告用） */
const referencedBy = computed(() => {
  const refs = props.initial?.referenced_by || []
  return refs.map(r => {
    if (typeof r === 'string') return r
    return r.name || r.tool_name || String(r)
  })
})

/** 判断推荐工具是否已在 App 层启用（启用后配置锁定，不可在此修改） */
function isInApp(tool) {
  const isSp = SP_TOOLS.some(t => t.key === tool.key)
  return isSp
    ? !!props.enabledTools[tool.key]?.enabled
    : !!props.enabledSpecialTools[tool.key]?.enabled
}

/** 打开子工具参数配置内嵌弹窗并初始化 pendingConfig */
function openConfig(tool) {
  configTool.value = tool
  // 初始化待配置表单：用已保存的值，没有则用参数默认值
  const saved = form.toolConfigs[tool.key] || {}
  tool.params?.forEach(p => {
    pendingConfig[p.key] = p.key in saved ? saved[p.key] : p.default
  })
}

/** 保存子工具参数到 form.toolConfigs */
function saveConfig() {
  const cfg = {}
  configTool.value.params?.forEach(p => {
    cfg[p.key] = pendingConfig[p.key] === '' ? null : pendingConfig[p.key]
  })
  form.toolConfigs[configTool.value.key] = cfg
  configTool.value = null
}

/** 从嵌套工具列表中移除指定 key */
function removeToolDep(key) {
  form.tools = form.tools.filter(t => t !== key)
  markDirty()
}

/** 弹窗打开时根据 mode 初始化或回填表单 */
watch(() => props.visible, v => {
  if (v) {
    configTool.value = null
    if (props.initial) {
      form.name          = props.initial.name || ''
      form.description   = props.initial.description || ''
      form.system_prompt = props.initial.system_prompt || ''
      form.tools         = subToolsToFlat(props.initial.sub_tools || props.initial.tools || [])
      form.toolConfigs   = { ...(props.initial.tool_configs || {}) }
    } else {
      form.name = ''; form.description = ''; form.system_prompt = ''
      form.tools = []; form.toolConfigs = {}
    }
  } else {
    showPromptModal.value = false
  }
})

/** 将 sub_tools 对象数组转为扁平 id/key 列表供 checkbox 绑定 */
function subToolsToFlat(subTools = []) {
  return subTools.map(t => {
    if (typeof t === 'string') return t
    return t.type === 'recommended' ? t.name : t.custom_tool_id
  }).filter(Boolean)
}

/** 将扁平 id 列表转回 sub_tools 引用结构（区分推荐工具与自定义工具） */
function flatToSubTools(ids = []) {
  const spKeys = new Set(SP_TOOLS.map(t => t.key))
  const specialKeys = new Set(SPECIAL_TOOLS.map(t => t.key))
  return ids.map(id => {
    if (spKeys.has(id) || specialKeys.has(id)) return { type: 'recommended', name: id }
    const ct = props.existingCustomTools.find(t => t.id === id)
      || props.existingCustomTools.find(t => t.name === id)
    return { type: 'custom', custom_tool_id: ct?.id || id, name: ct?.name || id }
  })
}

/** 校验必填项后 emit confirm 并关闭弹窗 */
function handleConfirm() {
  if (!form.name.trim())         { showError('工具名称不能为空'); return }
  if (!form.description.trim())  { showError('工具描述不能为空'); return }
  if (!form.system_prompt.trim()){ showError('系统提示词不能为空'); return }
  emit('confirm', {
    name:          form.name.trim(),
    description:   form.description.trim(),
    system_prompt: form.system_prompt.trim(),
    sub_tools:     flatToSubTools(form.tools),
    tool_configs:  { ...form.toolConfigs },
  })
  emit('update:visible', false)
}

/** 取消并关闭弹窗 */
function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}

/** 触发依赖列表响应式更新（预留扩展点） */
function markDirty() {
  // Can be expanded if needed, currently used just to trigger reactivity or tracking
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
.check-item:hover:not(.is-circular) { border-color: var(--color-primary); background: var(--color-primary-muted); }

.check-item.is-circular {
  background: var(--color-bg-secondary);
  opacity: 0.65;
  cursor: not-allowed;
}

.check-item.is-circular .check-inner {
  cursor: not-allowed;
}

.circular-badge {
  display: inline-flex; align-items: center; gap: 2px; flex-shrink: 0;
  font-size: 10px; font-weight: 600; color: var(--color-error);
  padding: 2px 6px; border-radius: 4px;
  background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
  white-space: nowrap; margin-left: auto;
}

.check-inner {
  display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; cursor: pointer;
}
.check-inner input { accent-color: var(--color-primary); flex-shrink: 0; }
.check-name { font-size: 12px; font-weight: 600; color: var(--color-text); font-family: var(--font-mono); white-space: nowrap; }
.check-desc { font-size: 12px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 平台工具异常状态 */
.is-error-platform {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.3);
}
.disabled-error-inner {
  cursor: not-allowed !important;
  opacity: 0.8;
}
.error-icon { font-size: 12px; margin-right: 2px; flex-shrink: 0; }
.error-icon.warn { color: #b45309; }
.btn-close-error {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  background: var(--color-error);
  color: white;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.btn-close-error:hover { opacity: 0.85; }

/* 子 Agent 异常状态 */
.is-error-agent {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.35);
}
.is-error-agent .check-desc {
  color: #b45309;
}

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

.prompt-box {
  width: 100%;
  min-height: 120px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 13px;
  line-height: 1.6;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.prompt-trigger {
  position: relative;
  cursor: pointer;
}

.prompt-trigger:hover {
  border-color: #cbd5e1;
  background: #fafafa;
}

.prompt-trigger:focus-visible {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px #dbeafe;
}

.prompt-preview {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text);
  max-height: 120px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
}

.prompt-placeholder {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.prompt-open-hint {
  position: absolute;
  right: 12px;
  bottom: 10px;
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0;
  transition: opacity 0.15s;
}

.prompt-trigger:hover .prompt-open-hint,
.prompt-trigger:focus-visible .prompt-open-hint {
  opacity: 1;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: scale(0.96) translateY(-6px); opacity: 0; }
</style>
