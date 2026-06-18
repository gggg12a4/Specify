<template>
  <div class="model-management admin-page">
    <!-- Toast -->
    <div v-if="toast.show" :class="['toast', 'toast-' + toast.type]">
      {{ toast.msg }}
    </div>

    <div class="main-content">
      <div class="section">
        <div class="page-header">
          <div class="header-title">
            <h2>模型列表</h2>
            <span class="count-badge">共 {{ totalCount }} 个模型</span>
          </div>
          <div class="header-actions" style="display: flex; align-items: center; gap: 12px;">
            <select
              v-model="platformFilter"
              class="filter-select"
              style="min-width: 140px;"
            >
              <option value="">平台: 全部</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">
                {{ g.displayName }}
              </option>
            </select>

            <select
              v-model="typeFilter"
              class="filter-select"
              style="min-width: 140px;"
            >
              <option value="">类型: 全部</option>
              <option value="chat">对话模型</option>
              <option value="sub">专属模型</option>
            </select>

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

            <button class="btn btn-ghost btn-sm" @click="resetFilters">重置</button>

            <button class="btn btn-primary" @click="openModelForm()">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              新增模型
            </button>
          </div>
        </div>

        <div class="table-wrap" v-if="models.length > 0 || isLoading">
          <table v-if="!isLoading">
            <thead>
              <tr>
                <th>模型名</th>
                <th>展示名</th>
                <th>所属平台</th>
                <th>模型类型</th>
                <th>说明</th>
                <th>输入价</th>
                <th>输出价</th>
                <th>可见</th>
                <th>状态</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in models" :key="m.id">
                <td>{{ m.name || '-' }}</td>
                <td>{{ m.displayName || '-' }}</td>
                <td>
                  <span v-if="isPlatformMissing(m.modelGroupId)" class="platform-missing" :title="m.modelGroupId">
                    平台不存在
                  </span>
                  <span v-else>{{ getPlatformName(m.modelGroupId) }}</span>
                </td>
                <td>
                  <span :class="['tag', m.type === 'chat' ? 'tag-blue' : 'tag-gray']">
                    {{ m.type === 'chat' ? '对话模型' : '专属模型' }}
                  </span>
                </td>
                <td class="text-muted" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="m.description">
                  {{ m.description || '-' }}
                </td>
                <td>{{ m.inputPrice || 0 }}</td>
                <td>{{ m.outputPrice || 0 }}</td>
                <td>
                  <Switch :modelValue="!!m.visible" disabled />
                </td>
                <td>
                  <span :class="['tag', statusTagClass(m.status)]">
                    {{ statusLabel(m.status) }}
                  </span>
                </td>
                <td>{{ m.sortOrder || 0 }}</td>
                <td class="actions">
                  <button class="btn btn-ghost btn-sm" @click="openModelForm(m)">
                    编辑
                  </button>
                  <button class="btn btn-sm btn-danger" @click="confirmDelete(m)">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <table v-else>
            <thead>
              <tr>
                <th>模型名</th>
                <th>展示名</th>
                <th>所属平台</th>
                <th>模型类型</th>
                <th>说明</th>
                <th>输入价</th>
                <th>输出价</th>
                <th>可见</th>
                <th>状态</th>
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
            v-if="!isLoading && models.length > 0"
            :total="totalCount"
            :pageSize="pageSize"
            v-model="currentPage"
          />
        </div>
        <div v-else class="empty-state">
          <div v-if="platformFilter === '' && statusFilter === ''">
            <div class="empty-icon">🤖</div>
            <p>暂无模型数据，点击右上角「+ 新增模型」添加第一个模型</p>
          </div>
          <div v-else>
            <p>暂无符合条件的模型</p>
          </div>
        </div>

        <div class="hint" style="margin-top: 8px" v-if="models.length > 0">价格单位：元/百万 token</div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-mask" @click.self="showDeleteModal = false">
      <div class="modal" style="width: 400px">
        <div class="modal-header">删除模型「{{ deleteTarget.displayName }}」</div>
        <div class="modal-body">
          <p
            v-if="deleteTarget.platformMissing"
            style="margin: 0 0 12px; color: var(--color-text-secondary); font-size: 13px"
          >
            该模型关联的平台已不存在，删除后可清理无效数据。
          </p>
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

    <!-- 模型弹窗 -->
    <div v-if="showModelModal" class="modal-mask" @click.self="!isSaving && (showModelModal = false)">
      <div class="modal">
        <div class="modal-header">
          {{ modelForm.id ? "编辑模型" : "新增模型" }}
        </div>
        <div class="modal-body">
          <div class="form-field" v-if="!modelForm.id">
            <label>所属平台 *</label>
            <select v-model="modelForm.modelGroupId" :disabled="isSaving">
              <option v-for="g in groups" :key="g.id" :value="g.id">
                {{ g.displayName }}
              </option>
            </select>
          </div>
          <div class="form-field" v-else>
            <label>所属平台</label>
            <input :value="getPlatformName(modelForm.modelGroupId)" disabled style="background: #f3f4f6" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>展示名 *</label>
              <input v-model="modelForm.displayName" placeholder="如 Claude Opus 4" :disabled="isSaving" />
            </div>
            <div class="form-field" v-if="!modelForm.id">
              <label>模型标识 *</label>
              <input v-model="modelForm.name" placeholder="如 claude-opus-4" :disabled="isSaving" />
            </div>
            <div class="form-field" v-else>
              <label>模型标识</label>
              <input :value="modelForm.name" disabled style="background: #f3f4f6" />
            </div>
          </div>
          <div class="form-field">
            <label>模型类型 *</label>
            <div class="radio-group" style="display: flex; gap: 16px; white-space: nowrap;">
              <label style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;"><input type="radio" v-model="modelForm.type" value="chat" :disabled="isSaving" /> 对话模型</label>
              <label style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;"><input type="radio" v-model="modelForm.type" value="sub" :disabled="isSaving" /> 专属模型</label>
            </div>
          </div>
          <div class="form-field">
            <label>说明</label>
            <input v-model="modelForm.description" placeholder="最强推理能力，适合复杂分析任务..." :disabled="isSaving" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>输入价 *</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input v-model.number="modelForm.inputPrice" type="number" step="0.01" min="0" :disabled="isSaving" style="flex: 1;" />
                <span class="text-muted" style="font-size: 13px;">元/百万token</span>
              </div>
            </div>
            <div class="form-field">
              <label>输出价 *</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input v-model.number="modelForm.outputPrice" type="number" step="0.01" min="0" :disabled="isSaving" style="flex: 1;" />
                <span class="text-muted" style="font-size: 13px;">元/百万token</span>
              </div>
            </div>
          </div>
          <div class="form-row" style="margin-top: 6px;">
            <div class="form-field">
              <label>排序 *</label>
              <input v-model.number="modelForm.sortOrder" type="number" :disabled="isSaving" />
            </div>
            <div class="form-field">
              <label>是否可见</label>
              <Switch v-model="modelForm.visible" :disabled="isSaving" />
            </div>
            <div class="form-field">
              <label>状态 *</label>
              <select v-model.number="modelForm.status" :disabled="isSaving">
                <option :value="1">正常</option>
                <option :value="2">即将过期</option>
                <option :value="3">失效</option>
              </select>
            </div>
          </div>

          <p v-if="saveError" style="color: var(--color-error); font-size: 13px; margin-top: 10px;">{{ saveError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModelModal = false" :disabled="isSaving">取消</button>
          <button class="btn btn-primary" @click="saveModelData" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '确认保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getModels, getModelDetail, getModelGroups, saveModel, deleteModel } from '@/api/admin';
import Switch from '@/components/common/Switch.vue';
import Pagination from '@/components/common/Pagination.vue';

const route = useRoute();
const router = useRouter();
const emit = defineEmits(["toast"]);

const toast = reactive({ show: false, msg: '', type: 'success' });
const isLoading = ref(true);

const groups = ref([]);
const models = ref([]);

// 获取平台的展示名称
function getPlatformName(groupId) {
  if (!groupId) return '-';
  const group = groups.value.find((g) => g.id === groupId);
  return group ? group.displayName || group.name : '-';
}

function isPlatformMissing(groupId) {
  if (!groupId) return true;
  return !groups.value.some((g) => g.id === groupId);
}

async function getPlatformModelCount(modelGroupId) {
  const res = await getModels({
    modelGroupId,
    pageNo: 1,
    pageSize: 1,
  });
  if (res.code !== 0) {
    throw new Error(res.message || res.msg || '查询失败');
  }
  return res.data?.total ?? 0;
}

// Filters
const platformFilter = ref(route.query.platformId || '');
const typeFilter = ref('');
const statusFilter = ref('');

const currentPage = ref(1);
const pageSize = 20;
const totalCount = ref(0);

function resetFilters() {
  platformFilter.value = '';
  typeFilter.value = '';
  statusFilter.value = '';
  currentPage.value = 1;
}

watch([platformFilter, typeFilter, statusFilter], () => {
  currentPage.value = 1;
  loadData();
});

watch(currentPage, () => {
  loadData();
});

const showModelModal = ref(false);
const showDeleteModal = ref(false);
const isSaving = ref(false);
const saveError = ref('');
const deletePassword = ref('');
const deleteError = ref('');
const isDeleting = ref(false);
const deleteTarget = reactive({ id: null, displayName: '', platformMissing: false });

const modelForm = reactive({});

function statusLabel(s) {
  return { 1: '正常', 2: '即将过期', 3: '失效' }[s] || '未知';
}

function statusTagClass(s) {
  return { 1: 'tag-green', 2: 'tag-yellow', 3: 'tag-red' }[s] || 'tag-gray';
}

function showToast(msg, type = 'success') {
  toast.show = true;
  toast.msg = msg;
  toast.type = type;
  setTimeout(() => (toast.show = false), 2500);
}

async function loadData() {
  isLoading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize
    };
    if (platformFilter.value !== '') params.modelGroupId = platformFilter.value;
    if (typeFilter.value !== '') params.type = typeFilter.value;
    if (statusFilter.value !== '') params.status = statusFilter.value;

    const [groupsRes, modelsRes] = await Promise.all([
      getModelGroups(), // Usually don't paginate model groups since we need all for filtering
      getModels(params)
    ]);

    if (groupsRes.code === 0 && modelsRes.code === 0) {
      groups.value = groupsRes.data?.records || groupsRes.data || [];
      models.value = modelsRes.data?.records || modelsRes.data?.models || modelsRes.data || [];
      totalCount.value = modelsRes.data?.total || modelsRes.data?.totalModels || models.value.length;
    }
  } catch (e) {
    showToast('加载模型数据失败', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function toggleVisibility(model, newValue) {
  try {
    const updatedModel = { ...model, visible: newValue };
    const r = await saveModel(updatedModel);
    if (r.code === 0) {
      // visible is already updated via v-model
      showToast('状态已更新');
    } else {
      model.visible = !newValue; // Revert on failure
      showToast(r.msg || '切换失败', 'error');
    }
  } catch (e) {
    model.visible = !newValue; // Revert on failure
    showToast('切换失败', 'error');
  }
}

async function openModelForm(m) {
  saveError.value = '';

  if (m) {
    try {
      const res = await getModelDetail(m.id);
      if (res.code === 0 && res.result) {
        Object.assign(modelForm, res.result);
      } else {
        Object.assign(modelForm, m); // Fallback to list data if fetch fails
      }
    } catch (error) {
      console.error('Failed to fetch model details', error);
      Object.assign(modelForm, m);
    }
  } else {
    Object.assign(modelForm, {
      id: null,
      modelGroupId: platformFilter.value || (groups.value[0]?.id),
      name: '',
      displayName: '',
      type: 'chat',
      description: '',
      inputPrice: 0,
      outputPrice: 0,
      visible: true,
      status: 1,
      sortOrder: models.value.length > 0 ? Math.max(...models.value.map(x => x.sortOrder || 0)) + 1 : 1
    });
  }
  showModelModal.value = true;
}

async function saveModelData() {
  // Validate required fields
  if (!modelForm.id && !modelForm.name) {
    saveError.value = '必填项 模型标识 * 没填';
    showToast('必填项 模型标识 * 没填', 'error');
    return;
  }
  if (!modelForm.modelGroupId) {
    saveError.value = '必填项 所属平台 * 没填';
    showToast('必填项 所属平台 * 没填', 'error');
    return;
  }
  if (!modelForm.displayName) {
    saveError.value = '必填项 展示名 * 没填';
    showToast('必填项 展示名 * 没填', 'error');
    return;
  }
  if (modelForm.inputPrice === '' || modelForm.inputPrice === null) {
    saveError.value = '必填项 输入价 * 没填或格式错误';
    showToast('必填项 输入价 * 没填或格式错误', 'error');
    return;
  }
  if (modelForm.outputPrice === '' || modelForm.outputPrice === null) {
    saveError.value = '必填项 输出价 * 没填或格式错误';
    showToast('必填项 输出价 * 没填或格式错误', 'error');
    return;
  }

  isSaving.value = true;
  saveError.value = '';

  try {
    const r = await saveModel(modelForm);
    if (r.code === 0) {
      showModelModal.value = false;
      showToast('保存成功');
      loadData();
    } else {
      saveError.value = r.msg || '保存失败';
    }
  } catch (e) {
    saveError.value = '保存失败，网络或服务器错误';
  } finally {
    isSaving.value = false;
  }
}

async function confirmDelete(m) {
  const platformMissing = isPlatformMissing(m.modelGroupId);

  if (!platformMissing) {
    try {
      const count = await getPlatformModelCount(m.modelGroupId);
      if (count <= 1) {
        showToast('该平台下必须至少保留一个模型，不允许删除', 'error');
        return;
      }
    } catch {
      showToast('无法校验平台模型数量，请稍后重试', 'error');
      return;
    }
  }

  deleteTarget.id = m.id;
  deleteTarget.displayName = m.displayName;
  deleteTarget.platformMissing = platformMissing;
  deletePassword.value = '';
  deleteError.value = '';
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
    const r = await deleteModel({ id: deleteTarget.id, password: deletePassword.value });
    if (r.code === 0) {
      showDeleteModal.value = false;
      showToast('已删除');
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

  .toggle-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: var(--color-border);
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  .toggle-btn.active {
    color: var(--color-success);
  }
  .toggle-btn:hover {
    opacity: 0.8;
  }

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

  .platform-missing {
    color: var(--color-error, #ef4444);
    font-size: 12px;
    font-weight: 500;
    cursor: help;
  }
</style>