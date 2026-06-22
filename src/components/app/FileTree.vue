<template>
  <div class="file-tree">
    <div class="tree-header">
      <span class="tree-label">空间文件</span>
      <div class="header-btns">
        <button class="hdr-btn" title="新建文件夹" @click="showMkdir = true">+ 文件夹</button>
        <button class="hdr-btn" title="上传文件" @click="openUpload">上传</button>
      </div>
    </div>

    <div class="tree-body">
      <div v-for="dir in dirs" :key="dir.key" class="dir-node" :class="{ 'dir-shared': dir.isShared }">
        <div class="dir-row" @click="toggleDir(dir.key)">
          <span class="dir-arrow">{{ expanded[dir.key] ? '▾' : '▸' }}</span>
          <span class="dir-icon">{{ dir.isShared ? '🤝' : '📁' }}</span>
          <span class="dir-name" :title="dir.key + '/'">{{ dir.key }}/</span>
          <span v-if="dir.isShared" class="shared-badge">只读</span>
        </div>
        <div v-if="expanded[dir.key]" class="dir-children">
          <div v-if="!dir.files.length" class="empty-dir">（空）</div>
          <template v-for="item in dir.files" :key="item.path">
            <!-- 嵌套子文件夹 -->
            <div
              v-if="item.isDir && isItemVisible(item)"
              class="dir-row"
              :style="{ paddingLeft: (12 + item.depth * 14) + 'px' }"
              @click="toggleSubDir(item.path)"
              @mouseenter="hovered = item.path"
              @mouseleave="hovered = null"
            >
              <span class="dir-arrow">{{ expandedPaths[item.path] ? '▾' : '▸' }}</span>
              <span class="dir-icon">📁</span>
              <span class="dir-name" :title="item.name">{{ item.name }}</span>
              <div v-if="hovered === item.path && (!dir.isShared || isOwner)" class="file-actions">
                <button class="file-btn file-btn-del" title="删除" @click.stop="askDelete(item)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
            <!-- 文件 -->
            <div
              v-else-if="!item.isDir && isItemVisible(item)"
              class="file-row"
              :style="{ paddingLeft: (12 + item.depth * 14) + 'px' }"
              @mouseenter="hovered = item.path"
              @mouseleave="hovered = null"
            >
              <span class="file-icon">📄</span>
              <span class="file-name" :title="item.name">{{ item.name }}</span>
              <div v-if="hovered === item.path" class="file-actions">
                <button class="file-btn" title="下载" @click.stop="downloadFile(item)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <button v-if="!dir.isShared || isOwner" class="file-btn file-btn-del" title="删除" @click.stop="askDelete(item)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 新建文件夹弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showMkdir" class="overlay" @click="showMkdir = false">
          <div class="simple-dialog" @click.stop>
            <div class="simple-dialog-title">新建文件夹</div>
            <div class="simple-field">
              <label>创建到：</label>
              <select v-model="mkdirTarget" class="simple-select">
                <option v-for="dir in dirs" :key="dir.key" :value="dir.key" :disabled="dir.isShared && !isOwner">
                  {{ dir.key }}/ {{ dir.isShared && !isOwner ? '(不可建)' : '' }}
                </option>
              </select>
            </div>
            <div class="simple-field">
              <label>文件夹名：</label>
              <input v-model="mkdirName" class="simple-input" placeholder="如：reports" @keydown.enter="handleMkdir" />
            </div>
            <div class="simple-footer">
              <button class="btn-ghost-sm" @click="showMkdir = false">取消</button>
              <button class="btn-primary-sm" @click="handleMkdir">创建</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 上传弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showUpload" class="overlay" @click="!uploadProgress.uploading && cancelUpload()">
          <div class="simple-dialog upload-dialog" @click.stop>
            <div class="simple-dialog-title">上传</div>

            <!-- 模式切换 -->
            <div class="mode-toggle">
              <button :class="{ active: uploadMode === 'file' }" @click="switchMode('file')">文件</button>
              <button :class="{ active: uploadMode === 'folder' }" @click="switchMode('folder')">文件夹</button>
            </div>

            <!-- 目标目录 -->
            <div class="simple-field">
              <label>上传到：</label>
              <select v-model="uploadTarget" class="simple-select">
                <option v-for="dir in dirs" :key="dir.key" :value="dir.key" :disabled="dir.isShared && !isOwner">
                  {{ dir.key }}/ {{ dir.isShared && !isOwner ? '(不可传)' : '' }}
                </option>
              </select>
            </div>

            <!-- 上传中：进度条 -->
            <template v-if="uploadProgress.uploading">
              <div class="upload-progress">
                <div class="progress-header">
                  <span class="progress-text">正在上传 {{ uploadProgress.current }} / {{ uploadProgress.total }}</span>
                  <span class="progress-pct">{{ progressPercent }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                </div>
              </div>
            </template>

            <!-- 空闲：上传区域 -->
            <template v-else>
              <div
                class="upload-zone"
                :class="{ 'upload-zone-active': isDragging }"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="handleDrop"
              >
                <template v-if="uploadMode === 'file'">
                  <p>拖拽文件到此处</p>
                  <p>或 <label class="upload-label">点击选择文件
                    <input ref="fileInputRef" type="file" multiple hidden @change="handleFileSelect" />
                  </label></p>
                </template>
                <template v-else>
                  <p>拖拽文件夹到此处</p>
                  <p>或 <label class="upload-label">选择文件夹
                    <input ref="folderInputRef" type="file" webkitdirectory hidden @change="handleFolderInputSelect" />
                  </label></p>
                </template>
              </div>

              <!-- 文件模式：待上传列表 -->
              <div v-if="uploadMode === 'file' && pendingFiles.length" class="pending-list">
                <div v-for="(f, i) in pendingFiles" :key="i" class="pending-item">
                  <span class="pending-name">{{ f.name }}</span>
                  <span class="pending-size">{{ formatSize(f.size) }}</span>
                  <button class="pending-remove" @click="pendingFiles.splice(i, 1)">✕</button>
                </div>
              </div>

              <!-- 文件夹模式：预览 -->
              <div v-if="uploadMode === 'folder' && pendingFolderItems.length" class="folder-preview">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <span class="folder-preview-name">{{ folderName }}</span>
                <span class="folder-preview-count">{{ pendingFolderItems.length }} 个文件</span>
                <button class="pending-remove" @click="pendingFolderItems = []">✕</button>
              </div>

              <!-- 上传失败列表 -->
              <div v-if="uploadErrors.length" class="upload-errors">
                <div class="upload-errors-title">{{ uploadErrors.length }} 个文件上传失败：</div>
                <div v-for="err in uploadErrors" :key="err" class="upload-error-item">{{ err }}</div>
              </div>
            </template>

            <div class="simple-footer">
              <button class="btn-ghost-sm" :disabled="uploadProgress.uploading" @click="cancelUpload">取消</button>
              <button class="btn-primary-sm" :disabled="!canConfirmUpload || uploadProgress.uploading" @click="confirmUpload">
                {{ uploadBtnText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteTarget" class="overlay" @click="deleteTarget = null">
          <div class="simple-dialog" @click.stop>
            <div class="simple-dialog-title">删除文件</div>
            <div class="delete-confirm-body">
              <template v-if="deleteTarget.isDir">
                确定要删除文件夹 <strong>{{ deleteTarget.name }}</strong> 及其所有内容吗？此操作不可撤销。
              </template>
              <template v-else>
                确定要删除 <strong>{{ deleteTarget.name }}</strong> 吗？此操作不可撤销。
              </template>
            </div>
            <div class="simple-footer">
              <button class="btn-ghost-sm" @click="deleteTarget = null">取消</button>
              <button class="btn-danger-sm" @click="confirmDelete">删除</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as mockApi from '@/api/mockApi'

const props = defineProps({
  appId: { type: String, default: '' },
  isOwner: { type: Boolean, default: true } // Support ownership checking for Formal Mode
})

const hovered = ref(null)
const showMkdir = ref(false)
const showUpload = ref(false)
const mkdirTarget = ref('workspace')
const mkdirName = ref('')
const uploadTarget = ref('workspace')
const uploadMode = ref('file')           // 'file' | 'folder'
const pendingFiles = ref([])
const pendingFolderItems = ref([])       // [{ file, relativePath }]
const isDragging = ref(false)
const deleteTarget = ref(null)
const fileInputRef = ref(null)
const folderInputRef = ref(null)

const uploadProgress = reactive({ current: 0, total: 0, uploading: false })
const uploadErrors = ref([])             // failed relativePaths

const dirs = reactive([
  { key: 'shared',    files: [], isShared: true }, // Added shared/ directory
  { key: 'workspace', files: [] },
  { key: 'temp',      files: [] },
  { key: 'memory',    files: [] },
  { key: 'assets',    files: [] },
])

const expanded = reactive({ shared: false, workspace: true, temp: false, memory: false, assets: false })
const expandedPaths = reactive({})  // subdir path → boolean

function toggleSubDir(path) {
  expandedPaths[path] = !expandedPaths[path]
}

// An item is visible when all its ancestor sub-dirs (depth ≥ 1) are expanded
function isItemVisible(item) {
  const parts = item.path.split('/')
  // parts[0] is the root dir key; ancestors start at index 2
  for (let i = 2; i < parts.length; i++) {
    if (!expandedPaths[parts.slice(0, i).join('/')]) return false
  }
  return true
}

const isOwner = computed(() => props.isOwner)

// ── Computed ─────────────────────────────────────────────────────
const folderName = computed(() =>
  pendingFolderItems.value[0]?.relativePath.split('/')[0] ?? ''
)

const progressPercent = computed(() =>
  uploadProgress.total ? Math.round((uploadProgress.current / uploadProgress.total) * 100) : 0
)

const canConfirmUpload = computed(() =>
  uploadMode.value === 'file' ? pendingFiles.value.length > 0 : pendingFolderItems.value.length > 0
)

const uploadBtnText = computed(() => {
  if (uploadProgress.uploading) return '上传中...'
  if (uploadMode.value === 'file')
    return pendingFiles.value.length ? `上传 (${pendingFiles.value.length})` : '上传'
  return pendingFolderItems.value.length
    ? `上传 (${pendingFolderItems.value.length} 个文件)`
    : '上传'
})

// ── Tree loading ──────────────────────────────────────────────────
// Recursively flatten a nested tree into a display list with depth info
function _flattenItems(items, basePath, depth) {
  const result = []
  for (const item of items || []) {
    const fullPath = basePath + '/' + item.name
    result.push({
      name: item.type === 'dir' ? item.name + '/' : item.name,
      path: fullPath,
      isDir: item.type === 'dir',
      depth,
      fileObj: item._fileObj || null,
    })
    if (item.type === 'dir' && item.children?.length)
      result.push(..._flattenItems(item.children, fullPath, depth + 1))
  }
  return result
}

function _loadTree(apiTree) {
  // Clear stale subdir expand state
  Object.keys(expandedPaths).forEach(k => delete expandedPaths[k])
  for (const treeDir of apiTree) {
    const d = dirs.find(d => d.key === treeDir.name)
    if (d) d.files = _flattenItems(treeDir.children || [], treeDir.name, 0)
  }
}

onMounted(async () => {
  if (!props.appId) return
  const res = await mockApi.getFiles(props.appId, 'user')
  if (res.code === 0) _loadTree(res.data.tree)
})

// ── Dir actions ───────────────────────────────────────────────────
function toggleDir(key) { expanded[key] = !expanded[key] }

async function copyPath(path) {
  try { await navigator.clipboard.writeText(path) } catch { /* silent */ }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function getDirFiles(key) { return dirs.find(d => d.key === key)?.files || [] }

async function handleMkdir() {
  if (!mkdirName.value.trim() || !props.appId) return
  const path = mkdirTarget.value + '/' + mkdirName.value.trim()
  await mockApi.mkdir(props.appId, path)
  const dir = dirs.find(d => d.key === mkdirTarget.value)
  if (dir) {
    const filePath = path + '/'
    if (!dir.files.find(f => f.path === filePath))
      dir.files.push({ name: mkdirName.value.trim() + '/', path: filePath, isDir: true, depth: 0, fileObj: null })
    expanded[mkdirTarget.value] = true
  }
  mkdirName.value = ''
  showMkdir.value = false
}

// ── Upload dialog lifecycle ───────────────────────────────────────
function openUpload() {
  // If not owner, prevent uploading to Shared/
  if (!isOwner.value && uploadTarget.value === 'shared') {
    uploadTarget.value = 'workspace'
  }
  pendingFiles.value = []
  pendingFolderItems.value = []
  uploadErrors.value = []
  uploadProgress.current = 0
  uploadProgress.total = 0
  uploadProgress.uploading = false
  showUpload.value = true
}

function switchMode(mode) {
  uploadMode.value = mode
  pendingFiles.value = []
  pendingFolderItems.value = []
  uploadErrors.value = []
}

function cancelUpload() {
  pendingFiles.value = []
  pendingFolderItems.value = []
  uploadErrors.value = []
  uploadProgress.uploading = false
  showUpload.value = false
}

// ── File mode ─────────────────────────────────────────────────────
function handleFileSelect(e) {
  mergeIntoPending(Array.from(e.target.files))
  e.target.value = ''
}

function mergeIntoPending(files) {
  for (const f of files)
    if (!pendingFiles.value.find(p => p.name === f.name)) pendingFiles.value.push(f)
}

async function confirmFileUpload() {
  if (!pendingFiles.value.length || !props.appId) return
  for (const file of pendingFiles.value)
    await mockApi.uploadFile(props.appId, file, uploadTarget.value + '/')
  const res = await mockApi.getFiles(props.appId, 'user')
  if (res.code === 0) _loadTree(res.data.tree)
  expanded[uploadTarget.value] = true
  pendingFiles.value = []
  showUpload.value = false
}

// ── Folder mode ───────────────────────────────────────────────────
function handleFolderInputSelect(e) {
  const files = Array.from(e.target.files)
  pendingFolderItems.value = files.map(f => ({ file: f, relativePath: f.webkitRelativePath }))
  uploadErrors.value = []
  e.target.value = ''
}

// Reads all entries from a DirectoryReader, handling the 100-item batch limit
async function _readAllEntries(reader) {
  const all = []
  while (true) {
    const batch = await new Promise((res, rej) => reader.readEntries(res, rej))
    if (!batch.length) break
    all.push(...batch)
  }
  return all
}

// Recursively turns a FileSystemEntry into [{ file, relativePath }]
async function _readEntry(entry, basePath) {
  if (entry.isFile) {
    return new Promise(resolve => {
      entry.file(file => resolve([{ file, relativePath: basePath + file.name }]))
    })
  }
  if (entry.isDirectory) {
    const entries = await _readAllEntries(entry.createReader())
    const nested = await Promise.all(entries.map(e => _readEntry(e, basePath + entry.name + '/')))
    return nested.flat()
  }
  return []
}

// ── Unified drop handler ──────────────────────────────────────────
async function handleDrop(e) {
  isDragging.value = false
  if (uploadMode.value === 'folder') {
    const items = Array.from(e.dataTransfer.items || [])
    const all = []
    for (const item of items) {
      const entry = item.webkitGetAsEntry?.()
      if (entry) all.push(...await _readEntry(entry, ''))
    }
    pendingFolderItems.value = all
    uploadErrors.value = []
  } else {
    mergeIntoPending(Array.from(e.dataTransfer.files))
  }
}

// ── Folder upload processor ───────────────────────────────────────
async function processFolder(items) {
  uploadProgress.current = 0
  uploadProgress.total = items.length
  uploadProgress.uploading = true
  uploadErrors.value = []

  // Collect unique directory paths, sort shallowest first
  const dirSet = new Set()
  for (const { relativePath } of items) {
    const parts = relativePath.split('/')
    for (let i = 1; i < parts.length; i++)
      dirSet.add(parts.slice(0, i).join('/'))
  }
  const sortedDirs = [...dirSet].sort((a, b) => a.split('/').length - b.split('/').length)

  // Create directories
  for (const dir of sortedDirs)
    await mockApi.mkdir(props.appId, uploadTarget.value + '/' + dir)

  // Upload files one by one, collect failures
  for (const { file, relativePath } of items) {
    const parts = relativePath.split('/')
    const dirPart = parts.slice(0, -1).join('/')
    const targetPath = uploadTarget.value + '/' + (dirPart ? dirPart + '/' : '')
    const res = await mockApi.uploadFile(props.appId, file, targetPath)
    if (res.code !== 0) uploadErrors.value.push(relativePath)
    uploadProgress.current++
  }

  uploadProgress.uploading = false

  // Refresh tree
  const res = await mockApi.getFiles(props.appId, 'user')
  if (res.code === 0) _loadTree(res.data.tree)
  expanded[uploadTarget.value] = true

  // Close only when no failures
  if (!uploadErrors.value.length) {
    pendingFolderItems.value = []
    showUpload.value = false
  }
}

// ── Confirm dispatcher ────────────────────────────────────────────
async function confirmUpload() {
  if (uploadMode.value === 'file') await confirmFileUpload()
  else await processFolder(pendingFolderItems.value)
}

// ── Delete ────────────────────────────────────────────────────────
function askDelete(item) { deleteTarget.value = item }

async function confirmDelete() {
  if (!deleteTarget.value || !props.appId) return
  const res = await mockApi.deleteFile(props.appId, deleteTarget.value.path)
  if (res.code === 0) {
    // Reload tree so nested children of deleted dirs are also removed
    const treeRes = await mockApi.getFiles(props.appId, 'user')
    if (treeRes.code === 0) _loadTree(treeRes.data.tree)
  }
  deleteTarget.value = null
}

// ── Download ──────────────────────────────────────────────────────
async function downloadFile(item) {
  if (item.isDir) return
  let fileObj = item.fileObj
  if (!fileObj && props.appId) fileObj = await mockApi.downloadFile(props.appId, item.path)
  if (!fileObj) return
  const url = URL.createObjectURL(fileObj)
  const a = document.createElement('a')
  a.href = url; a.download = item.name; a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.file-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
}
.file-tree::-webkit-scrollbar { display: none; }

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.tree-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.header-btns { display: flex; gap: 4px; }
.hdr-btn {
  font-size: 11px;
  padding: 3px 7px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.hdr-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-primary-soft);
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
  scrollbar-width: none;
}
.tree-body::-webkit-scrollbar { display: none; }

.dir-node { display: flex; flex-direction: column; }
.dir-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
  position: relative;
}
.dir-row:hover { background: var(--color-bg-secondary); }
.dir-arrow { font-size: 10px; color: var(--color-text-muted); width: 12px; flex-shrink: 0; }
.dir-icon { font-size: 13px; }
.dir-name { font-size: 13px; color: var(--color-text); font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.copy-btn {
  font-size: 11px; background: none; border: none; cursor: pointer;
  opacity: 0; padding: 1px 3px; border-radius: 3px; transition: opacity 0.15s;
}
.dir-row:hover .copy-btn { opacity: 1; }

.shared-badge {
  font-size: 10px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  padding: 1px 4px;
  border-radius: 4px;
  margin-left: 4px;
}

.dir-shared .dir-icon {
  font-size: 12px;
}

.dir-children { padding-left: 24px; }
.empty-dir {
  font-size: 12px; color: var(--color-text-muted);
  padding: 3px 12px; font-style: italic;
}
.file-row {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 12px; border-radius: 4px; position: relative;
}
.file-row:hover { background: var(--color-bg-secondary); }
.file-icon { font-size: 12px; }
.file-name {
  font-size: 12px; color: var(--color-text-secondary);
  flex: 1; min-width: 0; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
}
.file-actions { display: flex; gap: 2px; flex-shrink: 0; }
.file-btn {
  width: 20px; height: 20px; border: none; background: none;
  cursor: pointer; color: var(--color-text-muted); border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; font-size: 11px;
}
.file-btn:hover { color: var(--color-text); background: var(--color-border); }
.file-btn-del:hover { color: var(--color-error) !important; background: rgba(239,68,68,0.1) !important; }

/* ── 弹窗公共 ── */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}
.simple-dialog {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%; max-width: 380px;
  padding: 20px; display: flex; flex-direction: column; gap: 14px;
}
.upload-dialog { max-width: 420px; }
.simple-dialog-title { font-size: 15px; font-weight: 600; color: var(--color-text); }
.simple-field {
  display: flex; flex-direction: column; gap: 5px;
  font-size: 13px; color: var(--color-text-secondary);
}
.simple-select, .simple-input {
  padding: 7px 10px;
  border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
  background: var(--color-surface); color: var(--color-text);
  font-size: 13px; outline: none; font-family: inherit;
}
.simple-select:focus, .simple-input:focus { border-color: var(--color-primary); }
.simple-footer { display: flex; justify-content: flex-end; gap: 8px; }
.btn-ghost-sm {
  padding: 6px 16px; font-size: 13px; background: transparent;
  color: var(--color-text-secondary); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); cursor: pointer;
}
.btn-ghost-sm:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary-sm {
  padding: 6px 16px; font-size: 13px;
  background: var(--color-primary); color: #fff; border: none;
  border-radius: var(--radius-md); cursor: pointer;
}
.btn-primary-sm:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-danger-sm {
  padding: 6px 16px; font-size: 13px;
  background: var(--color-error); color: #fff; border: none;
  border-radius: var(--radius-md); cursor: pointer;
}
.btn-danger-sm:hover { opacity: 0.88; }

/* ── 模式切换 ── */
.mode-toggle {
  display: flex;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 2px;
}
.mode-toggle button {
  flex: 1; padding: 5px 0; font-size: 13px; font-weight: 500;
  background: transparent; border: none; border-radius: calc(var(--radius-md) - 2px);
  color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.mode-toggle button.active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

/* ── 上传区域 ── */
.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px; text-align: center;
  font-size: 13px; color: var(--color-text-muted);
  line-height: 1.7; transition: border-color 0.15s, background 0.15s;
}
.upload-zone-active { border-color: var(--color-primary); background: var(--color-primary-soft); }
.upload-label { color: var(--color-primary); cursor: pointer; text-decoration: underline; }

/* ── 文件模式：待上传列表 ── */
.pending-list {
  display: flex; flex-direction: column; gap: 4px;
  max-height: 140px; overflow-y: auto;
}
.pending-item {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px; background: var(--color-bg-secondary);
  border-radius: var(--radius-md); font-size: 12px;
}
.pending-name {
  flex: 1; min-width: 0; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
  color: var(--color-text-secondary);
}
.pending-size { font-size: 11px; color: var(--color-text-muted); flex-shrink: 0; }
.pending-remove {
  background: none; border: none; cursor: pointer;
  font-size: 11px; color: var(--color-text-muted); padding: 0 2px; flex-shrink: 0;
}
.pending-remove:hover { color: var(--color-error); }

/* ── 文件夹模式：预览 ── */
.folder-preview {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--color-bg-secondary);
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  font-size: 13px; color: var(--color-text-secondary);
}
.folder-preview-name { font-weight: 600; color: var(--color-text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.folder-preview-count { font-size: 12px; color: var(--color-text-muted); flex-shrink: 0; }

/* ── 进度条 ── */
.upload-progress { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
.progress-header { display: flex; justify-content: space-between; align-items: center; }
.progress-text { font-size: 13px; color: var(--color-text-secondary); }
.progress-pct { font-size: 12px; font-weight: 600; color: var(--color-primary); }
.progress-track {
  height: 6px; background: var(--color-bg-secondary);
  border-radius: 3px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: var(--color-primary);
  border-radius: 3px; transition: width 0.2s ease;
}

/* ── 失败列表 ── */
.upload-errors {
  background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2);
  border-radius: var(--radius-md); padding: 10px 12px;
  display: flex; flex-direction: column; gap: 4px;
  max-height: 120px; overflow-y: auto;
}
.upload-errors-title { font-size: 12px; font-weight: 600; color: var(--color-error); }
.upload-error-item {
  font-size: 11px; color: var(--color-text-muted);
  font-family: var(--font-mono); padding-left: 4px;
}

/* ── 删除确认 ── */
.delete-confirm-body { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
