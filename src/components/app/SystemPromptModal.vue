<template>
  <Teleport to="body">
    <Transition name="prompt-modal">
      <div v-if="visible" class="prompt-overlay" @click.self="handleClose">
        <div class="prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="prompt-modal-title">
          <!-- Header -->
          <header class="prompt-header">
            <div class="header-left">
              <span class="header-kicker">PROMPT</span>
              <h2 id="prompt-modal-title" class="header-title">系统提示词</h2>
            </div>

            <div class="header-tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                class="tab-btn"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="header-right">
              <div v-if="activeTab !== 'preview'" class="ref-wrap">
                <button type="button" class="ref-btn" @click="showRefPanel = !showRefPanel">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  快速引用文件 / 工具
                </button>

                <div v-if="showRefPanel" class="ref-panel">
                  <div v-if="fileRefs.length" class="ref-group">
                    <div class="ref-group-label">工作区路径</div>
                    <button
                      v-for="item in fileRefs"
                      :key="item.value"
                      type="button"
                      class="ref-item"
                      @click="insertRef(buildMentionInsertText(item))"
                    >
                      <span class="ref-item-name">{{ item.label }}</span>
                      <span class="ref-item-path">{{ buildMentionInsertText(item) }}</span>
                    </button>
                  </div>
                  <div v-if="toolRefs.length" class="ref-group">
                    <div class="ref-group-label">工具</div>
                    <button
                      v-for="item in toolRefs"
                      :key="item.value"
                      type="button"
                      class="ref-item"
                      @click="insertRef(buildMentionInsertText(item))"
                    >
                      <span class="ref-item-name">{{ item.label }}</span>
                      <span class="ref-item-path">{{ buildMentionInsertText(item) }}</span>
                    </button>
                  </div>
                  <div v-if="!fileRefs.length && !toolRefs.length" class="ref-empty">
                    暂无可引用项，请先启用工具或上传文件
                  </div>
                </div>
              </div>

              <button type="button" class="close-btn" aria-label="关闭" @click="handleClose">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </header>

          <!-- Body -->
          <div class="prompt-body">
            <!-- 编辑 - 预览（分栏） -->
            <div v-if="activeTab === 'split'" class="split-view">
              <div class="pane pane-editor">
                <div class="editor-wrap">
                  <textarea
                    ref="editorRef"
                    v-model="draft"
                    class="editor-input"
                    spellcheck="false"
                    placeholder="定义 App 的角色、行为边界以及如何使用工作区资源…"
                    @input="onEditorInput"
                    @keydown="onEditorKeydown"
                    @click="onEditorInput"
                    @keyup="onEditorInput"
                  ></textarea>
                  <MentionPicker
                    v-if="mentionOpen"
                    :folders="filteredFolders"
                    :tools="filteredTools"
                    :active-index="mentionIndex"
                    :style="mentionStyle"
                    @select="selectMention"
                    @hover="mentionIndex = $event"
                  />
                </div>
              </div>
              <div class="pane-divider"></div>
              <div class="pane pane-preview">
                <div
                  v-if="draft.trim()"
                  class="preview-content markdown-body"
                  v-html="previewHtml"
                ></div>
                <div v-else class="preview-empty">预览将在这里实时显示</div>
              </div>
            </div>

            <!-- 纯编辑 -->
            <div v-else-if="activeTab === 'edit'" class="single-view">
              <div class="editor-wrap editor-wrap-full">
                <textarea
                  ref="editorRef"
                  v-model="draft"
                  class="editor-input editor-input-full"
                  spellcheck="false"
                  placeholder="定义 App 的角色、行为边界以及如何使用工作区资源…"
                  @input="onEditorInput"
                  @keydown="onEditorKeydown"
                  @click="onEditorInput"
                  @keyup="onEditorInput"
                ></textarea>
                <MentionPicker
                  v-if="mentionOpen"
                  :folders="filteredFolders"
                  :tools="filteredTools"
                  :active-index="mentionIndex"
                  :style="mentionStyle"
                  @select="selectMention"
                  @hover="mentionIndex = $event"
                />
              </div>
            </div>

            <!-- 纯预览 -->
            <div v-else class="single-view single-view-preview">
              <div
                v-if="draft.trim()"
                class="preview-content preview-content-full markdown-body"
                v-html="previewHtml"
              ></div>
              <div v-else class="preview-empty">暂无内容，请先在编辑模式输入提示词</div>
            </div>
          </div>

          <!-- Footer -->
          <footer class="prompt-footer">
            <span class="char-count">{{ charCount }} 字</span>
            <button type="button" class="btn-done" @click="handleDone">完成</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import MentionPicker from '@/components/app/MentionPicker.vue'
import {
  detectMention,
  getTextareaCaretCoords,
  buildMentionInsertText,
  filterMentionItems,
} from '@/composables/useAtMention'

const props = defineProps({
  visible: { type: Boolean, default: false },
  modelValue: { type: String, default: '' },
  fileRefs: { type: Array, default: () => [] },
  toolRefs: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:visible', 'update:modelValue', 'done', 'close'])

const tabs = [
  { id: 'split', label: '编辑 - 预览' },
  { id: 'edit', label: '纯编辑' },
  { id: 'preview', label: '纯预览' },
]

const activeTab = ref('split')
const draft = ref('')
const showRefPanel = ref(false)
const editorRef = ref(null)

const mentionOpen = ref(false)
const mentionQuery = ref('')
const mentionRange = ref(null)
const mentionIndex = ref(0)
const mentionStyle = ref({ top: '0px', left: '0px' })

const previewHtml = computed(() => renderMarkdown(draft.value))
const charCount = computed(() => draft.value.length)

const filteredFolders = computed(() =>
  filterMentionItems(props.fileRefs, mentionQuery.value)
)

const filteredTools = computed(() =>
  filterMentionItems(props.toolRefs, mentionQuery.value)
)

const flatMentionItems = computed(() => [
  ...filteredFolders.value,
  ...filteredTools.value,
])

watch(
  () => props.visible,
  (open) => {
    if (open) {
      draft.value = props.modelValue || ''
      activeTab.value = 'split'
      showRefPanel.value = false
      closeMention()
      nextTick(() => focusEditor())
    }
  },
)

watch(activeTab, (tab) => {
  if (tab === 'split' || tab === 'edit') {
    closeMention()
    nextTick(() => focusEditor())
  }
  if (tab === 'preview') {
    showRefPanel.value = false
    closeMention()
  }
})

watch(flatMentionItems, (items) => {
  if (mentionIndex.value >= items.length) {
    mentionIndex.value = Math.max(0, items.length - 1)
  }
})

function focusEditor() {
  editorRef.value?.focus()
}

function closeMention() {
  mentionOpen.value = false
  mentionQuery.value = ''
  mentionRange.value = null
  mentionIndex.value = 0
}

function updateMentionState() {
  const el = editorRef.value
  if (!el || activeTab.value === 'preview') {
    closeMention()
    return
  }

  const cursor = el.selectionStart
  const detected = detectMention(draft.value, cursor)

  if (!detected) {
    closeMention()
    return
  }

  mentionQuery.value = detected.query
  mentionRange.value = { start: detected.start, end: detected.end }
  mentionOpen.value = true
  mentionIndex.value = 0

  const coords = getTextareaCaretCoords(el, cursor)
  mentionStyle.value = {
    top: `${coords.top}px`,
    left: `${Math.min(coords.left, el.clientWidth - 280)}px`,
  }
}

function onEditorInput() {
  updateMentionState()
}

function onEditorKeydown(e) {
  if (mentionOpen.value && flatMentionItems.value.length) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      mentionIndex.value = (mentionIndex.value + 1) % flatMentionItems.value.length
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      mentionIndex.value =
        (mentionIndex.value - 1 + flatMentionItems.value.length) % flatMentionItems.value.length
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      selectMention(flatMentionItems.value[mentionIndex.value])
      return
    }
  }

  if (e.key === 'Escape') {
    if (mentionOpen.value) {
      e.preventDefault()
      e.stopPropagation()
      closeMention()
      return
    }
    e.stopPropagation()
    handleClose()
  }
}

function selectMention(item) {
  if (!item || !mentionRange.value) return

  const el = editorRef.value
  const { start, end } = mentionRange.value
  const insertText = buildMentionInsertText(item)
  draft.value = draft.value.slice(0, start) + insertText + draft.value.slice(end)

  closeMention()

  nextTick(() => {
    if (!el) return
    const pos = start + insertText.length
    el.focus()
    el.setSelectionRange(pos, pos)
  })
}

function insertRef(value) {
  const el = editorRef.value
  if (!el) {
    draft.value += value
    showRefPanel.value = false
    return
  }

  const start = el.selectionStart
  const end = el.selectionEnd
  const before = draft.value.slice(0, start)
  const after = draft.value.slice(end)
  draft.value = before + value + after

  nextTick(() => {
    const pos = start + value.length
    el.focus()
    el.setSelectionRange(pos, pos)
  })

  showRefPanel.value = false
  closeMention()
}

function handleDone() {
  emit('update:modelValue', draft.value)
  emit('done', draft.value)
  emit('update:visible', false)
  emit('close')
}

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.visible && !mentionOpen.value) {
    handleClose()
  }
}

function onDocClick(e) {
  if (!showRefPanel.value) return
  const wrap = document.querySelector('.ref-wrap')
  if (wrap && !wrap.contains(e.target)) {
    showRefPanel.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
.prompt-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(8px);
}

.prompt-dialog {
  width: min(1120px, 100%);
  height: min(760px, calc(100vh - 64px));
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.prompt-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.header-kicker {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.header-tabs {
  display: inline-flex;
  padding: 3px;
  background: var(--color-bg-secondary);
  border-radius: 10px;
  gap: 2px;
}

.tab-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--color-text);
}

.tab-btn.active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.35);
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.ref-wrap {
  position: relative;
}

.ref-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.ref-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.ref-btn svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.ref-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  max-height: 320px;
  overflow-y: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  padding: 8px;
  z-index: 10;
}

.ref-group + .ref-group {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.ref-group-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 4px 8px 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ref-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}

.ref-item:hover {
  background: var(--color-bg-secondary);
}

.ref-item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.ref-item-path {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}

.ref-empty {
  padding: 16px 12px;
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.5;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

/* Body */
.prompt-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.split-view {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  height: 100%;
}

.pane {
  min-height: 0;
  overflow: hidden;
}

.pane-editor {
  display: flex;
  flex-direction: column;
  position: relative;
}

.editor-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.editor-wrap-full {
  height: 100%;
}

.editor-input {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 24px 28px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
}

.pane-divider {
  background: var(--color-border);
}

.pane-preview {
  overflow-y: auto;
  background: #fafafa;
}

.preview-content {
  padding: 24px 28px;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: var(--color-text-muted);
}

.single-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.single-view-preview {
  overflow-y: auto;
  background: #fafafa;
}

.editor-input-full {
  flex: 1;
  height: 100%;
}

.preview-content-full {
  flex: 1;
  min-height: 100%;
}

/* Markdown preview */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin: 0 0 12px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
}

.markdown-body :deep(h1) { font-size: 20px; }
.markdown-body :deep(h2) { font-size: 17px; margin-top: 20px; }
.markdown-body :deep(h3) { font-size: 15px; margin-top: 16px; }

.markdown-body :deep(p),
.markdown-body :deep(li) {
  font-size: 14px;
  line-height: 1.75;
  color: var(--color-text-secondary);
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0 0 12px;
  padding-left: 20px;
}

.markdown-body :deep(code) {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--color-bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
}

.markdown-body :deep(pre) {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 12px 14px;
  overflow-x: auto;
  margin: 0 0 12px;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}

/* Footer */
.prompt-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.char-count {
  font-size: 12px;
  color: var(--color-text-muted);
}

.btn-done {
  padding: 8px 22px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-done:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

/* Transition */
.prompt-modal-enter-active,
.prompt-modal-leave-active {
  transition: opacity 0.2s ease;
}

.prompt-modal-enter-active .prompt-dialog,
.prompt-modal-leave-active .prompt-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.prompt-modal-enter-from,
.prompt-modal-leave-to {
  opacity: 0;
}

.prompt-modal-enter-from .prompt-dialog,
.prompt-modal-leave-to .prompt-dialog {
  transform: scale(0.98) translateY(8px);
  opacity: 0;
}

@media (max-width: 900px) {
  .prompt-overlay {
    padding: 16px;
  }

  .prompt-header {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .header-tabs {
    justify-self: start;
  }

  .header-right {
    justify-content: space-between;
  }

  .split-view {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1px 1fr;
  }
}
</style>
