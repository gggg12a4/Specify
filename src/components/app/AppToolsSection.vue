<template>
  <div class="tools-section">
    <div
      v-for="section in toolSections"
      :key="section.key"
      class="tools-block"
    >
      <div class="section-divider">
        <span class="section-divider-label">—— <strong>{{ section.label }}</strong> ——</span>
      </div>

      <div v-if="!section.items.length" class="subgroup-empty">
        {{ section.empty }}
      </div>

      <TransitionGroup v-else :name="section.key === 'more' ? 'list-anim' : undefined" tag="div" class="card-grid">
        <div
          v-for="item in section.items"
          :key="item.key"
          class="tool-card"
          :class="{
            'is-on': item.enabled,
            'is-off': !item.enabled,
            'is-unavailable': item.isUnavailable,
            'is-warn-agent': item.isWarn,
          }"
        >
          <div class="tool-card-head">
            <label class="tool-checkbox-wrap" @click.stop>
              <input
                type="checkbox"
                class="tool-checkbox-input"
                :checked="item.enabled"
                :disabled="item.isUnavailable && item.itemType === 'platform'"
                @change="toggleToolItem(item, $event.target.checked)"
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
                @click="toggleToolItem(item, false)"
              >
                关闭
              </button>
              <ToolInfoIcon
                :label="item.name"
                :tooltip="item.tooltip"
                @click="openToolInfo(item)"
              />
              <ToolConfigBtn
                v-if="item.showConfig"
                :title="item.configTitle"
                @click="openToolConfig(item)"
              />
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <p class="tools-footer-hint">勾选的工具随草稿保存，调试/正式对话即生效。</p>

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
 * App 推荐工具配置区：平台工具（基础 / 特殊），按「已启用 / 更多工具」分组展示。
 * 目录来自编辑页接口 templates.platform_tools；无数据时为空。
 * 自定义 Agent 工具见 AppCustomAgentsSection。
 */
import { ref, computed } from 'vue'
import { isToolError, getToolErrorMsg } from '@/constants/spTools'
import {
  normalizeSubTools,
  getSubToolRefKey,
  isPlatformSubTool,
  findCustomToolRef,
  isSubToolError as isSubToolErrorUtil,
  isCustomToolOrDepError,
} from '@/utils/customToolErrors'
import ToolSubModelModal from './ToolSubModelModal.vue'
import ToolInfoIcon from './ToolInfoIcon.vue'
import ToolConfigBtn from './ToolConfigBtn.vue'

const props = defineProps({
  tools: { type: Object, required: true },
  customTools: { type: Array, required: true },
  specialTools: { type: Object, default: () => ({}) },
  platformMcp: { type: Object, default: () => ({}) },
  platform: { type: String, default: 'claude' },
  /** 编辑页接口 templates.platform_tools 规范化后的目录；无数据时展示为空 */
  platformToolDefs: { type: Array, default: () => [] },
})
const emit = defineEmits([
  'update:tools',
  'update:specialTools',
  'update:platformMcp',
  'show-info',
  'show-config',
])

defineExpose({
  checkEnabledToolsErrors,
})

const showSubModel = ref(false)
const subModelTool = ref(null)
const disabledConfigs = ref({})

function getToolTooltip(tool) {
  return tool.desc || tool.detail?.summary || '点击查看使用说明'
}

function getToolDisplayName(sub) {
  const key = getSubToolRefKey(sub)
  const fromCatalog = props.platformToolDefs.find(t => t.key === key)
  if (fromCatalog) return fromCatalog.name
  if (isPlatformSubTool(sub)) return key
  const ct = findCustomToolRef(key, props.customTools)
  return ct?.name || sub.name || key || '未知工具'
}

function getCustomSubTools(ct) {
  return normalizeSubTools(ct, props.customTools)
}

const allPlatformTools = computed(() => {
  return (props.platformToolDefs || []).map(def => {
    const category = def.category || (def.kind === 'special' ? 'agent' : (def.kind === 'mcp' ? 'mcp' : 'basetool'))
    const kind = category === 'agent' ? 'special' : (category === 'mcp' ? 'mcp' : 'sp')
    return {
      ...def,
      category,
      kind,
    }
  })
})

function isPlatformToolEnabled(tool) {
  if (tool.kind === 'mcp' || tool.category === 'mcp') {
    return !!props.platformMcp[tool.key]?.enabled
  }
  if (tool.kind === 'special' || tool.category === 'agent') {
    return !!props.specialTools[tool.key]?.enabled
  }
  return !!props.tools[tool.key]?.enabled
}

function sortToolsWithErrorsFirst(items) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aError = a.item.isUnavailable || a.item.isWarn ? 1 : 0
      const bError = b.item.isUnavailable || b.item.isWarn ? 1 : 0
      if (aError !== bError) return bError - aError
      return a.index - b.index
    })
    .map(({ item }) => item)
}

function buildPlatformToolItem(tool) {
  const unavailable = isToolError(tool.key)
  const enabled = isPlatformToolEnabled(tool)
  const isAgent = tool.category === 'agent' || tool.kind === 'special'
  const isMcp = tool.category === 'mcp' || tool.kind === 'mcp'
  const hasConfig = !!tool.hasConfig
  const hasSubModel = !isMcp && tool.kind === 'special' && tool.hasSubModel

  let typeBadge = '基础工具'
  let badgeClass = 'type-basetool'
  if (isMcp) {
    typeBadge = '平台提供的MCP'
    badgeClass = 'type-mcp'
  } else if (isAgent) {
    typeBadge = 'Agent 工具'
    badgeClass = 'type-agent'
  }

  return {
    itemType: 'platform',
    key: tool.key,
    raw: tool,
    name: tool.name,
    shortLabel: tool.desc,
    summary: unavailable ? '平台工具已下架或失效' : (tool.detail?.summary || tool.desc || ''),
    typeBadge,
    badgeClass,
    enabled,
    isUnavailable: unavailable,
    isWarn: false,
    tooltip: getToolTooltip(tool),
    showClose: unavailable && enabled,
    showConfig: !unavailable && (hasConfig || hasSubModel),
    configTitle: hasSubModel ? '配置子模型' : '配置参数',
  }
}

const allDisplayTools = computed(() => allPlatformTools.value.map(buildPlatformToolItem))

const toolSections = computed(() => [
  {
    key: 'enabled',
    label: '已启用',
    items: sortToolsWithErrorsFirst(allDisplayTools.value.filter(item => item.enabled)),
    empty: props.platformToolDefs?.length ? '暂未启用任何工具' : '暂无可用工具',
  },
  {
    key: 'more',
    label: '更多工具',
    items: sortToolsWithErrorsFirst(allDisplayTools.value.filter(item => !item.enabled)),
    empty: props.platformToolDefs?.length ? '所有工具均已启用' : '暂无可用工具',
  },
])

function toggleToolItem(item, enabled) {
  const tool = item.raw
  if (tool.kind === 'mcp' || tool.category === 'mcp') {
    togglePlatformMcp(tool.key, enabled)
    return
  }
  if (tool.kind === 'special' || tool.category === 'agent') {
    toggleSpecialTool(tool.key, enabled)
    return
  }
  toggleSPTool(tool.key, enabled)
}

function openToolInfo(item) {
  emit('show-info', item.raw)
}

function openToolConfig(item) {
  const tool = item.raw
  if (tool.kind === 'special' && tool.hasSubModel) {
    openSubModel(tool)
    return
  }
  emit('show-config', {
    tool,
    disabledRules: disabledConfigs.value[tool.key],
    _platformMcp: tool.kind === 'mcp' || tool.category === 'mcp',
    _agentTool: tool.kind === 'special' || tool.category === 'agent',
  })
}

function toggleSPTool(key, enabled) {
  const updated = { ...props.tools, [key]: { ...props.tools[key], enabled } }
  emit('update:tools', updated)
  if (key === 'SPSkillManager' && enabled) {
    const tool = allPlatformTools.value.find(t => t.key === 'SPSkillManager')
    if (tool?.hasConfig) {
      emit('show-config', { tool, disabledRules: disabledConfigs.value[tool.key] })
    }
  }
}

function toggleSpecialTool(key, enabled) {
  const current = props.specialTools[key] || {}
  emit('update:specialTools', { ...props.specialTools, [key]: { ...current, enabled } })
}

function togglePlatformMcp(key, enabled) {
  const current = props.platformMcp[key] || {}
  emit('update:platformMcp', {
    ...props.platformMcp,
    [key]: { ...current, enabled },
  })
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

function isToolOrDepError(ct) {
  return isCustomToolOrDepError(ct, props.customTools)
}

function isSubToolError(sub) {
  return isSubToolErrorUtil(sub, props.customTools)
}

function checkEnabledToolsErrors() {
  const errors = []

  Object.keys(props.tools).forEach(key => {
    if (props.tools[key]?.enabled && isToolError(key)) {
      const t = allPlatformTools.value.find(x => x.key === key)
      errors.push(`【官方工具】${t?.name || key}: ${getToolErrorMsg(key)}`)
    }
  })

  Object.keys(props.specialTools).forEach(key => {
    if (props.specialTools[key]?.enabled && isToolError(key)) {
      const t = allPlatformTools.value.find(x => x.key === key)
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

.tools-block + .tools-block {
  margin-top: 28px;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  margin: 0 0 16px;
}

.tools-block + .tools-block .section-divider {
  margin-top: 0;
}

.section-divider-line {
  flex: 1;
  height: 1px;
  background: #e5e7eb;
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

.tools-footer-hint {
  margin: 20px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #9ca3af;
  text-align: left;
}

/* ── Compact card grid：一行 4 个 ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  position: relative;
}

@media (max-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
}

@media (max-width: 960px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}

.tool-card {
  position: relative;
  box-sizing: border-box;
  height: 83px;
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
  box-shadow: none;
}

.tool-card.is-on {
  border-color: #bfdbfe;
}

.tool-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 1px 4px rgba(59, 130, 246, 0.08);
}

.tool-card.is-off:not(.is-unavailable):not(.is-warn-agent) {
  opacity: 0.92;
  border-color: #e5e7eb;
}

.tool-card.is-off:not(.is-unavailable):not(.is-warn-agent):hover {
  border-color: #d1d5db;
  box-shadow: none;
}

.tool-card.is-unavailable {
  opacity: 0.9;
  background: #fef2f2;
  border-color: #fecaca;
}

.tool-card.is-unavailable:hover {
  border-color: #fca5a5;
  box-shadow: none;
}

.tool-card.is-warn-agent {
  opacity: 0.95;
  background: #fffbeb;
  border-color: #fde68a;
}

.tool-card.is-warn-agent:hover {
  border-color: #fcd34d;
  box-shadow: none;
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
  max-width: 45%;
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

.tool-type-badge {
  font-size: 10px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.01em;
  color: #9ca3af;
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
  width: calc((100% - 48px) / 4);
}

@media (max-width: 1280px) {
  .list-anim-leave-active {
    width: calc((100% - 28px) / 3);
  }
}

@media (max-width: 960px) {
  .list-anim-leave-active {
    width: calc((100% - 12px) / 2);
  }
}
</style>
