<template>
  <div class="agent-tool-edit">
    <div class="page-header">
      <div class="header-left">
        <button class="btn btn-ghost btn-back" @click="goBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回列表
        </button>
        <div class="header-title-block">
          <h1 class="page-title">{{ agentToolForm.id ? "编辑 Agent 工具" : "新增 Agent 工具" }}</h1>
          <p
            v-if="agentToolForm.id && (agentToolForm.displayName || agentConfigValues.name)"
            class="page-subtitle"
          >
            {{ agentToolForm.displayName || agentConfigValues.name }}
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" @click="goBack">取消</button>
        <button class="btn btn-primary" @click="saveAgentTool">确认保存</button>
      </div>
    </div>

    <div class="page-content layout-split">
      <!-- LEFT PANEL: Basic Info, Config & Prompt -->
      <div class="left-panel">
        <div v-if="agentToolForm.id && agentToolForm.referencedBy" class="form-card warning-card">
          ⚠️ 该工具被引用：{{ agentToolForm.referencedBy }}
        </div>

        <!-- 区域 1：基本信息 & 引擎配置 -->
        <div class="form-card flex-fill">
          <div class="section-title" :class="{'section-title-first': true}">基本信息</div>
          <div class="form-field">
            <label>工具模板 (category) *</label>
            <select v-model="agentToolForm.category" :disabled="!!agentToolForm.id"
              @change="onAgentCategoryChange(false)" :style="agentToolForm.id
                  ? 'background-color: var(--color-bg-secondary); opacity: 0.8;'
                  : ''
                ">
              <option v-for="t in templates" :key="t.id" :value="t.name">
                {{ t.displayName }} ({{ t.name }})
              </option>
            </select>
          </div>

          <div class="section-title">引擎配置参数</div>
          <p class="section-desc">由所选模板动态渲染以下字段</p>

          <div class="form-field" v-if="!agentToolForm.id">
              <label>服务名 (config.name) *</label>
              <input :value="agentConfigValues.name" placeholder="如 my_agent，点击编辑" readonly style="cursor: pointer;" @click="openFieldEditModal('name', '服务名 (config.name)', 'string', false)" />
              <div class="hint">只能字母下划线，创建后不可修改</div>
            </div>
            <div class="form-field" v-if="agentToolForm.id && agentConfigValues.name">
              <label>服务名 (config.name)</label>
              <input :value="agentConfigValues.name" disabled style="background: #f3f4f6" />
            </div>

            <template v-for="field in computedAgentCategoryFields" :key="field.name">
            <div v-if="shouldShowConfigKey(field.name)" class="form-field">
              <label>
                {{ field.label || field.name }}
                <span v-if="isFieldRequired(field)" style="color: #ef4444; margin-left: 2px">*</span>
              </label>

              <!-- 根据 value 的类型动态决定渲染方式 -->
              <!-- 布尔类型用 Switch -->
              <div v-if="field.type === 'boolean'">
                <Switch v-model="agentConfigValues[field.name]" />
              </div>

              <!-- 数组或对象、长文本 用 textarea -->
              <textarea v-else-if="
                field.name === 'systemPrompt' ||
                field.name === 'system_prompt' ||
                field.type === 'array' ||
                field.type === 'object'
              " :value="agentConfigValues[field.name]" :class="[
                  (field.name === 'systemPrompt' || field.name === 'system_prompt') ? 'huge-textarea prompt-field-input' : 'huge-textarea'
                ]" :placeholder="field.type === 'array' || field.type === 'object'
                    ? '请输入 JSON 格式内容，点击编辑'
                    : '请输入 Prompt，点击编辑...'
                  "
                  readonly style="cursor: pointer;" @click="openFieldEditModal(field.name, field.label || field.name, field.type, true)"></textarea>

              <!-- 数字类型 -->
              <input v-else-if="field.type === 'number' || field.type === 'integer'" type="number"
                :value="agentConfigValues[field.name]" placeholder="请输入数字，点击编辑" readonly style="cursor: pointer;" @click="openFieldEditModal(field.name, field.label || field.name, field.type, false)" />

              <!-- 普通字符串或其他 -->
              <input v-else :value="agentConfigValues[field.name]" placeholder="请输入内容，点击编辑" readonly style="cursor: pointer;" @click="openFieldEditModal(field.name, field.label || field.name, field.type, false)" />
            </div>
          </template>
        </div>

        <!-- 文件访问权限 -->
        <div class="form-card">
          <div class="section-title section-title-first">文件访问权限</div>
          <div class="form-field">
            <label>file_access *</label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model="agentToolForm.fileAccess" value="readonly" />
                只读模式（仅访问指定路径）
              </label>
              <label>
                <input type="radio" v-model="agentToolForm.fileAccess" value="read_write" />
                读写模式（用户目录 + 指定路径）
              </label>
            </div>
          </div>

          <div class="form-field">
            <label>可访问路径 *</label>
            <div style="
                border: 1px solid var(--color-border);
                border-radius: 8px;
                overflow: hidden;
              ">
              <div v-for="(path, index) in agentToolForm.fileAccessDirs" :key="index" style="
                  display: flex;
                  align-items: center;
                  padding: 8px 12px;
                  border-bottom: 1px solid var(--color-border);
                  background: var(--color-surface);
                ">
                <span style="
                    flex: 1;
                    font-size: 13px;
                    font-family: var(--font-mono, monospace);
                  ">{{ path }}</span>
                <button class="btn btn-sm btn-danger" style="padding: 2px 6px" @click="removeAccessiblePath(index)">
                  ✕
                </button>
              </div>
              <div style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 12px;
                  background: var(--color-bg-secondary);
                ">
                <input v-model="newAccessiblePath" placeholder="输入路径，如 public/skills/"
                  style="flex: 1; margin: 0; padding: 6px 10px; font-size: 13px" @keyup.enter="addAccessiblePath" />
                <button class="btn btn-sm btn-ghost" @click="addAccessiblePath">
                  添加
                </button>
              </div>
            </div>
            <div class="hint">
              填写 Agent 运行时可访问的路径<br />
              可从左侧文件树 [📋] 复制粘贴<br />
              readonly → scope=路径列表, scope_mode="restrict"<br />
              readwrite → scope=路径列表, scope_mode="extend"
            </div>
          </div>
        </div>

        <!-- 区域 2：附加信息 & 运行控制 -->
        <div class="form-card">
          <div class="section-title section-title-first">附加信息</div>
          <div class="form-field">
            <label>展示名</label>
            <input v-model="agentToolForm.displayName" placeholder="可选，前端展示名。为空时显示 config.name" />
          </div>
          <div class="form-field">
            <label>详细说明</label>
            <textarea v-model="agentToolForm.detail" style="min-height: 80px"
              placeholder="支持读取文本、图片、文档等文件并进行深度分析..."></textarea>
          </div>
          <div class="form-field instance-level-field">
            <label>instance_level *</label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model.number="agentToolForm.instanceLevel" :value="0" />
                0
              </label>
              <label>
                <input type="radio" v-model.number="agentToolForm.instanceLevel" :value="1" />
                1
              </label>
              <label>
                <input type="radio" v-model.number="agentToolForm.instanceLevel" :value="2" />
                2
              </label>
              <label>
                <input type="radio" v-model.number="agentToolForm.instanceLevel" :value="3" />
                3
              </label>
            </div>
            <div class="hint">0=平台实例 1=App缓存 2=用户缓存 3=用完即弃</div>
          </div>
          <div class="form-row controls-row">
            <div class="switch-group">
              <div class="form-field">
                <label>是否可见 (visible)</label>
                <Switch v-model="agentToolForm.visible" />
              </div>
              <div class="form-field">
                <label>默认启用 (default_enabled)</label>
                <Switch v-model="agentToolForm.defaultEnabled" />
              </div>
            </div>
            <div class="form-field status-field">
              <label>状态 (status) *</label>
              <select v-model.number="agentToolForm.status">
                <option :value="1">正常</option>
                <option :value="2">已弃用</option>
                <option :value="3">预览版</option>
              </select>
            </div>
            <div class="form-field sort-field">
              <label>排序 (sort_order)</label>
              <input v-model.number="agentToolForm.sortOrder" type="number" min="0" placeholder="20" />
            </div>
          </div>
        </div>

        <!-- 区域 3：子工具与支持平台 -->
        <div class="form-card">
          <div class="section-title section-title-first">子工具</div>
          <p class="section-desc">按需勾选下方子工具，若工具要求配置参数，勾选后会出现「配置参数」按钮</p>

          <div class="sub-tool-group">
            <h4>基础工具</h4>
            <div class="checkbox-group" style="padding: 12px">
              <div v-for="t in basetools" :key="t.id" class="sub-tool-item">
                <label>
                  <input type="checkbox" :checked="isSubToolChecked('platform_basetools', t.id)" @change="
                    onSubToolCheck(
                      'platform_basetools',
                      t.id,
                      $event.target.checked,
                    )
                    " />
                  {{ t.displayName }}
                </label>
                <button v-if="
                  isSubToolChecked('platform_basetools', t.id) &&
                  hasSubToolConfig('platform_basetools', t.id)
                " class="btn btn-sm btn-ghost" @click.stop.prevent="
                    openSubToolConfigEditor('platform_basetools', t.id, true)
                    ">
                  配置参数
                </button>
              </div>
            </div>
          </div>

          <div class="sub-tool-group">
            <h4>Agent 工具</h4>
            <div class="checkbox-group" style="padding: 12px">
              <div v-for="t in availableAgentTools" :key="t.id" class="sub-tool-item">
                <label
                  :class="{ 'sub-tool-label--cycle': getAgentToolCycleRef(t.id) }"
                  @click="onAgentSubToolLabelClick(t, $event)"
                >
                  <input
                    type="checkbox"
                    :checked="isSubToolChecked('platform_agent_tools', t.id)"
                    :disabled="!!getAgentToolCycleRef(t.id)"
                    @click.stop
                    @change="
                      onSubToolCheck(
                        'platform_agent_tools',
                        t.id,
                        $event.target.checked,
                      )
                    "
                  />
                  {{ t.displayName }}
                  <span v-if="getAgentToolCycleRef(t.id)" class="sub-tool-cycle-tag">（会导致循环引用）</span>
                </label>
                <button v-if="
                  isSubToolChecked('platform_agent_tools', t.id) &&
                  hasSubToolConfig('platform_agent_tools', t.id)
                " class="btn btn-sm btn-ghost" @click.stop.prevent="
                    openSubToolConfigEditor('platform_agent_tools', t.id, true)
                    ">
                  配置参数
                </button>
              </div>
              <div v-if="availableAgentTools.length === 0" class="hint">
                无可用 Agent 工具
              </div>
            </div>
          </div>

          <div class="sub-tool-group">
            <h4>MCP 工具</h4>
            <div class="checkbox-group" style="padding: 12px">
              <div v-for="t in mcpTools" :key="t.id" class="sub-tool-item">
                <label>
                  <input type="checkbox" :checked="isSubToolChecked('platform_mcp_tools', t.id)" @change="
                    onSubToolCheck(
                      'platform_mcp_tools',
                      t.id,
                      $event.target.checked,
                    )
                    " />
                  {{ t.displayName }}
                </label>
                <button v-if="
                  isSubToolChecked('platform_mcp_tools', t.id) &&
                  hasSubToolConfig('platform_mcp_tools', t.id)
                " class="btn btn-sm btn-ghost" @click.stop.prevent="
                    openSubToolConfigEditor('platform_mcp_tools', t.id, true)
                    ">
                  配置参数
                </button>
              </div>
              <div v-if="mcpTools.length === 0" class="hint">
                无可用 MCP 工具
              </div>
            </div>
          </div>

          <div class="form-field" style="margin-top: 8px; margin-bottom: 0">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
              ">
              <label style="margin-bottom: 0">支持平台 (model_groups)</label>
              <button class="btn btn-sm btn-ghost" @click="
                agentMgOverride = !agentMgOverride;
              onAgentMgOverrideChange();
              ">
                {{ agentMgOverride ? "恢复自动" : "手动覆盖" }}
              </button>
            </div>
            <div class="checkbox-group">
              <template v-if="agentMgOverride">
                <label v-for="g in groups" :key="g.id">
                  <input type="checkbox" :value="g.id" v-model="agentMgChecked" />
                  {{ g.displayName }}
                </label>
              </template>
              <template v-else>
                <label v-for="g in groups" :key="g.id" style="opacity: 0.6">
                  <input type="checkbox" :checked="isAutoModelGroupChecked(g.id)" disabled />
                  {{ g.displayName }}
                </label>
              </template>
            </div>
            <div class="hint" style="margin-top: 8px">
              <span v-if="!agentMgOverride">全不勾 = NULL =
                全分组可用。默认按子工具交集自动填充（只读）。</span>
              <span v-else>全不勾 = 全分组可用。管理员手动覆盖。</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: Files Area -->
      <div class="right-panel">
        <PublicFileTree @toast="
          (msg) => {
            if (msg.type === 'error') showError(msg.msg);
            else showSuccess(msg.msg);
          }
        " />
      </div>
    </div>

    <!-- Sub-Tool Config Editor Modal -->
    <div v-if="showSubToolConfig" class="modal-mask sub-dialog" @click.self="cancelSubToolConfigEditor">
      <div class="modal" style="width: 440px">
        <div class="modal-header">配置工具参数 — {{ subToolConfigName }}</div>
        <div class="modal-body">
          <div v-if="subToolConfigFields.length === 0" class="field-empty" style="margin-bottom: 0">
            暂无需要配置的参数
          </div>
          <template v-for="field in subToolConfigFields" :key="field.name">
            <div v-if="field.type === 'boolean'" class="form-field">
              <label>
                {{ field.name }}
                <span v-if="isFieldRequired(field)" style="color: var(--color-error, #ef4444); margin-left: 4px">*</span>
              </label>
              <div class="field-card">
                <div class="field-info">
                  <span class="field-title">
                    {{ field.label || field.name }}
                  </span>
                  <span v-if="field.description" class="field-desc">{{ field.description }}</span>
                </div>
                <div class="field-action">
                  <Switch v-model="subToolConfigValues[field.name]" />
                </div>
              </div>
            </div>
            <div v-else-if="field.type === 'string'" class="form-field">
              <label>
                {{ field.label || field.name }}
                <span v-if="isFieldRequired(field)" style="color: var(--color-error, #ef4444); margin-left: 4px">*</span>
              </label>
              <input :value="subToolConfigValues[field.name]" readonly style="cursor: pointer;" placeholder="点击编辑" @click="openSubToolFieldEditModal(field.name, field.label || field.name, field.type)" />
            </div>
            <div v-else-if="field.type === 'integer' || field.type === 'number'" class="form-field">
              <label>
                {{ field.label || field.name }}
                <span v-if="isFieldRequired(field)" style="color: var(--color-error, #ef4444); margin-left: 4px">*</span>
              </label>
              <input :value="subToolConfigValues[field.name]" type="number" readonly style="cursor: pointer;" placeholder="点击编辑" @click="openSubToolFieldEditModal(field.name, field.label || field.name, field.type)" />
            </div>
            <div v-else-if="field.type === 'object' || field.type === 'array'" class="form-field">
              <label>
                {{ field.label || field.name }}
                <span v-if="isFieldRequired(field)" style="color: var(--color-error, #ef4444); margin-left: 4px">*</span>
              </label>
              <textarea
                :value="subToolConfigValues[field.name]"
                class="huge-textarea"
                placeholder="请输入 JSON 格式内容，点击编辑"
                readonly
                style="cursor: pointer; min-height: 80px;"
                @click="openSubToolFieldEditModal(field.name, field.label || field.name, field.type)"
              ></textarea>
            </div>
          </template>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="cancelSubToolConfigEditor">
            取消
          </button>
          <button class="btn btn-primary" @click="saveSubToolConfigEditor">
            确认
          </button>
        </div>
      </div>
    </div>

    <!-- Universal Field Edit Modal -->
    <div v-if="showFieldEditModal" class="modal-mask sub-dialog" style="z-index: 200;" @click.self="cancelFieldEdit">
      <div class="modal" style="width: 80vw; max-width: 1200px;">
        <div class="modal-header">
          编辑: {{ currentEditingFieldLabel }}
        </div>
        <div class="modal-body" style="padding: 20px;">
          <textarea
            v-if="currentEditingFieldIsLarge"
            ref="fieldEditInput"
            v-model="currentEditingValue"
            class="huge-textarea prompt-field-input"
            style="width: 100%; min-height: 60vh; font-size: 14px; box-sizing: border-box;"
          ></textarea>
          <input
            v-else-if="currentEditingFieldType === 'number' || currentEditingFieldType === 'integer'"
            ref="fieldEditInput"
            type="number"
            v-model.number="currentEditingValue"
            style="width: 100%; padding: 12px; font-size: 14px; box-sizing: border-box;"
          />
          <input
            v-else
            ref="fieldEditInput"
            v-model="currentEditingValue"
            style="width: 100%; padding: 12px; font-size: 14px; box-sizing: border-box;"
          />
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="cancelFieldEdit">取消</button>
          <button class="btn btn-primary" @click="saveFieldEdit">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 平台 Agent 工具新增/编辑页（/admin/agent-tools/create | :id/edit）。
 * 支持配置模板参数、子工具（BaseTool / Agent / MCP）、模型分组及文件访问权限。
 * 编辑模式下会对 Agent 子工具做循环引用检测，阻止形成 A → B → A 的引用环。
 */
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showSuccess, showError, showWarning } from '@/composables/useNotification';
import Switch from '@/components/common/Switch.vue';
import {
  getAgentTools,
  getAgentToolDetail,
  getAgentSubToolsByMainId,
  getToolTemplates,
  getModelGroups,
  getBaseTools,
  getMcpTools,
  saveAgentTool as apiSaveAgentTool
} from '@/api/admin';
import PublicFileTree from './components/PublicFileTree.vue';
import {
  buildAgentSubToolAdjacency,
  fetchAllAgentSubToolRelations,
  getAgentToolCycleRefType,
  getAgentToolCycleTooltip,
} from '@/utils/agentSubToolCycle';

const emit = defineEmits(["toast"]);
const route = useRoute();
const router = useRouter();

const agentTools = ref([]);
/** 全平台 Agent 子工具引用图，仅编辑模式用于环检测 */
const agentSubToolGraph = ref(new Map());
const templates = ref([]);
const groups = ref([]);
const basetools = ref([]);
const mcpTools = ref([]);

const agentToolForm = reactive({
  id: null,
  category: "",
  description: "",
  displayName: "",
  detail: "",
  instanceLevel: 3,
  fileAccess: "readonly",
  fileAccessDirs: [],
  visible: true,
  status: 1,
  defaultEnabled: false,
  sortOrder: 20,
  referencedBy: ""
});

const computedAgentCategoryFields = computed(() => {
  if (!agentToolForm.category) return [];
  // 按照你的要求，不论是新增还是编辑，统一使用 'create' 模式的逻辑
  // 也就是只渲染 createVisible = true 的字段
  return getTemplateFields(agentToolForm.category, 'create');
});
const agentConfigValues = reactive({});

// Universal Field Edit Modal State
const showFieldEditModal = ref(false);
const currentEditingField = ref("");
const currentEditingFieldLabel = ref("");
const currentEditingFieldType = ref("string");
const currentEditingFieldIsLarge = ref(false);
const currentEditingValue = ref(null);
const currentEditingTarget = ref('agent'); // 'agent' or 'subtool'
const fieldEditInput = ref(null);

function openFieldEditModal(fieldName, label, type, isLarge) {
  currentEditingField.value = fieldName;
  currentEditingFieldLabel.value = label;
  currentEditingFieldType.value = type;
  currentEditingFieldIsLarge.value = isLarge;
  currentEditingTarget.value = 'agent';
  currentEditingValue.value = agentConfigValues[fieldName];
  showFieldEditModal.value = true;
  nextTick(() => {
    if (fieldEditInput.value) {
      fieldEditInput.value.focus();
    }
  });
}

function openSubToolFieldEditModal(fieldName, label, type) {
  currentEditingField.value = fieldName;
  currentEditingFieldLabel.value = label;
  currentEditingFieldType.value = type;
  currentEditingFieldIsLarge.value = type === 'object' || type === 'array';
  currentEditingTarget.value = 'subtool';
  let val = subToolConfigValues[fieldName];
  if ((type === 'object' || type === 'array') && val !== null && val !== undefined && typeof val !== 'string') {
    val = JSON.stringify(val, null, 2);
  }
  currentEditingValue.value = val ?? '';
  showFieldEditModal.value = true;
  nextTick(() => {
    if (fieldEditInput.value) {
      fieldEditInput.value.focus();
    }
  });
}

function cancelFieldEdit() {
  showFieldEditModal.value = false;
  currentEditingValue.value = null;
}

function saveFieldEdit() {
  if (currentEditingTarget.value === 'agent') {
    if (currentEditingField.value === 'name') {
       agentConfigValues[currentEditingField.value] = (currentEditingValue.value || '').replace(/[^a-zA-Z_]/g, '');
    } else {
       agentConfigValues[currentEditingField.value] = currentEditingValue.value;
    }
  } else {
    subToolConfigValues[currentEditingField.value] = currentEditingValue.value;
  }
  showFieldEditModal.value = false;
}

// 根据当前是新增还是编辑，判断是否应该展示某个 config key
function shouldShowConfigKey(key) {
  // 特殊字段由独立 UI 渲染，永远跳过
  if (key === 'file_access' || key === 'fileAccess' || key === 'accessible_paths' || key === 'name') return false;

  // 对于由模板驱动的展示，需要判断 createVisible/configVisible
  const currentFields = computedAgentCategoryFields.value;
  const field = currentFields.find(f => f.name === key);

  // 因为 computedAgentCategoryFields 已经根据 mode 做了 visible 过滤，存在即代表该模式下可见
  return !!field;
}

// 获取字段是否必填
function isFieldRequired(field) {
  if (!field) return false;
  return field.required === true || String(field.required).toLowerCase() === 'true' || field.required === 1 || field.required === '1';
}

const agentSubTools = ref([]);
const agentMgOverride = ref(false);
const agentMgChecked = ref([]);

function getSubToolConfigRaw(st) {
  return st?.configValues ?? st?.config ?? null;
}

function parseSubToolConfigRaw(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

function serializeSubToolConfig(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  return typeof raw === 'string' ? raw : JSON.stringify(raw);
}

function normalizeLoadedSubTool(st) {
  const { refType, refId } = normalizeSubToolRef(st);
  const info = getSubToolInfo(refType, refId);
  return {
    ...st,
    refType,
    refId,
    ...info,
    configValues: getSubToolConfigRaw(st),
  };
}

// Sub-Tool Config Editor State
const showSubToolConfig = ref(false);
const subToolConfigRefType = ref("");
const subToolConfigRefId = ref(null);
const subToolConfigName = ref("");
const subToolConfigIsAutoPopup = ref(false);
const subToolConfigFields = ref([]);
const subToolConfigValues = reactive({});

const newAccessiblePath = ref("");

function addAccessiblePath() {
  const p = newAccessiblePath.value.trim();
  if (p) {
    if (!agentToolForm.fileAccessDirs) {
      agentToolForm.fileAccessDirs = [];
    }
    // Auto-append trailing slash if missing and doesn't look like a file extension
    const formattedPath = p.endsWith('/') || p.includes('.') ? p : p + '/';
    if (!agentToolForm.fileAccessDirs.includes(formattedPath)) {
      agentToolForm.fileAccessDirs.push(formattedPath);
    }
    newAccessiblePath.value = "";
  }
}

function removeAccessiblePath(index) {
  if (agentToolForm.fileAccessDirs) {
    agentToolForm.fileAccessDirs.splice(index, 1);
  }
}

function getUniversalGroupIds() {
  return groups.value.map((g) => String(g.id));
}

function parseModelGroupIds(raw) {
  if (raw === null || raw === undefined || raw === "") return null;

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
      return parts.length ? parts.map(String) : null;
    }
  }

  if (parsed === null) return null;
  if (Array.isArray(parsed)) {
    return parsed.length ? parsed.map(String) : null;
  }
  return null;
}

function intersectModelGroupIds(a, b) {
  const setB = new Set(b.map(String));
  return a.map(String).filter((id) => setB.has(id));
}

function isFieldConfigActive(field, valuesObj) {
  const val = valuesObj[field.name];
  if (field.type === "boolean") {
    return val === true || String(val).toLowerCase() === "true" || val === 1 || val === "1";
  }
  return val !== undefined && val !== null && val !== "";
}

function normalizeSubToolRef(st) {
  return {
    refType: st?.refType ?? st?.ref_type,
    refId: st?.refId ?? st?.ref_id,
  };
}

function findToolById(list, refId) {
  return list.find((x) => String(x.id) === String(refId));
}

function isSameSubToolRef(st, refType, refId) {
  const normalized = normalizeSubToolRef(st);
  return normalized.refType === refType && String(normalized.refId) === String(refId);
}

function getSubToolSchemaContext(st) {
  const { refType, refId } = normalizeSubToolRef(st);
  if (!refType || refId == null || refId === "") {
    return { subMgs: null, schemaFields: [] };
  }

  const schemaFields = getSubToolFieldsByRef(refType, refId);

  if (refType === "platform_basetools") {
    const bt = findToolById(basetools.value, refId);
    return { subMgs: bt?.modelGroups ?? null, schemaFields };
  }
  if (refType === "platform_mcp_tools") {
    const mt = findToolById(mcpTools.value, refId);
    return { subMgs: mt?.modelGroups ?? null, schemaFields };
  }
  if (refType === "platform_agent_tools") {
    const at = findToolById(agentTools.value, refId);
    return { subMgs: at?.modelGroups ?? null, schemaFields };
  }
  return { subMgs: null, schemaFields: [] };
}

function computeSubToolEffectiveModelGroups(st) {
  const { subMgs, schemaFields } = getSubToolSchemaContext(st);
  const toolLevelGroups = parseModelGroupIds(subMgs);
  let effective = toolLevelGroups === null ? getUniversalGroupIds() : [...toolLevelGroups];

  if (schemaFields.length > 0) {
    const valuesObj = parseSubToolConfigRaw(getSubToolConfigRaw(st));
    for (const field of schemaFields) {
      if (!field.modelGroups || !Array.isArray(field.modelGroups) || field.modelGroups.length === 0) {
        continue;
      }
      if (!isFieldConfigActive(field, valuesObj)) {
        continue;
      }
      effective = intersectModelGroupIds(effective, field.modelGroups);
    }
  }

  return effective;
}

function normalizeComputedModelGroups(intersection) {
  if (!intersection.length) return [];
  const universal = getUniversalGroupIds();
  if (intersection.length === universal.length && intersection.every((id) => universal.includes(String(id)))) {
    return null;
  }
  return intersection;
}

function isAutoModelGroupChecked(groupId) {
  const computed = computedAgentModelGroups.value;
  if (computed === null) return true;
  if (!Array.isArray(computed) || computed.length === 0) return false;
  return computed.map(String).includes(String(groupId));
}

const availableAgentTools = computed(() => {
  return agentTools.value.filter(t => t.id !== agentToolForm.id);
});

// ── 循环引用检测（仅编辑模式，新建时尚无 id）──
const agentToolCycleRefMap = computed(() => {
  const currentId = agentToolForm.id;
  if (!currentId) return {};
  const map = {};
  for (const t of agentTools.value) {
    if (String(t.id) === String(currentId)) continue;
    const refType = getAgentToolCycleRefType(t.id, currentId, agentSubToolGraph.value);
    if (refType) map[String(t.id)] = refType;
  }
  return map;
});

function getAgentToolCycleRef(agentId) {
  return agentToolCycleRefMap.value[String(agentId)] || null;
}

function onAgentSubToolLabelClick(tool, event) {
  const cycleRef = getAgentToolCycleRef(tool.id);
  if (!cycleRef) return;
  event.preventDefault();
  showWarning(getAgentToolCycleTooltip(cycleRef));
}

/** 进入编辑页时拉取所有 Agent 的子工具关系，构建引用图 */
async function loadAgentSubToolGraphForCycleDetection() {
  if (!agentToolForm.id || !agentTools.value.length) {
    agentSubToolGraph.value = new Map();
    return;
  }
  const subtoolsByAgentId = await fetchAllAgentSubToolRelations(
    agentTools.value.map((t) => t.id),
    getAgentSubToolsByMainId
  );
  agentSubToolGraph.value = buildAgentSubToolAdjacency(subtoolsByAgentId);
}

// 子工具 tool.modelGroups ∩ 各已启用参数的 field.modelGroups，再对所有子工具取交集
const computedAgentModelGroups = computed(() => {
  if (agentMgOverride.value) return agentMgChecked.value;
  if (agentSubTools.value.length === 0) return null;

  const mgSets = agentSubTools.value.map(computeSubToolEffectiveModelGroups);
  let intersection = mgSets[0];
  for (let i = 1; i < mgSets.length; i++) {
    intersection = intersectModelGroupIds(intersection, mgSets[i]);
  }
  return normalizeComputedModelGroups(intersection);
});

// 监听覆盖开关变化
function onAgentMgOverrideChange() {
  if (!agentMgOverride.value) {
    agentMgChecked.value = computedAgentModelGroups.value || [];
  }
}

// ---- Sub Tool Logic ----

function getSubToolInfo(refType, refId) {
  if (refType === 'platform_basetools') {
    const t = findToolById(basetools.value, refId);
    if (!t) return {};
    return { displayName: t.displayName, configSchema: t.configSchema, name: t.name };
  } else if (refType === 'platform_agent_tools') {
    const t = findToolById(agentTools.value, refId);
    if (!t) return {};
    let configObj = {};
    try {
      configObj = typeof t.config === 'string' ? JSON.parse(t.config) : (t.config || {});
    } catch (e) {
      configObj = {};
    }
    return {
      displayName: t.displayName,
      configSchema: getAgentToolConfigSchema(t),
      category: t.category,
      name: configObj.name || 'agent',
    };
  } else if (refType === 'platform_mcp_tools') {
    const t = findToolById(mcpTools.value, refId);
    if (!t) return {};
    let configObj = {};
    try {
      configObj = typeof t.config === 'string' ? JSON.parse(t.config) : (t.config || {});
    } catch (e) {
      configObj = {};
    }
    return {
      displayName: t.displayName,
      configSchema: getMcpToolConfigSchema(t),
      category: t.category,
      name: configObj.name || 'mcp',
    };
  }
  return {};
}

function getAgentToolConfigSchema(tool) {
  if (!tool || !tool.category) return null;
  const tmpl = templates.value.find(t => t.name === tool.category);
  return tmpl ? tmpl.configSchema : null;
}

function getMcpToolConfigSchema(tool) {
  if (!tool || !tool.category) return null;
  const tmpl = templates.value.find(t => t.name === tool.category);
  return tmpl ? tmpl.configSchema : null;
}

function isSubToolChecked(refType, refId) {
  return agentSubTools.value.some((st) => isSameSubToolRef(st, refType, refId));
}

function isTruthyFlag(val, defaultVal = false) {
  if (val === undefined || val === null) return defaultVal;
  return val === true || String(val).toLowerCase() === 'true' || val === 1 || val === '1';
}

function getSubToolConfigFieldsFromSchema(configSchema) {
  const schema = parseConfigSchema(configSchema);
  if (!schema?.fields?.length) return [];
  return schema.fields.filter((f) =>
    isTruthyFlag(f.configVisible ?? f.config_visible, false)
  );
}

function getSubToolFieldsByRef(refType, refId) {
  if (refType === "platform_basetools") {
    const bt = findToolById(basetools.value, refId);
    return bt?.configSchema ? getSubToolConfigFieldsFromSchema(bt.configSchema) : [];
  }
  if (refType === "platform_agent_tools") {
    const at = findToolById(agentTools.value, refId);
    if (!at?.category) return [];
    return getTemplateFields(at.category, "config");
  }
  if (refType === "platform_mcp_tools") {
    const mt = findToolById(mcpTools.value, refId);
    if (!mt?.category) return [];
    return getTemplateFields(mt.category, "config");
  }
  return [];
}

function hasSubToolConfig(refType, refId) {
  return getSubToolFieldsByRef(refType, refId).length > 0;
}

function hasSubToolRequiredConfig(refType, refId) {
  return getSubToolFieldsByRef(refType, refId).some((field) => isFieldRequired(field));
}

function onSubToolCheck(refType, refId, checked) {
  if (checked && refType === 'platform_agent_tools') {
    const cycleRef = getAgentToolCycleRef(refId);
    if (cycleRef) {
      showWarning(getAgentToolCycleTooltip(cycleRef));
      return;
    }
  }
  if (checked) {
    if (!isSubToolChecked(refType, refId)) {
      const info = getSubToolInfo(refType, refId);
      agentSubTools.value.push({
        refType,
        refId,
        configValues: null,
        ...info
      });

      if (hasSubToolRequiredConfig(refType, refId)) {
        openSubToolConfigEditor(refType, refId, false);
      }
    }
  } else {
    agentSubTools.value = agentSubTools.value.filter(
      (st) => !isSameSubToolRef(st, refType, refId)
    );
  }
}

// ---- Sub Tool Config Modal ----

function openSubToolConfigEditor(refType, refId, manualClick) {
  subToolConfigRefType.value = refType;
  subToolConfigRefId.value = refId;
  subToolConfigIsAutoPopup.value = !manualClick;

  const info = getSubToolInfo(refType, refId);
  subToolConfigName.value = info.displayName;

  subToolConfigFields.value = [];
  for (const k in subToolConfigValues) delete subToolConfigValues[k];

  subToolConfigFields.value = getSubToolFieldsByRef(refType, refId);
  if (subToolConfigFields.value.length === 0) {
    showSubToolConfig.value = false;
    return;
  }

  const st = agentSubTools.value.find((x) => isSameSubToolRef(x, refType, refId));
  const existingVals = parseSubToolConfigRaw(getSubToolConfigRaw(st));

  subToolConfigFields.value.forEach(f => {
    let val = existingVals[f.name] !== undefined
      ? existingVals[f.name]
      : (f.default !== undefined
        ? f.default
        : (f.type === 'boolean' ? false : (f.type === 'number' || f.type === 'integer' ? null : '')));
    if ((f.type === 'object' || f.type === 'array') && val !== null && val !== '' && typeof val !== 'string') {
      val = JSON.stringify(val, null, 2);
    }
    subToolConfigValues[f.name] = val;
  });

  showSubToolConfig.value = true;
}

function cancelSubToolConfigEditor() {
  if (subToolConfigIsAutoPopup.value) {
    agentSubTools.value = agentSubTools.value.filter(
      (st) => !isSameSubToolRef(st, subToolConfigRefType.value, subToolConfigRefId.value)
    );
  }
  showSubToolConfig.value = false;
}

function saveSubToolConfigEditor() {
  const st = agentSubTools.value.find((x) =>
    isSameSubToolRef(x, subToolConfigRefType.value, subToolConfigRefId.value)
  );
  if (st) {
    // 校验必填项
    for (const field of subToolConfigFields.value) {
      if (!isFieldRequired(field)) continue;

      const val = subToolConfigValues[field.name];
      if (val === undefined || val === null || val === '') {
        if (field.type === 'boolean' && val === false) {
          continue;
        }
        return showError(`必填项 ${field.label || field.name} * 没填`);
      }
      if (field.type === 'object' || field.type === 'array') {
        try {
          if (typeof val === 'string') JSON.parse(val);
        } catch {
          return showError(`${field.label || field.name} 必须是合法的 JSON 格式`);
        }
      }
    }
    const savedConfig = {};
    for (const field of subToolConfigFields.value) {
      let val = subToolConfigValues[field.name];
      if ((field.type === 'object' || field.type === 'array') && val && typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch {
          return showError(`${field.label || field.name} 必须是合法的 JSON 格式`);
        }
      }
      savedConfig[field.name] = val;
    }
    st.configValues = JSON.stringify(savedConfig);
  }
  showSubToolConfig.value = false;
}

async function saveAgentTool() {
  try {
    if (!agentToolForm.category) {
      return showError("请选择 category (工具模板)");
    }
    if (!agentConfigValues.name || !/^[a-zA-Z_]+$/.test(agentConfigValues.name)) {
      return showError("服务名必填，且只能包含字母和下划线");
    }

    // 校验必填字段 (基于模板 schema)
    const currentFields = computedAgentCategoryFields.value;
    for (const field of currentFields) {
      if (!shouldShowConfigKey(field.name)) continue;

      // 仅在严格要求的情况下校验
      if (isFieldRequired(field)) {
        const val = agentConfigValues[field.name];
        if (val === undefined || val === null || val === '') {
          // Boolean fields can be false, so check strictly for undefined/null/empty string
          if (field.type === 'boolean' && val === false) {
            continue; // false is a valid value for boolean
          }
          return showError(`必填项 ${field.label || field.name} * 没填`);
        }
      }
    }

    // 保存前，将 config 中应该为 JSON/Array 的文本转回对象
    const parsedConfigValues = { ...agentConfigValues };
    for (const field of computedAgentCategoryFields.value) {
      if ((field.type === 'object' || field.type === 'array') && parsedConfigValues[field.name]) {
        try {
          if (typeof parsedConfigValues[field.name] === 'string') {
            parsedConfigValues[field.name] = JSON.parse(parsedConfigValues[field.name]);
          }
        } catch (e) {
          return showError(`${field.label || field.name} 必须是合法的 JSON 格式`);
        }
      }
    }

    const payload = {
      id: agentToolForm.id,
      category: agentToolForm.category,
      description: agentToolForm.description,
      displayName: agentToolForm.displayName,
      detail: agentToolForm.detail,
      instanceLevel: agentToolForm.instanceLevel,
      fileAccess: agentToolForm.fileAccess,
      fileAccessDirs: JSON.stringify(agentToolForm.fileAccessDirs),
      visible: agentToolForm.visible ? 1 : 0,
      status: agentToolForm.status,
      defaultEnabled: agentToolForm.defaultEnabled ? 1 : 0,
      sortOrder: agentToolForm.sortOrder,
      modelGroups: agentMgOverride.value ? JSON.stringify(agentMgChecked.value) : (computedAgentModelGroups.value ? JSON.stringify(computedAgentModelGroups.value) : null),
      config: JSON.stringify(parsedConfigValues),
      // 传递子工具数组
      platformAgentSubtoolList: agentSubTools.value.map((st) => ({
        ...(st.id ? { id: st.id } : {}),
        ...(st.agentToolId ? { agentToolId: st.agentToolId } : {}),
        refType: st.refType,
        refId: st.refId,
        enabled: st.enabled ?? 1,
        config: serializeSubToolConfig(getSubToolConfigRaw(st)),
      }))
    };

    const res = await apiSaveAgentTool(payload);
    if (res.code === 0 || res.code === 200 || res.success) {
      showSuccess("保存成功");
      router.push("/admin/agent-tools");
    } else {
      showError(res.msg || res.message || "保存失败");
    }
  } catch (e) {
    showError("保存发生异常" + (e.message));
  }
}
function goBack() {
  router.push("/admin/agent-tools");
}

async function loadData() {
  try {
    // Note: We still need getAgentTools for the "availableAgentTools" list (for sub-tools)
    const [atRes, tRes, gRes, btRes, mRes] = await Promise.all([
      getAgentTools({ pageNo: 1, pageSize: 1000 }),
      getToolTemplates({ pageNo: 1, pageSize: 1000 }),
      getModelGroups({ pageNo: 1, pageSize: 1000 }),
      getBaseTools({ pageNo: 1, pageSize: 1000 }),
      getMcpTools({ pageNo: 1, pageSize: 1000 }),
    ]);

    if (atRes.code === 0 || atRes.code === 200 || atRes.success) {
      const atData = atRes.result || atRes.data;
      agentTools.value = atData?.records || atData || [];
    }

    if (tRes.code === 0 || tRes.code === 200 || tRes.success) {
      const tData = tRes.result || tRes.data;
      templates.value = tData?.records || tData || [];
    }

    if (gRes.code === 0 || gRes.code === 200 || gRes.success) {
      const gData = gRes.result || gRes.data;
      groups.value = gData?.groups || gData?.records || gData || [];
    }

    if (btRes.code === 0 || btRes.code === 200 || btRes.success) {
      const btData = btRes.result || btRes.data;
      basetools.value = btData?.records || btData || [];
    }

    if (mRes.code === 0 || mRes.code === 200 || mRes.success) {
      const mData = mRes.result || mRes.data;
      mcpTools.value = mData?.records || mData || [];
    }

    initForm();
  } catch (e) {
    showError("加载数据失败");
  }
}

async function initForm() {
  const idParam = route.params.id;
  if (idParam) {
    try {
      // 并发请求工具详情和它的子工具列表
      const [res, subRes] = await Promise.all([
        getAgentToolDetail(idParam),
        getAgentSubToolsByMainId(idParam)
      ]);

      if (res.code === 0 || res.code === 200 || res.success) {
        const t = res.result || res.data;
        if (t) {
          originalCategory.value = t.category;
          Object.assign(agentToolForm, {
            id: t.id,
            category: t.category,
            description: t.description,
            displayName: t.displayName,
            detail: t.detail,
            instanceLevel: t.instanceLevel ?? 3,
            fileAccess: t.fileAccess || "readonly",
            visible: t.visible === 1,
            status: t.status,
            defaultEnabled: t.defaultEnabled === 1,
            sortOrder: t.sortOrder || 20,
            referencedBy: t.referencedBy || ""
          });
          for (const key in agentConfigValues) delete agentConfigValues[key];
          Object.assign(agentConfigValues, { ...(t.config ? (typeof t.config === 'string' ? JSON.parse(t.config) : t.config) : {}) });

          // Object.keys(agentConfigValues).forEach(k => {
          //    if (typeof agentConfigValues[k] === 'object' && agentConfigValues[k] !== null) {
          //        agentConfigValues[k] = JSON.stringify(agentConfigValues[k], null, 2);
          //    }
          // });

          // 处理子工具的回显
          let subToolList = [];
          if (subRes.code === 0 || subRes.code === 200 || subRes.success) {
            subToolList = subRes.result || subRes.data || [];
          } else {
            // 兜底：如果查询子工具接口失败，尝试看详情里有没有附带
            subToolList = t.platformAgentSubtoolList || [];
          }

          agentSubTools.value = subToolList.map(normalizeLoadedSubTool);

          agentToolForm.fileAccessDirs = [];
          if (t.fileAccessDirs) {
            try {
              agentToolForm.fileAccessDirs = typeof t.fileAccessDirs === 'string' ? JSON.parse(t.fileAccessDirs) : t.fileAccessDirs;
            } catch (e) {
              console.error("Failed to parse fileAccessDirs:", e);
              agentToolForm.fileAccessDirs = [];
            }
          }
          agentMgOverride.value = false; // 编辑模式也默认自动模式
          let mgs = t.modelGroups;
          if (typeof mgs === 'string') {
            try { mgs = JSON.parse(mgs); } catch { mgs = mgs.split(',').map(s => s.trim()); }
          }
          agentMgChecked.value = mgs ? [...mgs] : [];

          // 编辑模式下初始化 schema 相关数据，不要清空现有的 agentConfigValues
          if (agentToolForm.category) {
            onAgentCategoryChange(true);
          }

          await loadAgentSubToolGraphForCycleDetection();
        }
      } else {
        showError("获取工具详情失败: " + (res.msg || res.message));
      }
    } catch (e) {
      showError("获取工具详情失败，网络或服务器错误");
    }
  } else {
    originalCategory.value = "";
    agentSubToolGraph.value = new Map();
    const targetTmpl = templates.value.find(t => t.name === "SimpleAgent");
    agentToolForm.category = targetTmpl ? targetTmpl.name : (templates.value[0]?.name || "");

    // 默认是自动的状态 (恢复自动 = 不进行覆盖)
    agentMgOverride.value = false;
    agentMgChecked.value = [];

    if (agentToolForm.category) {
      onAgentCategoryChange();
    }
  }
}

function parseConfigSchema(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
}

function getTemplateFields(category, mode) {
  const tmpl = templates.value.find((t) => t.name === category);
  if (!tmpl || !tmpl.configSchema) return [];
  const schema = parseConfigSchema(tmpl.configSchema);
  return (schema.fields || []).filter((f) => {
    // 兼容 boolean, 字符串 "true" 以及数字 1 (或者直接缺省，根据不同版本 schema 冗余)
    const isTrue = (val) => {
      if (val === undefined || val === null) return true;
      return val === true || String(val).toLowerCase() === 'true' || val === 1 || val === '1';
    };

    if (mode === 'create') {
      return isTrue(f.createVisible ?? f.create_visible);
    }
    if (mode === 'config') {
      return isTruthyFlag(f.configVisible ?? f.config_visible, false);
    }
    if (mode === 'edit') {
      return isTrue(f.configVisible ?? f.config_visible);
    }
    return isTrue(f[mode]);
  });
}

const originalCategory = ref("");

function onAgentCategoryChange(isInitEdit = false) {
  // 当切换模版时，如果不是在初始化编辑数据，重置并给一个基础空对象防止界面报错
  if (!isInitEdit) {
    for (const key in agentConfigValues) delete agentConfigValues[key];
    agentToolForm.fileAccess = 'readonly'; // Set default
  }

  // 根据模板 schema 动态初始化字段，否则基于 key-value 的渲染无法在页面上展示这些输入框
  const tmpl = templates.value.find((t) => t.name === agentToolForm.category);
  const isEditingOriginalCategory = agentToolForm.id && originalCategory.value === agentToolForm.category;

  if (tmpl && tmpl.configSchema) {
    const schema = parseConfigSchema(tmpl.configSchema);
    if (schema && schema.fields) {
      if (!isEditingOriginalCategory) {
        schema.fields.forEach(f => {
          // 如果是 edit 模式，原有的值优先级最高，不要被 default 覆盖
          if (agentConfigValues[f.name] !== undefined) {
            if ((f.type === 'object' || f.type === 'array') && typeof agentConfigValues[f.name] !== 'string' && agentConfigValues[f.name] !== null) {
              agentConfigValues[f.name] = JSON.stringify(agentConfigValues[f.name], null, 2);
            }
            return;
          }

          let defaultVal = f.default !== undefined ? f.default : (f.type === 'boolean' ? false : (f.type === 'number' || f.type === 'integer' ? null : ''));
          if ((f.type === 'object' || f.type === 'array') && defaultVal !== '' && defaultVal !== null && typeof defaultVal !== 'string') {
            defaultVal = JSON.stringify(defaultVal, null, 2);
          }
          agentConfigValues[f.name] = defaultVal;
        });
      } else if (isInitEdit) {
        // 在编辑初始化的时候，也需要将对象数组转为字符串以便展示
        schema.fields.forEach(f => {
          if (agentConfigValues[f.name] !== undefined) {
            if ((f.type === 'object' || f.type === 'array') && typeof agentConfigValues[f.name] !== 'string' && agentConfigValues[f.name] !== null) {
              agentConfigValues[f.name] = JSON.stringify(agentConfigValues[f.name], null, 2);
            }
          }
        })
      }
    }
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
@import "@/assets/admin-common.css";
.agent-tool-edit {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  padding: 24px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 16px;
  margin-bottom: var(--spacing-lg, 24px);
  padding-bottom: var(--spacing-md, 16px);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1;
}

.header-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 28px 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.section-title-first {
  margin-top: 0;
}

.section-desc {
  margin: -8px 0 16px;
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 6px;
  line-height: 1.5;
}

.controls-row {
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
}

.switch-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-shrink: 0;
}

.switch-group .form-field {
  flex: none;
  margin-bottom: 0;
}

.status-field {
  flex: none;
  margin-bottom: 0;
  width: 140px;
}

.sort-field {
  flex: none;
  margin-bottom: 0;
  width: 100px;
}

.header-actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.header-actions .btn {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .agent-tool-edit .page-header .header-actions {
    flex-direction: row !important;
    align-items: center !important;
    width: auto !important;
    flex-shrink: 0;
  }

  .agent-tool-edit .page-header .header-actions .btn {
    width: auto !important;
    max-width: none !important;
  }
}

.system-prompt-display {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--color-border);
}

.prompt-content {
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg-secondary);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.page-content {
  flex: 1;
  overflow: hidden;
}

/* Two Column Layout */
.layout-split {
  display: flex;
  gap: 24px;
  align-items: stretch;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.right-panel {
  width: 440px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.warning-card {
  background: var(--color-warning-soft, #fef3c7);
  border-color: var(--color-warning, #f59e0b);
  color: #b45309;
  font-weight: 500;
  font-size: 14px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-card {
  background: var(--color-surface);
  border-radius: var(--radius-md, 8px);
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.flex-fill {
  flex: 1;
}

/* Textareas & Inputs */
.prompt-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}

.huge-textarea {
  flex: 1;
  min-height: 120px;
  resize: vertical;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  line-height: 1.6;
  padding: 12px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.huge-textarea:focus {
  background-color: var(--color-surface);
}

.prompt-field-input {
  min-height: 240px;
}

.btn-text:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text);
}

.btn-text-danger {
  background: var(--color-error, #ef4444);
  color: #fff;
  border: none;
}

.btn-text-danger:hover {
  background: #dc2626;
  color: #fff;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:not(:disabled):hover {
  background: var(--color-primary-hover);
}

.btn-danger {
  background: var(--color-error);
  color: #fff;
  border-radius: var(--radius-md, 8px);
}

.btn-danger:not(:disabled):hover {
  background: #dc2626;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-ghost:not(:disabled):hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* Tags */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-full, 9999px);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
}

.tag-gray {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

/* Field Lists (Subtools) */
.field-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  background: var(--color-surface);
}

.field-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm, 14px);
  gap: 12px;
}

.field-item:last-child {
  border-bottom: none;
}

.field-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-actions {
  display: flex;
  gap: 8px;
}

.field-empty {
  padding: 32px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm, 14px);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md, 8px);
  background: var(--color-bg-secondary);
}

.field-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
}

.field-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 16px;
}

.field-title {
  margin: 0;
  font-size: 13px;
  color: var(--color-text);
  font-weight: 500;
}

.field-desc {
  font-size: 11px;
  color: var(--color-text-muted);
}

.field-action {
  flex-shrink: 0;
}

.sub-dialog {
  z-index: 150;
}

.sub-tool-group {
  margin-bottom: 24px;
}

.sub-tool-group h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: var(--color-text);
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
}

.sub-tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sub-tool-item label {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 500;
}

.sub-tool-label--cycle {
  color: var(--color-text-muted, #9ca3af);
  cursor: not-allowed;
}

.sub-tool-cycle-tag {
  color: var(--color-text-muted, #9ca3af);
  font-weight: 400;
  font-size: 13px;
}

.radio-group {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 20px;
  padding: 4px 0;
}

.radio-group label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: none;
  letter-spacing: normal;
}

.radio-group input[type="radio"] {
  width: 16px;
  height: 16px;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  accent-color: var(--color-primary);
  border: none;
  box-shadow: none;
}

.radio-group input[type="radio"]:focus {
  box-shadow: none;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--color-border);
}

.checkbox-group label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm, 14px);
  cursor: pointer;
  white-space: nowrap;
  text-transform: none;
  font-weight: 500;
  color: var(--color-text);
}
</style>
