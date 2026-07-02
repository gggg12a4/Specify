<template>
  <div class="tools-section">

    <!-- ── 平台工具 ── -->
    <div class="group">
      <div class="group-label">平台工具</div>

      <div
        v-for="section in platformToolSections"
        :key="section.key"
        class="platform-subgroup"
      >
        <div class="subgroup-label">{{ section.label }}</div>

        <div v-if="!section.tools.length" class="subgroup-empty">
          {{ section.empty }}
        </div>

        <div v-else class="card-grid">
          <div
            v-for="tool in section.tools"
            :key="tool.key"
            class="tool-card group"
            :class="{
              'is-off': !isPlatformToolEnabled(tool),
              'is-unavailable': isToolError(tool.key),
            }"
          >
            <div class="card-row">
              <div class="card-info">
                <div class="card-title-row">
                  <span class="card-title">{{ tool.name }}</span>
                  <ToolInfoIcon
                    :label="tool.name"
                    :tooltip="getToolTooltip(tool)"
                    @click="$emit('show-info', tool)"
                  />
                </div>
                <div class="card-desc">{{ isToolError(tool.key) ? '平台工具已下架或失效' : tool.desc }}</div>
                <div
                  v-if="tool.kind === 'special' && tool.hasSubModel && isPlatformToolEnabled(tool) && specialTools[tool.key]?.sub_model"
                  class="submodel-hint"
                >
                  子模型: {{ specialTools[tool.key].sub_model }}
                </div>
              </div>
              <div class="card-controls">
                <button
                  v-if="isToolError(tool.key) && isPlatformToolEnabled(tool)"
                  type="button"
                  class="card-aux-btn warn"
                  @click="togglePlatformTool(tool, false)"
                >
                  关闭
                </button>
                <template v-else-if="!isToolError(tool.key)">
                  <ToolConfigBtn
                    v-if="tool.kind === 'sp' && tool.hasConfig"
                    title="配置参数"
                    @click="$emit('show-config', { tool, disabledRules: disabledConfigs[tool.key] })"
                  />
                  <ToolConfigBtn
                    v-else-if="tool.kind === 'special' && tool.hasSubModel"
                    title="配置子模型"
                    @click="openSubModel(tool)"
                  />
                  <button
                    type="button"
                    class="card-toggle"
                    :class="{ off: !isPlatformToolEnabled(tool) }"
                    :aria-pressed="isPlatformToolEnabled(tool)"
                    title="启用 / 禁用"
                    @click="togglePlatformTool(tool, !isPlatformToolEnabled(tool))"
                  >
                    <div class="card-toggle-knob"></div>
                  </button>
                </template>
              </div>
            </div>

            <div
              v-if="tool.kind === 'sp' && tool.key === 'SPSkillManager' && tools['SPSkillManager']?.enabled && skillManagerWarn"
              class="dep-warn"
            >
              需要同时启用 SPread、SPglob 才能正常工作
            </div>

            <span class="tool-type-badge type-basetool">基础工具</span>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- ── 你创建的工具 ── -->
    <div class="group">
      <div class="group-label-row">
        <span class="group-label">你创建的工具</span>
        <button class="btn-add" @click="showCreate = true">+ 创建工具</button>
      </div>

      <div v-if="!customTools.length" class="custom-empty">
        暂无自定义工具，点击「创建工具」添加子 Agent
      </div>

      <TransitionGroup v-else name="list-anim" tag="div" class="card-grid">
        <div
          v-for="ct in sortedCustomTools"
          :key="ct.id"
          class="tool-card tool-card-agent"
          :class="{
            'is-off': !ct.enabled,
            'is-warn-agent': isToolOrDepError(ct),
          }"
        >
          <div class="agent-card-row">
            <div class="card-info">
              <div class="agent-card-head">
                <div class="card-title-row">
                  <span class="card-title">{{ ct.name || '(未命名)' }}</span>
                  <ToolInfoIcon
                    :label="ct.name || '自定义工具'"
                    :tooltip="getCustomToolTooltip(ct)"
                    @click="openCustomToolInfo(ct)"
                  />
                </div>
                <div class="card-controls">
                  <ToolConfigBtn
                    :title="isToolOrDepError(ct) ? '修复工具' : '编辑工具'"
                    @click="openEdit(ct)"
                  />
                  <button
                    type="button"
                    class="card-aux-btn icon-only"
                    title="移除"
                    @click="removeCustomTool(ct.id)"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="card-toggle"
                    :class="{ off: !ct.enabled }"
                    :aria-pressed="!!ct.enabled"
                    title="启用 / 禁用"
                    @click="toggleCustomTool(ct, !ct.enabled)"
                  >
                    <div class="card-toggle-knob"></div>
                  </button>
                </div>
              </div>

              <div class="card-desc">
                <template v-if="isToolOrDepError(ct)">
                  <span class="desc-error-hint">依赖异常</span>
                  <span v-if="!ct.enabled" class="desc-muted-hint">· 未启用，暂不影响</span>
                </template>
                <template v-else>
                  <span v-if="getCustomSubTools(ct).length" class="nested-badge" title="此工具内部调用了其他工具">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12h8"/><path d="M12 2v20"/><path d="M22 12h-8"/></svg>
                    嵌套
                  </span>
                  {{ ct.description || '暂无描述' }}
                </template>
              </div>

              <!-- 嵌套子工具标签：异常优先展示，超出 MAX_VISIBLE_SUB_TOOLS 折叠为 +N -->
              <div v-if="getCustomSubTools(ct).length" class="nested-chips">
                <span
                  v-for="sub in getVisibleSubTools(ct)"
                  :key="getSubToolRefKey(sub)"
                  class="chip-item"
                  :class="{ 'chip-error-agent': isSubToolError(sub) }"
                >
                  <span v-if="isSubToolError(sub)" class="chip-icon">⚠️</span>
                  {{ getToolDisplayName(sub) }}
                </span>
                <span v-if="getHiddenSubToolCount(ct) > 0" class="chip-item chip-more">
                  +{{ getHiddenSubToolCount(ct) }}
                </span>
              </div>
            </div>
          </div>

          <span class="tool-type-badge type-agent">Agent工具</span>
        </div>
      </TransitionGroup>
    </div>

    <!-- 弹窗 -->
    <ToolCreateModal
      v-model:visible="showCreate"
      mode="create"
      :existing-custom-tools="customTools"
      :platform="platform"
      :enabled-tools="tools"
      :enabled-special-tools="specialTools"
      :file-refs="fileRefs"
      :tool-refs="toolRefs"
      @confirm="handleCreateTool"
    />

    <ToolCreateModal
      v-model:visible="showEdit"
      mode="edit"
      :initial="editTarget"
      :existing-custom-tools="customTools"
      :platform="platform"
      :enabled-tools="tools"
      :enabled-special-tools="specialTools"
      :file-refs="fileRefs"
      :tool-refs="toolRefs"
      @confirm="handleEditTool"
    />

    <ToolSubModelModal
      v-if="subModelTool"
      v-model:visible="showSubModel"
      :tool-key="subModelTool.key"
      :platform="platform"
      :current-sub-model="specialTools[subModelTool.key]?.sub_model || null"
      @confirm="handleSubModelConfirm"
    />
  </div>
</template>

<script setup>
/**
 * App 工具配置区：平台工具、特殊工具、用户创建的 Agent 工具。
 *
 * 通过 v-model 风格 emit 将变更同步到父级 form；
 * checkEnabledToolsErrors() 供 AppEditView 在保存/调试前做全局失效检查。
 *
 * 展示排序规则：
 * - 平台工具 / 自定义工具：异常项优先，同优先级内保持原顺序
 * - 嵌套子工具标签：异常依赖优先，最多展示 MAX_VISIBLE_SUB_TOOLS 个
 */
import { ref, computed, watch } from 'vue'
import { SP_TOOLS, SPECIAL_TOOLS, isToolError, getToolErrorMsg } from '@/constants/spTools'
import {
  normalizeSubTools,
  getSubToolRefKey,
  isPlatformSubTool,
  findCustomToolRef,
  isSubToolError as isSubToolErrorUtil,
  isCustomToolOrDepError,
} from '@/utils/customToolErrors'
import ToolCreateModal from './ToolCreateModal.vue'
import ToolSubModelModal from './ToolSubModelModal.vue'
import ToolInfoIcon from './ToolInfoIcon.vue'
import ToolConfigBtn from './ToolConfigBtn.vue'
import mockApi from '@/api/mockApi'

import { showError } from '@/composables/useNotification'

const props = defineProps({
  tools: { type: Object, required: true },
  customTools: { type: Array, required: true },
  specialTools: { type: Object, default: () => ({}) },
  platform: { type: String, default: 'claude' },
  fileRefs: { type: Array, default: () => [] },
  toolRefs: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:tools', 'update:customTools', 'update:specialTools', 'show-info', 'show-config'])

defineExpose({
  checkEnabledToolsErrors
})

const showCreate = ref(false)
const showEdit = ref(false)
const showSubModel = ref(false)
const editTarget = ref(null)
const subModelTool = ref(null)

const allowedTools = ref([])       // 当前平台允许启用的工具 key 列表
const disabledConfigs = ref({})    // 各工具禁用的配置项规则

/** 平台工具悬停提示文案 */
function getToolTooltip(tool) {
  return tool.desc || tool.detail?.summary || '点击查看使用说明'
}

/** 自定义 Agent 工具悬停提示文案 */
function getCustomToolTooltip(ct) {
  return ct.description?.trim() || '点击查看使用说明'
}

/** 将自定义工具信息组装后触发 show-info 弹窗 */
function openCustomToolInfo(ct) {
  emit('show-info', {
    name: ct.name || '(未命名)',
    desc: ct.description,
    params: [],
    detail: {
      summary: ct.description?.trim() || '暂无描述',
      example: ct.system_prompt?.trim()
        ? `调用时的系统提示词：\n${ct.system_prompt}`
        : '暂无示例',
    },
  })
}

/** 解析子工具引用的人类可读名称（内置工具名或自定义工具名） */
function getToolDisplayName(sub) {
  const key = getSubToolRefKey(sub)
  const builtin = [...SP_TOOLS, ...SPECIAL_TOOLS].find(t => t.key === key)
  if (builtin) return builtin.name
  if (isPlatformSubTool(sub)) return key
  const ct = findCustomToolRef(key, props.customTools)
  return ct?.name || sub.name || key || '未知工具'
}

/** 获取自定义工具引用的全部子工具列表 */
function getCustomSubTools(ct) {
  return normalizeSubTools(ct, props.customTools)
}

/** 卡片内嵌套子工具最多展示数量，超出折叠为 +N */
const MAX_VISIBLE_SUB_TOOLS = 3

/** 子工具排序：依赖异常的排在前，便于用户优先发现与修复 */
function getSortedSubTools(ct) {
  const subs = getCustomSubTools(ct)
  const errorSubs = subs.filter(sub => isSubToolError(sub))
  const normalSubs = subs.filter(sub => !isSubToolError(sub))
  return [...errorSubs, ...normalSubs]
}

/** 取排序后的前 N 个子工具用于卡片展示 */
function getVisibleSubTools(ct) {
  return getSortedSubTools(ct).slice(0, MAX_VISIBLE_SUB_TOOLS)
}

/** 折叠隐藏的子工具数量（基于排序后的列表计算） */
function getHiddenSubToolCount(ct) {
  const sorted = getSortedSubTools(ct)
  return Math.max(0, sorted.length - MAX_VISIBLE_SUB_TOOLS)
}

/** 判断单个子工具引用是否处于平台失效或依赖异常状态 */
function isSubToolError(sub) {
  return isSubToolErrorUtil(sub, props.customTools)
}

/** 平台切换时拉取该平台允许的工具列表与禁用配置项 */
watch(() => props.platform, async (newPlatform) => {
  if (!newPlatform) return
  try {
    const res = await mockApi.getPlatformToolsConstraints(newPlatform)
    if (res.code === 0 && res.data) {
      allowedTools.value = res.data.allowed_tools || []
      disabledConfigs.value = res.data.disabled_configs || {}
    }
  } catch (error) {
    console.error('Failed to fetch platform tools constraints:', error)
  }
}, { immediate: true })

/** 当前平台可用的全部平台工具（SP + 特殊） */
const allPlatformTools = computed(() => {
  const sp = SP_TOOLS
    .filter(t => allowedTools.value.includes(t.key))
    .map(t => ({ ...t, kind: 'sp' }))
  const special = SPECIAL_TOOLS
    .filter(t => allowedTools.value.includes(t.key))
    .map(t => ({ ...t, kind: 'special' }))
  return [...sp, ...special]
})

/** 判断平台工具（SP / 特殊工具）当前是否已启用 */
function isPlatformToolEnabled(tool) {
  if (tool.kind === 'sp') return !!props.tools[tool.key]?.enabled
  return !!props.specialTools[tool.key]?.enabled
}

/** 平台工具列表：有异常的优先，同组内保持原顺序 */
function sortPlatformToolsWithErrorsFirst(tools) {
  const withIndex = tools.map((tool, index) => ({ tool, index }))
  return withIndex
    .sort((a, b) => {
      const aError = isToolError(a.tool.key) ? 1 : 0
      const bError = isToolError(b.tool.key) ? 1 : 0
      if (aError !== bError) return bError - aError
      return a.index - b.index
    })
    .map(({ tool }) => tool)
}

/** 已启用的平台工具，异常项排在前面 */
const enabledPlatformTools = computed(() =>
  sortPlatformToolsWithErrorsFirst(allPlatformTools.value.filter(t => isPlatformToolEnabled(t))),
)

/** 未启用的平台工具，异常项排在前面 */
const morePlatformTools = computed(() =>
  sortPlatformToolsWithErrorsFirst(allPlatformTools.value.filter(t => !isPlatformToolEnabled(t))),
)

/** 平台工具分区：「已启用」与「更多工具」两组 */
const platformToolSections = computed(() => [
  {
    key: 'enabled',
    label: '已启用',
    tools: enabledPlatformTools.value,
    empty: '暂未启用任何平台工具',
  },
  {
    key: 'more',
    label: '更多工具',
    tools: morePlatformTools.value,
    empty: '当前平台工具已全部启用',
  },
])

/** 按工具类型分发平台工具开关操作 */
function togglePlatformTool(tool, enabled) {
  if (tool.kind === 'sp') toggleSPTool(tool.key, enabled)
  else toggleSpecialTool(tool.key, enabled)
}

/** 自定义 Agent 工具列表：有异常的优先，其次已启用的，最后保持原顺序 */
const sortedCustomTools = computed(() => {
  const listWithIndex = props.customTools.map((tool, index) => ({
    ...tool,
    _originalIndex: index,
  }))

  return listWithIndex.sort((a, b) => {
    const aError = isToolOrDepError(a) ? 1 : 0
    const bError = isToolOrDepError(b) ? 1 : 0
    if (aError !== bError) return bError - aError

    const aEnabled = a.enabled ? 1 : 0
    const bEnabled = b.enabled ? 1 : 0
    if (aEnabled !== bEnabled) return bEnabled - aEnabled

    return a._originalIndex - b._originalIndex
  })
})

/** SPSkillManager 启用时检测 SPread/SPglob 依赖是否满足 */
const skillManagerWarn = computed(() => {
  if (!props.tools['SPSkillManager']?.enabled) return false
  return !props.tools['SPread']?.enabled || !props.tools['SPglob']?.enabled
})

/** 切换 SP 平台工具开关；启用 SPSkillManager 时自动弹出配置 */
function toggleSPTool(key, enabled) {
  const updated = { ...props.tools, [key]: { ...props.tools[key], enabled } }
  emit('update:tools', updated)
  if (key === 'SPSkillManager' && enabled) {
    const tool = SP_TOOLS.find(t => t.key === 'SPSkillManager')
    if (tool?.hasConfig) emit('show-config', { tool, disabledRules: disabledConfigs.value[tool.key] })
  }
}

/** 切换特殊工具（如多模态）的启用状态 */
function toggleSpecialTool(key, enabled) {
  const current = props.specialTools[key] || {}
  emit('update:specialTools', { ...props.specialTools, [key]: { ...current, enabled } })
}

/** 打开特殊工具的子模型选择弹窗 */
function openSubModel(tool) {
  subModelTool.value = tool
  showSubModel.value = true
}

/** 子模型选择确认后写入 special_tools[key].sub_model */
function handleSubModelConfirm(subModelId) {
  const key = subModelTool.value.key
  const current = props.specialTools[key] || {}
  emit('update:specialTools', { ...props.specialTools, [key]: { ...current, sub_model: subModelId } })
}

/** 切换自定义 Agent 工具开关；启用前校验自身及依赖是否失效 */
function toggleCustomTool(ct, checked) {
  if (checked && isToolOrDepError(ct)) {
    showError('请先修复异常，再启用该工具。')
    const updated = [...props.customTools]
    emit('update:customTools', updated)
    return
  }

  setTimeout(() => {
    updateCustomTool(ct.id, { enabled: checked })
  }, 100)
}

/** 按 id 局部更新自定义工具字段 */
function updateCustomTool(id, updates) {
  const list = props.customTools.map(t => t.id === id ? { ...t, ...updates } : t)
  emit('update:customTools', list)
}

/** 删除自定义工具，并清理其他工具 sub_tools 中对它的引用 */
function removeCustomTool(id) {
  if (!confirm('确认删除此工具？该工具被引用的地方将一并取消引用。')) return

  const deleted = props.customTools.find(t => t.id === id)

  const updatedList = props.customTools.filter(t => t.id !== id).map(t => {
    const subs = normalizeSubTools(t, props.customTools)
    if (!subs.length) return t
    const filteredSubs = subs.filter(sub => {
      const key = getSubToolRefKey(sub)
      return key !== id && key !== deleted?.name
    })
    if (filteredSubs.length !== subs.length) {
      return { ...t, sub_tools: filteredSubs }
    }
    return t
  })

  emit('update:customTools', updatedList)
}

/** 打开自定义工具编辑弹窗 */
function openEdit(ct) {
  editTarget.value = ct
  showEdit.value = true
}

/** 创建新自定义 Agent 工具，默认关闭并追加到列表 */
function handleCreateTool(data) {
  const newTool = {
    id: 'ct_' + Date.now(),
    ...data,
    enabled: false,
    referenced_by: []
  }
  emit('update:customTools', [...props.customTools, newTool])
}

/** 保存编辑后的自定义工具，修改后强制关闭并清空 lm_id */
function handleEditTool(data) {
  const list = props.customTools.map(t =>
    t.id === editTarget.value.id ? { ...t, ...data, enabled: false, lm_id: null } : t
  )
  emit('update:customTools', list)
}

/** 判断自定义工具自身或其子工具依赖是否存在平台失效 */
function isToolOrDepError(ct) {
  return isCustomToolOrDepError(ct, props.customTools)
}

/** 收集所有已启用但平台侧已失效的工具名称，供顶部警告条与调试拦截使用 */
function checkEnabledToolsErrors() {
  const errors = []

  Object.keys(props.tools).forEach(key => {
    if (props.tools[key]?.enabled && isToolError(key)) {
      const t = SP_TOOLS.find(x => x.key === key)
      errors.push(`【官方工具】${t?.name || key}: ${getToolErrorMsg(key)}`)
    }
  })

  Object.keys(props.specialTools).forEach(key => {
    if (props.specialTools[key]?.enabled && isToolError(key)) {
      const t = SPECIAL_TOOLS.find(x => x.key === key)
      errors.push(`【平台工具】${t?.name || key}: ${getToolErrorMsg(key)}`)
    }
  })

  props.customTools.forEach(ct => {
    if (!ct.enabled || !isToolOrDepError(ct)) return
    const brokenSubs = getCustomSubTools(ct).filter(sub => isSubToolError(sub))
    if (brokenSubs.length) {
      brokenSubs.forEach(sub => {
        errors.push(`【自建Agent】${ct.name || ct.id} 的依赖 [${getToolDisplayName(sub)}] 存在异常`)
      })
    } else if (isToolError(ct.id)) {
      errors.push(`【自建Agent】${ct.name || ct.id}: ${getToolErrorMsg(ct.id)}`)
    }
  })

  return errors
}
</script>

<style scoped>
.tools-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #6b7280;
  text-transform: uppercase;
}

.group-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.platform-subgroup {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.platform-subgroup + .platform-subgroup {
  margin-top: 16px;
}

.subgroup-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
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

.btn-add {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-surface);
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-add:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 20px 0;
}

.custom-empty {
  font-size: 13px;
  color: #9ca3af;
  padding: 20px 16px;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  text-align: center;
  background: #f9fafb;
}

/* ── Compact card grid ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
  position: relative;
}

.tool-card {
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
  transition: border-color 0.15s;
  box-shadow: none;
}
.tool-card:hover {
  border-color: #d1d5db;
}
.tool-card.is-off:not(.is-unavailable) {
  opacity: 0.88;
}
.tool-card.is-unavailable,
.tool-card.is-error-platform {
  opacity: 0.85;
  background: #fef2f2;
  border-color: #fecaca;
}
.tool-card.is-unavailable:hover,
.tool-card.is-error-platform:hover {
  box-shadow: none;
}
.tool-card.is-warn-agent {
  opacity: 0.9;
  background: #fffbeb;
  border-color: #fde68a;
}
.tool-card.is-warn-agent:hover {
  box-shadow: none;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.card-aux-btn {
  padding: 0 8px;
  height: 26px;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.card-aux-btn.warn {
  color: #dc2626;
  background: #fee2e2;
}

.card-aux-btn.icon-only {
  width: 26px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  background: transparent;
}

.card-aux-btn.icon-only:hover {
  color: #dc2626;
  background: #fef2f2;
}

.card-title-row {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 0 1 auto;
}

/* ── Agent 工具卡片 ── */
.tool-card-agent {
  min-height: 0;
}

.agent-card-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.agent-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.agent-card-head .card-title-row {
  flex: 1;
  min-width: 0;
}

.agent-card-head .card-controls {
  flex-shrink: 0;
  margin-top: -1px;
}

.desc-error-hint {
  color: #b45309;
  font-weight: 500;
}

.desc-muted-hint {
  color: #9ca3af;
}

.card-desc {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
  margin-top: 1px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.tool-type-badge {
  margin-top: 8px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
  align-self: flex-start;
  letter-spacing: 0.02em;
}
.tool-type-badge.type-basetool {
  color: #9ca3af;
}
.tool-type-badge.type-agent {
  color: #6366f1;
}
.tool-type-badge.type-mcp {
  color: #059669;
}

.dep-warn {
  font-size: 10px;
  color: #b45309;
  padding: 4px 6px;
  border-radius: 4px;
  background: #fefce8;
  margin-top: 8px;
}

.submodel-hint {
  font-size: 10px;
  color: #9ca3af;
  font-family: var(--font-mono, monospace);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Extras ── */
.nested-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  color: #3b82f6;
  padding: 1px 4px;
  border-radius: 4px;
  background: #eff6ff;
  flex-shrink: 0;
}

.nested-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  max-height: 22px;
  overflow: hidden;
}

.chip-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  line-height: 1.4;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-item.chip-more {
  background: #eef2ff;
  color: #6366f1;
  border-color: #c7d2fe;
  flex-shrink: 0;
}

.chip-item.chip-error-agent {
  background: #fffbeb;
  color: #b45309;
  border-color: #fde68a;
}

.chip-icon {
  font-size: 9px;
  line-height: 1;
  flex-shrink: 0;
}

.tool-card-agent .tool-type-badge {
  margin-top: 10px;
}

/* ── List animation ── */
.list-anim-move {
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.list-anim-enter-active,
.list-anim-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.list-anim-enter-from,
.list-anim-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.list-anim-leave-active {
  position: absolute;
  width: calc(50% - 6px);
  max-width: 420px;
}
</style>
