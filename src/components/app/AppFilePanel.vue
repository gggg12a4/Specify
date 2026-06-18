<template>
  <div class="file-panel">
    <!-- ── 上半部：App 资料 ── -->
    <div class="panel-section app-resource">
      <div class="section-header">
        <span class="section-title">📁 App 资料</span>
        <div class="header-btns">
          <button class="hdr-btn" title="新建文件夹" @click="showMkdir = true">+ 文件夹</button>
          <button class="hdr-btn" title="上传文件" @click="openUpload">上传</button>
        </div>
      </div>
      <p class="guide-text">在这里管理你的 App 资料，复制路径后在提示词中引用，AI 即可读取使用。</p>

      <div class="tree-body">
        <!-- shared/ -->
        <div class="dir-node">
          <div class="dir-row" @click="toggleDir('shared')">
            <span class="dir-arrow">{{ expanded.shared ? '▾' : '▸' }}</span>
            <span class="dir-name">shared/</span>
            <button class="copy-btn" title="复制路径" @click.stop="copyPath('shared/')">📋</button>
          </div>
          <div v-if="expanded.shared" class="dir-children">
            <div v-if="!sharedFiles.length" class="empty-dir">（空）</div>
            <div
              v-for="item in sharedFiles" :key="item.path"
              class="file-row"
              @mouseenter="hovered = item.path"
              @mouseleave="hovered = null"
            >
              <span class="file-icon">{{ item.isDir ? '▸' : '📄' }}</span>
              <span class="file-name">{{ item.name }}</span>
              <div v-if="hovered === item.path" class="file-actions">
                <button class="file-btn" title="复制路径" @click.stop="copyPath(item.path)">📋</button>
                <button v-if="!item.isDir" class="file-btn" title="下载" @click.stop="downloadFile(item)">⬇</button>
                <button class="file-btn file-btn-del" title="删除" @click.stop="askDelete(item)">🗑</button>
              </div>
            </div>
          </div>
        </div>

        <!-- mailbox/ -->
        <div class="dir-node">
          <div class="dir-row" @click="toggleDir('mailbox')">
            <span class="dir-arrow">{{ expanded.mailbox ? '▾' : '▸' }}</span>
            <span class="dir-name">mailbox/</span>
            <button class="help-btn" title="查看使用说明" @click.stop="showMailboxHelp = true">?</button>
          </div>
          <div v-if="expanded.mailbox" class="dir-children">
            <div v-if="!mailboxFiles.length" class="empty-dir">（空）</div>
            <div
              v-for="item in mailboxFiles" :key="item.path"
              class="file-row"
              @mouseenter="hovered = item.path"
              @mouseleave="hovered = null"
            >
              <span class="file-icon">{{ item.isDir ? '▸' : '📄' }}</span>
              <span class="file-name">{{ item.name }}</span>
              <div v-if="hovered === item.path" class="file-actions">
                <button class="file-btn" title="复制路径" @click.stop="copyPath(item.path)">📋</button>
                <button v-if="!item.isDir" class="file-btn" title="下载" @click.stop="downloadFile(item)">⬇</button>
                <button class="file-btn file-btn-del" title="删除" @click.stop="askDelete(item)">🗑</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="panel-divider">─ ─ ─ ─ ─ ─ ─ ─</div>

    <!-- ── 下半部：用户网盘说明 ── -->
    <div class="panel-section user-disk">
      <div class="disk-header">💡 用户网盘说明</div>
      <p class="disk-intro">如果你的 App 需要帮用户处理文件，可在提示词中使用以下文件夹名来引用。Specify 会自动为每个用户创建独立个人网盘。不涉及文件操作可跳过。</p>

      <div v-for="d in diskDirs" :key="d.name" class="disk-dir">
        <div class="disk-dir-name">📂 {{ d.name }}</div>
        <div class="disk-dir-label">{{ d.label }}</div>
        <div class="disk-dir-desc">{{ d.desc }}</div>
        <div v-if="d.note" class="disk-dir-note">⚡ {{ d.note }}</div>
      </div>

      <div class="disk-example">
        <div class="disk-example-title">提示词中可以引用这些文件夹：</div>
        <div class="disk-example-code">"将报告保存到用户的 workspace/"</div>
        <div class="disk-example-code">"把要点记录到用户的 memory/"</div>
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
                <option value="shared/">shared/</option>
                <option value="mailbox/">mailbox/</option>
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
            <div class="simple-dialog-title">上传文件</div>
            <div class="simple-field">
              <label>上传到：</label>
              <select v-model="uploadTarget" class="simple-select">
                <option value="shared/">shared/</option>
                <option value="mailbox/">mailbox/</option>
              </select>
            </div>
            <div
              class="upload-zone"
              :class="{ 'upload-zone-active': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <p>拖拽文件到此处</p>
              <p>或 <label class="upload-label">点击选择文件<input ref="fileInputRef" type="file" multiple hidden @change="handleFileSelect" /></label></p>
            </div>
            <!-- 待上传文件列表 -->
            <div v-if="pendingFiles.length" class="pending-list">
              <div v-for="(f, i) in pendingFiles" :key="i" class="pending-item">
                <span class="pending-name">{{ f.name }}</span>
                <span class="pending-size">{{ formatSize(f.size) }}</span>
                <button class="pending-remove" @click="pendingFiles.splice(i, 1)">✕</button>
              </div>
            </div>
            <div class="simple-footer">
              <button class="btn-ghost-sm" @click="cancelUpload">取消</button>
              <button class="btn-primary-sm" :disabled="!pendingFiles.length" @click="confirmUpload">
                上传 {{ pendingFiles.length ? `(${pendingFiles.length})` : '' }}
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
              确定要删除 <strong>{{ deleteTarget.name }}</strong> 吗？此操作不可撤销。
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
import { ref, reactive } from 'vue'

const expanded = reactive({ shared: true, mailbox: false })
const hovered = ref(null)
const showMailboxHelp = ref(false)
const showMkdir = ref(false)
const showUpload = ref(false)
const mkdirParent = ref('shared/')
const mkdirName = ref('')
const uploadTarget = ref('shared/')
const pendingFiles = ref([])
const isDragging = ref(false)
const deleteTarget = ref(null)
const fileInputRef = ref(null)

const sharedFiles = ref([
  { name: 'skills/', path: 'shared/skills/', isDir: true, fileObj: null }
])
const mailboxFiles = ref([])

const diskDirs = [
  { name: 'workspace/', label: '主文件夹', desc: '用户和 AI 的主要工作目录，产出物默认保存在这里' },
  { name: 'temp/', label: '临时区（定期清理）', desc: '工具运行的中间结果暂存在此，无需手动管理' },
  { name: 'memory/', label: '记忆磁盘', desc: '需要长期记忆的内容可放在这里，适合保存用户偏好、关键结论等', note: '写入需启用 SPmake' },
  { name: 'assets/', label: '用户上传内容', desc: '用户在对话中上传的文件自动保存到这里' }
]

function toggleDir(name) {
  expanded[name] = !expanded[name]
}

async function copyPath(path) {
  try {
    await navigator.clipboard.writeText(path)
  } catch {
    // fallback silently
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function handleMkdir() {
  if (!mkdirName.value.trim()) return
  const dirName = mkdirName.value.trim() + '/'
  const path = mkdirParent.value + mkdirName.value.trim() + '/'
  const list = mkdirParent.value === 'shared/' ? sharedFiles : mailboxFiles
  if (!list.value.find(f => f.path === path)) {
    list.value.push({ name: dirName, path, isDir: true, fileObj: null })
  }
  mkdirName.value = ''
  showMkdir.value = false
}

function openUpload() {
  pendingFiles.value = []
  showUpload.value = true
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files)
  mergeIntoPending(files)
  e.target.value = ''
}

function handleDrop(e) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => !f.type.startsWith(''))
  mergeIntoPending(Array.from(e.dataTransfer.files))
}

function mergeIntoPending(files) {
  for (const f of files) {
    if (!pendingFiles.value.find(p => p.name === f.name)) {
      pendingFiles.value.push(f)
    }
  }
}

function confirmUpload() {
  const list = uploadTarget.value === 'shared/' ? sharedFiles : mailboxFiles
  for (const file of pendingFiles.value) {
    const path = uploadTarget.value + file.name
    if (!list.value.find(f => f.path === path)) {
      list.value.push({ name: file.name, path, isDir: false, fileObj: file })
    }
  }
  pendingFiles.value = []
  showUpload.value = false
}

function cancelUpload() {
  pendingFiles.value = []
  showUpload.value = false
}

function askDelete(item) {
  deleteTarget.value = item
}

function confirmDelete() {
  if (!deleteTarget.value) return
  const path = deleteTarget.value.path
  sharedFiles.value = sharedFiles.value.filter(f => f.path !== path)
  mailboxFiles.value = mailboxFiles.value.filter(f => f.path !== path)
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
</script>

<style scoped>
.file-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
}
.file-panel::-webkit-scrollbar {
  display: none;
}

/* ── App 资料区 ── */
.app-resource {
  flex-shrink: 0;
}

.panel-section {
  padding: 12px 14px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text);
}
.header-btns {
  display: flex;
  gap: 4px;
}
.hdr-btn {
  font-size: 11px;
  padding: 3px 8px;
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

.guide-text {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0 0 8px;
}

/* Tree */
.tree-body {
  display: flex;
  flex-direction: column;
}

.dir-node {
  display: flex;
  flex-direction: column;
}
.dir-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  transition: background 0.1s;
  position: relative;
}
.dir-row:hover {
  background: var(--color-bg-secondary);
}
.dir-arrow {
  font-size: 9px;
  color: var(--color-text-muted);
  width: 12px;
  flex-shrink: 0;
}
.dir-name {
  font-size: 13px;
  color: var(--color-text);
  font-weight: 500;
  font-family: var(--font-mono, monospace);
  flex: 1;
  min-width: 0;
}
.copy-btn,
.help-btn {
  font-size: 11px;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  padding: 1px 3px;
  border-radius: 3px;
  transition: opacity 0.15s;
}
.dir-row:hover .copy-btn,
.dir-row:hover .help-btn {
  opacity: 1;
}
.help-btn {
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  font-size: 10px;
  font-weight: 600;
}
.help-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.dir-children {
  padding-left: 16px;
}
.empty-dir {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 3px 0;
  font-style: italic;
}
.file-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 0;
  position: relative;
}
.file-icon {
  font-size: 12px;
}
.file-name {
  font-size: 12px;
  color: var(--color-text-secondary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
.file-btn {
  font-size: 11px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 3px;
  color: var(--color-text-muted);
  transition: all 0.1s;
}
.file-btn:hover {
  background: var(--color-bg-secondary);
}
.file-btn-del:hover {
  color: var(--color-error);
}

/* ── 分隔 ── */
.panel-divider {
  font-size: 10px;
  color: var(--color-text-muted);
  padding: 4px 14px;
  opacity: 0.5;
  flex-shrink: 0;
}

/* ── 用户网盘说明 ── */
.user-disk {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}
.user-disk::-webkit-scrollbar {
  display: none;
}
.disk-header {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}
.disk-intro {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.55;
  margin: 0 0 12px;
}
.disk-dir {
  margin-bottom: 10px;
}
.disk-dir-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  font-family: var(--font-mono, monospace);
}
.disk-dir-label {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
  margin: 1px 0;
}
.disk-dir-desc {
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.disk-dir-note {
  font-size: 11px;
  color: var(--color-warning, #f59e0b);
}
.disk-example {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--color-border);
}
.disk-example-title {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}
.disk-example-code {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono, monospace);
  background: var(--color-bg-secondary);
  padding: 3px 6px;
  border-radius: 3px;
  margin-bottom: 3px;
}

/* ── 弹窗 ── */
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

/* 上传区 */
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
.upload-label {
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
}

/* 待上传列表 */
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

/* 删除确认 */
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
