<template>
  <div class="role-management admin-page">
    <div class="page-header">
      <div class="header-title">
        <h2>角色管理</h2>
        <span class="count-badge">共 {{ totalCount }} 个</span>
      </div>
      <div class="header-actions">
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
          新增角色
        </button>
      </div>
    </div>

    <div class="table-wrap" v-if="roles.length > 0 || isLoading">
      <table v-if="!isLoading">
        <thead>
          <tr>
            <th class="th-name">角色名称</th>
            <th class="th-desc">描述</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in roles" :key="r.id">
            <td class="font-medium td-name">{{ r.name }}</td>
            <td class="text-muted td-desc" style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="r.desc">
              {{ r.desc || "-" }}
            </td>
            <td class="td-actions">
              <div class="actions-container">
                <button
                  class="btn btn-ghost btn-sm"
                  @click="openForm(r)"
                  :disabled="r.name === '超级管理员' && !isCurrentUserSuperAdmin"
                  :title="
                    r.name === '超级管理员' && !isCurrentUserSuperAdmin
                      ? '暂无操作权限'
                      : ''
                  "
                >
                  编辑
                </button>
                <button
                  v-if="r.name !== '超级管理员'"
                  class="btn btn-sm btn-danger"
                  @click="confirmDelete(r)"
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
            <th class="th-name">角色名称</th>
            <th class="th-desc">描述</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="3" style="text-align: center; padding: 60px 0">
              <div class="loading-spinner"></div>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination
        v-if="!isLoading && roles.length > 0"
        :total="totalCount"
        :pageSize="pageSize"
        v-model="currentPage"
      />
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
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
      <p>暂无角色</p>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal-mask" @click.self="showForm = false">
      <div class="modal" style="width: 700px">
        <div class="modal-header">
          {{ form.id ? "编辑角色" : "新增角色" }}
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field">
              <label>角色名称 *</label>
              <input
                v-model="form.name"
                placeholder="如 运营管理员"
                :disabled="
                  form.name === '超级管理员' && !isCurrentUserSuperAdmin
                "
                :style="
                  form.name === '超级管理员' && !isCurrentUserSuperAdmin
                    ? 'background: #f3f4f6'
                    : ''
                "
              />
            </div>
            <div class="form-field">
              <label>描述</label>
              <input
                v-model="form.desc"
                placeholder="负责日常运营配置..."
                :disabled="
                  form.name === '超级管理员' && !isCurrentUserSuperAdmin
                "
                :style="
                  form.name === '超级管理员' && !isCurrentUserSuperAdmin
                    ? 'background: #f3f4f6'
                    : ''
                "
              />
            </div>
          </div>

          <div class="permissions-section">
            <div class="section-title">权限配置</div>
            <table class="perms-table">
              <thead>
                <tr>
                  <th style="width: 250px">模块</th>
                  <th>查看</th>
                  <th>新增</th>
                  <th>编辑</th>
                  <th>删除</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="group in permissionConfig" :key="group.module">
                  <tr class="group-row">
                    <td colspan="5">{{ group.module }}</td>
                  </tr>
                  <tr
                    v-for="item in group.items"
                    :key="item.key"
                    class="perm-row"
                  >
                    <td class="item-name">{{ item.name }}</td>
                    <td class="checkbox-cell">
                      <input
                        type="checkbox"
                        v-model="form.perms[item.key].view"
                        @change="onViewChange(item.key)"
                        :disabled="
                          item.disable?.includes('view') ||
                          (form.name === '超级管理员' &&
                            !isCurrentUserSuperAdmin)
                        "
                      />
                    </td>
                    <td class="checkbox-cell">
                      <input
                        v-if="!item.hide?.includes('add')"
                        type="checkbox"
                        v-model="form.perms[item.key].add"
                        @change="onActionChange(item.key)"
                        :disabled="
                          form.name === '超级管理员' && !isCurrentUserSuperAdmin
                        "
                      />
                      <span v-else class="dash">—</span>
                    </td>
                    <td class="checkbox-cell">
                      <input
                        v-if="!item.hide?.includes('edit')"
                        type="checkbox"
                        v-model="form.perms[item.key].edit"
                        @change="onActionChange(item.key)"
                        :disabled="
                          form.name === '超级管理员' && !isCurrentUserSuperAdmin
                        "
                      />
                      <span v-else class="dash">—</span>
                    </td>
                    <td class="checkbox-cell">
                      <input
                        v-if="!item.hide?.includes('delete')"
                        type="checkbox"
                        v-model="form.perms[item.key].delete"
                        @change="onActionChange(item.key)"
                        :disabled="
                          form.name === '超级管理员' && !isCurrentUserSuperAdmin
                        "
                      />
                      <span v-else class="dash">—</span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showForm = false">取消</button>
          <button class="btn btn-primary" @click="saveForm">确认保存</button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div
      v-if="showDeleteModal"
      class="modal-mask sub-dialog"
      @click.self="showDeleteModal = false"
    >
      <div class="modal" style="width: 400px">
        <div class="modal-header">确认删除</div>
        <div class="modal-body">
          <p style="margin: 0 0 12px; color: var(--color-error)">
            ⚠️ 确认要删除角色 {{ targetRole?.name }} 吗？此操作不可逆。
          </p>
          <p
            v-if="deleteError"
            style="
              margin: 0;
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
import { ref, reactive, onMounted, computed } from "vue";
import { getRoles, saveRole, deleteRole } from "@/api/admin";
import Pagination from "@/components/common/Pagination.vue";

const emit = defineEmits(["toast"]);

const isLoading = ref(true);

const isCurrentUserSuperAdmin = true; // Mock current user role

const permissionConfig = [
  {
    module: "模型管理",
    items: [
      { name: "平台管理", key: "platform" },
      { name: "模型列表", key: "model" },
    ],
  },
  {
    module: "工具管理",
    items: [
      { name: "基础工具", key: "basetool" },
      { name: "Agent 工具", key: "agenttool" },
      { name: "MCP 工具", key: "mcptool" },
      { name: "表单模板", key: "template" },
    ],
  },
  {
    module: "用户管理",
    items: [{ name: "用户列表", key: "user", hide: ["add", "edit", "delete"] }],
  },
  {
    module: "权限管理",
    items: [
      { name: "管理员账号", key: "admin" },
      { name: "角色管理", key: "role" },
    ],
  },
];

function generateDefaultPerms() {
  const p = {};
  permissionConfig.forEach((g) => {
    g.items.forEach((i) => {
      p[i.key] = { view: false, add: false, edit: false, delete: false };
    });
  });
  return p;
}

const roles = ref([]);
const currentPage = ref(1);
const pageSize = 20;
const totalCount = ref(0);

import { watch } from 'vue';
watch(currentPage, () => {
  loadRoles();
});

onMounted(() => {
  loadRoles();
});

async function loadRoles() {
  isLoading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize
    };
    const res = await getRoles(params)
    if (res.code === 0) {
      roles.value = res.data?.records || res.data || []
      totalCount.value = res.data?.total || roles.value.length;
    }
  } catch (err) {
    emit("toast", { msg: "获取角色列表失败", type: "error" });
  } finally {
    isLoading.value = false;
  }
}

const showForm = ref(false);
const form = reactive({
  id: null,
  name: "",
  desc: "",
  perms: generateDefaultPerms(),
});

const showDeleteModal = ref(false);
const targetRole = ref(null);
const deleteError = ref("");

function onViewChange(key) {
  if (!form.perms[key].view) {
    form.perms[key].add = false;
    form.perms[key].edit = false;
    form.perms[key].delete = false;
  }
}

function onActionChange(key) {
  if (form.perms[key].add || form.perms[key].edit || form.perms[key].delete) {
    form.perms[key].view = true;
  }
}

function openForm(r = null) {
  if (r) {
    Object.assign(form, JSON.parse(JSON.stringify(r)));
    if (!form.perms) form.perms = generateDefaultPerms();
  } else {
    Object.assign(form, {
      id: null,
      name: "",
      desc: "",
      perms: generateDefaultPerms(),
    });
  }
  showForm.value = true;
}

async function saveForm() {
  if (!form.name) {
    emit("toast", { msg: "必填项 角色名称 * 没填", type: "error" });
    return;
  }
  try {
    const res = await saveRole({ ...form })
    if (res.code === 0) {
      showForm.value = false;
      emit("toast", { msg: "保存成功" });
      loadRoles();
    } else {
      emit("toast", { msg: res.msg || "保存失败", type: "error" });
    }
  } catch (err) {
    emit("toast", { msg: "保存失败", type: "error" });
  }
}

function confirmDelete(r) {
  targetRole.value = r;
  deleteError.value = "";
  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!targetRole.value) return;
  try {
    if (targetRole.value.name === "超级管理员") {
      deleteError.value = "超级管理员角色不可删除";
      return;
    }

    const res = await deleteRole({ id: targetRole.value.id })
    if (res.code === 0) {
      showDeleteModal.value = false;
      targetRole.value = null;
      emit("toast", { msg: "删除成功" });
      loadRoles();
    } else {
      deleteError.value = res.msg || "删除失败";
    }
  } catch (err) {
    deleteError.value = "删除失败";
  }
}
</script>

<style scoped>
@import '@/assets/admin-common.css';

  .th-name,
  .td-name {
    width: 140px;
  }
  .th-desc,
  .td-desc {
    width: auto;
  }
  .th-actions,
  .td-actions {
    text-align: left;
    width: 200px;
  }

  .font-medium {
    font-weight: 500;
  }
  .text-muted {
    color: #64748b;
    font-size: 13px;
  }

  .actions-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
</style>

