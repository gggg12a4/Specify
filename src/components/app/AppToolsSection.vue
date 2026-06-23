<template>
  <div class="tools-section">

    <!-- ── 平台工具（包含内置 SP 工具和平台特殊工具） ── -->
    <div class="group">
      <div class="group-label">平台工具</div>

      <TransitionGroup name="list-anim" tag="div" class="tools-list-container">
        <div v-for="tool in visibleSpTools" :key="tool.key"
          class="tool-row" :class="{ active: tools[tool.key]?.enabled, 'is-error': isToolError(tool.key) }">
          <label class="tool-check">
            <div v-if="isToolError(tool.key)" class="checkbox-error-icon" title="平台工具已失效，不可启用">
              ⚠️
            </div>
            <input v-else type="checkbox"
              :checked="tools[tool.key]?.enabled"
              @change="toggleSPTool(tool.key, $event.target.checked)" />
            <div class="tool-info-wrapper">
              <div class="tool-info">
                <span class="tool-name">{{ tool.name }}</span>
                <span v-if="isToolError(tool.key)" class="tool-desc error-text">平台工具已下架或失效，暂不可用</span>
                <span v-else class="tool-desc">{{ tool.desc }}</span>
              </div>
            </div>
          </label>
          <div class="tool-btns">
            <!-- 平台工具失效时，隐藏配置和详情图标，如果当前正处于启用状态，则给一个快速关闭的按钮 -->
            <button v-if="tools[tool.key]?.enabled && isToolError(tool.key)" class="btn-close-error" @click="toggleSPTool(tool.key, false)">
              关闭
            </button>
            <template v-else-if="!isToolError(tool.key)">
              <button class="icon-btn" title="查看说明" @click="$emit('show-info', tool)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </button>
              <button v-if="tool.hasConfig" class="icon-btn" title="配置参数" @click="$emit('show-config', { tool, disabledRules: disabledConfigs[tool.key] })">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
            </template>
          </div>
          <!-- SPSkillManager 依赖警告 -->
          <div v-if="tool.key === 'SPSkillManager' && tools['SPSkillManager']?.enabled && skillManagerWarn" class="dep-warn">
            ⚠️ 需要同时启用 SPread、SPglob 才能正常工作
          </div>
        </div>
      </TransitionGroup>

      <template v-if="visibleSpecialTools.length">
        <TransitionGroup name="list-anim" tag="div" class="tools-list-container">
          <div v-for="tool in visibleSpecialTools" :key="tool.key"
            class="tool-row" :class="{ active: specialTools[tool.key]?.enabled, 'is-error': isToolError(tool.key) }">
            <label class="tool-check">
              <div v-if="isToolError(tool.key)" class="checkbox-error-icon" title="平台工具已失效，不可启用">
                ⚠️
              </div>
              <input v-else type="checkbox"
                :checked="specialTools[tool.key]?.enabled"
                @change="toggleSpecialTool(tool.key, $event.target.checked)" />
              <div class="tool-info-wrapper">
                <div class="tool-info">
                  <span class="tool-name">{{ tool.name }}</span>
                  <span v-if="isToolError(tool.key)" class="tool-desc error-text">平台工具已下架或失效，暂不可用</span>
                  <span v-else class="tool-desc">{{ tool.desc }}</span>
                </div>
              </div>
            </label>
            <div class="tool-btns">
              <!-- 失效状态下只显示关闭按钮 -->
              <button v-if="specialTools[tool.key]?.enabled && isToolError(tool.key)" class="btn-close-error" @click="toggleSpecialTool(tool.key, false)">
                关闭
              </button>
              <template v-else-if="!isToolError(tool.key)">
                <button v-if="tool.hasSubModel" class="icon-btn" title="配置子模型" @click="openSubModel(tool)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
                <button class="icon-btn" title="查看说明" @click="$emit('show-info', tool)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </button>
              </template>
            </div>
            <!-- 当前子模型显示 -->
            <div v-if="tool.hasSubModel && specialTools[tool.key]?.enabled && specialTools[tool.key]?.sub_model" class="submodel-hint">
              当前: {{ specialTools[tool.key].sub_model }}
            </div>
          </div>
        </TransitionGroup>
      </template>
    </div>

    <div class="divider"></div>

    <!-- ── 你创建的工具 ── -->
    <div class="group">
      <div class="group-label-row">
        <span class="group-label">你创建的工具</span>
        <button class="btn-add" @click="showCreate = true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          创建工具
        </button>
      </div>

      <div v-if="!customTools.length" class="custom-empty">
        暂无自定义工具，点击「创建工具」添加子 Agent
      </div>

      <TransitionGroup name="list-anim" tag="div" class="tools-list-container" v-else>
        <div v-for="ct in sortedCustomTools" :key="ct.id"
          class="tool-row" :class="{ active: ct.enabled, 'is-error': isActiveError(ct) }">
          <label class="tool-check">
            <!-- 替换原生 checkbox 为三态展示 (如果启用并异常展示 ⚠️，否则展示原生 checkbox) -->
            <div v-if="isActiveError(ct)" class="checkbox-error-icon" title="该工具本身或其依赖项存在异常，需修复后才能正常运行">
              ⚠️
            </div>
            <input v-else type="checkbox" :checked="ct.enabled" @change="toggleCustomTool(ct, $event.target.checked)" />

            <div class="tool-info-wrapper">
              <div class="tool-info">
                <span class="tool-name">{{ ct.name || '(未命名)' }}</span>
                <span class="tool-desc">
                  <span v-if="ct.sub_tools?.length" class="nested-badge" title="此工具内部调用了其他工具">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12h8"/><path d="M12 2v20"/><path d="M22 12h-8"/></svg>
                    嵌套
                  </span>
                  {{ ct.description || '暂无描述' }}
                </span>
              </div>

              <div v-if="ct.sub_tools?.length" class="nested-chips">
                <span v-for="sub in ct.sub_tools" :key="sub.name || sub.custom_tool_id"
                      class="chip-item">
                  <template v-if="isPlatformTool(sub) && isToolError(sub.name || sub.custom_tool_id)">❌ </template>
                  <template v-else-if="!isPlatformTool(sub) && isToolError(sub.name || sub.custom_tool_id)">⚠️ </template>
                  {{ getToolDisplayName(sub) }}
                </span>
                <span v-if="!ct.enabled && isToolOrDepError(ct)" class="chip-item-hint">（未启用，暂不影响）</span>
              </div>
            </div>
          </label>
          <div class="tool-btns">
            <!-- 不管启用与否，只要有依赖错或者自己错，就显示纯文字修复；否则显示铅笔（编辑） -->
            <button v-if="isToolOrDepError(ct)" class="text-btn-error" @click="openEdit(ct)">
              修复
            </button>
            <button v-else class="icon-btn" title="编辑" @click="openEdit(ct)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn icon-btn-danger" title="删除" @click="removeCustomTool(ct.id)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
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
import { SP_TOOLS, SPECIAL_TOOLS, PLATFORM_TOOLS, isToolError, getToolErrorMsg } from '@/constants/spTools'
import ToolCreateModal from './ToolCreateModal.vue'
import ToolSubModelModal from './ToolSubModelModal.vue'
import mockApi from '@/api/mockApi'

import { showSuccess, showError, showConfirm } from '@/composables/useNotification'

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
  // Use setTimeout to create a slight delay before triggering the reorder
  // This prevents accidental double-clicks when items shift position
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
    // 强制重置状态以防止选中
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

  // Cascade delete logic: Find all other custom tools that depend on this one, and remove the dependency
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

// “启用链”上的异常判定。仅当 Agent 被“启用”，且（自身或依赖）存在异常时，才显示为强烈的整体错误状态
function isActiveError(ct) {
  return ct.enabled && isToolOrDepError(ct)
}

function checkEnabledToolsErrors() {
  const errors = []

  // Check SP tools (only report if enabled)
  Object.keys(props.tools).forEach(key => {
    if (props.tools[key]?.enabled && isToolError(key)) {
      const t = SP_TOOLS.find(x => x.key === key)
      errors.push(`【官方工具】${t?.name || key}: ${getToolErrorMsg(key)}`)
    }
  })

  // Check Special tools (only report if enabled)
  Object.keys(props.specialTools).forEach(key => {
    if (props.specialTools[key]?.enabled && isToolError(key)) {
      const t = SPECIAL_TOOLS.find(x => x.key === key)
      errors.push(`【平台工具】${t?.name || key}: ${getToolErrorMsg(key)}`)
    }
  })

  // Check Custom tools
  props.customTools.forEach(ct => {
    if (ct.enabled) {
      if (isToolError(ct.id)) {
        errors.push(`【自建Agent】${ct.name || ct.id}: ${getToolErrorMsg(ct.id)}`)
      }

      // Also check dependencies
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
.tools-section { display: flex; flex-direction: column; gap: 0; }

.group { display: flex; flex-direction: column; gap: 2px; padding-bottom: 4px; }

.group-label {
  font-size: 11px; font-weight: 700; letter-spacing: 0.6px;
  text-transform: uppercase; color: var(--color-text-muted);
  padding: 0 2px 10px;
}
.group-label-row {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 10px;
}
.group-label-row .group-label { padding-bottom: 0; }

.btn-add {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; font-size: 12px; font-weight: 500;
  background: var(--color-primary); color: #fff;
  border: none; border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s;
}
.btn-add:hover { background: var(--color-primary-hover); }

.divider { height: 1px; background: var(--color-border); margin: 16px 0; }

.custom-empty {
  font-size: 13px; color: var(--color-text-muted); padding: 14px 12px;
  border: 1.5px dashed var(--color-border); border-radius: var(--radius-md);
  text-align: center;
}

.tools-list-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

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
  transform: translateY(-10px);
}

.list-anim-leave-active {
  position: absolute;
  width: 100%;
}

.tool-row {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  padding: 10px 12px; border-radius: var(--radius-md);
  border: 1px solid transparent; transition: all 0.15s, background-color 0.2s, border-color 0.2s;
  gap: 4px;
  background: var(--color-surface);
}
.tool-row:hover { background: var(--color-bg-secondary); }
.tool-row.active { background: var(--color-primary-muted); border-color: var(--color-primary-soft); }

.tool-row.is-error {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.03);
}

.tool-check {
  display: flex; align-items: flex-start; gap: 12px;
  cursor: pointer; flex: 1; min-width: 0;
  flex-wrap: wrap;
}
.tool-check input[type="checkbox"] {
  width: 16px; height: 16px; flex-shrink: 0;
  accent-color: var(--color-primary); cursor: pointer;
  margin-top: 3px;
}

.checkbox-error-icon {
  width: 16px; height: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; margin-top: 3px; cursor: not-allowed;
}

.chip-item-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-left: 4px;
}

.tool-info-wrapper {
  display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 4px;
}

.tool-info { display: flex; align-items: baseline; gap: 10px; min-width: 0; width: 100%; }
.tool-name {
  font-size: 13px; font-weight: 600; color: var(--color-text);
  font-family: var(--font-mono); white-space: nowrap;
}
.tool-desc {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--color-text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.error-badge {
  display: inline-flex; align-items: center; gap: 2px;
  font-size: 10px; font-weight: 600; color: var(--color-error, #ef4444);
  padding: 1px 5px; border-radius: 4px;
  background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
  flex-shrink: 0; cursor: help; margin-left: auto;
}

.nested-chips {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  width: 100%; margin-top: 4px;
}

.chip-item {
  display: inline-flex; align-items: center;
  font-size: 11px; color: var(--color-text-secondary);
  font-family: var(--font-mono);
  background: var(--color-bg-secondary);
  padding: 2px 8px; border-radius: 12px;
  border: 1px solid var(--color-border);
}

.nested-badge {
  display: inline-flex; align-items: center; gap: 2px;
  font-size: 10px; font-weight: 600; color: var(--color-primary);
  padding: 1px 4px; border-radius: 4px;
  background: var(--color-primary-soft); border: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.tool-btns { display: flex; gap: 2px; flex-shrink: 0; }
.icon-btn {
  width: 26px; height: 26px; border: none; background: none;
  cursor: pointer; color: var(--color-text-muted); border-radius: 6px;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.icon-btn:hover { color: var(--color-primary); background: var(--color-primary-soft); }
.icon-btn-danger:hover { color: var(--color-error) !important; background: rgba(239,68,68,0.1) !important; }

.dep-warn {
  width: 100%; margin-top: 2px;
  font-size: 11px; color: #ca8a04;
  padding: 4px 8px; border-radius: 6px;
  background: rgba(234,179,8,0.08);
}

.text-btn-error {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  background: transparent;
  color: var(--color-error, #ef4444);
  border: 1px solid rgba(239, 68, 68, 0.4);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.text-btn-error:hover {
  background: rgba(239, 68, 68, 0.1);
}

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

.error-text {
  color: var(--color-error, #ef4444) !important;
  font-weight: 500;
}

.submodel-hint {
  width: 100%;
  font-size: 11px; color: var(--color-text-muted);
  padding-left: 28px;
}
</style>
