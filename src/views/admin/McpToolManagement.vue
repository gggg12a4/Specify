<template>
  <div class="mcp-tool-management admin-page">
    <div class="page-header">
      <div class="header-title">
        <h2>MCP 工具</h2>
        <span class="count-badge" style="background: none; border: none; padding: 0;">共 {{ totalCount }} 个工具</span>
      </div>
      <div class="header-actions" style="display: flex; align-items: center; gap: 12px;">
        <select
          v-model="statusFilter"
          class="filter-select"
          style="min-width: 140px;"
        >
          <option value="">状态: 全部</option>
          <option :value="1">正常</option>
          <option :value="2">即将过期</option>
          <option :value="3">失效</option>
        </select>
        <button class="btn btn-primary" @click="openMcpToolForm()">
          + 添加MCP工具
        </button>
      </div>
    </div>
    <div class="table-wrap" v-if="mcpTools.length > 0 || isLoading">
      <table v-if="!isLoading">
        <thead>
          <tr>
            <th>服务标识</th>
            <th>展示名</th>
            <th>说明</th>
            <!-- <th style="width: 200px;">端点URL</th> -->
            <th>认证方式</th>
            <th>模板类型</th>
            <th style="text-align: center;">默认启用</th>
            <th style="text-align: center;">可见</th>
            <th>状态</th>
            <th style="display: none;">被引用</th>
            <th>排序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in mcpTools" :key="t.id">
            <td class="text-mono">{{ parseConfig(t.config)?.name || "-" }}</td>
            <td class="font-medium">{{ t.displayName || parseConfig(t.config)?.name || "-" }}</td>
            <td class="text-muted" style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="t.description">
              {{ t.description || '-' }}
            </td>
            <!-- <td class="text-mono" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="extractEndpoint(t)">{{ extractEndpoint(t) }}</td> -->
            <td><span class="tag tag-gray">{{ extractAuthMode(t) }}</span></td>
            <td><span class="tag tag-gray">{{ t.category }}</span></td>
            <td style="text-align: center;">
              <Switch :modelValue="t.defaultEnabled === 1" disabled />
            </td>
            <td style="text-align: center;">
              <Switch :modelValue="t.visible === 1" disabled />
            </td>
            <td>
              <span :class="['tag', statusTagClass(t.status)]">
                {{ statusLabel(t.status) }}
              </span>
            </td>
            <td class="text-muted" style="display: none;">{{ t.referencedBy?.length || "-" }}</td>
            <td>{{ t.sortOrder }}</td>
            <td class="actions">
              <button class="btn btn-ghost btn-sm" @click="openMcpToolForm(t)">
                编辑
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="confirmDelete(t.id)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-else>
        <thead>
          <tr>
            <th>服务标识</th>
            <th>展示名</th>
            <th>说明</th>
            <!-- <th style="width: 200px;">端点URL</th> -->
            <th>认证方式</th>
            <th>模板类型</th>
            <th style="text-align: center;">默认启用</th>
            <th style="text-align: center;">可见</th>
            <th>状态</th>
            <th style="display: none;">被引用</th>
            <th>排序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="11" style="text-align: center; padding: 60px 0;">
              <div class="loading-spinner"></div>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination
        v-if="!isLoading && mcpTools.length > 0"
        :total="totalCount"
        :pageSize="pageSize"
        v-model="currentPage"
      />
    </div>
    <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <p>暂无 MCP 工具数据</p>
      </div>

    <!-- MCP 工具弹窗 -->
    <div
      v-if="showMcpToolModal"
      class="modal-mask"
      @click.self="showMcpToolModal = false"
    >
      <div class="modal" style="width: 760px; max-height: 90vh; min-width: 760px;">
        <div class="modal-header">
          {{ mcpToolForm.id ? "编辑 MCP 工具" : "新增 MCP 工具" }}
        </div>
        <div class="modal-body">
          <!-- 1. 基本信息 -->
          <div class="form-card">
            <div class="section-title" style="margin-top: 0">基本信息</div>
            <div class="form-row">
              <div class="form-field">
                <label>展示名 *</label>
                <input v-model="mcpToolForm.displayName" placeholder="如 GitHub" />
              </div>
            </div>
            <div class="form-field">
              <label>说明 (description) *</label>
              <input v-model="mcpToolForm.description" placeholder="一句话说明，如 连接 GitHub 仓库，支持代码管理..." />
            </div>
            <div class="form-field" style="margin-bottom: 0;">
              <label>详细说明 (detail)</label>
              <textarea v-model="mcpToolForm.detail" style="min-height: 60px" placeholder="可选的详细描述..."></textarea>
            </div>
          </div>

          <!-- 2. 引擎配置参数（基于模板渲染） -->
          <div class="form-card">
            <div class="section-title" style="margin-top: 0">引擎配置参数</div>
            <div class="form-field" v-if="!mcpToolForm.id">
              <label>模板类型 (category) *</label>
              <select
                v-model="mcpToolForm.category"
                @change="onMcpCategoryChange"
              >
                <option v-for="t in templates" :key="t.id" :value="t.name">
                  {{ t.displayName }} ({{ t.name }})
                </option>
              </select>
            </div>
            <div class="form-field" v-else>
              <label>模板类型 (category)</label>
              <input :value="mcpToolForm.category" disabled style="background: #f3f4f6" />
            </div>
            <div class="form-field" v-if="!mcpToolForm.id">
              <label>服务名 (config.name) *</label>
              <input v-model="mcpConfigValues.name" placeholder="如 github" @input="mcpConfigValues.name = mcpConfigValues.name.replace(/[^a-zA-Z_]/g, '')" />
              <div class="hint">只能字母下划线，作为工具名前缀（如 github_create_issue），创建后不可修改</div>
            </div>
            <div class="form-field" v-if="mcpToolForm.id">
              <label>服务名 (config.name)</label>
              <input :value="mcpConfigValues.name" disabled style="background: #f3f4f6" />
            </div>

            <template v-for="field in mcpCategoryFields" :key="field.name">
              <!-- Skip config.name if it comes from the schema, as we handle it manually above -->
              <template v-if="field.name !== 'name'">
                <!-- MCPAuth special component -->
                <div
                  v-if="field.name === 'headers'"
                  class="form-field"
                >
                  <label>认证请求头 (Headers)</label>
                  <div class="auth-box" style="box-sizing: border-box;">
                    <div>
                      <div
                        v-for="(h, hi) in mcpCustomHeaders"
                        :key="hi"
                        class="kv-row"
                      >
                        <div class="form-field" style="margin-bottom: 0; flex: 1;">
                          <label>Header 名 *</label>
                          <input
                            v-model="h.key"
                            placeholder="X-API-Key"
                          />
                        </div>
                        <div class="form-field" style="margin-bottom: 0; flex: 1;">
                          <label>Header 值</label>
                          <!-- 注释掉脱敏逻辑，直接回显真实值 -->
                          <!-- <input v-model="h.value" :placeholder="mcpToolForm.id && h.maskedValue ? h.maskedValue : (mcpToolForm.id ? '留空表示不更新' : 'sk-****xxxx')" type="password" /> -->
                          <input v-model="h.value" placeholder="请输入值" type="text" />
                        </div>
                        <div class="form-field" style="margin-bottom: 0; display: flex; align-items: flex-end;">
                          <button
                            class="btn btn-danger"
                            @click="mcpCustomHeaders.splice(hi, 1)"
                            style="height: 38px; padding: 0 16px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm, 6px);"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      <!-- <div class="hint" style="margin-bottom: 8px; margin-top: 4px;">（编辑时若有值将显示遮敏信息，留空表示不更新；新增时为空）</div> -->
                      <button
                        class="btn btn-sm btn-ghost"
                        @click="mcpCustomHeaders.push({ key: '', value: '' })"
                        style="margin-top: 8px;"
                      >
                        + 添加 Header
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Normal string field -->
                <div v-else-if="field.type === 'string' || field.type === 'integer' || field.type === 'number'" class="form-field">
                  <label>
                    {{ getFieldLabel(field) }}
                  </label>
                  <input
                    v-model="mcpConfigValues[field.name]"
                    :placeholder="'请输入' + field.name"
                  />
                </div>
                <div v-else-if="field.type === 'boolean'" class="form-field">
                  <label>{{ getFieldLabel(field) }}</label>
                  <div>
                    <Switch v-model="mcpConfigValues[field.name]" />
                  </div>
                </div>
              </template>
            </template>
          </div>

          <!-- 3. 运行与发布控制 -->
          <div class="form-card">
            <div class="section-title" style="margin-top: 0">运行与发布控制</div>
            <div class="form-field instance-level-field" style="margin-bottom: 16px;">
              <label>instance_level *</label>
              <div class="radio-group">
                <label>
                  <input type="radio" v-model.number="mcpToolForm.instanceLevel" :value="0" />
                  0
                </label>
                <label>
                  <input type="radio" v-model.number="mcpToolForm.instanceLevel" :value="1" />
                  1
                </label>
                <label>
                  <input type="radio" v-model.number="mcpToolForm.instanceLevel" :value="2" />
                  2
                </label>
                <label>
                  <input type="radio" v-model.number="mcpToolForm.instanceLevel" :value="3" />
                  3
                </label>
              </div>
              <div class="hint">0=平台实例 1=App缓存 2=用户缓存 3=用完即弃</div>
            </div>
            <div class="form-row" style="align-items: center; flex-wrap: nowrap; gap: 24px;">
              <div class="form-field" style="width: 80px; flex: none; margin-bottom: 0;">
                <label>排序 *</label>
                <input v-model.number="mcpToolForm.sortOrder" type="number" style="padding: 6px 10px; width: 100%; box-sizing: border-box;" />
              </div>
              <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; width: 80px; flex: none; gap: 8px; margin-bottom: 0;">
                <label style="margin-bottom: 0; white-space: nowrap;">默认启用</label>
                <Switch v-model="mcpToolForm.defaultEnabled" />
              </div>
              <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; width: 80px; flex: none; gap: 8px; margin-bottom: 0;">
                <label style="margin-bottom: 0; white-space: nowrap;">是否可见</label>
                <Switch v-model="mcpToolForm.visible" />
              </div>
              <div class="form-field" style="width: 120px; flex: none; margin-bottom: 0;">
                <label>状态 *</label>
                <select v-model.number="mcpToolForm.status" style="padding: 6px 10px; width: 100%;">
                  <option :value="1">正常</option>
                  <option :value="2">已弃用</option>
                  <option :value="3">预览版</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showMcpToolModal = false">
            取消
          </button>
          <button class="btn btn-primary" @click="saveMcpTool">
            确认保存
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-mask" @click.self="showDeleteModal = false">
      <div class="modal" style="width: 500px; max-height: 80vh">
        <div class="modal-header">删除 MCP 工具「{{ deleteTargetName }}」</div>
        <div class="modal-body">
          <template v-if="deleteAppCount > 0">
            <p style="margin: 0 0 8px; color: var(--color-text);">当前有 {{ deleteAppCount }} 个 App 正在使用该工具，</p>
            <p style="margin: 0 0 16px; color: var(--color-text);">删除后这些 App 的相关功能将受到影响。</p>
          </template>

          <template v-if="referencingTools && referencingTools.length > 0">
            <div style="margin-bottom: 16px;">
              <p style="margin: 0 0 8px; color: var(--color-text); font-weight: 500;">以下工具正在引用该工具：</p>
              <div class="table-wrap" style="box-shadow: none; border: 1px solid var(--color-border); max-height: 200px; overflow-y: auto; padding: 0;">
                <table style="min-width: unset;">
                  <thead>
                    <tr>
                      <th style="padding: 8px;">引用工具名称</th>
                      <th style="padding: 8px;">引用类型</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(refTool, index) in referencingTools" :key="index">
                      <td style="padding: 8px;">{{ refTool.agentToolName || '-' }}</td>
                      <td style="padding: 8px;">
                        <span class="tag tag-gray">{{ formatRefType(refTool.refType) }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <p style="margin: 0 0 16px; color: var(--color-error, #ef4444)">⚠️ 此操作不可恢复，请输入确认密码以执行删除。</p>

          <div class="form-field">
            <label>确认密码 *</label>
            <input v-model="deletePassword" type="password" placeholder="请输入确认密码" @keyup.enter="executeDelete" />
          </div>

          <p v-if="deleteError" style="color: var(--color-error, #ef4444); font-size: 12px; margin: 0">{{ deleteError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showDeleteModal = false">取消</button>
          <button class="btn btn-sm btn-danger" @click="executeDelete" :disabled="isDeleting">
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { getMcpTools, getMcpToolDetail, getToolTemplates, saveMcpTool as apiSaveMcpTool, deleteMcpTool as apiDeleteMcpTool, getMcpToolReferencingTools } from '@/api/admin';
import Switch from '@/components/common/Switch.vue';
import Pagination from '@/components/common/Pagination.vue';

const emit = defineEmits(["toast", "update:mcpTools"]);

const mcpTools = ref([]);
const templates = ref([]);
const statusFilter = ref('');
const isLoading = ref(true);
const currentPage = ref(1);
const pageSize = 20;
const totalCount = ref(0);

watch(statusFilter, () => {
  currentPage.value = 1;
  loadData();
});

watch(currentPage, () => {
  loadData();
});

const showDeleteModal = ref(false);
const deleteError = ref('');
const deletePassword = ref('');
const isDeleting = ref(false);
const deleteTargetId = ref(null);
const deleteTargetName = ref('');
const deleteAppCount = ref(0);
const referencingTools = ref([]);

function formatRefType(type) {
  const map = {
    'platform_basetools': '基础工具',
    'platform_mcp_tools': 'MCP工具',
    'platform_agent_tools': 'Agent工具'
  };
  return map[type] || type || '-';
}

function statusLabel(s) {
  return { 1: '正常', 2: '即将过期', 3: '失效' }[s] || '未知';
}

function statusTagClass(s) {
  return { 1: 'tag-green', 2: 'tag-yellow', 3: 'tag-red' }[s] || 'tag-gray';
}

const showMcpToolModal = ref(false);
const mcpToolForm = reactive({
  id: null,
  category: "",
  displayName: "",
  description: "",
  detail: "",
  visible: true,
  status: 1,
  defaultEnabled: false,
  sortOrder: 0,
  instanceLevel: 0,
});

const mcpCategoryFields = ref([]);
const mcpConfigValues = reactive({});
const originalCategory = ref("");
const mcpCustomHeaders = ref([]);

async function loadData() {
  isLoading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize
    };
    if (statusFilter.value !== "") params.status = statusFilter.value;

    const [mcpRes, tRes] = await Promise.all([
      getMcpTools(params),
      getToolTemplates(),
    ]);

    if (mcpRes.code === 0) {
      mcpTools.value = mcpRes.data?.records || mcpRes.data || [];
      totalCount.value = mcpRes.data?.total || mcpTools.value.length;
      emit("update:mcpTools", mcpTools.value);
    }
    if (tRes.code === 0) templates.value = tRes.data?.records || tRes.data || [];
  } catch (e) {
    emit("toast", { msg: "加载数据失败", type: "error" });
  } finally {
    isLoading.value = false;
  }
}

function getTemplateFields(category, mode) {
  const tmpl = templates.value.find((t) => t.name === category);
  if (!tmpl || !tmpl.configSchema) return [];
  try {
    const schema = typeof tmpl.configSchema === 'string' ? JSON.parse(tmpl.configSchema) : tmpl.configSchema;
    return (schema.fields || []).filter((f) => {
      const isTrue = (val) => {
        if (val === undefined || val === null) return true;
        return val === true || String(val).toLowerCase() === 'true' || val === 1 || val === '1';
      };

      // mode === 'create' 对应 create_visible
      // mode === 'edit' 对应 config_visible
      if (mode === 'create') {
        return isTrue(f.createVisible ?? f.create_visible);
      } else {
        return isTrue(f.configVisible ?? f.config_visible);
      }
    });
  } catch (e) {
    console.error("Failed to parse configSchema:", e);
    return [];
  }
}

function getFieldLabel(field) {
  const isRequired = field.required === true || String(field.required).toLowerCase() === 'true' || field.required === 1 || field.required === '1';
  return isRequired ? `${field.label || field.name} *` : (field.label || field.name);
}

function onMcpCategoryChange() {
    // 无论是新增还是编辑切换模板，都重新计算字段，统一传 'create' 获取可见信息
    mcpCategoryFields.value = getTemplateFields(mcpToolForm.category, 'create');
    // Reset config
    for (const key in mcpConfigValues) delete mcpConfigValues[key];

    // 如果是编辑模式且是原本的模板类型，不要覆盖已经加载的 config，直接跳过默认赋值
    const isEditingOriginalCategory = mcpToolForm.id && originalCategory.value === mcpToolForm.category;

    if (!isEditingOriginalCategory) {
      mcpCategoryFields.value.forEach((f) => {
        if (f.default !== undefined) {
          mcpConfigValues[f.name] = f.default;
        } else if (f.name !== 'name' && f.name !== 'headers') {
          // Provide empty defaults based on type so that Vue reactivity works for new inputs
          mcpConfigValues[f.name] = f.type === 'boolean' ? false : (f.type === 'number' || f.type === 'integer' ? null : '');
        }
      });
      // Always ensure headers exists if auth component is expected
      const authField = mcpCategoryFields.value.find(f => f.type === 'object' && f.class === 'MCPAuth');
      if (authField) mcpConfigValues.headers = null;

      // Special auth reset
      mcpCustomHeaders.value = [];
    }
}

function openMcpToolForm(t) {
  if (t) {
    originalCategory.value = t.category;
    Object.assign(mcpToolForm, {
      id: t.id,
      name: t.name || parseConfig(t.config)?.name,
      category: t.category,
      displayName: t.displayName,
      description: t.description,
      detail: t.detail,
      visible: t.visible === 1,
      status: t.status,
      defaultEnabled: t.defaultEnabled === 1,
      sortOrder: t.sortOrder,
      instanceLevel: t.instanceLevel ?? 0,
    });
    // Load config — need detail API for full credentials
    for (const key in mcpConfigValues) delete mcpConfigValues[key];

    // Load detail (with full credentials) if editing
    getMcpToolDetail(t.id).then(detailRes => {
      // NOTE: We should use .result instead of .data if the backend wraps the payload.
      // Assuming response structure { code: 0, result: {...} } based on documentation
      if (detailRes.code === 0 || detailRes.success) {
        const detailData = detailRes.result || detailRes.data;
        const configData = typeof detailData.config === 'string' ? JSON.parse(detailData.config) : (detailData.config || {});
        Object.assign(mcpConfigValues, configData);
        // Ensure category fields are updated AFTER config is loaded so the template picks up the values
        mcpCategoryFields.value = getTemplateFields(t.category, "create");

        // Parse auth from config.headers field
        if (mcpConfigValues.headers && typeof mcpConfigValues.headers === 'object') {
          mcpCustomHeaders.value = Object.entries(mcpConfigValues.headers).map(([k, v]) => ({
            key: k,
            // 直接将真实值赋给 value 用于回显
            value: v,
            // 暂时不再使用 maskedValue
            maskedValue: ""
          }));
        }
      }
    });
  } else {
    originalCategory.value = "";
    Object.assign(mcpToolForm, {
      id: null,
      name: "",
      category: "", // 稍后设置默认值
      displayName: "",
      description: "",
      detail: "",
      visible: true,
      status: 1,
      defaultEnabled: false,
      sortOrder: 0,
      instanceLevel: 0,
    });

    // 强制寻找 MCPServerStreamable 作为默认模板，找不到则退回取第一个
    const targetTmpl = templates.value.find(t => t.name === "MCPServerStreamable");
    mcpToolForm.category = targetTmpl ? targetTmpl.name : (templates.value[0]?.name || "");

    for (const key in mcpConfigValues) delete mcpConfigValues[key];
    mcpCustomHeaders.value = [];
    if (mcpToolForm.category) onMcpCategoryChange();
  }
  showMcpToolModal.value = true;
}

async function saveMcpTool() {
  if (!mcpToolForm.displayName) {
    emit("toast", { msg: "必填项 展示名 * 没填", type: "error" });
    return;
  }
  if (!mcpToolForm.description) {
    emit("toast", { msg: "必填项 说明 * 没填", type: "error" });
    return;
  }
  if (!mcpToolForm.category) {
    emit("toast", { msg: "必填项 模板类型 * 没填", type: "error" });
    return;
  }
  if (!mcpConfigValues.name) {
    emit("toast", { msg: "必填项 服务名 * 没填", type: "error" });
    return;
  }

    const payload = { ...mcpToolForm };
    const config = { ...mcpConfigValues };

    // 校验基于模板动态渲染的必填字段
    const currentFields = mcpCategoryFields.value;
    for (const field of currentFields) {
      if (field.name !== 'name' && field.name !== 'headers' && (field.required === true || String(field.required).toLowerCase() === 'true' || field.required === 1 || field.required === '1')) {
        const val = config[field.name];
        if (val === undefined || val === null || val === '') {
          if (field.type === 'boolean' && val === false) {
             continue;
          }
          emit("toast", { msg: `必填项 ${field.label || field.name} * 没填`, type: "error" });
          return;
        }
      }
    }

    // Handle auth field
    if ('headers' in config) {
    const headers = {};
    mcpCustomHeaders.value.forEach((h) => {
      if (h.key) headers[h.key] = h.value || undefined;
    });
    config.headers = Object.keys(headers).length > 0
      ? headers
      : null;
  }

  payload.config = JSON.stringify(config);

  // Boolean mapping
  payload.visible = payload.visible ? 1 : 0;
  payload.defaultEnabled = payload.defaultEnabled ? 1 : 0;

  try {
    // In edit mode, if config.name is present, the API may still try to modify it depending on the backend,
    // but the UI is strictly disabled. We just pass everything.
    let r;
    if (payload.id) {
      r = await apiSaveMcpTool(payload);
    } else {
      r = await apiSaveMcpTool(payload);
    }
    if (r.code === 0 || r.code === 200 || r.success) {
      showMcpToolModal.value = false;
      emit("toast", { msg: "保存成功" });
      loadData();
    } else {
      emit("toast", { msg: r.msg || r.message, type: "error" });
    }
  } catch (e) {
    emit("toast", { msg: "保存失败", type: "error" });
  }
}

function extractEndpoint(t) {
  if (!t.config) return "-";
  // Attempt to find something that looks like an endpoint (often 'url' or 'endpoint')
  for (const key of ['url', 'endpoint', 'base_url', 'command']) {
    if (t.config[key]) return t.config[key];
  }
  return "-";
}

function extractAuthMode(t) {
  if (!t.config) return "无认证";
  const config = parseConfig(t.config);
  if (!config) return "无认证";

  if (config.headers && Object.keys(config.headers).length > 0) {
    return '自定义 Headers';
  }
  return "无认证";
}

function parseConfig(configStr) {
  if (!configStr) return null;
  if (typeof configStr === 'object') return configStr;
  try {
    return JSON.parse(configStr);
  } catch (e) {
    return null;
  }
}

async function confirmDelete(id) {
  const tool = mcpTools.value.find(t => t.id === id);
  deleteTargetId.value = id;
  deleteTargetName.value = tool ? tool.displayName : '';
  deleteAppCount.value = tool?.referencedBy?.length || 0;
  deletePassword.value = '';
  deleteError.value = '';
  referencingTools.value = [];

  try {
    const res = await getMcpToolReferencingTools(id);
    if (res.code === 0 || res.code === 200 || res.success) {
      referencingTools.value = res.result || res.data || [];
    }
  } catch (e) {
    console.error('获取引用列表失败', e);
  }

  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!deletePassword.value) {
    deleteError.value = '请输入确认密码';
    return;
  }

  isDeleting.value = true;
  deleteError.value = '';

  try {
    const r = await apiDeleteMcpTool({ id: deleteTargetId.value, password: deletePassword.value });
    if (r.code === 0 || r.code === 200 || r.success) {
      showDeleteModal.value = false;
      emit("toast", { msg: "已删除" });
      loadData();
    } else {
      deleteError.value = r.message || r.msg || '删除失败，请检查密码或重试';
    }
  } catch (e) {
    deleteError.value = e?.response?.data?.message || e?.response?.data?.msg || e?.message || '删除失败，网络或服务器错误';
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
@import '@/assets/admin-common.css';

/* Buttons */
.btn-text {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-md, 8px);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  height: 28px;
  box-sizing: border-box;
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

/* Modals with Backdrop Blur */

  /* Modern Inputs with Primary-Soft Focus Glow */
  .section-title {
    font-size: var(--text-xs, 12px);
    font-weight: 700;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 24px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .hint {
    font-size: var(--text-xs, 12px);
    color: var(--color-text-muted);
    margin-top: 6px;
  }

/* Pill Tags */
  .tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: var(--radius-full, 9999px);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.5;
  }
  .tag-green {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success, #10b981);
    white-space: nowrap;
  }
  .tag-gray {
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    white-space: nowrap;
  }
  .tag-yellow {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    white-space: nowrap;
  }
  .tag-red {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error, #ef4444);
    white-space: nowrap;
  }
  .text-mono {
    font-family: var(--font-mono, monospace);
    font-size: 12px;
  }
  .font-medium {
    font-weight: 500;
  }
  .text-muted {
    color: var(--color-text-muted);
    text-align: center;
  }
  .tag-blue {
    background: var(--color-primary-soft, rgba(59, 130, 246, 0.1));
    color: var(--color-primary);
  }

  /* Auth Box Enhancement */
  .auth-box {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: 16px;
    margin-top: 8px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }
  .radio-group {
    display: flex;
    gap: 24px;
    align-items: center;
    margin-bottom: 16px;
  }
  .radio-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-sm, 14px);
    cursor: pointer;
    font-weight: 500;
  }
  .kv-row {
    display: flex;
    gap: 16px;
    align-items: flex-end;
    margin-bottom: 12px;
  }
  .kv-row input {
    flex: 1;
    padding: 8px 12px;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-sm, 6px);
    font-size: var(--text-sm, 14px);
    background: var(--color-surface);
    transition: all 0.2s ease;
  }
  .kv-row input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-soft, rgba(59,130,246,0.15));
  }

  /* Custom Scrollbar for Modal Body */
  .modal-body::-webkit-scrollbar {
    width: 6px;
  }
  .modal-body::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }
  .modal-body::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-muted);
  }
  /* Select */
  .filter-select {
    padding: 6px 32px 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 6px);
    font-size: var(--text-sm, 13px);
    color: var(--color-text);
    background-color: var(--color-surface);
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }
  .filter-select:hover {
    border-color: #d1d5db;
  }
  .filter-select:focus {
    border-color: var(--color-border);
    box-shadow: none;
  }
  /* 原生 option 样式（只能做部分基础定制，无法修改展开层的边框） */
  .filter-select option {
    background-color: var(--color-surface);
    color: var(--color-text);
  }
  /* Loading Spinner */
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
