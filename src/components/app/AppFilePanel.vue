<template>
  <div class="file-panel">
    <div class="panel-header">
      <span class="panel-title">工作区资源</span>
      <button class="header-btn" title="新建文件夹" @click="openMkdirIn('shared/')">
        <PlusIcon :size="14" />
      </button>
    </div>

    <div class="tree-view">
      <!-- shared / 核心知识库 -->
      <div class="folder-block">
        <div
          class="folder-header"
          :class="{ expanded: expanded.shared }"
          @click="toggleDir('shared')"
        >
          <div class="folder-header-left">
            <span class="folder-chevron">▸</span>
            <FolderTypeIcon />
            <span>shared / 核心知识库</span>
          </div>
          <div class="folder-header-actions" @click.stop>
            <span class="folder-action" title="上传文件或文件夹" @click="openUploadTo('shared/')">
              <UploadIcon :size="13" />
            </span>
            <span class="folder-action" title="新建文件夹" @click="openMkdirIn('shared/')">
              <PlusIcon :size="13" />
            </span>
          </div>
        </div>
        <div class="folder-desc">
          存放 Agent 必须阅读的文档或准则。复制此处的路径并粘贴到提示词中，AI 即可将其作为核心知识。
        </div>
        <div class="folder-contents" :class="{ expanded: expanded.shared }">
          <FolderTreeList
            :files="sharedFiles"
            parent-path="shared/"
            :expanded-paths="expandedPaths"
            @upload="openUploadTo"
            @mkdir="openMkdirIn"
            @copy="copyPath"
            @delete="askDelete"
            @download="downloadFile"
          />
        </div>
      </div>

      <!-- mailbox / 用户传递 -->
      <div class="folder-block">
        <div
          class="folder-header"
          :class="{ expanded: expanded.mailbox }"
          @click="toggleDir('mailbox')"
        >
          <div class="folder-header-left">
            <span class="folder-chevron">▸</span>
            <FolderTypeIcon />
            <span>mailbox / 用户传递</span>
          </div>
          <div class="folder-header-actions" @click.stop>
            <span class="folder-action" title="上传文件或文件夹" @click="openUploadTo('mailbox/')">
              <UploadIcon :size="13" />
            </span>
            <span class="folder-action" title="新建文件夹" @click="openMkdirIn('mailbox/')">
              <PlusIcon :size="13" />
            </span>
            <span class="folder-action" title="使用说明" @click="showMailboxHelp = true">?</span>
          </div>
        </div>
        <div class="folder-desc">
          App 内用户之间的文件传递通道。写入后系统生成加密文件名，需知道具体文件名才能读取。
        </div>
        <div class="folder-contents" :class="{ expanded: expanded.mailbox }">
          <FolderTreeList
            :files="mailboxFiles"
            parent-path="mailbox/"
            :expanded-paths="expandedPaths"
            @upload="openUploadTo"
            @mkdir="openMkdirIn"
            @copy="copyPath"
            @delete="askDelete"
            @download="downloadFile"
          />
        </div>
      </div>
    </div>

    <!-- mailbox 说明弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showMailboxHelp" class="overlay" @click="showMailboxHelp = false">
          <div class="help-dialog" @click.stop>
            <div class="help-header">
              <span>mailbox/ 使用说明</span>
              <button class="close-x" @click="showMailboxHelp = false">✕</button>
            </div>
            <div class="help-body">
              <p><strong>📌 工作原理</strong></p>
              <p>mailbox 是 App 内用户之间的文件传递通道。文件写入 mailbox/ 后，系统自动生成加密文件名，保障文件隐私。mailbox/ 不支持搜索和浏览目录，必须知道具体文件名才能读取。</p>
              <p><strong>📌 使用流程</strong></p>
              <p>用户 A：帮我把这份报告发给同事<br>→ AI 将报告写入 mailbox/<br>→ 系统返回加密文件名如 mailbox/a3f8c1e9_report.md<br>→ 用户 A 将文件名发给用户 B</p>
              <p>用户 B：同事给了我一份文件，文件名是 a3f8c1e9_report.md<br>→ AI 读取该文件并处理</p>
              <p><strong>📌 需要启用的工具</strong></p>
              <p>· SPmake — 写入 mailbox/ 必须使用 SPmake（安全写入，不覆盖已有内容）</p>
            </div>
            <div class="help-footer">
              <button class="btn-ok" @click="showMailboxHelp = false">知道了</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 新建文件夹弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showMkdir" class="overlay" @click="showMkdir = false">
          <div class="simple-dialog" @click.stop>
            <div class="simple-dialog-title">新建文件夹</div>
            <div class="simple-field">
              <label>创建到：</label>
              <select v-model="mkdirParent" class="simple-select">
                <option v-for="p in allFolderPaths" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <div class="simple-field">
              <label>文件夹名：</label>
              <input v-model="mkdirName" class="simple-input" placeholder="如：skills" @keydown.enter="handleMkdir" />
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
        <div v-if="showUpload" class="overlay" @click="showUpload = false">
          <div class="simple-dialog" @click.stop>
            <div class="simple-dialog-title">上传文件或文件夹</div>
            <div class="simple-field">
              <label>上传到：</label>
              <div class="upload-target-path">{{ uploadTarget }}</div>
            </div>
            <div
              class="upload-zone"
              :class="{ 'upload-zone-active': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <p>拖拽文件到此处，或选择上传方式</p>
              <p class="upload-btns">
                <label class="upload-label">
                  选择文件
                  <input ref="fileInputRef" type="file" multiple hidden @change="handleFileSelect" />
                </label>
                <span class="upload-sep">或</span>
                <label class="upload-label">
                  选择文件夹
                  <input ref="dirInputRef" type="file" webkitdirectory multiple hidden @change="handleDirSelect" />
                </label>
              </p>
            </div>
            <div v-if="uploadMode === 'folder' && pendingFolderItems.length" class="folder-upload-preview">
              <div class="folder-upload-preview-title">将先创建文件夹，再上传其中的内容：</div>
              <div class="folder-upload-preview-path">{{ uploadTarget }}{{ folderUploadName }}/</div>
              <div class="folder-upload-preview-count">共 {{ pendingFolderItems.length }} 个文件</div>
            </div>
            <div v-else-if="uploadMode === 'file' && pendingFiles.length" class="pending-list">
              <div v-for="(f, i) in pendingFiles" :key="i" class="pending-item">
                <span class="pending-name">{{ f.name }}</span>
                <span class="pending-size">{{ formatSize(f.size) }}</span>
                <button class="pending-remove" @click="pendingFiles.splice(i, 1)">✕</button>
              </div>
            </div>
            <div class="simple-footer">
              <button class="btn-ghost-sm" @click="cancelUpload">取消</button>
              <button class="btn-primary-sm" :disabled="!canConfirmUpload" @click="confirmUpload">
                {{ confirmUploadLabel }}
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
            <div class="simple-dialog-title">{{ deleteTarget?.isDir ? '删除文件夹' : '删除文件' }}</div>
            <div class="delete-confirm-body">
              确定要删除 <strong>{{ deleteTarget.name }}</strong>{{ deleteTarget?.isDir ? ' 及其所有内容' : '' }}吗？此操作不可撤销。
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
import { ref, reactive, computed } from 'vue'
import FolderTypeIcon from '@/components/app/FolderTypeIcon.vue'
import FolderTreeList from '@/components/app/FolderTreeList.vue'
import UploadIcon from '@/components/app/UploadIcon.vue'
import PlusIcon from '@/components/app/PlusIcon.vue'
import { showSuccess, showError } from '@/composables/useNotification'

const expanded = reactive({ shared: true, mailbox: false })
const expandedPaths = reactive({ 'shared/skills/': false })
const showMailboxHelp = ref(false)
const showMkdir = ref(false)
const showUpload = ref(false)
const mkdirParent = ref('shared/')
const mkdirName = ref('')
const uploadTarget = ref('shared/')
const uploadMode = ref('file')
const pendingFiles = ref([])
const pendingFolderItems = ref([])
const isDragging = ref(false)
const deleteTarget = ref(null)
const fileInputRef = ref(null)
const dirInputRef = ref(null)

const sharedFiles = ref([
  { name: 'skills/', path: 'shared/skills/', isDir: true, fileObj: null }
])
const mailboxFiles = ref([])

const allFolderPaths = computed(() => {
  const paths = new Set(['shared/', 'mailbox/'])
  for (const item of [...sharedFiles.value, ...mailboxFiles.value]) {
    if (item.isDir) paths.add(item.path)
  }
  return [...paths].sort()
})

const folderUploadName = computed(() => {
  if (!pendingFolderItems.value.length) return ''
  const first = pendingFolderItems.value[0].relativePath
  return first.split('/').filter(Boolean)[0] || ''
})

const canConfirmUpload = computed(() =>
  uploadMode.value === 'folder'
    ? pendingFolderItems.value.length > 0 && !!folderUploadName.value
    : pendingFiles.value.length > 0
)

const confirmUploadLabel = computed(() => {
  if (uploadMode.value === 'folder' && pendingFolderItems.value.length) {
    return `上传文件夹 (${pendingFolderItems.value.length})`
  }
  if (uploadMode.value === 'file' && pendingFiles.value.length) {
    return `上传 (${pendingFiles.value.length})`
  }
  return '上传'
})

function toggleDir(name) {
  expanded[name] = !expanded[name]
}

async function copyPath(path) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(path)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = path
      textArea.style.position = 'absolute'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }
    showSuccess(`路径已复制：${path}`)
  } catch {
    showError('复制失败，请重试')
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function getListForPath(path) {
  return path.startsWith('mailbox/') ? mailboxFiles : sharedFiles
}

function handleMkdir() {
  if (!mkdirName.value.trim()) return
  const dirName = mkdirName.value.trim() + '/'
  const path = mkdirParent.value + mkdirName.value.trim() + '/'
  const list = getListForPath(mkdirParent.value)
  if (!list.value.find(f => f.path === path)) {
    list.value.push({ name: dirName, path, isDir: true, fileObj: null })
    expandedPaths[path] = true
  }
  mkdirName.value = ''
  showMkdir.value = false
}

function openMkdirIn(path) {
  mkdirParent.value = path
  mkdirName.value = ''
  showMkdir.value = true
}

function openUploadTo(target) {
  uploadTarget.value = target
  uploadMode.value = 'file'
  pendingFiles.value = []
  pendingFolderItems.value = []
  showUpload.value = true
}

function handleFileSelect(e) {
  uploadMode.value = 'file'
  pendingFolderItems.value = []
  pendingFiles.value = Array.from(e.target.files)
  e.target.value = ''
}

function handleDirSelect(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  uploadMode.value = 'folder'
  pendingFiles.value = []
  pendingFolderItems.value = files.map(file => ({
    file,
    relativePath: normalizeRelativePath(file.webkitRelativePath || file.name),
  }))
  e.target.value = ''
}

async function handleDrop(e) {
  isDragging.value = false
  const items = Array.from(e.dataTransfer.items || [])
  const hasDirectory = items.some(item => {
    const entry = item.webkitGetAsEntry?.()
    return entry?.isDirectory
  })

  if (hasDirectory) {
    uploadMode.value = 'folder'
    pendingFiles.value = []
    const collected = []
    for (const item of items) {
      const entry = item.webkitGetAsEntry?.()
      if (entry) collected.push(...await readEntry(entry, ''))
    }
    pendingFolderItems.value = collected
    return
  }

  uploadMode.value = 'file'
  pendingFolderItems.value = []
  pendingFiles.value = Array.from(e.dataTransfer.files)
}

function normalizeRelativePath(path) {
  return path.replace(/\\/g, '/')
}

async function readAllEntries(reader) {
  const all = []
  while (true) {
    const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject))
    if (!batch.length) break
    all.push(...batch)
  }
  return all
}

async function readEntry(entry, basePath) {
  if (entry.isFile) {
    return new Promise(resolve => {
      entry.file(file => {
        resolve([{
          file,
          relativePath: normalizeRelativePath(basePath + file.name),
        }])
      })
    })
  }
  if (entry.isDirectory) {
    const entries = await readAllEntries(entry.createReader())
    const nested = await Promise.all(
      entries.map(child => readEntry(child, basePath + entry.name + '/'))
    )
    return nested.flat()
  }
  return []
}

function getRootPrefix(path) {
  return path.startsWith('mailbox/') ? 'mailbox/' : 'shared/'
}

function ensureDirPath(list, dirPath, rootPrefix) {
  if (!dirPath.startsWith(rootPrefix) || dirPath === rootPrefix) return
  const relative = dirPath.slice(rootPrefix.length)
  const parts = relative.split('/').filter(Boolean)
  let acc = rootPrefix
  for (const part of parts) {
    acc += part + '/'
    if (!list.value.some(f => f.path === acc)) {
      list.value.push({ name: part + '/', path: acc, isDir: true, fileObj: null })
    }
    expandedPaths[acc] = true
  }
}

function expandAfterUpload(path) {
  const rootPrefix = getRootPrefix(path)
  if (rootPrefix === 'shared/') expanded.shared = true
  else expanded.mailbox = true

  const relative = path.slice(rootPrefix.length)
  const parts = relative.split('/').filter(Boolean)
  let acc = rootPrefix
  for (const part of parts) {
    acc += part + '/'
    expandedPaths[acc] = true
  }
}

function confirmUpload() {
  if (uploadMode.value === 'folder') confirmFolderUpload()
  else confirmFileUpload()
}

function confirmFileUpload() {
  const list = getListForPath(uploadTarget.value)
  const count = pendingFiles.value.length
  const target = uploadTarget.value

  for (const file of pendingFiles.value) {
    const fullPath = target + file.name
    if (!list.value.find(f => f.path === fullPath)) {
      list.value.push({ name: file.name, path: fullPath, isDir: false, fileObj: file })
    }
  }

  pendingFiles.value = []
  showUpload.value = false
  expandAfterUpload(target)
  showSuccess(`已上传 ${count} 个文件到 ${target}`)
}

function confirmFolderUpload() {
  const folderName = folderUploadName.value
  if (!folderName) {
    showError('无法识别文件夹，请重新选择')
    return
  }

  const list = getListForPath(uploadTarget.value)
  const rootPrefix = getRootPrefix(uploadTarget.value)
  const containerPath = uploadTarget.value + folderName + '/'

  ensureDirPath(list, containerPath, rootPrefix)
  expandedPaths[containerPath] = true

  let uploadedCount = 0
  for (const { file, relativePath } of pendingFolderItems.value) {
    const innerPath = relativePath.startsWith(folderName + '/')
      ? relativePath.slice(folderName.length + 1)
      : relativePath === folderName
        ? ''
        : relativePath

    if (!innerPath) continue

    const fullPath = containerPath + innerPath
    const parentDir = fullPath.slice(0, fullPath.lastIndexOf('/') + 1)
    ensureDirPath(list, parentDir, rootPrefix)

    if (!list.value.find(f => f.path === fullPath)) {
      list.value.push({ name: file.name, path: fullPath, isDir: false, fileObj: file })
      uploadedCount++
    }
  }

  pendingFolderItems.value = []
  showUpload.value = false
  expandAfterUpload(containerPath)
  showSuccess(`已创建 ${containerPath} 并上传 ${uploadedCount} 个文件`)
}

function cancelUpload() {
  pendingFiles.value = []
  pendingFolderItems.value = []
  uploadMode.value = 'file'
  showUpload.value = false
}

function askDelete(item) {
  deleteTarget.value = item
}

function confirmDelete() {
  if (!deleteTarget.value) return
  const path = deleteTarget.value.path
  if (deleteTarget.value.isDir) {
    sharedFiles.value = sharedFiles.value.filter(f => !f.path.startsWith(path))
    mailboxFiles.value = mailboxFiles.value.filter(f => !f.path.startsWith(path))
  } else {
    sharedFiles.value = sharedFiles.value.filter(f => f.path !== path)
    mailboxFiles.value = mailboxFiles.value.filter(f => f.path !== path)
  }
  deleteTarget.value = null
}

function downloadFile(item) {
  if (item.isDir || !item.fileObj) return
  const url = URL.createObjectURL(item.fileObj)
  const a = document.createElement('a')
  a.href = url
  a.download = item.name
  a.click()
  URL.revokeObjectURL(url)
}

const VIRTUAL_DISK_PATHS = [
  { label: 'workspace / 工作目录', value: 'workspace/', kind: 'folder' },
  { label: 'assets / 用户上传', value: 'assets/', kind: 'folder' },
  { label: 'memory / 长期记忆', value: 'memory/', kind: 'folder' },
  { label: 'temp / 临时区', value: 'temp/', kind: 'folder' },
]

function getMentionFileItems() {
  const items = [
    { label: 'shared / 核心知识库', value: 'shared/', kind: 'folder' },
    { label: 'mailbox / 用户传递', value: 'mailbox/', kind: 'folder' },
    ...VIRTUAL_DISK_PATHS,
  ]

  const seen = new Set(items.map(i => i.value))
  for (const item of [...sharedFiles.value, ...mailboxFiles.value]) {
    if (seen.has(item.path)) continue
    seen.add(item.path)
    items.push({
      label: item.name.replace(/\/$/, ''),
      value: item.path,
      kind: item.isDir ? 'folder' : 'file',
    })
  }

  return items
}

defineExpose({ getMentionFileItems })
</script>

<style scoped>
.file-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Panel header ── */
.panel-header {
  padding: 20px 24px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: -0.01em;
}
.header-btn {
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: none;
  transition: background 0.15s, color 0.15s;
}
.header-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* ── Tree view ── */
.tree-view {
  padding: 0 16px 20px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-width: none;
}
.tree-view::-webkit-scrollbar {
  display: none;
}

/* ── Folder block ── */
.folder-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.folder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  border-radius: 6px;
  user-select: none;
  transition: background 0.15s;
}
.folder-header:hover {
  background: #f3f4f6;
}

.folder-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.folder-header-actions {
  display: flex;
  align-items: center;
  gap: 0;
}

.folder-action {
  opacity: 0;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 500;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: opacity 0.2s, color 0.15s, background 0.15s;
  cursor: pointer;
}
.folder-header:hover .folder-action {
  opacity: 1;
}
.folder-action:hover {
  color: #374151;
  background: #e5e7eb;
}

.folder-chevron {
  color: var(--color-text-muted);
  font-size: 14px;
  transition: transform 0.2s;
  flex-shrink: 0;
}
.folder-header.expanded .folder-chevron {
  transform: rotate(90deg);
}

/* Contextual description */
.folder-desc {
  margin: 0 8px 6px 32px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
  opacity: 1;
  max-height: 120px;
}
.folder-header.expanded + .folder-desc {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  overflow: hidden;
  transform: scaleY(0.9);
}
.folder-contents {
  display: none;
  margin-left: 14px;
  border-left: 1px solid var(--color-border);
  padding-left: 8px;
}
.folder-contents.expanded {
  display: block;
}

.empty-dir {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 6px 8px;
  font-style: italic;
}

/* ── File nodes ── */
.file-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--color-text);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 2px;
  position: relative;
  transition: background 0.15s;
}
.file-node:hover {
  background: var(--color-bg-secondary);
}
.file-icon {
  color: var(--color-text-muted);
  font-size: 14px;
  flex-shrink: 0;
}
.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}
.file-actions {
  display: flex;
  gap: 0;
  flex-shrink: 0;
}
.file-action-btn {
  font-size: 11px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 1px 2px;
  border-radius: 4px;
  color: var(--color-text-muted);
  transition: all 0.1s;
}
.file-action-btn:hover {
  background: var(--color-bg-secondary);
}
.file-action-del:hover {
  color: var(--color-error);
}

/* ── Modals ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.help-dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.close-x {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-muted);
}
.help-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.65;
  max-height: 60vh;
  overflow-y: auto;
}
.help-body p {
  margin: 0;
}
.help-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}
.btn-ok {
  padding: 7px 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ok:hover {
  background: var(--color-primary-hover);
}

.simple-dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  width: 100%;
  max-width: 380px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.simple-dialog-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}
.simple-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.simple-select,
.simple-input {
  padding: 7px 10px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  outline: none;
  font-family: inherit;
}
.simple-select:focus,
.simple-input:focus {
  border-color: var(--color-primary);
}
.simple-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.btn-ghost-sm {
  padding: 6px 16px;
  font-size: 13px;
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}
.btn-primary-sm {
  padding: 6px 16px;
  font-size: 13px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}
.btn-primary-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-danger-sm {
  padding: 6px 16px;
  font-size: 13px;
  background: var(--color-error);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}
.btn-danger-sm:hover {
  opacity: 0.88;
}

.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.7;
  transition: border-color 0.15s, background 0.15s;
}
.upload-zone-active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}
.upload-target-path {
  padding: 7px 10px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 13px;
  font-family: var(--font-mono, monospace);
}
.upload-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.upload-sep {
  color: var(--color-text-muted);
  font-size: 12px;
}

.folder-upload-preview {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.folder-upload-preview-title {
  font-size: 12px;
  color: var(--color-text-muted);
}
.folder-upload-preview-path {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  font-family: var(--font-mono, monospace);
  word-break: break-all;
}
.folder-upload-preview-count {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.upload-label {
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 160px;
  overflow-y: auto;
}
.pending-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  font-size: 12px;
}
.pending-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-secondary);
}
.pending-size {
  font-size: 11px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.pending-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: var(--color-text-muted);
  padding: 0 2px;
  flex-shrink: 0;
}
.pending-remove:hover {
  color: var(--color-error);
}

.delete-confirm-body {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
