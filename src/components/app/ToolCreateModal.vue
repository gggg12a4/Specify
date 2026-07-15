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
            <aside class="dialog-sidebar">
              <AppFilePanel
                ref="filePanelRef"
                variant="compact"
                :app-name="appName"
              />
            </aside>

            <div class="dialog-main">
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
                class="prompt-row"
                role="button"
                tabindex="0"
                @click="openPromptModal"
                @keydown.enter.prevent="openPromptModal"
                @keydown.space.prevent="openPromptModal"
              >
                <div class="prompt-row-main">
                  <span class="prompt-row-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path d="M153.6 768h716.8a51.2 51.2 0 0 1 0 102.4H153.6a51.2 51.2 0 0 1 0-102.4zM153.6 153.6h716.8a51.2 51.2 0 0 1 0 102.4H153.6a51.2 51.2 0 0 1 0-102.4z m0 307.2h409.6a51.2 51.2 0 0 1 0 102.4H153.6a51.2 51.2 0 0 1 0-102.4z" fill="currentColor" />
                    </svg>
                  </span>
                  <span class="prompt-row-label">{{ promptRowLabel }}</span>
                </div>
                <span class="prompt-expand-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                  展开编辑
                </span>
              </div>
            </div>

            <div class="field tools-field">
              <label class="field-label">
                推荐工具 <span class="field-label-en">TOOLS</span>
              </label>
              <div class="field-hint">勾选后会移到「已选」；系统提示词中可说明何时调用它们。</div>

              <div
                v-for="section in nestToolSections"
                :key="section.key"
                class="tools-block"
              >
                <div class="section-divider">
                  <span class="section-divider-label">—— <strong>{{ section.label }}</strong> ——</span>
                </div>

                <div
                  v-if="!section.items.length"
                  class="subgroup-empty"
                  :class="{ 'is-selected-zone': section.key === 'selected' }"
                >
                  {{ section.empty }}
                </div>

                <TransitionGroup
                  v-else
                  :name="section.key === 'more' ? 'list-anim' : undefined"
                  tag="div"
                  class="card-grid"
                >
                  <div
                    v-for="item in section.items"
                    :key="item.key"
                    class="tool-card"
                    :class="{
                      'is-on': item.enabled,
                      'is-off': !item.enabled,
                      'is-unavailable': item.isUnavailable,
                      'is-warn-agent': item.isWarn,
                      'is-circular': item.isCircular,
                    }"
                  >
                    <div class="tool-card-head">
                      <label class="tool-checkbox-wrap" @click.stop>
                        <input
                          type="checkbox"
                          class="tool-checkbox-input"
                          :checked="item.enabled"
                          :disabled="item.isUnavailable || item.isCircular"
                          @change="toggleNestTool(item, $event.target.checked)"
                        />
                        <span class="tool-checkbox-ui" aria-hidden="true"></span>
                      </label>
                      <div class="tool-card-title-wrap">
                        <span class="card-title">{{ item.name }}</span>
                        <span v-if="item.shortLabel" class="card-short-label">{{ item.shortLabel }}</span>
                      </div>
                    </div>

                    <div class="card-desc">{{ item.summary }}</div>

                    <div class="tool-card-footer">
                      <span class="tool-type-badge" :class="item.badgeClass">{{ item.typeBadge }}</span>
                      <div class="tool-card-actions">
                        <button
                          v-if="item.showClose"
                          type="button"
                          class="card-aux-btn warn"
                          @click="toggleNestTool(item, false)"
                        >
                          关闭
                        </button>
                        <span v-if="item.isCircular" class="circular-badge">循环引用</span>
                        <span
                          v-else-if="item.appLocked"
                          class="app-cfg-tag"
                          title="使用 App 中的配置，不可在此修改"
                        >
                          App配置
                        </span>
                        <ToolInfoIcon
                          v-if="!item.isCircular"
                          :label="item.name"
                          :tooltip="item.tooltip"
                          @click="infoTool = item.raw"
                        />
                        <ToolConfigBtn
                          v-if="item.showConfig"
                          :title="item.configTitle"
                          @click="openConfig(item.raw)"
                        />
                      </div>
                    </div>
                  </div>
                </TransitionGroup>
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
    :file-refs="resolvedFileRefs"
    :tool-refs="toolRefs"
    title="工具系统提示词"
    placeholder="定义该工具被调用时的角色、行为边界以及如何使用嵌套工具…"
  />

  <ToolInfoModal v-if="infoTool" :tool="infoTool" @close="infoTool = null" />

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
import { isToolError } from '@/constants/spTools'
import { isCustomToolOrDepError } from '@/utils/customToolErrors'
import { showError } from '@/composables/useNotification'
import SystemPromptModal from './SystemPromptModal.vue'
import AppFilePanel from './AppFilePanel.vue'
import ToolInfoIcon from './ToolInfoIcon.vue'
import ToolConfigBtn from './ToolConfigBtn.vue'
import ToolInfoModal from './ToolInfoModal.vue'

const props = defineProps({
  visible:             { type: Boolean, default: false },
  mode:                { type: String,  default: 'create' },
  initial:             { type: Object,  default: null },
  existingCustomTools: { type: Array,   default: () => [] },
  platform:            { type: String,  default: 'claude' },
  appName:             { type: String,  default: '' },
  enabledTools:        { type: Object,  default: () => ({}) },
  enabledSpecialTools: { type: Object,  default: () => ({}) },
  platformToolDefs:    { type: Array,   default: () => [] },
  fileRefs:            { type: Array,   default: () => [] },
  toolRefs:            { type: Array,   default: () => [] },
})
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const form = reactive({ name: '', description: '', system_prompt: '', tools: [], toolConfigs: {} })
const configTool = ref(null)
const pendingConfig = reactive({})
const showPromptModal = ref(false)
const filePanelRef = ref(null)
const infoTool = ref(null)

const resolvedFileRefs = computed(() =>
  filePanelRef.value?.getMentionFileItems?.() ?? props.fileRefs
)

/** 紧凑行展示：空时为 # Role，有内容时取首行 */
const promptRowLabel = computed(() => {
  const text = form.system_prompt.trim()
  if (!text) return '# Role'
  const firstLine = text.split('\n').map((line) => line.trim()).find(Boolean)
  return firstLine || '# Role'
})

function openPromptModal() {
  showPromptModal.value = true
}

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
  if (props.mode === 'create') return false

  const currentEditingId = props.initial?.id
  if (!currentEditingId) return false
  if (targetId === currentEditingId) return true
  if (visited.has(targetId)) return false
  visited.add(targetId)

  const targetAgent = props.existingCustomTools.find(t => t.id === targetId)
  if (!targetAgent || !targetAgent.sub_tools || targetAgent.sub_tools.length === 0) {
    return false
  }

  for (const childRef of targetAgent.sub_tools) {
    const childId = childRef.custom_tool_id || childRef.name || childRef
    const childAgent = props.existingCustomTools.find(t => t.id === childId)
    if (childAgent && isCircularDependency(childId, visited)) return true
  }

  return false
}

function isSelected(key) {
  return form.tools.includes(key)
}

/** 判断推荐工具是否已在 App 层启用（启用后配置锁定） */
function isInApp(tool) {
  const def = props.platformToolDefs.find(t => t.key === tool.key)
  const isSp = !def || (def.kind !== 'special' && def.category !== 'agent')
  return isSp
    ? !!props.enabledTools[tool.key]?.enabled
    : !!props.enabledSpecialTools[tool.key]?.enabled
}

function buildPlatformItem(tool) {
  const category = tool.category || (tool.kind === 'special' ? 'agent' : (tool.kind === 'mcp' ? 'mcp' : 'basetool'))
  const unavailable = isToolError(tool.key)
  const enabled = isSelected(tool.key)
  const isAgent = category === 'agent' || tool.kind === 'special'
  const isMcp = category === 'mcp' || tool.kind === 'mcp'
  const appLocked = !unavailable && !!tool.hasConfig && isInApp(tool)
  const showConfig = !unavailable && !!tool.hasConfig && !appLocked

  let typeBadge = '基础工具'
  let badgeClass = 'type-basetool'
  if (isMcp) {
    typeBadge = '平台提供的MCP工具'
    badgeClass = 'type-mcp'
  } else if (isAgent) {
    typeBadge = 'Agent 工具'
    badgeClass = 'type-agent'
  }

  return {
    key: tool.key,
    itemType: 'platform',
    raw: {
      key: tool.key,
      name: tool.name,
      desc: tool.desc,
      hasConfig: !!tool.hasConfig,
      params: tool.params || [],
      detail: tool.detail,
      kind: tool.kind,
      category,
    },
    name: tool.name,
    shortLabel: tool.desc,
    summary: unavailable
      ? '该平台工具已下架或失效'
      : (tool.detail?.summary || tool.desc || ''),
    typeBadge,
    badgeClass,
    enabled,
    isUnavailable: unavailable,
    isWarn: false,
    isCircular: false,
    appLocked,
    showClose: unavailable && enabled,
    showConfig,
    configTitle: '配置参数',
    tooltip: unavailable ? '该平台工具已下架或失效' : `点击查看「${tool.name}」使用说明`,
  }
}

function buildCustomItem(ct) {
  const circular = isCircularDependency(ct.id)
  const warn = isCustomToolInError(ct)
  const enabled = isSelected(ct.id)

  return {
    key: ct.id,
    itemType: 'custom',
    raw: {
      key: ct.id,
      name: ct.name,
      desc: ct.description,
      detail: { summary: ct.description || '' },
      params: [],
      hasConfig: false,
    },
    name: ct.name || '(未命名)',
    shortLabel: '',
    summary: circular
      ? '挂载将导致循环依赖'
      : (warn ? '该创建工具存在异常，建议修改或移除引用' : (ct.description || '暂无描述')),
    typeBadge: '你创建的工具',
    badgeClass: 'type-custom',
    enabled,
    isUnavailable: false,
    isWarn: warn,
    isCircular: circular,
    appLocked: false,
    showClose: false,
    showConfig: false,
    configTitle: '',
    tooltip: circular
      ? '无法挂载：该工具已直接或间接依赖当前工具'
      : `点击查看「${ct.name || '工具'}」说明`,
  }
}

const allNestToolItems = computed(() => [
  ...(props.platformToolDefs || []).map(buildPlatformItem),
  ...otherCustomTools.value.map(buildCustomItem),
])

function sortToolsWithErrorsFirst(items) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aError = a.item.isUnavailable || a.item.isWarn || a.item.isCircular ? 1 : 0
      const bError = b.item.isUnavailable || b.item.isWarn || b.item.isCircular ? 1 : 0
      if (aError !== bError) return bError - aError
      return a.index - b.index
    })
    .map(({ item }) => item)
}

const nestToolSections = computed(() => {
  const selected = allNestToolItems.value.filter(item => item.enabled)
  const more = allNestToolItems.value.filter(item => !item.enabled)
  const hasCatalog = allNestToolItems.value.length > 0

  return [
    {
      key: 'selected',
      label: '已选',
      items: sortToolsWithErrorsFirst(selected),
      empty: hasCatalog
        ? '(还没选工具，从下方「更多工具」勾选)'
        : '暂无可用工具',
    },
    {
      key: 'more',
      label: '更多工具',
      items: sortToolsWithErrorsFirst(more),
      empty: hasCatalog ? '所有工具均已选中' : '暂无可用工具',
    },
  ]
})

function toggleNestTool(item, enabled) {
  if (item.isCircular && enabled) return
  const key = item.key
  if (enabled) {
    if (!form.tools.includes(key)) form.tools = [...form.tools, key]
  } else {
    form.tools = form.tools.filter(t => t !== key)
  }
}

/** 引用当前工具的其他 Agent 名称列表（编辑模式警告用） */
const referencedBy = computed(() => {
  const refs = props.initial?.referenced_by || []
  return refs.map(r => {
    if (typeof r === 'string') return r
    return r.name || r.tool_name || String(r)
  })
})

/** 打开子工具参数配置内嵌弹窗并初始化 pendingConfig */
function openConfig(tool) {
  configTool.value = tool
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

/** 弹窗打开时根据 mode 初始化或回填表单 */
watch(() => props.visible, v => {
  if (v) {
    configTool.value = null
    infoTool.value = null
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
  const recommendedKeys = new Set((props.platformToolDefs || []).map(t => t.key))
  return ids.map(id => {
    if (recommendedKeys.has(id) || String(id).startsWith('SP')) {
      return { type: 'recommended', name: id }
    }
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
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;
}
.dialog {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%; max-width: 920px; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
}
.dialog-title { font-size: 15px; font-weight: 600; color: var(--color-text); }
.close-btn {
  width: 28px; height: 28px; border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted); border-radius: 6px; transition: all 0.15s;
}
.close-btn:hover { background: var(--color-bg-secondary); }

.dialog-body {
  flex: 1; overflow: hidden; padding: 0;
  display: flex; align-items: stretch; min-height: 0;
}

.dialog-sidebar {
  width: 260px;
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
}

.dialog-sidebar :deep(.file-panel) {
  height: 100%;
  border-right: none;
}

.dialog-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 760px) {
  .dialog-body {
    flex-direction: column;
    overflow-y: auto;
  }
  .dialog-sidebar {
    width: 100%;
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }
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
.field-label-en {
  margin-left: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.06em;
}
.field-hint { font-size: 12px; color: var(--color-text-muted); line-height: 1.4; margin-bottom: 4px; }
.req { color: var(--color-error); }

.input, .textarea {
  padding: 9px 12px; border: 1.5px solid var(--color-border); border-radius: 8px;
  background: var(--color-bg); color: var(--color-text); font-size: 14px;
  font-family: inherit; outline: none; transition: border-color 0.15s;
}
.input:focus, .textarea:focus { border-color: var(--color-primary); }
.textarea { resize: vertical; min-height: 80px; }

.tools-field { gap: 10px; }

.tools-block + .tools-block {
  margin-top: 22px;
}

.section-divider {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  margin: 0 0 14px;
}

.section-divider-label {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 400;
  color: #8f959e;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.subgroup-empty {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 14px 16px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  text-align: center;
}

.subgroup-empty.is-selected-zone {
  border: none;
  background: #f3f4f6;
  padding: 18px 16px;
  color: #9ca3af;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  position: relative;
}

@media (max-width: 900px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.tool-card {
  position: relative;
  box-sizing: border-box;
  height: 88px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.tool-card.is-on {
  border-color: #bfdbfe;
}

.tool-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 1px 4px rgba(59, 130, 246, 0.08);
}

.tool-card.is-off:not(.is-unavailable):not(.is-warn-agent):not(.is-circular) {
  opacity: 0.92;
}

.tool-card.is-unavailable {
  background: #fef2f2;
  border-color: #fecaca;
}

.tool-card.is-warn-agent {
  background: #fffbeb;
  border-color: #fde68a;
}

.tool-card.is-circular {
  opacity: 0.7;
  background: var(--color-bg-secondary);
}

.tool-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tool-checkbox-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  cursor: pointer;
}

.tool-checkbox-input {
  position: absolute;
  inset: 0;
  width: 16px;
  height: 16px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.tool-checkbox-ui {
  display: block;
  width: 16px;
  height: 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  transition: background 0.15s, border-color 0.15s;
}

.tool-checkbox-input:checked + .tool-checkbox-ui {
  background: var(--color-primary, #3b82f6);
  border-color: var(--color-primary, #3b82f6);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M3.5 8.2L6.6 11.3L12.5 5.2' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px 12px;
}

.tool-checkbox-input:disabled + .tool-checkbox-ui {
  opacity: 0.45;
  cursor: not-allowed;
}

.tool-card-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  max-width: 55%;
}

.card-short-label {
  font-size: 11px;
  font-weight: 400;
  color: #9ca3af;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.card-desc {
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-word;
  flex-shrink: 0;
}

.tool-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  flex-shrink: 0;
}

.tool-card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.card-aux-btn {
  padding: 0 8px;
  height: 24px;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.card-aux-btn.warn {
  color: #dc2626;
  background: #fee2e2;
}

.tool-type-badge {
  font-size: 10px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.01em;
  color: #9ca3af;
}

.tool-type-badge.type-mcp {
  color: #059669;
}

.circular-badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-error);
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(239, 68, 68, 0.1);
  white-space: nowrap;
}

.app-cfg-tag {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  white-space: nowrap;
}

.list-anim-move {
  transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
}

.list-anim-enter-active,
.list-anim-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
}

.list-anim-enter-from,
.list-anim-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.list-anim-leave-active {
  position: absolute;
}

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

.prompt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid #eef0f3;
  border-radius: 8px;
  background: var(--color-surface);
  box-shadow: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  box-sizing: border-box;
}

.prompt-row:hover {
  border-color: #e5e7eb;
  background: #fafafa;
}

.prompt-row:focus-visible {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px #dbeafe;
}

.prompt-row-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.prompt-row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #9ca3af;
}

.prompt-row:hover .prompt-row-icon {
  color: #6b7280;
}

.prompt-row-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  font-family: var(--font-sans);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: var(--color-primary);
  line-height: 1;
  white-space: nowrap;
}

.prompt-expand-btn svg {
  flex-shrink: 0;
}

.prompt-row:hover .prompt-expand-btn {
  color: var(--color-primary-hover, #2563eb);
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .dialog, .modal-leave-active .dialog { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .dialog, .modal-leave-to .dialog { transform: scale(0.96) translateY(-6px); opacity: 0; }
</style>
