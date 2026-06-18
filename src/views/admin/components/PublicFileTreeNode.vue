<template>
  <li class="tree-node">
    <div class="node-content" @mouseenter="hover = true" @mouseleave="hover = false" @click="toggle">
      <div class="node-icon">
        <svg v-if="node.is_dir" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="expanded" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          <path v-else d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
      </div>
      <span class="node-name">{{ node.name }}</span>

      <!-- Hover Actions -->
      <div v-show="hover" class="node-actions" @click.stop>
        <button class="action-btn" title="复制路径" @click="$emit('copy', node.path)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>

        <template v-if="node.is_dir">
          <button class="action-btn" title="上传至此" @click="$emit('upload-to', node.path)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </button>
          <!-- Added Delete for Directory -->
          <button v-if="node.path !== 'public'" class="action-btn text-danger" title="删除目录" @click="$emit('delete', node.path, true)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </template>
        <template v-else>
          <button class="action-btn text-danger" title="删除文件" @click="$emit('delete', node.path, false)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </template>
      </div>
    </div>

    <!-- Children -->
    <ul v-if="node.is_dir && expanded" class="tree-children">
      <!-- 添加加载中的提示 -->
      <li v-if="loading" class="tree-node loading-node">加载中...</li>
      <li v-else-if="hasLoaded && node.children.length === 0" class="tree-node empty-node">空文件夹</li>

        <PublicFileTreeNode
        v-else
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :expanded-paths="expandedPaths"
        @copy="$emit('copy', $event)"
        @delete="(path, isDir) => $emit('delete', path, isDir)"
        @upload-to="$emit('upload-to', $event)"
        @toast="$emit('toast', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { getPublicFiles } from '@/api/admin';

const props = defineProps({
  node: Object,
  expandedPaths: {
    type: Set,
    default: () => new Set()
  }
});

const emit = defineEmits(['copy', 'delete', 'upload-to', 'toast']);

const expanded = ref(false);
const hover = ref(false);
const loading = ref(false); // 控制当前文件夹是否正在加载
const hasLoaded = ref(false); // 标记是否已经请求过数据了

watch(() => props.expandedPaths, (newSet) => {
  if (props.node.is_dir && newSet && newSet.has(props.node.path)) {
    if (!expanded.value) {
      toggle(true);
    } else if (hasLoaded.value) {
      // 强制刷新子节点，以展示新上传的内容
      refreshChildren();
    }
  }
}, { deep: true, immediate: true });

async function refreshChildren() {
  if (!props.node.is_dir) return;
  loading.value = true;
  try {
    const res = await getPublicFiles({ path: props.node.path, recursive: false });
    if (res.code === 0 || res.success) {
      const resultData = res.data || res.result || {};
      const items = resultData.files ? resultData.files : (Array.isArray(resultData) ? resultData : (resultData.items || []));

      props.node.children = items.map(item => {
        const normalizedPath = item.path.replace(/\/$/, '');
        const parts = normalizedPath.split('/');
        return {
          name: item.name || parts[parts.length - 1],
          path: normalizedPath,
          is_dir: item.isDir || item.is_dir || false,
          size: item.size,
          updated_at: item.modified,
          children: []
        };
      }).sort((a, b) => {
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        return a.name.localeCompare(b.name);
      });
      hasLoaded.value = true;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function toggle(forceExpand = false) {
  if (!props.node.is_dir) return;

  expanded.value = forceExpand === true ? true : !expanded.value;

  // 如果是展开操作，并且还没有加载过数据，则向后端请求
  if (expanded.value && !hasLoaded.value) {
    await refreshChildren();
  }
}
</script>

<style scoped>
.tree-node {
  list-style: none;
}

.node-content {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text);
  font-size: var(--text-sm, 13px);
  user-select: none;
}

.node-content:hover {
  background: var(--color-bg-secondary);
}

.node-icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
}

.node-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: transparent;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.action-btn.text-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error, #ef4444);
}

.tree-children {
  padding-left: 20px;
  margin: 0;
}

.loading-node, .empty-node {
  padding: 6px 8px 6px 24px;
  color: var(--color-text-muted);
  font-size: 12px;
}
</style>