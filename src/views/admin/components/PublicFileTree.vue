<template>
  <div class="public-file-tree">
    <div class="tree-header">
      <div class="header-text">
        <span class="title">public/ 文件区</span>
        <span class="hint">上传工具所需资料，复制路径后在提示词中引用。</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-sm btn-ghost" @click="showNewFolder = true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            ></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
          文件夹
        </button>
        <button class="btn btn-sm btn-ghost" @click="triggerUpload">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          上传
        </button>
      </div>
    </div>

    <!-- Tree Body -->
    <div
      class="tree-body"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
      :class="{ 'drag-over': dragOver }"
    >
      <div v-if="loading" class="tree-loading">加载中...</div>
      <div v-else-if="files.length === 0" class="tree-empty">
        暂无文件，点击右上角上传或拖拽文件至此
      </div>
      <ul v-else class="tree-list">
        <PublicFileTreeNode
          v-for="file in files"
          :key="file.path"
          :node="file"
          :expanded-paths="expandedPaths"
          @copy="copyPath"
          @delete="confirmDelete"
          @upload-to="setUploadTarget"
          @toast="(event) => emit('toast', event)"
        />
      </ul>
    </div>

    <!-- Hidden File Input -->
    <input
      type="file"
      ref="fileInput"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- New Folder Modal -->
    <Teleport to="body">
      <div
        v-if="showNewFolder"
        class="modal-mask sub-dialog"
        @click.self="showNewFolder = false"
      >
        <div class="modal" style="width: 400px">
          <div class="modal-header">新建文件夹</div>
          <div class="modal-body">
            <div class="form-field">
              <label>目标目录</label>
              <select v-model="newFolderTarget">
                <option value="public">public/</option>
                <option
                  v-for="dir in allDirectories"
                  :key="dir.path"
                  :value="normalizeDirPath(dir.path)"
                >
                  {{ formatDirLabel(dir.path) }}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label>文件夹名 *</label>
              <input
                v-model="newFolderName"
                placeholder="输入文件夹名称"
                @keyup.enter="createNewFolder"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showNewFolder = false">
              取消
            </button>
            <button
              class="btn btn-primary"
              @click="createNewFolder"
              :disabled="!newFolderName"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  getPublicFiles,
  mkdirPublic,
  uploadPublicFile,
  deletePublicFile,
  downloadPublicFile,
} from "@/api/admin";
import PublicFileTreeNode from "./PublicFileTreeNode.vue";
import { showSuccess, showError } from "@/composables/useNotification";

const emit = defineEmits(["toast"]);

const files = ref([]);
const loading = ref(false);
const dragOver = ref(false);

const fileInput = ref(null);
const uploadTarget = ref("public");

const showNewFolder = ref(false);
const newFolderName = ref("");
const newFolderTarget = ref("public");

const expandedPaths = ref(new Set());

// Mock data implementation for UI development since APIs might return 404
const mockFiles = [
  {
    name: "docs",
    path: "public/docs",
    is_dir: true,
    children: [
      { name: "manual.pdf", path: "public/docs/manual.pdf", is_dir: false },
    ],
  },
  { name: "config.json", path: "public/config.json", is_dir: false },
];

async function loadFiles() {
  loading.value = true;
  try {
    // 首次加载只请求第一层，不再使用递归
    const res = await getPublicFiles({ path: "public", recursive: false });
    console.log("getPublicFiles Response:", res); // 添加打印

    if (res.code === 0 || res.success) {
      // 兼容接口文档返回的结构 res.data.files 或者 res.result.files
      const resultData = res.data || res.result || {};
      const items = resultData.files
        ? resultData.files
        : Array.isArray(resultData)
          ? resultData
          : resultData.items || [];

      // 因为不再递归，后端返回的就是一层的数据，直接映射为 node 对象即可
      files.value = items
        .map((item) => {
          const normalizedPath = item.path.replace(/\/$/, "");
          const parts = normalizedPath.split("/");
          return {
            name: item.name || parts[parts.length - 1],
            path: normalizedPath,
            is_dir: item.isDir || item.is_dir || false,
            size: item.size,
            updated_at: item.modified,
            children: [], // 初始化为空数组，等待懒加载
          };
        })
        .sort((a, b) => {
          // 文件夹排在前面
          if (a.is_dir && !b.is_dir) return -1;
          if (!a.is_dir && b.is_dir) return 1;
          return a.name.localeCompare(b.name);
        });
    } else {
      // Fallback to mock data for dev on failure, but show error msg if provided
      emit("toast", {
        msg: "文件列表获取失败: " + (res.message || res.msg || "未知错误"),
        type: "error",
      });
      files.value = [];
    }
  } catch (e) {
    console.error(e);
    files.value = [];
  } finally {
    loading.value = false;
  }
}

// 废弃旧的构建树逻辑，因为它依赖于一次性获取所有数据
function buildTreeFromFlatList(items) {
  return [];
}

function getAllDirectories(nodes, result = []) {
  for (const node of nodes) {
    if (node.is_dir) {
      result.push(node);
      if (node.children) getAllDirectories(node.children, result);
    }
  }
  return result;
}

const allDirectories = computed(() => {
  return getAllDirectories(files.value);
});

function normalizeDirPath(path) {
  if (!path) return path;
  return path.replace(/\/+$/, "");
}

function formatDirLabel(path) {
  return `${normalizeDirPath(path)}/`;
}

function addExpandedPathAndParents(path) {
  if (!path || path === "public") return;
  const parts = path.split("/");
  let current = "";
  for (let i = 0; i < parts.length; i++) {
    current = current ? `${current}/${parts[i]}` : parts[i];
    expandedPaths.value.add(current);
  }
}

async function createNewFolder() {
  if (!newFolderName.value) return;
  const base =
    newFolderTarget.value === "public"
      ? "public"
      : normalizeDirPath(newFolderTarget.value);
  const targetPath = `${base}/${newFolderName.value}`;

  try {
    const res = await mkdirPublic(targetPath);
    if (res.code === 0 || res.success) {
      emit("toast", { msg: "文件夹创建成功" });
      showNewFolder.value = false;
      newFolderName.value = "";

      // Auto expand the parent directory
      addExpandedPathAndParents(base);
      // Give Vue reactivity a tick to pass down expandedPaths before reloading root if base is public
      setTimeout(() => loadFiles(), 50);
    } else {
      emit("toast", {
        msg: "文件夹创建失败: " + (res.message || res.msg || "未知错误"),
        type: "error",
      });
    }
  } catch (e) {
    emit("toast", { msg: "文件夹创建失败", type: "error" });
  }
}

function triggerUpload() {
  uploadTarget.value = "public";
  fileInput.value.click();
}

function setUploadTarget(path) {
  uploadTarget.value = path;
  fileInput.value.click();
}

async function handleFileSelect(event) {
  const selectedFiles = event.target.files;
  if (!selectedFiles.length) return;
  await processUpload(selectedFiles);
  fileInput.value.value = ""; // Reset
}

async function handleDrop(event) {
  dragOver.value = false;
  const droppedFiles = event.dataTransfer.files;
  if (!droppedFiles.length) return;

  // Basic implementation. Recursive folder drop requires more complex DataTransferItem handling
  await processUpload(droppedFiles);
}

async function processUpload(fileList) {
  let successCount = 0;
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    try {
      // 如果后端要求 path 参数不能带文件名，只传目录路径
      let targetPath = uploadTarget.value;
      if (targetPath.endsWith("/")) {
        targetPath = targetPath.slice(0, -1);
      }

      console.log("正在上传文件:", file.name, "到路径:", targetPath);

      const res = await uploadPublicFile(file, targetPath);
      console.log("上传结果:", res);

      // 如果能在 try 里走到这里，说明拦截器没有 reject（也就是成功了）
      if (res.code === 0 || res.success) {
        successCount++;
      } else {
        emit("toast", {
          msg: `文件 ${file.name} 上传失败: ${res.message || res.msg}`,
          type: "error",
        });
      }
    } catch (e) {
      console.error("上传出错:", e);
      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.msg ||
        e.message ||
        "未知错误";
      emit("toast", {
        msg: `文件 ${file.name} 上传失败: ${errorMsg}`,
        type: "error",
      });
    }
  }
  if (successCount > 0) {
    emit("toast", { msg: `成功上传 ${successCount} 个文件` });
    addExpandedPathAndParents(uploadTarget.value);
    setTimeout(() => loadFiles(), 50);
  } else {
    loadFiles();
  }
}

async function confirmDelete(path, isDir = false) {
  if (confirm(`确定要删除 ${path} 吗？`)) {
    try {
      const res = await deletePublicFile(path, isDir);
      if (res.code === 0 || res.success) {
        emit("toast", { msg: "删除成功" });
        loadFiles();
      } else {
        emit("toast", {
          msg: "删除失败: " + (res.message || res.msg || "未知错误"),
          type: "error",
        });
      }
    } catch (e) {
      emit("toast", { msg: "删除失败", type: "error" });
    }
  }
}

function copyPath(path) {
  // 只复制短路径，例如 public/knowledge
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(path)
      .then(() => {
        showSuccess("路径已复制: " + path);
      })
      .catch(() => {
        showError("复制失败，请重试");
      });
  } else {
    // 降级方案：适用于非 HTTPS 环境 (如局域网 IP 访问)
    const textArea = document.createElement("textarea");
    textArea.value = path;

    // 隐藏元素但保持可聚焦
    textArea.style.position = "absolute";
    textArea.style.left = "-999999px";

    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      showSuccess("路径已复制: " + path);
    } catch (error) {
      console.error(error);
      showError("复制失败，您的浏览器不支持");
    } finally {
      textArea.remove();
    }
  }
}

onMounted(() => {
  loadFiles();
});
</script>

<style scoped>
@import "@/assets/admin-common.css";

.public-file-tree {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  height: 100%; /* Fill container height */
}

.tree-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  background: var(--color-bg-secondary);
}

.header-text {
  display: flex;
  flex-direction: column;
}

.header-text .title {
  font-size: var(--text-sm, 14px);
  font-weight: 600;
  color: var(--color-text);
}

.header-text .hint {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.header-actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-actions .btn {
  white-space: nowrap;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  position: relative;
}

.tree-body.drag-over {
  background: var(--color-primary-soft, rgba(59, 130, 246, 0.05));
  border: 2px dashed var(--color-primary);
  border-radius: 4px;
}

.tree-loading,
.tree-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-size: var(--text-sm, 14px);
}

.tree-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sub-dialog {
  z-index: 1050;
}

.form-field input,
.form-field select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
.btn-ghost:hover {
  background: var(--color-bg-secondary);
}
</style>
