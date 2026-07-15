<template>
  <section class="custom-agents-section">
    <div class="section-head">
      <h2 class="section-label">
        你创建的工具 <span class="section-label-en">AGENTS</span>
      </h2>
      <button type="button" class="btn-section-link" @click="showCreate = true">
        + 创建工具
      </button>
    </div>

    <div v-if="!customTools.length" class="agents-empty">
      还没有自定义工具。点「创建工具」添加可复用的 Agent。
    </div>

    <div v-else class="agents-list">
      <div
        v-for="ct in customTools"
        :key="ct.id"
        class="agent-row"
        :class="{ 'is-off': !ct.enabled, 'is-warn': isToolOrDepError(ct) }"
      >
        <label class="tool-checkbox-wrap" @click.stop>
          <input
            type="checkbox"
            class="tool-checkbox-input"
            :checked="!!ct.enabled"
            @change="toggleTool(ct, $event.target.checked)"
          />
          <span class="tool-checkbox-ui" aria-hidden="true"></span>
        </label>

        <div class="agent-name" :title="ct.name || '(未命名)'">
          {{ ct.name || '(未命名)' }}
        </div>

        <div class="agent-desc" :title="descText(ct)">
          {{ descText(ct) }}
        </div>

        <div class="agent-actions">
          <button
            type="button"
            class="agent-action-btn"
            title="编辑"
            aria-label="编辑工具"
            @click="openEdit(ct)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button
            type="button"
            class="agent-action-btn danger"
            title="删除"
            aria-label="删除工具"
            @click="handleDelete(ct)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <ToolCreateModal
      v-model:visible="showCreate"
      mode="create"
      :existing-custom-tools="customTools"
      :platform="platform"
      :app-name="appName"
      :enabled-tools="tools"
      :enabled-special-tools="specialTools"
      :platform-tool-defs="platformToolDefs"
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
      :app-name="appName"
      :enabled-tools="tools"
      :enabled-special-tools="specialTools"
      :platform-tool-defs="platformToolDefs"
      :file-refs="fileRefs"
      :tool-refs="toolRefs"
      @confirm="handleEditTool"
    />
  </section>
</template>

<script setup>
/**
 * 编辑页「你创建的工具 AGENTS」：自定义 Agent 列表（勾选 / 编辑 / 删除）。
 */
import { ref } from 'vue'
import ToolCreateModal from './ToolCreateModal.vue'
import { isCustomToolOrDepError } from '@/utils/customToolErrors'
import { showConfirm, showError } from '@/composables/useNotification'

const props = defineProps({
  customTools: { type: Array, required: true },
  tools: { type: Object, default: () => ({}) },
  specialTools: { type: Object, default: () => ({}) },
  platform: { type: String, default: 'claude' },
  appName: { type: String, default: '' },
  platformToolDefs: { type: Array, default: () => [] },
  fileRefs: { type: Array, default: () => [] },
  toolRefs: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:customTools'])

const showCreate = ref(false)
const showEdit = ref(false)
const editTarget = ref(null)

function descText(ct) {
  if (isToolOrDepError(ct)) {
    return `依赖异常${!ct.enabled ? ' · 未启用，暂不影响' : ''}`
  }
  return ct.description?.trim() || '暂无描述'
}

function isToolOrDepError(ct) {
  return isCustomToolOrDepError(ct, props.customTools)
}

function updateList(list) {
  emit('update:customTools', list)
}

function toggleTool(ct, checked) {
  if (checked && isToolOrDepError(ct)) {
    showError('请先修复异常，再启用该工具。')
    return
  }
  updateList(props.customTools.map(t => (t.id === ct.id ? { ...t, enabled: checked } : t)))
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
    referenced_by: [],
  }
  updateList([...props.customTools, newTool])
}

function handleEditTool(data) {
  updateList(
    props.customTools.map(t =>
      t.id === editTarget.value.id ? { ...t, ...data, enabled: false, lm_id: null } : t
    )
  )
}

async function handleDelete(ct) {
  const refBy = ct.referenced_by || []
  if (refBy.length) {
    showError(`该工具被引用（${refBy.join('、')}），无法删除`)
    return
  }
  const ok = await showConfirm({
    title: '删除工具',
    message: `确定删除「${ct.name || '(未命名)'}」吗？此操作不可撤销。`,
    confirmText: '删除',
    cancelText: '取消',
  })
  if (!ok) return
  updateList(props.customTools.filter(t => t.id !== ct.id))
}
</script>

<style scoped>
.custom-agents-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.section-label-en {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.06em;
}

.btn-section-link {
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: var(--color-primary, #3b82f6);
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s;
}

.btn-section-link:hover {
  color: var(--color-primary-hover, #2563eb);
}

.agents-empty {
  font-size: 13px;
  color: #9ca3af;
  padding: 18px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  text-align: left;
  line-height: 1.6;
}

.agents-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.agent-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: border-color 0.15s, opacity 0.15s;
}

.agent-row:hover {
  border-color: #cbd5e1;
}

.agent-row.is-off {
  opacity: 0.85;
}

.agent-row.is-warn {
  background: #fffbeb;
  border-color: #fde68a;
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

.agent-name {
  flex-shrink: 0;
  width: 168px;
  max-width: 28%;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-desc {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #9ca3af;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.agent-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.agent-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.agent-action-btn:hover {
  color: #4b5563;
  background: #f3f4f6;
}

.agent-action-btn.danger:hover {
  color: #dc2626;
  background: #fef2f2;
}

@media (max-width: 720px) {
  .agent-row {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .agent-name {
    width: auto;
    max-width: none;
    flex: 1;
  }

  .agent-desc {
    flex-basis: 100%;
    padding-left: 28px;
  }

  .agent-actions {
    margin-left: auto;
  }
}
</style>
