<template>
  <div class="agent-tool-management admin-page">
    <div class="page-header">
      <div class="header-title">
        <h2>Agent 工具</h2>
        <span class="count-badge">共 {{ totalCount }} 个</span>
      </div>
      <div
        class="header-actions"
        style="display: flex; align-items: center; gap: 12px"
      >
        <select
          v-model="platformFilter"
          class="filter-select"
          style="min-width: 140px"
        >
          <option value="">全部平台</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">
            {{ g.displayName }}
          </option>
        </select>
        <select
          v-model="statusFilter"
          class="filter-select"
          style="min-width: 120px"
        >
          <option value="">状态: 全部</option>
          <option :value="1">正常</option>
          <option :value="2">已弃用</option>
          <option :value="3">测试版</option>
        </select>
        <button class="btn btn-primary" @click="goToCreate()">
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
          添加工具
        </button>
      </div>
    </div>

    <div class="table-wrap" v-if="agentTools.length > 0 || isLoading">
      <table v-if="!isLoading">
        <thead>
          <tr>
            <th>展示名</th>
            <th>说明</th>
            <th>工具模板</th>
            <th>支持平台</th>
            <th style="text-align: center">默认启用</th>
            <th style="text-align: center">可见</th>
            <th>状态</th>
            <th style="display: none">被引用</th>
            <th>排序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in agentTools" :key="t.id">
            <td class="font-medium">
              {{ t.displayName || t.config?.name || "-" }}
            </td>
            <td
              class="text-muted"
              style="
                max-width: 260px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              "
              :title="t.detail"
            >
              {{ t.detail || "-" }}
            </td>
            <td>
              <span class="tag tag-gray">{{ t.category }}</span>
            </td>
            <td :title="formatModelGroups(t.modelGroups)">
              {{ formatModelGroupsTruncated(t.modelGroups) }}
            </td>
            <td style="text-align: center">
              <Switch :modelValue="t.defaultEnabled === 1" disabled />
            </td>
            <td style="text-align: center">
              <Switch :modelValue="t.visible === 1" disabled />
            </td>
            <td>
              <span :class="['tag', statusTagClass(t.status)]">
                {{ statusLabel(t.status) }}
              </span>
            </td>
            <td class="text-muted" style="display: none">
              {{ t.referencedBy?.length || "—" }}
            </td>
            <td style="text-align: center">{{ t.sortOrder }}</td>
            <td class="actions">
              <button class="btn btn-ghost btn-sm" @click="goToEdit(t.id)">
                编辑
              </button>
              <button class="btn btn-sm btn-danger" @click="confirmDelete(t)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-else>
        <thead>
          <tr>
            <th>展示名</th>
            <th>说明</th>
            <th>工具模板</th>
            <th>支持平台</th>
            <th style="text-align: center">默认启用</th>
            <th style="text-align: center">可见</th>
            <th>状态</th>
            <th style="display: none">被引用</th>
            <th>排序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="9" style="text-align: center; padding: 60px 0">
              <div class="loading-spinner"></div>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination
        v-if="!isLoading && agentTools.length > 0"
        :total="totalCount"
        :pageSize="pageSize"
        v-model="currentPage"
      />
    </div>
    <div v-else class="empty-state">
      <template v-if="statusFilter === '' && platformFilter === ''">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <!-- Wireframe Cube -->
          <polygon
            points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"
          ></polygon>
          <line x1="12" y1="22" x2="12" y2="12"></line>
          <line x1="22" y1="8.5" x2="12" y2="12"></line>
          <line x1="2" y1="8.5" x2="12" y2="12"></line>
        </svg>
        <p>暂无 Agent 工具数据</p>
      </template>
      <template v-else>
        <p>暂无符合条件的 Agent 工具</p>
      </template>
    </div>

    <!-- Delete Modal -->
    <div
      v-if="showDeleteModal"
      class="modal-mask sub-dialog"
      @click.self="showDeleteModal = false"
    >
      <div class="modal" style="width: 500px; max-height: 80vh">
        <div class="modal-header">
          删除 Agent 工具「{{ deleteTargetName }}」
        </div>
        <div class="modal-body">
          <template v-if="deleteTargetUsageCount > 0">
            <p style="margin: 0 0 8px; color: var(--color-text)">
              当前有 {{ deleteTargetUsageCount }} 个 App 正在使用该工具，
            </p>
            <p style="margin: 0 0 16px; color: var(--color-text)">
              删除后这些 App 的相关功能将受到影响。
            </p>
          </template>

          <template v-if="referencingTools && referencingTools.length > 0">
            <div style="margin-bottom: 16px">
              <p
                style="
                  margin: 0 0 8px;
                  color: var(--color-text);
                  font-weight: 500;
                "
              >
                以下工具正在引用该工具：
              </p>
              <div
                class="table-wrap"
                style="
                  box-shadow: none;
                  border: 1px solid var(--color-border);
                  max-height: 200px;
                  overflow-y: auto;
                  padding: 0;
                "
              >
                <table style="min-width: unset">
                  <thead>
                    <tr>
                      <th style="padding: 8px">引用工具名称</th>
                      <th style="padding: 8px">引用类型</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(refTool, index) in referencingTools"
                      :key="index"
                    >
                      <td style="padding: 8px">
                        {{ refTool.agentToolName || "-" }}
                      </td>
                      <td style="padding: 8px">
                        <span class="tag tag-gray">{{
                          formatRefType(refTool.refType)
                        }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <p style="margin: 0 0 16px; color: var(--color-error, #ef4444)">
            ⚠️ 此操作不可恢复，请输入确认密码以执行删除。
          </p>

          <div class="form-field">
            <label>确认密码 *</label>
            <input
              v-model="deletePassword"
              type="password"
              placeholder="请输入确认密码"
              @keyup.enter="executeDelete"
            />
          </div>

          <p
            v-if="deleteError"
            style="
              color: var(--color-error, #ef4444);
              font-size: 12px;
              margin: 0;
            "
          >
            {{ deleteError }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showDeleteModal = false">
            取消
          </button>
          <button
            class="btn btn-sm btn-danger"
            @click="executeDelete"
            :disabled="isDeleting"
          >
            {{ isDeleting ? "删除中..." : "确认删除" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  getAgentTools,
  getModelGroups,
  getModelGroupById,
  deleteAgentTool as apiDeleteAgentTool,
  getAgentToolReferencingTools,
} from "@/api/admin";
import Switch from "@/components/common/Switch.vue";
import Pagination from "@/components/common/Pagination.vue";
import {
  parseModelGroupIds,
  syncModelGroupNameCache,
  fetchMissingModelGroupNames,
  formatModelGroupsDisplay,
  formatModelGroupsDisplayTruncated,
} from "@/utils/modelGroupDisplay";

const emit = defineEmits(["toast"]);
const router = useRouter();

const agentTools = ref([]);
const groups = ref([]);
const isLoading = ref(true);

const platformFilter = ref("");
const statusFilter = ref("");
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

watch([platformFilter, statusFilter], () => {
  currentPage.value = 1;
  loadData();
});

watch(currentPage, () => {
  loadData();
});

const showDeleteModal = ref(false);
const deleteError = ref("");
const deletePassword = ref("");
const isDeleting = ref(false);
const deleteTargetId = ref(null);
const deleteTargetName = ref("");
const deleteTargetUsageCount = ref(0);
const referencingTools = ref([]);

function formatRefType(type) {
  const map = {
    platform_basetools: "基础工具",
    platform_mcp_tools: "MCP工具",
    platform_agent_tools: "Agent工具",
  };
  return map[type] || type || "-";
}

function statusLabel(s) {
  return { 1: "正常", 2: "已弃用", 3: "测试版" }[s] || "未知";
}
function statusTagClass(s) {
  return { 1: "tag-green", 2: "tag-yellow", 3: "tag-blue" }[s] || "tag-gray";
}
function formatModelGroups(mg) {
  return formatModelGroupsDisplay(mg, groups.value, platformNameCache.value, "全部");
}

function formatModelGroupsTruncated(mg) {
  return formatModelGroupsDisplayTruncated(mg, groups.value, platformNameCache.value, "全部");
}

async function loadData() {
  isLoading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize,
    };
    if (statusFilter.value !== "") params.status = statusFilter.value;
    if (platformFilter.value !== "") params.modelGroups = platformFilter.value;

    const [atRes, gRes] = await Promise.all([
      getAgentTools(params),
      getModelGroups(),
    ]);

    if (gRes.code === 0 || gRes.success || gRes.code === 200) {
      const data = gRes.result || gRes.data;
      groups.value = data?.records || data || [];
      syncModelGroupNameCache(groups.value, platformNameCache.value);
    }
    if (atRes.code === 0 || atRes.success || atRes.code === 200) {
      const data = atRes.result || atRes.data;
      agentTools.value = data?.records || data || [];
      totalCount.value = data?.total || agentTools.value.length;
      loadPlatformNamesForTools(agentTools.value);
    }
  } catch (e) {
    emit("toast", { msg: "加载数据失败", type: "error" });
  } finally {
    isLoading.value = false;
  }
}

function goToCreate() {
  router.push("/admin/agent-tools/create");
}

function goToEdit(id) {
  router.push(`/admin/agent-tools/${id}/edit`);
}

async function confirmDelete(t) {
  deleteTargetId.value = t.id;
  deleteTargetName.value = t.displayName || t.config?.name || "未知";
  deleteTargetUsageCount.value = t.referencedBy?.length || 0;
  deletePassword.value = "";
  deleteError.value = "";
  referencingTools.value = [];

  try {
    const res = await getAgentToolReferencingTools(t.id);
    if (res.code === 0 || res.code === 200 || res.success) {
      referencingTools.value = res.result || res.data || [];
    }
  } catch (e) {
    console.error("获取引用列表失败", e);
  }

  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!deletePassword.value) {
    deleteError.value = "请输入确认密码";
    return;
  }

  isDeleting.value = true;
  deleteError.value = "";

  try {
    const r = await apiDeleteAgentTool({
      id: deleteTargetId.value,
      password: deletePassword.value,
    });
    if (r.code === 0 || r.code === 200 || r.success) {
      showDeleteModal.value = false;
      emit("toast", { msg: "已删除" });
      loadData();
    } else {
      deleteError.value = r.message || r.msg || "删除失败，请检查密码或重试";
    }
  } catch (e) {
    deleteError.value =
      e?.response?.data?.message ||
      e?.response?.data?.msg ||
      e?.message ||
      "删除失败，网络或服务器错误";
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
@import "@/assets/admin-common.css";

/* Base Layout */
.agent-tool-management {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
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
.filter-select option {
  background-color: var(--color-surface);
  color: var(--color-text);
}
.text-muted {
  color: var(--color-text-muted);
  text-align: center;
}
.text-mono {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--color-text-secondary);
}
tr:hover td {
  background: var(--color-primary-soft, rgba(59, 130, 246, 0.05));
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

.form-field {
  margin-bottom: 20px;
}
.form-field label {
  display: block;
  font-size: var(--text-xs, 12px);
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.form-field input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  font-size: var(--text-sm, 14px);
  outline: none;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  transition: all 0.2s ease;
}

.form-field input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft, rgba(59, 130, 246, 0.15));
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
  white-space: nowrap; /* 确保文字不换行，从而维持标签宽度 */
}
.tag-green {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success, #10b981);
}
.tag-gray {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.tag-yellow {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}
.tag-red {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error, #ef4444);
}
.tag-blue {
  background: var(--color-primary-soft, rgba(59, 130, 246, 0.1));
  color: var(--color-primary);
}

.sub-dialog {
  z-index: 150;
}
</style>
