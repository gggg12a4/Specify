<template>
  <div class="admin-account-management admin-page">
    <div class="page-header">
      <div class="header-title">
        <h2>管理员账号</h2>
      </div>
      <div class="header-actions">
        <div class="search-input-wrap">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input v-model="searchQuery" placeholder="搜索用户名..." />
        </div>
        <select v-model="statusFilter" class="filter-select">
          <option value="">状态: 全部</option>
          <option :value="1">正常</option>
          <option :value="2">禁用</option>
        </select>
        <button class="btn btn-primary" @click="openForm()">
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
          新增管理员
        </button>
      </div>
    </div>

    <div class="table-wrap" v-if="accounts.length > 0 || isLoading">
      <table v-if="!isLoading">
        <thead>
          <tr>
            <th class="th-username">用户名</th>
            <th class="th-name">姓名</th>
            <th class="th-role">角色</th>
            <th class="th-status">状态</th>
            <th class="th-date">创建时间</th>
            <th class="th-date">最后登录时间</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="a in accounts"
            :key="a.id"
            :class="{ 'row-disabled': a.status === 2 }"
          >
            <td class="font-medium td-username">{{ a.username }}</td>
            <td class="td-name">{{ a.name || "-" }}</td>
            <td class="td-role">
              <div class="roles-wrap">
                <span
                  v-for="r in a.roles"
                  :key="r"
                  class="tag"
                  :class="getRoleTagClass(r)"
                >
                  {{ r }}
                </span>
              </div>
            </td>
            <td class="td-status">
              <Switch :modelValue="a.status === 1" disabled />
            </td>
            <td class="text-muted td-date">{{ a.created_at }}</td>
            <td class="text-muted td-date">{{ a.last_login || "-" }}</td>
            <td class="td-actions">
              <div class="actions-container">
                <button class="btn btn-ghost btn-sm" @click="openForm(a)">
                  编辑
                </button>
                <button
                  v-if="
                    !a.roles.includes('超级管理员') &&
                    a.username !== currentUsername
                  "
                  class="btn btn-sm btn-danger"
                  @click="confirmDelete(a)"
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
            <th class="th-username">用户名</th>
            <th class="th-name">姓名</th>
            <th class="th-role">角色</th>
            <th class="th-status">状态</th>
            <th class="th-date">创建时间</th>
            <th class="th-date">最后登录时间</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="7" style="text-align: center; padding: 60px 0">
              <div class="loading-spinner"></div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="table-footer" v-if="!isLoading && accounts.length > 0">
        <span class="count-text">共 {{ totalCount }} 条记录</span>
        <Pagination
          :total="totalCount"
          :pageSize="pageSize"
          v-model="currentPage"
        />
      </div>
    </div>

    <div v-else class="empty-state">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <p v-if="searchQuery">未找到该用户名对应的账号</p>
      <p v-else>暂无管理员账号</p>
    </div>

    <div v-if="showForm" class="modal-mask" @click.self="showForm = false">
      <div class="modal" style="width: 500px; max-height: 80vh">
        <div class="modal-header">
          {{ form.id ? "编辑管理员" : "新增管理员" }}
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field">
              <label>用户名 *</label>
              <input
                v-model="form.username"
                placeholder="如 op_zhang"
                :disabled="!!form.id"
                :style="form.id ? 'background: #f3f4f6' : ''"
              />
            </div>
            <div class="form-field">
              <label>姓名</label>
              <input v-model="form.name" placeholder="如 张三" />
            </div>
          </div>

          <div class="form-field" v-if="!form.id">
            <label>密码 *</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="****************"
            />
          </div>

          <div class="form-field">
            <label>角色 *</label>
            <div class="checkbox-group">
              <label v-for="r in mockRoles" :key="r.id">
                <input
                  type="checkbox"
                  :value="r.name"
                  v-model="form.roles"
                  :disabled="
                    r.name === '超级管理员' &&
                    !isCurrentUserSuperAdmin &&
                    !form.roles.includes('超级管理员')
                  "
                />
                {{ r.name }}
              </label>
            </div>
          </div>

          <div class="form-field">
            <label>状态 *</label>
            <select
              v-model.number="form.status"
              :disabled="isStatusDisabled(form)"
              :style="isStatusDisabled(form) ? 'background: #f3f4f6' : ''"
            >
              <option :value="1">正常</option>
              <option :value="2">禁用</option>
            </select>
          </div>
        </div>
        <div
          class="modal-footer"
          :style="form.id ? 'justify-content: space-between' : ''"
        >
          <button
            v-if="form.id"
            class="btn btn-ghost"
            @click="showResetPassword = true"
          >
            重置密码
          </button>
          <div style="display: flex; gap: 8px; margin-left: auto">
            <button class="btn btn-ghost" @click="showForm = false">
              取消
            </button>
            <button class="btn btn-primary" @click="saveForm">确认保存</button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showResetPassword"
      class="modal-mask sub-dialog"
      @click.self="showResetPassword = false"
    >
      <div class="modal" style="width: 400px">
        <div class="modal-header">重置密码</div>
        <div class="modal-body">
          <div class="form-field">
            <label>新密码 *</label>
            <input v-model="newPassword" type="password" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showResetPassword = false">
            取消
          </button>
          <button class="btn btn-primary" @click="resetPassword">
            确认保存
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteModal"
      class="modal-mask sub-dialog"
      @click.self="showDeleteModal = false"
    >
      <div class="modal" style="width: 400px">
        <div class="modal-header">确认删除</div>
        <div class="modal-body">
          <p style="margin: 0; color: #ef4444; font-weight: 500">
            ⚠️ 确认要删除管理员 {{ targetAccount?.username }} 吗？此操作不可逆。
          </p>
          <p
            v-if="deleteError"
            style="
              margin: 8px 0 0;
              font-size: 13px;
              color: #d97706;
              background: #fffbeb;
              padding: 8px;
              border-radius: 4px;
            "
          >
            {{ deleteError }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showDeleteModal = false">
            取消
          </button>
          <button class="btn btn-sm btn-danger" @click="executeDelete">
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import Switch from "@/components/common/Switch.vue";
import Pagination from "@/components/common/Pagination.vue";

const emit = defineEmits(["toast"]);

const currentUsername = "admin";
const isCurrentUserSuperAdmin = true;
const isLoading = ref(false); // 默认为 false 方便查看静态 Mock

const mockAccounts = ref([
  {
    id: 1,
    username: "admin",
    name: "超管",
    roles: ["超级管理员"],
    status: 1,
    created_at: "2026-01-01 00:00",
    last_login: "2026-05-17 10:22",
    _pw: "admin888",
  },
  {
    id: 2,
    username: "op_zhang",
    name: "张三",
    roles: ["运营人员"],
    status: 1,
    created_at: "2026-02-10 09:30",
    last_login: "2026-05-16 14:05",
    _pw: "123456",
  },
  {
    id: 3,
    username: "dev_li",
    name: "李四",
    roles: ["模型管理员", "工具管理员"],
    status: 1,
    created_at: "2026-03-05 11:20",
    last_login: "2026-05-10 09:41",
    _pw: "123456",
  },
  {
    id: 4,
    username: "user_wang",
    name: "王五",
    roles: ["运营人员"],
    status: 2,
    created_at: "2026-04-01 08:15",
    last_login: "2026-04-20 16:33",
    _pw: "123456",
  },
]);

const mockRoles = ref([
  { id: 1, name: "超级管理员" },
  { id: 2, name: "运营人员" },
  { id: 3, name: "模型管理员" },
  { id: 4, name: "工具管理员" },
]);

const accounts = ref([]);
const totalCount = ref(0);

const searchQuery = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const pageSize = 20;

import {
  getAdminAccounts,
  saveAdminAccount,
  deleteAdminAccount,
  resetAdminPassword,
} from "@/api/admin";

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
  loadData();
});

watch(currentPage, () => {
  loadData();
});

// 动态获取角色标签的彩色类名
function getRoleTagClass(role) {
  switch (role) {
    case "超级管理员":
      return "tag-purple";
    case "运营人员":
      return "tag-green";
    case "模型管理员":
      return "tag-blue";
    case "工具管理员":
      return "tag-orange";
    default:
      return "tag-gray";
  }
}

const showForm = ref(false);
const form = reactive({
  id: null,
  username: "",
  name: "",
  password: "",
  roles: [],
  status: 1,
});
const showResetPassword = ref(false);
const newPassword = ref("");
const showDeleteModal = ref(false);
const targetAccount = ref(null);
const deleteError = ref("");

onMounted(() => {
  loadData();
});

async function loadData() {
  isLoading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize,
    };
    if (searchQuery.value) params.username = searchQuery.value;
    if (statusFilter.value) params.status = statusFilter.value;

    const r = await getAdminAccounts(params);
    if (r.code === 0) {
      accounts.value = r.data?.records || r.data || [];
      totalCount.value = r.data?.total || accounts.value.length;
    }
  } catch (e) {
    emit("toast", { msg: "加载数据失败", type: "error" });
  } finally {
    isLoading.value = false;
  }
}

function isStatusDisabled(acc) {
  if (!acc.id) return false;
  if (acc.roles.includes("超级管理员")) return true;
  if (acc.username === currentUsername) return true;
  return false;
}

function openForm(acc = null) {
  if (acc) {
    Object.assign(form, JSON.parse(JSON.stringify(acc)));
  } else {
    Object.assign(form, {
      id: null,
      username: "",
      name: "",
      password: "",
      roles: [],
      status: 1,
    });
  }
  showForm.value = true;
}

async function saveForm() {
  if (!form.username) {
    emit("toast", { msg: "必填项 用户名 * 没填", type: "error" });
    return;
  }
  if (!form.id && !form.password) {
    emit("toast", { msg: "必填项 密码 * 没填", type: "error" });
    return;
  }
  if (!form.roles || form.roles.length === 0) {
    emit("toast", { msg: "必填项 角色 * 没填", type: "error" });
    return;
  }

  try {
    const r = await saveAdminAccount(form);
    if (r.code === 0) {
      showForm.value = false;
      emit("toast", { msg: "保存成功" });
      loadData();
    } else {
      emit("toast", { msg: r.msg || "保存失败", type: "error" });
    }
  } catch (e) {
    emit("toast", { msg: "保存失败", type: "error" });
  }
}

async function resetPassword() {
  if (!newPassword.value) {
    emit("toast", { msg: "请输入新密码", type: "error" });
    return;
  }
  try {
    const r = await resetAdminPassword({
      id: form.id,
      password: newPassword.value,
    });
    if (r.code === 0) {
      showResetPassword.value = false;
      newPassword.value = "";
      emit("toast", { msg: "密码重置成功" });
    } else {
      emit("toast", { msg: r.msg || "重置失败", type: "error" });
    }
  } catch (e) {
    emit("toast", { msg: "重置失败", type: "error" });
  }
}

function confirmDelete(acc) {
  targetAccount.value = acc;
  deleteError.value = "";
  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!targetAccount.value) return;
  if (targetAccount.value.roles.includes("超级管理员")) {
    deleteError.value = "超级管理员账号不可删除";
    return;
  }
  try {
    const r = await deleteAdminAccount({ id: targetAccount.value.id });
    if (r.code === 0) {
      showDeleteModal.value = false;
      targetAccount.value = null;
      emit("toast", { msg: "删除成功" });
      loadData();
    } else {
      deleteError.value = r.msg || "删除失败";
    }
  } catch (e) {
    deleteError.value = "删除失败";
  }
}
</script>

<style scoped>
@import "@/assets/admin-common.css";

/* 搜索和筛选输入框样式优化 */
.search-input-wrap {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 6px;
  padding: 0 12px;
  width: 240px;
  height: 36px;
  box-sizing: border-box;
  transition: all 0.2s;
}
.search-input-wrap:focus-within {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.search-input-wrap svg {
  color: #94a3b8;
  margin-right: 8px;
  flex-shrink: 0;
}
.search-input-wrap input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  width: 100%;
  color: #334155;
}
/* 修复了原先 .filter-box select 的映射问题 */
.filter-select {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 6px;
  background: #ffffff;
  font-size: 13px;
  color: #334155;
  outline: none;
  cursor: pointer;
  min-width: 120px;
  box-sizing: border-box;
  transition: all 0.2s;
}
.filter-select:focus {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
/* 局部特定列对齐控制 */
.th-username,
.td-username {
  width: 140px;
}
.th-name,
.td-name {
  width: 120px;
}
.th-role,
.td-role {
  width: auto;
}
.th-status,
.td-status {
  text-align: left;
  width: 80px;
}
.th-date,
.td-date {
  text-align: left;
  width: 150px;
} /* 时间也左对齐，利于多行阅读一致性 */
.th-actions,
.td-actions {
  text-align: left;
  width: 200px;
}
/* 当账号被禁用时，整行数据优雅置灰 */
.row-disabled td {
  color: #94a3b8;
}
.row-disabled .tag {
  opacity: 0.6;
}
.font-medium {
  font-weight: 500;
  color: #1e293b;
}
.text-muted {
  color: #64748b;
  font-size: 13px;
}

/* 标签组与多彩色配置 */
.roles-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}
.tag-purple {
  background: #f5f3ff;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
}
.tag-green {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}
.tag-blue {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}
.tag-orange {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #ffedd5;
}
.tag-gray {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

/* 操作区域对齐强化 */
.actions-container {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
/* 底部底栏布局优化 */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
}
.count-text {
  font-size: 13px;
  color: #64748b;
}

.sub-dialog {
  z-index: 150;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.checkbox-group {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 16px;
  background: #ffffff;
  padding: 0;
  border-radius: 0;
  border: none;
}
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  white-space: nowrap;
}
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
