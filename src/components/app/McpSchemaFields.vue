<template>
  <div class="mcp-schema-fields">
    <template v-for="field in fields" :key="field.name">
      <div v-if="field.name === 'name' && lockName" class="field">
        <label class="field-label">{{ getMcpFieldLabel(field) }}</label>
        <input class="field-input field-input-disabled" :value="modelValue.name" disabled />
        <span class="field-hint">服务名创建后不可修改</span>
      </div>

      <div v-else-if="isMcpDictField(field)" class="field">
        <div class="field-label-row">
          <label class="field-label">{{ getMcpFieldLabel(field) }}</label>
          <button type="button" class="btn-text" @click="addHeaderRow(field.name)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加
          </button>
        </div>

        <div class="headers-list">
          <div v-for="(row, index) in modelValue[field.name]" :key="index" class="header-row">
            <input
              v-model="row.key"
              class="field-input header-key"
              placeholder="Header 名 (如 X-Api-Key)"
            />
            <input
              v-model="row.value"
              class="field-input header-value"
              placeholder="Header 值"
              type="password"
            />
            <button
              type="button"
              class="icon-btn-danger"
              title="删除"
              @click="removeHeaderRow(field.name, index)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="field.type === 'boolean'" class="field">
        <label class="field-label">{{ getMcpFieldLabel(field) }}</label>
        <label class="checkbox-row">
          <input v-model="modelValue[field.name]" type="checkbox" />
          <span>启用</span>
        </label>
      </div>

      <div v-else class="field">
        <label class="field-label">{{ getMcpFieldLabel(field) }}</label>
        <input
          v-model="modelValue[field.name]"
          class="field-input"
          :class="{ error: errors[field.name] }"
          :placeholder="field.placeholder || `请输入${field.label || field.name}`"
          @input="onNameInput(field)"
        />
        <span v-if="field.name === 'name'" class="field-hint">仅支持英文字母和下划线，作为工具名前缀</span>
        <span v-if="errors[field.name]" class="field-error">{{ errors[field.name] }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  getMcpTemplateFields,
  getMcpFieldLabel,
  isMcpDictField,
} from '@/utils/mcpSchema'

const props = defineProps({
  templateKey: { type: String, default: 'MCPServerStreamable' },
  mode: { type: String, default: 'create' },
  modelValue: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  lockName: { type: Boolean, default: false },
})

const fields = computed(() => getMcpTemplateFields(props.templateKey, props.mode))

function addHeaderRow(fieldName) {
  const rows = [...(props.modelValue[fieldName] || []), { key: '', value: '' }]
  props.modelValue[fieldName] = rows
}

function removeHeaderRow(fieldName, index) {
  const rows = [...(props.modelValue[fieldName] || [])]
  rows.splice(index, 1)
  props.modelValue[fieldName] = rows.length ? rows : [{ key: '', value: '' }]
}

function onNameInput(field) {
  if (field.name !== 'name') return
  props.modelValue.name = String(props.modelValue.name || '').replace(/[^a-zA-Z_]/g, '')
}
</script>

<style scoped>
.mcp-schema-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.field-hint { font-size: 11px; color: var(--color-text-muted); line-height: 1.4; }
.field-input {
  padding: 8px 12px; font-size: 13px;
  background: var(--color-bg); border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md); color: var(--color-text); outline: none;
  font-family: inherit; transition: border-color 0.15s;
}
.field-input:focus { border-color: var(--color-primary); }
.field-input.error { border-color: #ef4444; }
.field-input-disabled { background: var(--color-bg-secondary); color: var(--color-text-muted); }
.field-error { font-size: 11px; color: #ef4444; }

.field-label-row { display: flex; align-items: center; justify-content: space-between; }
.btn-text {
  background: none; border: none; font-size: 12px; color: var(--color-primary); cursor: pointer;
  display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-weight: 500;
}
.btn-text:hover { background: var(--color-primary-soft); }

.headers-list { display: flex; flex-direction: column; gap: 8px; }
.header-row { display: flex; gap: 8px; align-items: center; }
.header-key { flex: 1; min-width: 0; }
.header-value { flex: 1; min-width: 0; }
.icon-btn-danger {
  width: 28px; height: 28px; border: none; background: none; color: var(--color-text-muted);
  border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.15s;
}
.icon-btn-danger:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
