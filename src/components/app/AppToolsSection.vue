<template>
  <div class="tools-section">

    <!-- ── 平台工具（包含内置 SP 工具和平台特殊工具） ── -->
    <div class="group">
      <div class="group-label">平台工具</div>

      <TransitionGroup name="list-anim" tag="div" class="tools-list-container">
        <div v-for="tool in visibleSpTools" :key="tool.key"
          class="tool-row" :class="{ active: tools[tool.key]?.enabled }">
          <label class="tool-check">
            <input type="checkbox"
              :checked="tools[tool.key]?.enabled"
              @change="toggleSPTool(tool.key, $event.target.checked)" />
            <div class="tool-info">
              <span class="tool-name">{{ tool.name }}</span>
              <span class="tool-desc">{{ tool.desc }}</span>
            </div>
          </label>
          <div class="tool-btns">
            <button class="icon-btn" title="查看说明" @click="$emit('show-info', tool)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </button>
            <button v-if="tool.hasConfig" class="icon-btn" title="配置参数" @click="$emit('show-config', { tool, disabledRules: disabledConfigs[tool.key] })">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
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
            class="tool-row" :class="{ active: specialTools[tool.key]?.enabled }">
            <label class="tool-check">
              <input type="checkbox"
                :checked="specialTools[tool.key]?.enabled"
                @change="toggleSpecialTool(tool.key, $event.target.checked)" />
              <div class="tool-info">
                <span class="tool-name">{{ tool.name }}</span>
                <span class="tool-desc">{{ tool.desc }}</span>
              </div>
            </label>
            <div class="tool-btns">
              <button v-if="tool.hasSubModel" class="icon-btn" title="配置子模型" @click="openSubModel(tool)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
              <button class="icon-btn" title="查看说明" @click="$emit('show-info', tool)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </button>
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
          class="tool-row" :class="{ active: ct.enabled }">
          <label class="tool-check">
            <input type="checkbox" :checked="ct.enabled" @change="toggleCustomTool(ct, $event.target.checked)" />
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
          </label>
          <div class="tool-btns">
            <button class="icon-btn" title="编辑" @click="openEdit(ct)">
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
import { SP_TOOLS, SPECIAL_TOOLS, PLATFORM_TOOLS } from '@/constants/spTools'
import ToolCreateModal from './ToolCreateModal.vue'
import ToolSubModelModal from './ToolSubModelModal.vue'
import mockApi from '@/api/mockApi'

const props = defineProps({
  tools: { type: Object, required: true },
  customTools: { type: Array, required: true },
  specialTools: { type: Object, default: () => ({}) },
  platform: { type: String, default: 'claude' }
})
const emit = defineEmits(['update:tools', 'update:customTools', 'update:specialTools', 'show-info', 'show-config'])

const showCreate = ref(false)
const showEdit = ref(false)
const showSubModel = ref(false)
const editTarget = ref(null)
const subModelTool = ref(null)

const allowedTools = ref([])
const disabledConfigs = ref({})

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
  setTimeout(() => {
    updateCustomTool(ct.id, { enabled: checked })
  }, 100)
}

function updateCustomTool(id, updates) {
  const list = props.customTools.map(t => t.id === id ? { ...t, ...updates } : t)
  emit('update:customTools', list)
}

function removeCustomTool(id) {
  if (!confirm('确认删除此工具？')) return
  emit('update:customTools', props.customTools.filter(t => t.id !== id))
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

.tool-check {
  display: flex; align-items: center; gap: 12px;
  cursor: pointer; flex: 1; min-width: 0;
}
.tool-check input[type="checkbox"] {
  width: 16px; height: 16px; flex-shrink: 0;
  accent-color: var(--color-primary); cursor: pointer;
}

.tool-info { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.tool-name {
  font-size: 13px; font-weight: 600; color: var(--color-text);
  font-family: var(--font-mono); white-space: nowrap;
}
.tool-desc {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--color-text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
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

.submodel-hint {
  width: 100%;
  font-size: 11px; color: var(--color-text-muted);
  padding-left: 28px;
}
</style>
