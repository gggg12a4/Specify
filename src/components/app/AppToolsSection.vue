<template>
  <div class="tools-section">

    <!-- ── 平台工具 ── -->
    <div class="group">
      <div class="group-label">平台工具</div>

      <TransitionGroup name="list-anim" tag="div" class="card-grid">
        <div
          v-for="tool in visibleSpTools"
          :key="tool.key"
          class="tool-card group"
          :class="{
            'is-off': !tools[tool.key]?.enabled,
            'is-unavailable': isToolError(tool.key),
          }"
        >
          <div class="card-row">
            <div class="card-icon-wrap">🔧</div>
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
            </div>
            <div class="card-controls">
              <button
                v-if="isToolError(tool.key) && tools[tool.key]?.enabled"
                type="button"
                class="card-aux-btn warn"
                @click="toggleSPTool(tool.key, false)"
              >
                关闭
              </button>
              <template v-else-if="!isToolError(tool.key)">
                <ToolConfigBtn
                  v-if="tool.hasConfig"
                  title="配置参数"
                  @click="$emit('show-config', { tool, disabledRules: disabledConfigs[tool.key] })"
                />
                <button
                  type="button"
                  class="card-toggle"
                  :class="{ off: !tools[tool.key]?.enabled }"
                  :aria-pressed="!!tools[tool.key]?.enabled"
                  title="启用 / 禁用"
                  @click="toggleSPTool(tool.key, !tools[tool.key]?.enabled)"
                >
                  <div class="card-toggle-knob"></div>
                </button>
              </template>
            </div>
          </div>

          <div
            v-if="tool.key === 'SPSkillManager' && tools['SPSkillManager']?.enabled && skillManagerWarn"
            class="dep-warn"
          >
            需要同时启用 SPread、SPglob 才能正常工作
          </div>

          <span class="tool-type-badge type-basetool">基础工具</span>
        </div>

        <div
          v-for="tool in visibleSpecialTools"
          :key="tool.key"
          class="tool-card group"
          :class="{
            'is-off': !specialTools[tool.key]?.enabled,
            'is-unavailable': isToolError(tool.key),
          }"
        >
          <div class="card-row">
            <div class="card-icon-wrap">✨</div>
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
                v-if="tool.hasSubModel && specialTools[tool.key]?.enabled && specialTools[tool.key]?.sub_model"
                class="submodel-hint"
              >
                子模型: {{ specialTools[tool.key].sub_model }}
              </div>
            </div>
            <div class="card-controls">
              <button
                v-if="isToolError(tool.key) && specialTools[tool.key]?.enabled"
                type="button"
                class="card-aux-btn warn"
                @click="toggleSpecialTool(tool.key, false)"
              >
                关闭
              </button>
              <template v-else-if="!isToolError(tool.key)">
                <ToolConfigBtn
                  v-if="tool.hasSubModel"
                  title="配置子模型"
                  @click="openSubModel(tool)"
                />
                <button
                  type="button"
                  class="card-toggle"
                  :class="{ off: !specialTools[tool.key]?.enabled }"
                  :aria-pressed="!!specialTools[tool.key]?.enabled"
                  title="启用 / 禁用"
                  @click="toggleSpecialTool(tool.key, !specialTools[tool.key]?.enabled)"
                >
                  <div class="card-toggle-knob"></div>
                </button>
              </template>
            </div>
          </div>

          <span class="tool-type-badge type-basetool">基础工具</span>
        </div>
      </TransitionGroup>
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
          class="tool-card group"
          :class="{
            'is-off': !ct.enabled,
            'is-unavailable': isToolError(ct.id) || isActiveError(ct),
          }"
        >
          <div class="card-row">
            <div class="card-icon-wrap">🤖</div>
            <div class="card-info">
              <div class="card-title-row">
                <span class="card-title">{{ ct.name || '(未命名)' }}</span>
                <ToolInfoIcon
                  :label="ct.name || '自定义工具'"
                  :tooltip="getCustomToolTooltip(ct)"
                  @click="openCustomToolInfo(ct)"
                />
              </div>
              <div class="card-desc">
                <span v-if="ct.sub_tools?.length" class="nested-badge" title="此工具内部调用了其他工具">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12h8"/><path d="M12 2v20"/><path d="M22 12h-8"/></svg>
                  嵌套
                </span>
                {{ ct.description || '暂无描述' }}
              </div>
              <div v-if="ct.sub_tools?.length" class="nested-chips">
                <span v-for="sub in ct.sub_tools" :key="sub.name || sub.custom_tool_id" class="chip-item">
                  <template v-if="isPlatformTool(sub) && isToolError(sub.name || sub.custom_tool_id)">❌ </template>
                  <template v-else-if="!isPlatformTool(sub) && isToolError(sub.name || sub.custom_tool_id)">⚠️ </template>
                  {{ getToolDisplayName(sub) }}
                </span>
                <span v-if="!ct.enabled && isToolOrDepError(ct)" class="chip-item-hint">（未启用，暂不影响）</span>
              </div>
            </div>
            <div
              v-if="!isToolError(ct.id)"
              class="card-controls"
            >
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
import { ref, computed, watch } from 'vue'
import { SP_TOOLS, SPECIAL_TOOLS, isToolError, getToolErrorMsg } from '@/constants/spTools'
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
  platform: { type: String, default: 'claude' }
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

const allowedTools = ref([])
const disabledConfigs = ref({})

function getToolTooltip(tool) {
  return tool.desc || tool.detail?.summary || '点击查看使用说明'
}

function getCustomToolTooltip(ct) {
  return ct.description?.trim() || '点击查看使用说明'
}

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

function getToolDisplayName(sub) {
  if (sub.name) {
    const builtin = [...SP_TOOLS, ...SPECIAL_TOOLS].find(t => t.key === sub.name)
    if (builtin) return builtin.name
    return sub.name
  }
  const ct = props.customTools.find(t => t.id === sub.custom_tool_id)
  return ct?.name || sub.custom_tool_id || '未知工具'
}

function isPlatformTool(sub) {
  const key = sub.name || sub.custom_tool_id
  return [...SP_TOOLS, ...SPECIAL_TOOLS].some(t => t.key === key)
}

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

const visibleSpTools = computed(() => {
  const allowed = SP_TOOLS.filter(t => allowedTools.value.includes(t.key))

  const listWithIndex = allowed.map((tool, index) => ({
    ...tool,
    _originalIndex: index,
    _enabled: !!props.tools[tool.key]?.enabled
  }))

  return listWithIndex.sort((a, b) => {
    const aTop = a._enabled ? 1 : 0
    const bTop = b._enabled ? 1 : 0
    if (aTop !== bTop) return bTop - aTop
    return a._originalIndex - b._originalIndex
  })
})

const visibleSpecialTools = computed(() => {
  const allowed = SPECIAL_TOOLS.filter(t => allowedTools.value.includes(t.key))

  const listWithIndex = allowed.map((tool, index) => ({
    ...tool,
    _originalIndex: index,
    _enabled: !!props.specialTools[tool.key]?.enabled
  }))

  return listWithIndex.sort((a, b) => {
    const aTop = a._enabled ? 1 : 0
    const bTop = b._enabled ? 1 : 0
    if (aTop !== bTop) return bTop - aTop
    return a._originalIndex - b._originalIndex
  })
})

const sortedCustomTools = computed(() => {
  const listWithIndex = props.customTools.map((tool, index) => ({
    ...tool,
    _originalIndex: index,
  }))

  return listWithIndex.sort((a, b) => {
    const aTop = a.enabled ? 1 : 0
    const bTop = b.enabled ? 1 : 0
    if (aTop !== bTop) return bTop - aTop
    return a._originalIndex - b._originalIndex
  })
})

const skillManagerWarn = computed(() => {
  if (!props.tools['SPSkillManager']?.enabled) return false
  return !props.tools['SPread']?.enabled || !props.tools['SPglob']?.enabled
})

function toggleSPTool(key, enabled) {
  setTimeout(() => {
    const updated = { ...props.tools, [key]: { ...props.tools[key], enabled } }
    emit('update:tools', updated)
    if (key === 'SPSkillManager' && enabled) {
      const tool = SP_TOOLS.find(t => t.key === 'SPSkillManager')
      if (tool?.hasConfig) emit('show-config', { tool, disabledRules: disabledConfigs.value[tool.key] })
    }
  }, 100)
}

function toggleSpecialTool(key, enabled) {
  setTimeout(() => {
    const current = props.specialTools[key] || {}
    emit('update:specialTools', { ...props.specialTools, [key]: { ...current, enabled } })
  }, 100)
}

function openSubModel(tool) {
  subModelTool.value = tool
  showSubModel.value = true
}

function handleSubModelConfirm(subModelId) {
  const key = subModelTool.value.key
  const current = props.specialTools[key] || {}
  emit('update:specialTools', { ...props.specialTools, [key]: { ...current, sub_model: subModelId } })
}

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

function updateCustomTool(id, updates) {
  const list = props.customTools.map(t => t.id === id ? { ...t, ...updates } : t)
  emit('update:customTools', list)
}

function removeCustomTool(id) {
  if (!confirm('确认删除此工具？该工具被引用的地方将一并取消引用。')) return

  const updatedList = props.customTools.filter(t => t.id !== id).map(t => {
    if (t.sub_tools && t.sub_tools.length) {
      const filteredSubs = t.sub_tools.filter(sub => {
        const subId = sub.custom_tool_id || sub.name
        return subId !== id
      })
      if (filteredSubs.length !== t.sub_tools.length) {
        return { ...t, sub_tools: filteredSubs }
      }
    }
    return t
  })

  emit('update:customTools', updatedList)
}

function openEdit(ct) {
  editTarget.value = ct
  showEdit.value = true
}

function handleCreateTool(data) {
  const newTool = {
    id: 'ct_' + Date.now(),
    ...data,
    enabled: false,
    referenced_by: []
  }
  emit('update:customTools', [...props.customTools, newTool])
}

function handleEditTool(data) {
  const list = props.customTools.map(t =>
    t.id === editTarget.value.id ? { ...t, ...data, enabled: false, lm_id: null } : t
  )
  emit('update:customTools', list)
}

function isToolOrDepError(ct) {
  if (isToolError(ct.id)) return true
  if (ct.sub_tools && ct.sub_tools.length) {
    return ct.sub_tools.some(sub => isToolError(sub.name || sub.custom_tool_id))
  }
  return false
}

function isActiveError(ct) {
  return ct.enabled && isToolOrDepError(ct)
}

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
    if (ct.enabled) {
      if (isToolError(ct.id)) {
        errors.push(`【自建Agent】${ct.name || ct.id}: ${getToolErrorMsg(ct.id)}`)
      }

      if (ct.sub_tools && ct.sub_tools.length) {
        ct.sub_tools.forEach(sub => {
          const subKey = sub.name || sub.custom_tool_id
          if (isToolError(subKey)) {
            errors.push(`【自建Agent】${ct.name || ct.id} 的依赖项 [${getToolDisplayName(sub)}] 存在异常`)
          }
        })
      }
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
.tool-card.is-unavailable {
  opacity: 0.7;
  background: #fef2f2;
  border-color: #fecaca;
}
.tool-card.is-unavailable:hover {
  box-shadow: none;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon-wrap {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 6px;
  background: #f3f4f6;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
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

.card-toggle {
  width: 34px;
  height: 18px;
  flex-shrink: 0;
  background: #111827;
  border: none;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}
.card-toggle.off {
  background: #d1d5db;
}
.card-toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(16px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}
.card-toggle.off .card-toggle-knob {
  transform: translateX(0);
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
  display: none;
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
