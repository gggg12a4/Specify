<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <h2>{{ tool.name }} · 配置</h2>
        <button type="button" class="close-btn" aria-label="关闭" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div
          v-for="param in configurableParams"
          :key="param.key"
          class="config-row"
          :class="{ 'is-disabled': isParamDisabled(param) }"
        >
          <div class="config-meta">
            <div class="config-label">{{ param.label || param.key }}</div>
            <div class="config-desc">
              <template v-if="isParamDisabled(param)">该模型不可配置；</template>{{ param.desc || '' }}
            </div>
          </div>

          <!-- boolean：右侧开关 -->
          <label
            v-if="param.type === 'bool'"
            class="switch"
            :class="{ on: !!form[param.key], disabled: isParamDisabled(param) }"
          >
            <input
              v-model="form[param.key]"
              type="checkbox"
              :disabled="isParamDisabled(param)"
            />
            <span class="switch-track" aria-hidden="true">
              <span class="switch-knob"></span>
            </span>
          </label>

          <!-- number：右侧步进器 -->
          <div v-else-if="param.type === 'int' || param.type === 'number'" class="stepper">
            <button
              type="button"
              class="stepper-btn"
              :disabled="isParamDisabled(param)"
              @click="stepValue(param, -1)"
            >−</button>
            <input
              v-model.number="form[param.key]"
              type="number"
              class="stepper-input"
              :disabled="isParamDisabled(param)"
              :min="param.min ?? undefined"
              :max="param.max ?? undefined"
              :step="param.step || 1"
              :placeholder="param.default == null ? '' : String(param.default)"
            />
            <button
              type="button"
              class="stepper-btn"
              :disabled="isParamDisabled(param)"
              @click="stepValue(param, 1)"
            >+</button>
          </div>

          <!-- 其他：普通输入 -->
          <input
            v-else
            v-model="form[param.key]"
            type="text"
            class="text-input"
            :disabled="isParamDisabled(param)"
            :placeholder="param.default == null ? '' : String(param.default)"
          />
        </div>

        <div v-if="!configurableParams.length" class="empty-hint">暂无可配置参数</div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="$emit('close')">取消</button>
        <button type="button" class="btn-save" @click="handleSave">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 平台工具参数配置弹窗。
 * 按 config_schema.fields 渲染：label 标题、desc 说明，右侧为开关/步进器。
 * 字段含 modelGroups 且不包含当前模型分组时禁用（该模型不可配置）。
 */
import { reactive, computed, watch } from 'vue'

const props = defineProps({
  tool: { type: Object, required: true },
  config: { type: Object, default: () => ({}) },
  disabledRules: { type: Object, default: () => ({}) },
  modelGroupId: { type: String, default: '' },
})
const emit = defineEmits(['save', 'close'])

function isVisibleInConfig(param) {
  const v = param.configVisible
  if (v === undefined || v === null) return true
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true'
}

/** 当前工具可配置的参数列表 */
const configurableParams = computed(() =>
  (props.tool.params || []).filter(isVisibleInConfig)
)

function buildInitialForm() {
  const next = {}
  for (const p of configurableParams.value) {
    if (props.config && Object.prototype.hasOwnProperty.call(props.config, p.key)) {
      next[p.key] = props.config[p.key]
    } else if (p.type === 'bool') {
      next[p.key] = !!p.default
    } else {
      next[p.key] = p.default ?? null
    }
  }
  return next
}

const form = reactive(buildInitialForm())

watch(
  () => [props.tool?.key, props.config],
  () => Object.assign(form, buildInitialForm()),
  { deep: true }
)

function isParamDisabled(param) {
  if (props.disabledRules?.[param.key]) return true
  const groups = param.modelGroups
  if (!Array.isArray(groups) || groups.length === 0) return false
  if (!props.modelGroupId) return false
  return !groups.map(String).includes(String(props.modelGroupId))
}

function stepValue(param, direction) {
  if (isParamDisabled(param)) return
  const step = Number(param.step) || 1
  const current = form[param.key]
  const base = current == null || current === '' ? Number(param.default) || 0 : Number(current)
  let next = base + direction * step
  if (param.min != null && next < Number(param.min)) next = Number(param.min)
  if (param.max != null && next > Number(param.max)) next = Number(param.max)
  form[param.key] = next
}

/** 收集表单值；禁用字段保留原值/默认值，空字符串转 null */
function handleSave() {
  const out = {}
  for (const p of configurableParams.value) {
    if (isParamDisabled(p)) {
      out[p.key] = props.config?.[p.key] ?? p.default ?? (p.type === 'bool' ? false : null)
      continue
    }
    const val = form[p.key]
    out[p.key] = val === '' ? null : val
  }
  emit('save', out)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border-radius: 14px;
  width: 520px;
  max-width: 96vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.18);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 14px;
  border-bottom: 1px solid #eef0f3;
}

.modal-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #9ca3af;
  cursor: pointer;
  font-size: 14px;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px 12px;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 14px;
  border-radius: 10px;
}

.config-row:hover {
  background: #fafafa;
}

.config-row.is-disabled {
  opacity: 0.72;
}

.config-meta {
  min-width: 0;
  flex: 1;
}

.config-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.35;
}

.config-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #9ca3af;
}

.switch {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  cursor: pointer;
}

.switch input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
}

.switch-track {
  display: block;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: #d1d5db;
  transition: background 0.15s;
  position: relative;
}

.switch.on .switch-track {
  background: #3b82f6;
}

.switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s;
}

.switch.on .switch-knob {
  transform: translateX(18px);
}

.switch.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.stepper {
  display: inline-flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.stepper-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f9fafb;
  color: #4b5563;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.stepper-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.stepper-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.stepper-input {
  width: 72px;
  height: 32px;
  border: none;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  text-align: center;
  font-size: 13px;
  color: #111827;
  outline: none;
  background: #fff;
  /* hide native number spinners */
  -moz-appearance: textfield;
}

.stepper-input::-webkit-outer-spin-button,
.stepper-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.stepper-input:disabled {
  color: #9ca3af;
  background: #f9fafb;
}

.text-input {
  width: 160px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #111827;
  outline: none;
  flex-shrink: 0;
}

.text-input:focus {
  border-color: #93c5fd;
}

.text-input:disabled {
  color: #9ca3af;
  background: #f9fafb;
}

.empty-hint {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 22px;
  border-top: 1px solid #eef0f3;
}

.btn-cancel,
.btn-save {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel {
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #4b5563;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.btn-save {
  background: #3b82f6;
  border: none;
  color: #fff;
}

.btn-save:hover {
  background: #2563eb;
}
</style>
