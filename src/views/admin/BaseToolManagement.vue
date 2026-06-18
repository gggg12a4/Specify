<template>
	<div class="base-tool-management admin-page">
		<div class="page-header" style="margin-bottom: 0;">
			<div class="header-title">
				<h2>基础工具</h2>
				<span class="count-badge">共 {{ totalCount }} 个</span>
			</div>
			<div class="header-actions" style="display: flex; align-items: center; gap: 12px;">
				<select v-model="platformFilter" class="filter-select" style="min-width: 140px;">
					<option value="">全部平台</option>
					<option v-for="g in groups" :key="g.id" :value="g.id">{{ g.displayName }}</option>
				</select>
				<select v-model="statusFilter" class="filter-select" style="min-width: 120px;">
					<option value="">状态: 全部</option>
					<option :value="1">正常</option>
					<option :value="2">已弃用</option>
					<option :value="3">预览版</option>
				</select>
				<button class="btn btn-primary" @click="openBasetoolForm()">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					新增工具
				</button>
			</div>
		</div>
		<div class="toolbar">
			<div style="display: flex; align-items: center; gap: 10px;">
			</div>
		</div>
      <div class="table-wrap" v-if="basetools.length > 0 || isLoading">
        <table v-if="!isLoading">
          <thead>
            <tr>
              <th>工具标识</th>
              <th>展示名</th>
              <th style="width: 260px;">说明</th>
              <th>支持平台</th>
              <th style="width: 140px; text-align: center; white-space: nowrap;">instance_level</th>
              <th style="text-align: center; white-space: nowrap;">子Agent可用</th>
              <th style="text-align: center; white-space: nowrap;">默认启用</th>
              <th style="text-align: center; white-space: nowrap;">可见</th>
              <th style="width: 80px; text-align: center; white-space: nowrap;">状态</th>
              <th style="text-align: center; white-space: nowrap; display: none;">被引用</th>
              <th style="width: 60px; text-align: center; white-space: nowrap;">排序</th>
              <th style="white-space: nowrap;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in basetools" :key="t.id">
              <td>{{ t.name }}</td>
              <td>{{ t.displayName }}</td>
              <td class="text-muted" style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="t.description">{{ t.description || '-' }}</td>
              <td :title="formatModelGroups(t.modelGroups)">
                {{ formatModelGroupsTruncated(t.modelGroups) }}
              </td>
              <td style="text-align: center; white-space: nowrap;">
                <span :class="['tag', instanceLevelTagClass(t.instanceLevel)]">{{ instanceLevelLabel(t.instanceLevel) }}</span>
              </td>
              <td style="text-align: center;">
                <Switch :modelValue="!!(t.allowSubAgentUse)" disabled />
              </td>
              <td style="text-align: center;">
                <Switch :modelValue="!!(t.defaultEnabled)" disabled />
              </td>
              <td style="text-align: center;">
                <Switch :modelValue="!!t.visible" disabled />
              </td>
              <td style="text-align: center;">
                <span :class="['tag', statusTagClass(t.status)]">{{ statusLabel(t.status) }}</span>
              </td>
              <td class="text-muted" style="text-align: center; display: none;">{{ t.referencedBy?.length || "-" }}</td>
              <td style="text-align: center;">{{ t.sortOrder }}</td>
              <td class="actions">
                <div class="actions-container">
                  <button
                    class="btn btn-ghost btn-sm"
                    @click="openBasetoolForm(t)"
                  >
                    编辑
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="confirmDelete(t)"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <table v-else>
          <thead>
            <tr>
              <th>工具标识</th>
              <th>展示名</th>
              <th style="width: 260px;">说明</th>
              <th>支持平台</th>
              <th style="width: 140px; text-align: center; white-space: nowrap;">instance_level</th>
              <th style="text-align: center; white-space: nowrap;">子Agent可用</th>
              <th style="text-align: center; white-space: nowrap;">默认启用</th>
              <th style="text-align: center; white-space: nowrap;">可见</th>
              <th style="width: 80px; text-align: center; white-space: nowrap;">状态</th>
              <th style="text-align: center; white-space: nowrap; display: none;">被引用</th>
              <th style="width: 60px; text-align: center; white-space: nowrap;">排序</th>
              <th style="white-space: nowrap;">操作</th>
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
          v-if="!isLoading && basetools.length > 0"
          :total="totalCount"
          :pageSize="pageSize"
          v-model="currentPage"
        />
      </div>
      <div v-else class="empty-state">
          <div v-if="statusFilter === '' && platformFilter === ''">
            <div class="empty-icon">🛠️</div>
            <p>暂无基础工具，点击右上角「+ 新增工具」添加第一个工具</p>
          </div>
          <div v-else>
            <p>暂无符合条件的基础工具</p>
          </div>
      </div>
    </div>

    <!-- 基础工具弹窗 -->
    <div
      v-if="showBasetoolModal"
      class="modal-mask"
      @click.self="showBasetoolModal = false"
    >
      <div class="modal" style="width: 720px; max-height: 90vh">
        <div class="modal-header">
          {{ basetoolForm.id ? "编辑基础工具" : "新增基础工具" }}
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-field" v-if="!basetoolForm.id">
              <label>工具标识 *</label
              ><input v-model="basetoolForm.name" placeholder="如 SPread" />
              <div class="hint">仅支持英文、数字、符号，创建后不可修改</div>
            </div>
            <div class="form-field" v-if="basetoolForm.id">
              <label>工具标识</label
              ><input :value="basetoolForm.name" disabled style="background: #f3f4f6" />
            </div>
            <div class="form-field">
              <label>展示名 *</label
              ><input v-model="basetoolForm.displayName" placeholder="如 读取文件内容" />
            </div>
          </div>
          <div class="form-field">
            <label>说明 *</label
            ><input v-model="basetoolForm.description" placeholder="读取文件的文本或多媒体内容..." />
          </div>
          <div class="form-field">
            <label>详情描述</label
            ><textarea
              v-model="basetoolForm.detail"
              style="min-height: 60px"
            ></textarea>
          </div>
          <div class="form-field">
            <label>handlerPath *</label
            ><input
              v-model="basetoolForm.handlerPath"
              placeholder="tools.sp.read"
            />
          </div>
          <div class="form-field">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="margin-bottom: 0;">支持平台 *</label>
            </div>
            <div class="checkbox-group">
              <label v-for="g in groups" :key="g.id"
                ><input
                  type="checkbox"
                  :value="g.id"
                  v-model="basetoolForm.mgChecked"
                />
                {{ resolveModelGroupName(g.id, groups, platformNameCache) || g.displayName || g.name || '-' }}</label
              >
            </div>
            <div class="hint">前台按 App 绑定平台过滤工具列表。自动模式下，取上方字段配置的支持平台交集。</div>
          </div>
          <div class="form-field instance-level-field">
            <label>instance_level *</label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model.number="csInstanceLevel" :value="0" />
                0
              </label>
              <label>
                <input type="radio" v-model.number="csInstanceLevel" :value="1" />
                1
              </label>
              <label>
                <input type="radio" v-model.number="csInstanceLevel" :value="2" />
                2
              </label>
              <label>
                <input type="radio" v-model.number="csInstanceLevel" :value="3" />
                3
              </label>
            </div>
            <div class="hint">0=平台实例 1=App缓存 2=用户缓存 3=用完即弃</div>
          </div>
          <div class="form-row" style="align-items: center;">
            <div class="form-field" style="max-width: 80px;">
              <label>排序 *</label
              ><input v-model.number="basetoolForm.sortOrder" type="number" style="padding: 6px 10px;" />
            </div>
            <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; max-width: 80px; gap: 8px;">
              <label style="margin-bottom: 0;">默认启用</label
              ><Switch :modelValue="!!basetoolForm.defaultEnabled" @update:modelValue="val => basetoolForm.defaultEnabled = val ? 1 : 0" />
            </div>
            <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; max-width: 100px; gap: 8px;">
              <label style="margin-bottom: 0;">子Agent可用</label
              ><Switch :modelValue="!!basetoolForm.allowSubAgentUse" @update:modelValue="val => basetoolForm.allowSubAgentUse = val ? 1 : 0" />
            </div>
            <div class="form-field" style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; max-width: 80px; gap: 8px;">
              <label style="margin-bottom: 0;">是否可见</label
              ><Switch :modelValue="!!basetoolForm.visible" @update:modelValue="val => basetoolForm.visible = val ? 1 : 0" />
            </div>
            <div class="form-field" style="flex: 1;">
              <label>状态 *</label>
              <select v-model.number="basetoolForm.status">
                <option :value="1">正常</option>
                <option :value="2">已弃用</option>
                <option :value="3">预览版</option>
              </select>
            </div>
          </div>

          <!-- configSchema 可视化编辑器 -->
          <ConfigSchemaEditor
            v-model:fields="csFields"
            :groups="groups"
            :parent-mg-checked="basetoolForm.mgChecked"
            header-title="字段配置"
            @toast="onToast"
          />
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showBasetoolModal = false">
            取消
          </button>
          <button class="btn btn-primary" @click="saveBasetoolData">
            确认保存
          </button>
        </div>
      </div>
  </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-mask" @click.self="showDeleteModal = false">
      <div class="modal" style="width: 500px; max-height: 80vh">
        <div class="modal-header">删除工具「{{ deleteTargetName }}」</div>
        <div class="modal-body">
          <template v-if="deleteAppCount > 0">
            <p style="margin: 0 0 8px; color: var(--color-text);">当前有 {{ deleteAppCount }} 个 App 正在使用该工具，</p>
            <p style="margin: 0 0 16px; color: var(--color-text);">删除后这些 App 的相关功能将受到影响。</p>
          </template>

          <template v-if="referencingTools && referencingTools.length > 0">
            <div style="margin-bottom: 16px;">
              <p style="margin: 0 0 8px; color: var(--color-text); font-weight: 500;">以下工具正在引用该工具：</p>
              <div class="table-wrap" style="box-shadow: none; border: 1px solid var(--color-border); max-height: 200px; overflow-y: auto;">
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

          <p style="margin: 0 0 16px; color: var(--color-error)">⚠️ 此操作不可恢复，请输入确认密码以执行删除。</p>

          <div class="form-field">
            <label>确认密码 *</label>
            <input v-model="deletePassword" type="password" placeholder="请输入确认密码" @keyup.enter="executeDelete" />
          </div>

          <p v-if="deleteError" style="color: var(--color-error); font-size: 12px; margin: 0">{{ deleteError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showDeleteModal = false">取消</button>
          <button class="btn btn-sm btn-danger" @click="executeDelete" :disabled="isDeleting">
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import ConfigSchemaEditor from './components/ConfigSchemaEditor.vue';
import Switch from '@/components/common/Switch.vue';
import Pagination from '@/components/common/Pagination.vue';
import { getModelGroups, getModelGroupById, getBaseTools, saveBaseTool, deleteBaseTool, getBaseToolReferencingTools } from '@/api/admin';
import {
  parseModelGroupIds,
  syncModelGroupNameCache,
  fetchMissingModelGroupNames,
  formatModelGroupsDisplay,
  formatModelGroupsDisplayTruncated,
  resolveModelGroupName,
} from '@/utils/modelGroupDisplay';

const emit = defineEmits(["toast", "update:basetools"]);

const groups = ref([]);
const basetools = ref([]);
const isLoading = ref(true);

const platformFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = 20;
const totalCount = ref(0);

const platformNameCache = ref({});

async function loadPlatformNamesForTools(tools) {
  syncModelGroupNameCache(groups.value, platformNameCache.value);
  const uniqueIds = new Set();
  tools.forEach((t) => {
    parseModelGroupIds(t.modelGroups)?.forEach((id) => uniqueIds.add(id));
  });
  await fetchMissingModelGroupNames(Array.from(uniqueIds), platformNameCache.value, getModelGroupById);
}

// 当筛选条件改变时重置为第一页并重新加载
watch([platformFilter, statusFilter], () => {
  currentPage.value = 1;
  loadData();
});

// 当页码改变时重新加载数据
watch(currentPage, () => {
  loadData();
});

const showBasetoolModal = ref(false);
const basetoolForm = reactive({});
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

function instanceLevelLabel(level) {
  const map = {
    0: '0 平台实例',
    1: '1 App缓存',
    2: '2 用户缓存',
    3: '3 用完即弃',
  };
  return map[level] ?? level ?? '-';
}

function instanceLevelTagClass(level) {
  return {
    0: 'tag-level-0',
    1: 'tag-level-1',
    2: 'tag-level-2',
    3: 'tag-level-3',
  }[level] || 'tag-gray';
}

function formatModelGroups(mg) {
  return formatModelGroupsDisplay(mg, groups.value, platformNameCache.value, '全部平台');
}

function formatModelGroupsTruncated(mg) {
  return formatModelGroupsDisplayTruncated(mg, groups.value, platformNameCache.value, '全部平台');
}

function openBasetoolForm(t = null) {
  if (t) {
    Object.assign(basetoolForm, JSON.parse(JSON.stringify(t)));

    // Ensure mgChecked is properly parsed into an array so checkboxes work independently
    let mg = t.modelGroups || [];
    if (typeof mg === 'string') {
      try {
        mg = JSON.parse(mg);
      } catch {
        mg = mg.split(',').map(s => s.trim());
      }
    }
    basetoolForm.mgChecked = Array.isArray(mg) ? mg : [];

    let parsedSchema = t.configSchema;
    if (typeof parsedSchema === 'string' && parsedSchema) {
      try {
        parsedSchema = JSON.parse(parsedSchema);
      } catch (e) {
        parsedSchema = {};
      }
    }

    csFields.value = parsedSchema?.fields || [];
    csInstanceLevel.value = t.instanceLevel ?? parsedSchema?.instanceLevel ?? 3;
  } else {
    Object.keys(basetoolForm).forEach(k => delete basetoolForm[k]);
    basetoolForm.status = 1;
    basetoolForm.visible = 1;
    basetoolForm.defaultEnabled = 1;
    basetoolForm.allowSubAgentUse = 1;
    basetoolForm.mgChecked = groups.value.map(g => g.id); // 默认全选所有平台
    basetoolForm.sortOrder = 0;
    csFields.value = [];
    csInstanceLevel.value = 3;
  }
  showBasetoolModal.value = true;
}

// Config Schema Editor state
const csFields = ref([]);
const csInstanceLevel = ref(3);

function onToast(payload) {
  emit("toast", payload);
}

async function loadData() {
  isLoading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize
    };
    if (statusFilter.value !== '') params.status = statusFilter.value;
    if (platformFilter.value !== '') params.modelGroups = platformFilter.value; // Adjust to match exact backend field for filtering by model group

    const [modelsRes, basetoolsRes] = await Promise.all([
      getModelGroups(),
      getBaseTools(params)
    ]);

    if (modelsRes.code === 0 || modelsRes.success) {
      groups.value = modelsRes.result?.records || modelsRes.result || modelsRes.data?.records || modelsRes.data || [];
      syncModelGroupNameCache(groups.value, platformNameCache.value);
    }

    if (basetoolsRes.code === 0 || basetoolsRes.success) {
      basetools.value = basetoolsRes.result?.records || basetoolsRes.result || basetoolsRes.data?.records || basetoolsRes.data || [];
      totalCount.value = basetoolsRes.result?.total || basetoolsRes.data?.total || basetools.value.length;
      emit("update:basetools", basetools.value);
      loadPlatformNamesForTools(basetools.value);
    }
  } catch (e) {
    emit("toast", { msg: '加载数据失败', type: 'error' });
  } finally {
    isLoading.value = false;
  }
}

async function saveBasetoolData() {
  if (!basetoolForm.id && !basetoolForm.name) {
    emit("toast", { msg: "必填项 工具标识 * 没填", type: "error" });
    return;
  }
  if (!basetoolForm.displayName) {
    emit("toast", { msg: "必填项 展示名 * 没填", type: "error" });
    return;
  }
  if (!basetoolForm.description) {
    emit("toast", { msg: "必填项 说明 * 没填", type: "error" });
    return;
  }
  if (!basetoolForm.handlerPath) {
    emit("toast", { msg: "必填项 handlerPath * 没填", type: "error" });
    return;
  }
  if (!basetoolForm.mgChecked || basetoolForm.mgChecked.length === 0) {
    emit("toast", { msg: "必填项 支持平台 * 没填", type: "error" });
    return;
  }

  try {
    const payload = { ...basetoolForm };
    payload.modelGroups = basetoolForm.mgChecked && basetoolForm.mgChecked.length > 0 ? JSON.stringify(basetoolForm.mgChecked) : null;

    // configSchema 始终传 JSON 字符串；fields 为空时用 [] 表示清空，避免 null 被后端当作未传参而不更新
    payload.configSchema = JSON.stringify({
      instanceLevel: csInstanceLevel.value,
      fields: csFields.value,
    });

    delete payload.mgChecked;

    // Set fallback defaults if empty to match integer(int32) backend requirements
    payload.instanceLevel = csInstanceLevel.value || 0;

    const r = await saveBaseTool(payload);
    if (r.code === 0 || r.success) {
      showBasetoolModal.value = false;
      emit("toast", { msg: '保存成功' });
      loadData();
    } else {
      emit("toast", { msg: r.message || r.msg || '保存失败', type: 'error' });
    }
  } catch (e) {
    emit("toast", { msg: '保存失败', type: 'error' });
  }
}

async function confirmDelete(t) {
  deleteTargetId.value = t.id;
  deleteTargetName.value = t.displayName;
  deleteAppCount.value = t.referencedBy?.length || 0;
  deletePassword.value = '';
  deleteError.value = '';
  referencingTools.value = [];

  try {
    const res = await getBaseToolReferencingTools(t.id);
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
    const r = await deleteBaseTool({ id: deleteTargetId.value, password: deletePassword.value });
    if (r.code === 0 || r.success) {
      showDeleteModal.value = false;
      emit("toast", { msg: '已删除' });
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

  

  

  /* Tags */
  .tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: var(--radius-full, 9999px);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.5;
    white-space: nowrap;
  }
  .tag-green {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success);
  }
  .tag-gray {
    background: #f3f4f6;
    color: var(--color-text-muted);
  }
  .tag-yellow {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
  }
  .tag-red {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
  }
  .tag-blue {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }

  .text-muted {
    color: var(--color-text-muted);
  }

  .hint {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 6px;
  }

  .checkbox-group {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 16px;
    overflow-x: auto;
  }

  .checkbox-group label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    text-transform: none;
    letter-spacing: normal;
  }

  .checkbox-group input[type="checkbox"] {
    width: auto;
    margin: 0;
    flex-shrink: 0;
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
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

  /* Toast */
  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 13px;
    color: #fff;
    z-index: 200;
    animation: fadeIn 0.2s;
  }
  .toast-success {
    background: var(--color-success);
  }
  .toast-error {
    background: var(--color-error);
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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