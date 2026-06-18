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
            <h2>平台管理</h2>
            <span class="count-badge">共 {{ totalCount }} 个</span>
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
            <button class="btn btn-primary" @click="openGroupForm()">
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
              新增平台
            </button>
          </div>
        </div>

        <div class="table-wrap" v-if="groups.length > 0 || isLoading">
          <table v-if="!isLoading">
            <thead>
              <tr>
                <th>标识名</th>
                <th>展示名</th>
                <th>说明</th>
                <th>API 地址</th>
                <th style="text-align: center;">可见</th>
                <th>状态</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in groups" :key="g.id">
                <td>{{ g.name }}</td>
                <td>
                  <router-link :to="{ name: 'AdminModels', query: { platformId: g.id } }" class="display-name-link">
                    {{ g.displayName }}
                  </router-link>
                </td>
                <td class="text-muted" style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="g.description">
                  {{ g.description || '-' }}
                </td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                  {{ g.apiBase }}
                </td>
                <td style="text-align: center;">
                  <Switch :modelValue="g.visible" disabled />
                </td>
                <td>
                  <span :class="['tag', statusTagClass(g.status)]">
                    {{ statusLabel(g.status) }}
                  </span>
                </td>
                <td>{{ g.sortOrder }}</td>
              <td class="actions">
                  <button class="btn btn-ghost btn-sm" @click="openGroupForm(g)">
                    编辑
                  </button>
                  <button class="btn btn-sm btn-danger" @click="confirmDelete(g)">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <table v-else>
            <thead>
              <tr>
                <th>标识名</th>
                <th>展示名</th>
                <th>说明</th>
                <th>API 地址</th>
                <th style="text-align: center;">可见</th>
                <th>状态</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="8" style="text-align: center; padding: 60px 0;">
                  <div class="loading-spinner"></div>
                </td>
              </tr>
            </tbody>
          </table>
          <Pagination
            v-if="!isLoading && groups.length > 0"
            :total="totalCount"
            :pageSize="pageSize"
            v-model="currentPage"
          />
        </div>
        <div v-else class="empty-state">
          <div v-if="statusFilter === ''">
            <div class="empty-icon">📁</div>
            <p>暂无平台数据，点击右上角「+ 新增平台」添加第一个平台</p>
          </div>
          <div v-else>
            <p>暂无符合条件的平台</p>
          </div>
        </div>

      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-mask" @click.self="showDeleteModal = false">
      <div class="modal" style="width: 400px; max-height: 50vh">
        <div class="modal-header">删除平台「{{ deleteTarget.displayName }}」</div>
        <div class="modal-body">
          <p style="margin: 0 0 8px; color: var(--color-text);">此操作将同时删除该平台下的 {{ modelsCountForDelete }} 个模型。</p>
          <p v-if="deleteAppCount > 0" style="margin: 0 0 16px; color: var(--color-text);">当前有 {{ deleteAppCount }} 个 App 正在使用该平台的模型，删除后这些 App 将无法正常运行。</p>
          <p style="margin: 0 0 16px; color: var(--color-error); font-weight: 500;">此操作不可恢复，请确认。</p>

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

    <!-- 平台弹窗 -->
    <div v-if="showGroupModal" class="modal-mask" @click.self="!isSaving && (showGroupModal = false)">
      <div class="modal">
        <div class="modal-header">
          {{ groupForm.id ? "编辑平台" : "新增平台" }}
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-field" v-if="!groupForm.id">
              <label>标识名 *</label>
              <input v-model="groupForm.name" placeholder="如 claude" :disabled="isSaving" />
              <div class="hint">系统内部使用，创建后不可修改</div>
            </div>
            <div class="form-field" v-else>
              <label>标识名</label>
              <input :value="groupForm.name" disabled style="background: #f3f4f6" />
            </div>
            <div class="form-field">
              <label>展示名 *</label>
              <input v-model="groupForm.displayName" placeholder="如 Claude" :disabled="isSaving" />
            </div>
          </div>
          <div class="form-field">
            <label>说明 *</label>
            <input v-model="groupForm.description" placeholder="强推理能力，适合代码和分析任务..." :disabled="isSaving" />
          </div>
          <div class="form-field">
            <label>API地址 *</label>
            <input v-model="groupForm.apiBase" placeholder="https://api.anthropic.com" :disabled="isSaving" />
          </div>
          <div class="form-field">
            <label>详情</label>
            <textarea v-model="groupForm.detail" placeholder="平台的详细介绍文案，展示于前台创建 App 时平台选择页的详情面板中" :disabled="isSaving"></textarea>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>排序 *</label>
              <input v-model.number="groupForm.sortOrder" type="number" :disabled="isSaving" />
            </div>
            <div class="form-field">
              <label>是否可见</label>
              <Switch v-model="groupForm.visible" :disabled="isSaving" />
            </div>
            <div class="form-field">
              <label>状态 *</label>
              <select v-model.number="groupForm.status" :disabled="isSaving">
                <option :value="1">正常</option>
                <option :value="2">即将过期</option>
                <option :value="3">失效</option>
              </select>
            </div>
          </div>
          <div class="hint hint-block">状态：1=正常，2=即将过期，3=失效</div>

          <p v-if="saveError" style="color: var(--color-error); font-size: 13px; margin-top: 10px;">{{ saveError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showGroupModal = false" :disabled="isSaving">取消</button>
          <button class="btn btn-primary" @click="saveGroup" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '确认保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { getModelGroups, saveModelGroup, deleteModelGroup, getModels } from '@/api/admin';
import Switch from '@/components/common/Switch.vue';
import Pagination from '@/components/common/Pagination.vue';

const toast = reactive({ show: false, msg: '', type: 'success' });
const isLoading = ref(true);

const groups = ref([]);
const allModels = ref([]); // Store all models to calculate impact
const statusFilter = ref('');

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

const showGroupModal = ref(false);
const showDeleteModal = ref(false);
const isSaving = ref(false);
const saveError = ref('');
const deletePassword = ref('');
const deleteError = ref('');
const isDeleting = ref(false);
const deleteTarget = reactive({ id: null, displayName: '' });
const deleteAppCount = ref(0);

const modelsCountForDelete = computed(() => {
  if (!deleteTarget.id) return 0;
  return allModels.value.filter(m => m.modelGroupId === deleteTarget.id).length;
});

const groupForm = reactive({});

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
    if (statusFilter.value !== '') params.status = statusFilter.value;

    const r = await getModelGroups(params);
    if (r.code === 0) {
      groups.value = r.data?.records || r.data || [];
      totalCount.value = r.data?.total || groups.value.length;
    }

    // 加载所有模型数据以计算级联删除的数量
    const modelsRes = await getModels({ pageNo: 1, pageSize: 9999 });
    if (modelsRes.code === 0) {
      allModels.value = modelsRes.data?.records || modelsRes.data || [];
    }
  } catch (e) {
    showToast('加载数据失败', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function toggleVisibility(group, newValue) {
  try {
    const updatedGroup = { ...group, visible: newValue };
    const r = await saveModelGroup(updatedGroup);
    if (r.code === 0) {
      // visible is already updated via v-model
      showToast('状态已更新');
    } else {
      group.visible = !newValue; // Revert on failure
      showToast(r.msg || '切换失败', 'error');
    }
  } catch (e) {
    group.visible = !newValue; // Revert on failure
    showToast('切换失败', 'error');
  }
}

function openGroupForm(g) {
  saveError.value = '';
  Object.assign(groupForm, g || {
    id: null,
    name: '',
    displayName: '',
    description: '',
    detail: '',
    apiBase: '',
    visible: true,
    status: 1,
    sortOrder: groups.value.length > 0 ? Math.max(...groups.value.map(x => x.sortOrder || 0)) + 1 : 1
  });
  showGroupModal.value = true;
}

async function saveGroup() {
  // Required fields check
  if (!groupForm.id && !groupForm.name) {
    saveError.value = '必填项 标识名 * 没填';
    showToast('必填项 标识名 * 没填', 'error');
    return;
  }
  if (!groupForm.displayName) {
    saveError.value = '必填项 展示名 * 没填';
    showToast('必填项 展示名 * 没填', 'error');
    return;
  }
  if (!groupForm.description) {
    saveError.value = '必填项 说明 * 没填';
    showToast('必填项 说明 * 没填', 'error');
    return;
  }
  if (!groupForm.apiBase) {
    saveError.value = '必填项 API地址 * 没填';
    showToast('必填项 API地址 * 没填', 'error');
    return;
  }

  isSaving.value = true;
  saveError.value = '';

  try {
    const r = await saveModelGroup(groupForm);
    if (r.code === 0) {
      showGroupModal.value = false;
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

function confirmDelete(g) {
  deleteTarget.id = g.id;
  deleteTarget.displayName = g.displayName;
  deleteAppCount.value = g.referencedBy?.length || 0;
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
    const r = await deleteModelGroup({ id: deleteTarget.id, password: deletePassword.value });
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

/* Links */
  .display-name-link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
  }
  .display-name-link:hover {
    text-decoration: underline;
  }

  /* Toggle Button */
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

  .hint {
    font-size: 11px;
    color: var(--color-text-muted, #9ca3af);
    margin-top: 4px;
    line-height: 1.4;
  }

  .hint-block {
    margin-top: -4px;
    margin-bottom: 0;
  }
</style>