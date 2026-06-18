<template>
  <div class="config-schema-editor">
    <!-- Fields List -->
    <div class="form-field fields-section">
      <div class="fields-header">
        <h3 v-if="headerTitle" class="fields-header-title">{{ headerTitle }}</h3>
        <button class="btn btn-sm btn-ghost fields-header-action" @click="openFieldEditor(-1)">
          + 添加字段
        </button>
      </div>
      <div class="field-list" v-if="fields.length">
        <table class="fields-table">
          <thead>
            <tr>
              <th>字段名称</th>
              <th>展示名称</th>
              <th>类型</th>
              <th>创建可见</th>
              <th>配置可见</th>
              <th>必填</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(f, i) in fields" :key="i">
              <td>{{ f.name }}</td>
              <td>{{ f.label || '-' }}</td>
              <td>{{ f.type }}</td>
              <td>{{ (f.createVisible ?? f.create_visible ?? true) ? '✓' : '✗' }}</td>
              <td>{{ (f.configVisible ?? f.config_visible ?? true) ? '✓' : '✗' }}</td>
              <td>{{ f.required ? '✓' : '✗' }}</td>
              <td>
                <div class="actions-container">
                  <button class="btn-text-action btn-text-edit" @click="openFieldEditor(i)">编辑</button>
                  <button class="btn-text-action btn-text-delete" @click="confirmDeleteField(i)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="field-empty">暂无字段，点击上方按钮添加</div>
    </div>

    <!-- JSON Preview -->
    <div class="form-field">
      <label>JSON 预览（实时生成，只读）</label>
      <pre class="json-preview">{{ jsonPreview }}</pre>
    </div>

    <!-- Field Editor Sub-dialog -->
    <Teleport to="body">
      <div
        v-if="showFieldEditor"
        class="modal-mask sub-dialog"
        @click.self="showFieldEditor = false"
      >
      <div class="modal" style="width: 560px; max-height: 85vh">
        <div class="modal-header">
          {{ fieldEditIndex >= 0 ? "编辑字段" : "添加字段" }}
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-field">
              <label>字段名称 *</label>
              <input v-model="fieldForm.name" placeholder="如 include_img" />
            </div>
            <div class="form-field">
              <label>展示名称 *</label>
              <input v-model="fieldForm.label" placeholder="如 读取图片" />
            </div>
          </div>
          <div class="form-field">
            <label>字段描述</label>
            <input v-model="fieldForm.desc" placeholder="是否读取文件中的图片内容..." />
          </div>
          <div class="form-field">
            <label>字段类型 *</label>
            <select v-model="fieldForm.type">
              <option value="boolean">boolean</option>
              <option value="integer">integer</option>
              <option value="number">number</option>
              <option value="string">string</option>
              <option value="array">array</option>
              <option value="object">object</option>
            </select>
          </div>

          <div class="section-title" style="margin-top: 24px; margin-bottom: 12px">类型参数</div>
          <!-- Object special rendering logic is now lower down -->

          <!-- boolean -->
          <div v-if="fieldForm.type === 'boolean'" class="form-field">
            <label>默认值</label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model="fieldForm.defaultBool" :value="true" />
                true
              </label>
              <label>
                <input type="radio" v-model="fieldForm.defaultBool" :value="false" />
                false
              </label>
            </div>
          </div>

          <!-- integer / number -->
          <div v-if="fieldForm.type === 'integer' || fieldForm.type === 'number'">
            <div class="form-row">
              <div class="form-field">
                <label>默认值 (选填)</label>
                <input v-model.number="fieldForm.defaultNum" type="number" />
              </div>
              <div class="form-field">
                <label>最小值 (选填)</label>
                <input v-model.number="fieldForm.min" type="number" />
              </div>
              <div class="form-field">
                <label>最大值 (选填)</label>
                <input v-model.number="fieldForm.max" type="number" />
              </div>
            </div>
            <div class="form-field">
              <label
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                "
              >
                <span>枚举选项 (可选)</span>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="
                    fieldForm.enumOptions.push({
                      value: '',
                      label: '',
                      desc: '',
                    })
                  "
                >
                  + 添加选项
                </button>
              </label>
              <div
                v-for="(opt, oi) in fieldForm.enumOptions"
                :key="oi"
                class="kv-row"
              >
                <input v-model.number="opt.value" type="number" placeholder="value" style="width: 80px" />
                <input v-model="opt.label" placeholder="label" style="width: 100px" />
                <input v-model="opt.desc" placeholder="desc" />
                <button
                  class="btn-text-action btn-text-delete"
                  @click="fieldForm.enumOptions.splice(oi, 1)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>

            <!-- string -->
          <div v-if="fieldForm.type === 'string'">
            <div class="form-field">
              <label>默认值 (选填)</label>
              <input v-model="fieldForm.defaultStr" />
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>最小长度 (选填)</label>
                <input v-model.number="fieldForm.minLength" type="number" />
              </div>
              <div class="form-field">
                <label>最大长度 (选填)</label>
                <input v-model.number="fieldForm.maxLength" type="number" />
              </div>
            </div>
            <div class="form-field">
              <label>正则校验 (pattern) (选填)</label>
              <input v-model="fieldForm.pattern" placeholder="正则表达式" />
            </div>
            <div class="form-field">
              <label
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                "
              >
                <span>枚举选项 (可选)</span>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="
                    fieldForm.enumOptions.push({
                      value: '',
                      label: '',
                      desc: '',
                    })
                  "
                >
                  + 添加选项
                </button>
              </label>
              <div
                v-for="(opt, oi) in fieldForm.enumOptions"
                :key="oi"
                class="kv-row"
              >
                <input v-model="opt.value" placeholder="value" style="width: 80px" />
                <input v-model="opt.label" placeholder="label" style="width: 100px" />
                <input v-model="opt.desc" placeholder="desc" />
                <button
                  class="btn-text-action btn-text-delete"
                  @click="fieldForm.enumOptions.splice(oi, 1)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>

          <!-- array -->
          <div v-if="fieldForm.type === 'array'">
            <div class="form-row">
              <div class="form-field">
                <label>子项类型 (items type)</label>
                <div class="radio-group" style="margin-top: 8px;">
                  <label><input type="radio" v-model="fieldForm.itemsType" value="string" /> string</label>
                  <label><input type="radio" v-model="fieldForm.itemsType" value="integer" /> integer</label>
                  <label><input type="radio" v-model="fieldForm.itemsType" value="number" /> number</label>
                  <label><input type="radio" v-model="fieldForm.itemsType" value="boolean" /> boolean</label>
                </div>
              </div>
            </div>
            <div class="form-field">
              <label>默认值 (JSON Array，选填)</label>
              <input
                v-model="fieldForm.defaultArrStr"
                placeholder='如 [".txt", ".md"]'
              />
            </div>
          </div>

          <!-- object -->
          <div v-if="fieldForm.type === 'object'">
            <div class="section-title" style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
              <span>子字段配置(properties)</span>
              <button class="btn btn-sm btn-ghost" @click="addSubProperty()">+ 添加子字段</button>
            </div>

            <div class="field-list" v-if="fieldForm.subProperties.length">
              <table class="fields-table">
                <thead>
                  <tr>
                    <th>子字段名</th>
                    <th>展示名</th>
                    <th>类型</th>
                    <th>创建可见</th>
                    <th>配置可见</th>
                    <th>必填</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(sp, i) in fieldForm.subProperties" :key="i">
                    <td>{{ sp.name }}</td>
                    <td>{{ sp.label || '-' }}</td>
                    <td>{{ sp.type }}</td>
                    <td>{{ (sp.createVisible ?? sp.create_visible ?? true) ? '✓' : '✗' }}</td>
                    <td>{{ (sp.configVisible ?? sp.config_visible ?? true) ? '✓' : '✗' }}</td>
                    <td>{{ sp.required ? '✓' : '✗' }}</td>
                    <td>
                      <div class="actions-container">
                        <button class="btn-text-action btn-text-edit" @click="openSubPropertyEditor(i)">编辑</button>
                        <button class="btn-text-action btn-text-delete" @click="confirmDeleteSubProperty(i)">删除</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

            <div class="form-row" style="margin-top: 16px; margin-bottom: 14px; padding-top: 16px; border-top: 1px solid var(--color-border);">
              <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; max-width: 80px;">
                <label>创建可见</label>
                <Switch v-model="fieldForm.createVisible" />
              </div>
              <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; max-width: 80px;">
                <label>配置可见</label>
                <Switch v-model="fieldForm.configVisible" />
              </div>
              <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; max-width: 80px;" v-if="fieldForm.type !== 'object'">
                <label>必填</label>
                <Switch v-model="fieldForm.required" />
              </div>
            </div>

          <div class="form-field" v-if="availableGroups && availableGroups.length > 0">
            <label style="display: block; margin-bottom: 6px">modelGroups（哪些模型能用）</label>
            <div class="checkbox-group" style="gap: 8px 14px">
              <label v-for="g in availableGroups" :key="g.id">
                <input
                  type="checkbox"
                  :value="g.id"
                  v-model="fieldForm.mgChecked"
                />
                {{ g.displayName || g.display_name }}
              </label>
            </div>
            <div class="hint">全不勾 = 可用于当前基础工具所支持的所有平台</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showFieldEditor = false">
            取消
          </button>
          <button class="btn btn-primary" @click="saveFieldEditor">确定</button>
        </div>
      </div>
      </div>
    </Teleport>

    <!-- Sub-property editor for object type fields -->
    <Teleport to="body">
      <div
        v-if="showSubPropertyEditor"
        class="modal-mask sub-dialog sub-dialog-nested"
        @click.self="showSubPropertyEditor = false"
      >
      <div class="modal" style="width: 480px; max-height: 80vh">
        <div class="modal-header">
          {{ subPropertyEditIndex >= 0 ? "编辑子字段" : "添加子字段" }}
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-field">
              <label>子字段名称 *</label>
              <input v-model="subPropertyForm.name" placeholder="参数标识" />
            </div>
            <div class="form-field">
              <label>展示名称</label>
              <input v-model="subPropertyForm.label" placeholder="显示名称" />
            </div>
          </div>
          <div class="form-field">
            <label>字段描述</label>
            <input v-model="subPropertyForm.desc" placeholder="参数描述" />
          </div>
          <div class="form-field">
            <label>字段类型 *</label>
            <select v-model="subPropertyForm.type">
              <option value="boolean">boolean</option>
              <option value="integer">integer</option>
              <option value="number">number</option>
              <option value="string">string</option>
            </select>
          </div>

          <!-- 类型参数 -->
          <div class="section-title" style="margin-top: 24px; margin-bottom: 12px">── 类型参数 ───────────────────────────</div>
          <div v-if="subPropertyForm.type === 'boolean'" class="form-field">
            <label>默认值</label>
            <div class="radio-group">
              <label>
                <input
                  type="radio"
                  v-model="subPropertyForm.defaultBool"
                  :value="true"
                />
                true
              </label>
              <label>
                <input
                  type="radio"
                  v-model="subPropertyForm.defaultBool"
                  :value="false"
                />
                false
              </label>
            </div>
          </div>
          <div
            v-if="
              subPropertyForm.type === 'integer' ||
              subPropertyForm.type === 'number'
            "
            class="form-field"
          >
            <label>默认值 (选填)</label>
            <input
              v-model.number="subPropertyForm.defaultNum"
              type="number"
            />
          </div>
          <div class="form-field" v-if="subPropertyForm.type === 'string'">
            <label>默认值 (选填)</label>
            <input v-model="subPropertyForm.defaultStr" />
          </div>

          <div class="form-row" style="margin-top: 16px; margin-bottom: 14px; padding-top: 16px; border-top: 1px solid var(--color-border);">
            <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; max-width: 80px;">
              <label>创建可见</label>
              <Switch v-model="subPropertyForm.createVisible" />
            </div>
            <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; max-width: 80px;">
              <label>配置可见</label>
              <Switch v-model="subPropertyForm.configVisible" />
            </div>
            <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; max-width: 80px;">
              <label>必填</label>
              <Switch v-model="subPropertyForm.required" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showSubPropertyEditor = false">
            取消
          </button>
          <button class="btn btn-primary" @click="saveSubPropertyEditor">
            确定
          </button>
        </div>
      </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import Switch from '@/components/common/Switch.vue';

const props = defineProps({
  fields: {
    type: Array,
    required: true,
  },
  groups: {
    type: Array,
    default: () => [],
  },
  headerTitle: {
    type: String,
    default: "",
  },
  parentMgChecked: {
    type: Array,
    default: null,
  }
});

const emit = defineEmits(["update:fields", "toast"]);

const availableGroups = computed(() => {
  return props.groups; // 始终可以选择所有平台
});

const jsonPreview = computed(() => {
  if (!props.fields.length) return "{}";
  return JSON.stringify(
    { fields: props.fields },
    null,
    2
  );
});

// Field Editor State
const showFieldEditor = ref(false);
const fieldEditIndex = ref(-1);
const fieldForm = reactive({
  name: "",
  label: "",
  desc: "",
  type: "string",
  createVisible: false,
  configVisible: false,
  required: false,
  mgChecked: [],
  defaultBool: false,
  defaultNum: null,
  defaultStr: "",
  defaultArrStr: "[]",
  min: null,
  max: null,
  minLength: null,
  maxLength: null,
  pattern: "",
  enumOptions: [],
  className: "",
  itemsType: "string",
  subProperties: [],
});

function openFieldEditor(index) {
  fieldEditIndex.value = index;
  if (index >= 0) {
    const f = props.fields[index];
    Object.assign(fieldForm, {
      name: f.name || "",
      label: f.label || "",
      desc: f.desc || "",
      type: f.type || "string",
      createVisible: f.createVisible ?? f.create_visible ?? true,
      configVisible: f.configVisible ?? f.config_visible ?? true,
      required: !!f.required,
      mgChecked: f.modelGroups ? [...f.modelGroups] : [],
      defaultBool: f.type === "boolean" ? f.default ?? false : false,
      defaultNum:
        f.type === "integer" || f.type === "number" ? f.default ?? null : null,
      defaultStr: f.type === "string" ? f.default ?? "" : "",
      defaultArrStr:
        f.type === "array" ? JSON.stringify(f.default ?? []) : "[]",
      min: f.min ?? null,
      max: f.max ?? null,
      minLength: f.minLength ?? null,
      maxLength: f.maxLength ?? null,
      pattern: f.pattern || "",
      enumOptions: f.enum ? f.enum.map((e) => ({ ...e })) : [],
      itemsType: f.items?.type || "string",
      subProperties:
        f.properties && f.properties.fields
          ? f.properties.fields.map((p) => ({ ...p }))
          : [],
    });
  } else {
    Object.assign(fieldForm, {
      name: "",
      label: "",
      desc: "",
      type: "string",
      createVisible: true,
      configVisible: true,
      required: false,
      mgChecked: [],
      defaultBool: false,
      defaultNum: null,
      defaultStr: "",
      defaultArrStr: "[]",
      min: null,
      max: null,
      minLength: null,
      maxLength: null,
      pattern: "",
      enumOptions: [],
      itemsType: "string",
      subProperties: [],
    });
  }
  showFieldEditor.value = true;
}

function saveFieldEditor() {
  if (!fieldForm.name || !fieldForm.label) {
    emit("toast", { msg: "name 和 label 必填", type: "error" });
    return;
  }
  const f = {
    name: fieldForm.name,
    label: fieldForm.label,
    type: fieldForm.type,
    createVisible: fieldForm.createVisible,
    configVisible: fieldForm.configVisible,
  };
  if (fieldForm.desc) f.desc = fieldForm.desc;
  if (fieldForm.required) f.required = true;
  if (fieldForm.mgChecked.length > 0) f.modelGroups = [...fieldForm.mgChecked];
  if (fieldForm.type === "boolean") {
    f.default = fieldForm.defaultBool;
  } else if (fieldForm.type === "integer" || fieldForm.type === "number") {
    if (fieldForm.defaultNum !== null && fieldForm.defaultNum !== "")
      f.default = fieldForm.defaultNum;
    if (fieldForm.min !== null && fieldForm.min !== "") f.min = fieldForm.min;
    if (fieldForm.max !== null && fieldForm.max !== "") f.max = fieldForm.max;
    const validEnum = fieldForm.enumOptions.filter((e) => e.value !== null && e.value !== "");
    if (validEnum.length > 0) f.enum = validEnum;
  } else if (fieldForm.type === "string") {
    if (fieldForm.defaultStr !== "") f.default = fieldForm.defaultStr;
    if (fieldForm.minLength !== null && fieldForm.minLength !== "")
      f.minLength = fieldForm.minLength;
    if (fieldForm.maxLength !== null && fieldForm.maxLength !== "")
      f.maxLength = fieldForm.maxLength;
    if (fieldForm.pattern) f.pattern = fieldForm.pattern;
    const validEnum = fieldForm.enumOptions.filter((e) => e.value);
    if (validEnum.length > 0) f.enum = validEnum;
  } else if (fieldForm.type === "object") {
    if (fieldForm.subProperties.length > 0)
      f.properties = { fields: fieldForm.subProperties.map((p) => ({ ...p })) };
  } else if (fieldForm.type === "array") {
    f.items = { type: fieldForm.itemsType };
    try {
      const arr = JSON.parse(fieldForm.defaultArrStr);
      if (Array.isArray(arr)) f.default = arr;
    } catch {}
  }

  const newFields = [...props.fields];
  if (fieldEditIndex.value >= 0) {
    newFields[fieldEditIndex.value] = f;
  } else {
    newFields.push(f);
  }
  emit("update:fields", newFields);
  showFieldEditor.value = false;
}

function deleteField(index) {
  const newFields = [...props.fields];
  newFields.splice(index, 1);
  emit("update:fields", newFields);
}

function confirmDeleteField(index) {
  if (confirm("确认删除该字段吗？")) {
    deleteField(index);
  }
}

function confirmDeleteSubProperty(index) {
  if (confirm("确认删除该子字段吗？")) {
    fieldForm.subProperties.splice(index, 1);
  }
}

function moveField(index, dir) {
  const newFields = [...props.fields];
  const target = index + dir;
  [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
  emit("update:fields", newFields);
}

  const showSubPropertyEditor = ref(false);
  const subPropertyEditIndex = ref(-1);
  const subPropertyForm = reactive({
    name: "",
    label: "",
    desc: "",
    type: "string",
    createVisible: true,
    configVisible: true,
    required: false,
    defaultBool: false,
    defaultNum: null,
    defaultStr: "",
  });

  function addSubProperty() {
    subPropertyEditIndex.value = -1;
    Object.assign(subPropertyForm, {
      name: "",
      label: "",
      desc: "",
      type: "string",
      createVisible: true,
      configVisible: true,
      required: false,
      defaultBool: false,
      defaultNum: null,
      defaultStr: "",
    });
    showSubPropertyEditor.value = true;
  }

  function openSubPropertyEditor(index) {
    subPropertyEditIndex.value = index;
    const sp = fieldForm.subProperties[index];
    Object.assign(subPropertyForm, {
      name: sp.name || "",
      label: sp.label || "",
      desc: sp.desc || "",
      type: sp.type || "string",
      createVisible: sp.createVisible ?? sp.create_visible ?? true,
      configVisible: sp.configVisible ?? sp.config_visible ?? true,
      required: !!sp.required,
      defaultBool: sp.type === "boolean" ? sp.default ?? false : false,
      defaultNum:
        sp.type === "integer" || sp.type === "number" ? sp.default ?? null : null,
      defaultStr: sp.type === "string" ? sp.default ?? "" : "",
    });
    showSubPropertyEditor.value = true;
  }

  function saveSubPropertyEditor() {
    if (!subPropertyForm.name) {
      emit("toast", { msg: "name 必填", type: "error" });
      return;
    }
    const sp = { name: subPropertyForm.name, type: subPropertyForm.type, createVisible: subPropertyForm.createVisible, configVisible: subPropertyForm.configVisible };
    if (subPropertyForm.label) sp.label = subPropertyForm.label;
    if (subPropertyForm.desc) sp.desc = subPropertyForm.desc;
    if (subPropertyForm.required) sp.required = true;
  if (subPropertyForm.type === "boolean") {
    sp.default = subPropertyForm.defaultBool;
  } else if (
    subPropertyForm.type === "integer" ||
    subPropertyForm.type === "number"
  ) {
    if (subPropertyForm.defaultNum !== null && subPropertyForm.defaultNum !== "")
      sp.default = subPropertyForm.defaultNum;
  } else if (subPropertyForm.type === "string") {
    if (subPropertyForm.defaultStr !== "") sp.default = subPropertyForm.defaultStr;
  }
  if (subPropertyEditIndex.value >= 0) {
    fieldForm.subProperties[subPropertyEditIndex.value] = sp;
  } else {
    fieldForm.subProperties.push(sp);
  }
  fieldForm.subProperties = [...fieldForm.subProperties];
  showSubPropertyEditor.value = false;
}
</script>

<style scoped>
@import "@/assets/admin-common.css";

/* Modal and related */

.sub-dialog {
  z-index: 110;
}

.sub-dialog-nested {
  z-index: 120;
}

/* Config Schema Editor Styles */
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}
.checkbox-group label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.field-list {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.fields-section {
  margin-bottom: 0;
}

.fields-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.fields-header-title {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.fields-header-action {
  flex-shrink: 0;
  margin-left: auto;
}

.fields-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.fields-table th,
.fields-table td {
  padding: 8px 12px;
  text-align: left;
  vertical-align: middle;
}

.fields-table thead th {
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  font-weight: 500;
  background: var(--color-bg-secondary, #f9fafb);
}

.fields-table tbody tr {
  border-bottom: 1px solid var(--color-border);
}

.fields-table tbody tr:last-child {
  border-bottom: none;
}

.fields-table .actions-container {
  justify-content: flex-start;
  gap: 5px;
}
.field-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
  gap: 8px;
}
.field-item:last-child {
  border-bottom: none;
}
.field-item .field-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.field-item .field-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.json-preview {
  background: #f8f9fa;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  font-family: "SF Mono", Monaco, monospace;
  font-size: 11px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.5;
}
.radio-group {
  display: flex;
  gap: 16px;
  align-items: center;
}
.radio-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
}
.kv-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.kv-row input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 13px;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 16px 0 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
}
.hint {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 3px;
}
.field-empty {
  padding: 16px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
  border: 1px dashed var(--color-border);
  border-radius: 6px;
}

/* Button styles (assuming global styles exist, but added some for self-containment) */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-primary {
  background: var(--color-primary, #3b82f6);
  color: #fff;
}
.btn-danger {
  background: var(--color-error, #ef4444);
  color: #fff;
}
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}
.tag-gray {
  background: #f3f4f6;
  color: var(--color-text-muted);
}

.btn-text-action {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  line-height: 1.4;
  transition: color 0.15s;
}

.btn-text-edit {
  color: var(--color-primary, #3b82f6);
}

.btn-text-edit:hover {
  color: var(--color-primary-hover, #2563eb);
}

.btn-text-delete {
  color: var(--color-error, #ef4444);
}

.btn-text-delete:hover {
  color: #dc2626;
}
</style>
