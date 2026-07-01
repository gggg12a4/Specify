<template>
  <div class="tree-list">
    <div v-if="!children.length" class="empty-dir">（空）</div>

    <template v-for="item in children" :key="item.path">
      <div v-if="item.isDir" class="dir-block">
        <div
          class="dir-row"
          @mouseenter="hovered = item.path"
          @mouseleave="hovered = null"
        >
          <span
            class="folder-chevron"
            :class="{ expanded: isExpanded(item.path) }"
            @click="toggleExpand(item.path)"
          >▸</span>
          <FolderTypeIcon :size="14" />
          <span class="file-name" @click="toggleExpand(item.path)">{{ item.name }}</span>
          <div v-if="hovered === item.path" class="file-actions" @click.stop>
            <button class="file-action-btn" title="上传文件或文件夹" @click="$emit('upload', item.path)">
              <UploadIcon :size="12" />
            </button>
            <button class="file-action-btn" title="新建文件夹" @click="$emit('mkdir', item.path)">
              <PlusIcon :size="12" />
            </button>
            <button class="file-action-btn" title="复制路径" @click="$emit('copy', item.path)">
              <CopyIcon :size="12" />
            </button>
            <button class="file-action-btn file-action-del" title="删除" @click="$emit('delete', item)">
              <DeleteIcon :size="12" />
            </button>
          </div>
        </div>
        <div v-if="isExpanded(item.path)" class="dir-children">
          <FolderTreeList
            :files="files"
            :parent-path="item.path"
            :expanded-paths="expandedPaths"
            @upload="$emit('upload', $event)"
            @mkdir="$emit('mkdir', $event)"
            @copy="$emit('copy', $event)"
            @delete="$emit('delete', $event)"
            @download="$emit('download', $event)"
          />
        </div>
      </div>

      <div
        v-else
        class="file-node"
        @mouseenter="hovered = item.path"
        @mouseleave="hovered = null"
      >
        <span class="file-icon">📄</span>
        <span class="file-name">{{ item.name }}</span>
        <div v-if="hovered === item.path" class="file-actions" @click.stop>
          <button class="file-action-btn" title="复制路径" @click="$emit('copy', item.path)">
            <CopyIcon :size="12" />
          </button>
          <button class="file-action-btn" title="下载" @click="$emit('download', item)">⬇</button>
          <button class="file-action-btn file-action-del" title="删除" @click="$emit('delete', item)">
            <DeleteIcon :size="12" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * 递归文件树列表：渲染某父路径下的直接子项，子目录继续递归 FolderTreeList。
 * 操作事件（上传/新建/复制/删除/下载）向上冒泡给 AppFilePanel 处理。
 */
import { ref, computed } from 'vue'
import FolderTypeIcon from '@/components/app/FolderTypeIcon.vue'
import UploadIcon from '@/components/app/UploadIcon.vue'
import PlusIcon from '@/components/app/PlusIcon.vue'
import CopyIcon from '@/components/app/CopyIcon.vue'
import DeleteIcon from '@/components/app/DeleteIcon.vue'

const props = defineProps({
  files: { type: Array, required: true },
  parentPath: { type: String, required: true },
  expandedPaths: { type: Object, required: true },
})

defineEmits(['upload', 'mkdir', 'copy', 'delete', 'download', 'toggle-expand'])

const hovered = ref(null)

/** 当前父路径下的直接子文件/文件夹 */
const children = computed(() => getDirectChildren(props.files, props.parentPath))

/** 筛选 parentPath 下一层的直接子项（不含更深层） */
function getDirectChildren(files, parentPath) {
  return files.filter(item => {
    if (!item.path.startsWith(parentPath)) return false
    const rest = item.path.slice(parentPath.length)
    if (!rest) return false
    const normalized = rest.endsWith('/') ? rest.slice(0, -1) : rest
    return normalized.length > 0 && !normalized.includes('/')
  })
}

/** 判断某路径是否在 expandedPaths 中展开 */
function isExpanded(path) {
  return !!props.expandedPaths[path]
}

/** 切换子目录展开状态（直接修改 expandedPaths 对象） */
function toggleExpand(path) {
  props.expandedPaths[path] = !props.expandedPaths[path]
}
</script>

<style scoped>
.tree-list {
  display: flex;
  flex-direction: column;
}

.empty-dir {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 6px 8px;
  font-style: italic;
}

.dir-block {
  display: flex;
  flex-direction: column;
}

.dir-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px;
  font-size: 13px;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 2px;
  transition: background 0.15s;
}
.dir-row:hover {
  background: #f3f4f6;
}

.dir-children {
  margin-left: 14px;
  border-left: 1px solid var(--color-border);
  padding-left: 8px;
}

.folder-chevron {
  color: var(--color-text-muted);
  font-size: 14px;
  transition: transform 0.2s;
  flex-shrink: 0;
  width: 14px;
  text-align: center;
}
.folder-chevron.expanded {
  transform: rotate(90deg);
}

.file-node {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px;
  font-size: 13px;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 2px;
  transition: background 0.15s;
}
.file-node:hover {
  background: #f3f4f6;
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
  font-weight: 500;
  color: #374151;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.file-action-btn:hover {
  background: #e5e7eb;
}
.file-action-btn.file-action-del:hover {
  color: var(--color-error);
}
</style>
