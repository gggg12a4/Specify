<template>
  <div class="file-panel" :class="{ 'is-compact': isCompact }">
    <!-- 创建/编辑工具弹窗：紧凑资料侧栏 -->
    <template v-if="isCompact">
      <div class="compact-toolbar">
        <span class="compact-tool-item is-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          APP 资料
        </span>
        <button type="button" class="compact-tool-item" @click="openMkdirIn('shared/')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          新建文件夹
        </button>
        <button type="button" class="compact-tool-item" @click="openUploadTo('shared/')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          上传
        </button>
      </div>

      <div class="compact-tree">
        <div class="tree-root-row" :class="{ expanded: expanded.shared }" @click="toggleDir('shared')">
          <span class="folder-chevron">▸</span>
          <FolderTypeIcon :size="14" />
          <span class="tree-root-name">shared/</span>
        </div>
        <div v-show="expanded.shared" class="tree-root-children">
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

      <p class="compact-tip">
        可以从文件行 📋 复制路径，粘贴到右侧系统提示词中引用。
      </p>
    </template>

    <template v-else>
    <div class="root-path">
      <svg class="root-path-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
      <span class="root-path-text">~/{{ appName || 'App' }}/</span>
    </div>

    <div class="panel-scroll">
      <!-- APP 空间 -->
      <section class="space-section">
        <div class="space-head">
          <span class="space-title">APP 空间</span>
          <span class="space-badge badge-rw">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            可读写
          </span>
        </div>
        <p class="space-desc">
          应用本身的共享空间:搭建所需的文件、技能 Skill 与资料,对所有终端用户共享。
        </p>
        <div class="space-actions">
          <button type="button" class="space-action-btn" @click="openMkdirIn('shared/')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            新建文件夹
          </button>
          <button type="button" class="space-action-btn" @click="openUploadTo('shared/')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            上传
          </button>
        </div>

        <div class="space-tree">
          <div class="tree-root-row" :class="{ expanded: expanded.shared }" @click="toggleDir('shared')">
            <span class="folder-chevron">▸</span>
            <FolderTypeIcon :size="14" />
            <span class="tree-root-name">shared/</span>
          </div>
          <div v-show="expanded.shared" class="tree-root-children">
            <FolderTreeList :files="sharedFiles" parent-path="shared/" :expanded-paths="expandedPaths"
              @upload="openUploadTo" @mkdir="openMkdirIn" @copy="copyPath" @delete="askDelete"
              @download="downloadFile" />
          </div>

          <div class="tree-root-row mailbox-row mailbox-row--locked">
            <svg class="mailbox-lock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span class="tree-root-name">mailbox/</span>
            <button type="button" class="mailbox-help" title="mailbox 使用说明"
              @click.stop="showMailboxHelp = true">?</button>
          </div>
        </div>
      </section>

      <div class="section-divider" />

      <!-- 运行时 · 终端用户空间 -->
      <section class="space-section runtime-section">
        <div class="space-head">
          <span class="space-title">运行时 · 终端用户空间</span>
          <span class="space-badge badge-ro">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            只读
          </span>
        </div>

        <div class="runtime-card">
          <div class="runtime-card-head" :class="{ expanded: runtimeExpanded }"
            @click="runtimeExpanded = !runtimeExpanded">
            <span class="folder-chevron">▸</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span class="runtime-card-title">用户网盘</span>
            <span class="runtime-card-meta">运行时 · {{ runtimeFolders.length }} 项</span>
            <button type="button" class="runtime-help" title="用户网盘 · 介绍与使用"
              @click.stop="showRuntimeHelp = true">?</button>
          </div>

          <div v-show="runtimeExpanded" class="runtime-card-body">
            <div class="runtime-folder-grid">
              <button v-for="folder in runtimeFolders" :key="folder.value" type="button" class="runtime-folder"
                :title="folder.value" @click="copyPath(folder.value)">
                <FolderTypeIcon :size="14" />
                <span class="runtime-folder-name">{{ folder.shortName }}</span>
              </button>
            </div>
            <p class="runtime-footnote">
              终端用户运行时的私有空间。开发者不可编辑，仅供查看，可在提示词中引用路径。
            </p>
          </div>
        </div>
      </section>
    </div>
    </template>

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
              <p>用户 A：帮我把这份报告发给同事<br>→ AI 将报告写入 mailbox/<br>→ 系统返回加密文件名如 mailbox/a3f8c1e9_report.md<br>→ 用户 A 将文件名发给用户 B
              </p>
              <p>用户 B：同事给了我一份文件，文件名是 a3f8c1e9_report.md<br>→ AI 读取该文件并处理</p>
              <p><strong>📌 需要启用的工具</strong></p>
              <p>· SPmake — 写入 mailbox/ 必须使用 SPmake(安全写入，不覆盖已有内容)</p>
            </div>
            <div class="help-footer">
              <button class="btn-ok" @click="showMailboxHelp = false">知道了</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 用户网盘说明 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRuntimeHelp" class="overlay" @click="showRuntimeHelp = false">
          <div class="help-dialog help-dialog-wide" @click.stop>
            <div class="help-header">
              <span>用户网盘 · 介绍与使用</span>
              <button type="button" class="close-x" aria-label="关闭" @click="showRuntimeHelp = false">✕</button>
            </div>
            <div class="help-body help-body-rich">
              <section class="help-section">
                <h4 class="help-section-title">用户网盘是什么</h4>
                <p>
                  Specify 会为每个终端用户自动创建一块独立、隔离、互不可见的私有网盘。用户无需手动创建或管理，运行时自动分配。
                </p>
                <p class="help-sub-label">它固定包含四个目录：</p>
                <ul class="help-dir-list">
                  <li class="help-indent">
                    <code class="code-tag">workspace/</code>
                    <span>—— 主工作目录，对话产物默认保存在这里</span>
                  </li>
                  <li class="help-indent">
                    <code class="code-tag">temp/</code>
                    <span>—— 临时区，过程文件可随时清理</span>
                  </li>
                  <li class="help-indent">
                    <code class="code-tag">memory/</code>
                    <span>—— 记忆盘，沉淀长期上下文与用户偏好（写入需用 SPmake）</span>
                  </li>
                  <li class="help-indent">
                    <code class="code-tag">assets/</code>
                    <span>—— 用户在对话中上传的图片、文档等原始素材</span>
                  </li>
                </ul>
              </section>

              <section class="help-section">
                <h4 class="help-section-title">在提示词里怎么引用</h4>
                <p>直接用文件夹名引导 AI 读写即可，例如：</p>
                <ul class="help-example-list help-indent-deep">
                  <li class="help-indent">把生成的报告保存到 <code class="code-tag">workspace/report.md</code></li>
                  <li class="help-indent">先读取 <code class="code-tag">assets/</code> 里用户上传的文件再分析</li>
                  <li class="help-indent">把用户偏好记到 <code class="code-tag">memory/</code>，下次对话时参考</li>
                </ul>
              </section>

              <section class="help-section">
                <h4 class="help-section-title">注意</h4>
                <div class="help-indent">
                  <p>
                    这是<strong>运行时</strong>空间，只有真实用户对话时才存在；<strong>开发者在这里看不到、也不直接编辑</strong>（你编辑的是左侧的 <code
                      class="code-tag">shared/</code>）。
                  </p>
                  <p>
                    往 <code class="code-tag">memory/</code> 写入必须用 <strong>SPmake</strong>（安全写入，不覆盖已有内容）。
                  </p>
                </div>
              </section>
            </div>
            <div class="help-footer">
              <button type="button" class="btn-ok" @click="showRuntimeHelp = false">知道了</button>
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
            <div class="upload-zone" :class="{ 'upload-zone-active': isDragging }" @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false" @drop.prevent="handleDrop">
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
/**
 * App 编辑页左侧文件面板。
 * APP 空间（shared/mailbox 可读写）+ 运行时终端用户空间（只读预览）。
 * variant=compact：创建/编辑工具弹窗内的资料侧栏。
 */
import { ref, reactive, computed } from 'vue'
import FolderTypeIcon from '@/components/app/FolderTypeIcon.vue'
import FolderTreeList from '@/components/app/FolderTreeList.vue'
import { showSuccess, showError } from '@/composables/useNotification'

/** 模块级共享：编辑页与创建工具弹窗共用同一份文件树 */
const sharedFiles = ref([
  { name: 'skills/', path: 'shared/skills/', isDir: true, fileObj: null },
])
const mailboxFiles = ref([])
const expandedPaths = reactive({ 'shared/skills/': false })
const expanded = reactive({ shared: true, mailbox: false })

const props = defineProps({
  appName: { type: String, default: '' },
  /** default：完整编辑页侧栏；compact：创建工具弹窗侧栏 */
  variant: { type: String, default: 'default' },
})

const isCompact = computed(() => props.variant === 'compact')

const runtimeExpanded = ref(true)
const showMailboxHelp = ref(false)
const showRuntimeHelp = ref(false)
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

const VIRTUAL_DISK_PATHS = [
  { label: 'workspace / 工作目录', value: 'workspace/', shortName: 'workspace/', kind: 'folder' },
  { label: 'temp / 临时区', value: 'temp/', shortName: 'temp/', kind: 'folder' },
  { label: 'memory / 长期记忆', value: 'memory/', shortName: 'memory/', kind: 'folder' },
  { label: 'assets / 用户上传', value: 'assets/', shortName: 'assets/', kind: 'folder' },
]

const runtimeFolders = computed(() => VIRTUAL_DISK_PATHS)

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

function getMentionFileItems() {
  const items = [
    { label: 'shared/', value: 'shared/', kind: 'folder' },
    { label: 'mailbox/', value: 'mailbox/', kind: 'folder' },
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
  background: var(--color-surface);
  font-family: var(--font-sans);
}

.file-panel.is-compact {
  background: #fafbfc;
  border-right: 1px solid var(--color-border);
}

.compact-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  padding: 12px 14px 8px;
  flex-shrink: 0;
  border-bottom: 1px solid #eef0f3;
}

.compact-tool-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 2px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
  transition: color 0.15s;
}

.compact-tool-item svg {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.compact-tool-item:hover:not(.is-label) {
  color: var(--color-primary);
}

.compact-tool-item:hover:not(.is-label) svg {
  color: var(--color-primary);
}

.compact-tool-item.is-label {
  cursor: default;
  color: var(--color-text);
  font-weight: 600;
}

.compact-tree {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px 12px;
  min-height: 0;
}

.compact-tip {
  margin: 0;
  padding: 10px 14px 14px;
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--color-text-muted);
  border-top: 1px solid #eef0f3;
}

.root-path {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px 4px;
  flex-shrink: 0;
}

.root-path-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.root-path-text {
  font-size: 13px;
  font-weight: 500;
  color: black;
  font-family: var(--font-mono, monospace);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 14px 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
  scrollbar-width: thin;
}

.space-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.space-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.space-title {
  font-size: 10.5px;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: .6px;
  text-transform: uppercase;
  white-space: nowrap;
}

.space-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-bg-secondary);
  padding: 2px 8px;
  border-radius: 999px;
  line-height: 1.4;
}

.space-badge svg {
  flex-shrink: 0;
}

.space-desc {
  margin: 0;
  font-size: 11.5px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.space-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.space-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.space-action-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border-color: #d1d5db;
}

.space-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.tree-root-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.tree-root-row:hover {
  background: var(--color-bg-secondary);
}

.tree-root-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  font-family: var(--font-mono, monospace);
}

.mailbox-row .mailbox-lock {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.mailbox-row--locked {
  cursor: default;
}

.mailbox-row--locked:hover {
  background: transparent;
}

.mailbox-help,
.runtime-help {
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
}

.mailbox-help:hover,
.runtime-help:hover {
  background: #e5e7eb;
  color: var(--color-text-secondary);
}

.tree-root-children {
  margin-left: 12px;
  border-left: 1px solid var(--color-border);
  padding-left: 8px;
}

.folder-chevron {
  color: var(--color-text-muted);
  font-size: 13px;
  transition: transform 0.2s;
  flex-shrink: 0;
  width: 12px;
  text-align: center;
}

.tree-root-row.expanded .folder-chevron,
.runtime-card-head.expanded .folder-chevron {
  transform: rotate(90deg);
}

.section-divider {
  height: 1px;
  background: var(--color-border);
  margin: 18px 0;
}

.runtime-section {
  padding-bottom: 8px;
}

.runtime-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: #fafafa;
  overflow: hidden;
}

.runtime-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.runtime-card-head:hover {
  background: #f3f4f6;
}

.runtime-card-head svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.runtime-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
}

.runtime-card-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.runtime-card-body {
  padding: 0 12px 12px;
  border-top: 1px dashed var(--color-border);
}

.runtime-folder-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding-top: 12px;
}

.runtime-folder {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  min-width: 0;
}

.runtime-folder:hover {
  border-color: #d1d5db;
  background: var(--color-bg-secondary);
}

.runtime-folder-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  font-family: var(--font-mono, monospace);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runtime-footnote {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.55;
}

/* ── Modals ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10050;
  padding: 20px;
}

.help-dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.help-dialog-wide {
  max-width: 520px;
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

.help-body strong {
  color: #000000;
  font-weight: 600;
}

.help-body-rich {
  gap: 20px;
}

.help-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.help-section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.help-sub-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.help-indent {
  padding-left: 16px;
}

.help-indent-deep {
  padding-left: 32px;
}

.help-indent p+p {
  margin-top: 8px;
}

.help-dir-list,
.help-example-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-dir-list li,
.help-example-list li {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.code-tag {
  display: inline-block;
  padding: 1px 6px;
  font-size: 12px;
  font-family: var(--font-mono, monospace);
  color: var(--color-text);
  background: #f3f4f6;
  border-radius: 4px;
  vertical-align: baseline;
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
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
