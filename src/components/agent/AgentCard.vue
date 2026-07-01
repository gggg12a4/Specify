<template>
  <div class="app-card" :class="{ 'is-template': agent.isTemplate }">
    <div class="card-body">
      <!-- 顶部：名称 -->
      <div class="card-top">
        <h3 class="app-name">
          {{ agent.name }}
          <span v-if="agent.isTemplate" class="template-badge">💡 官方模板</span>
        </h3>
      </div>

      <!-- 平台标识 -->
      <div v-if="platformLabel && !agent.isTemplate" class="platform-tag">{{ platformLabel }}</div>

      <!-- 描述 -->
      <p class="app-desc">{{ agent.description || '暂无描述' }}</p>

      <!-- 工具数 -->
      <div class="app-meta">
        <span class="stat-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          {{ toolCount }} 个预置工具
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="card-actions">
        <template v-if="agent.isTemplate">
          <button class="act-btn act-run" style="flex: 1;" @click="$emit('use-template', agent)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            一键使用该模板
          </button>
        </template>
        <template v-else>
          <button class="act-btn" @click.stop="$emit('edit', agent.id)">编辑</button>
          <button class="act-btn" style="display:none" @click.stop="$emit('advanced', agent)">高级配置</button>
          <button class="act-btn act-run" @click.stop="$emit('run', agent.id)">运行</button>
          <button class="act-btn act-delete" @click.stop="$emit('delete', agent)">删除</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 工作空间 App/模板卡片。
 * 展示名称、平台、工具数与操作按钮（编辑/运行/删除或一键使用模板）。
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { PLATFORM_LABELS } from '@/constants/spTools'

const props = defineProps({
  agent: { type: Object, required: true }
})
const emit = defineEmits(['edit', 'run', 'delete', 'advanced', 'use-template'])

const appStore = useAppStore()
/** 已启用工具总数（含 MCP、自定义工具等） */
const toolCount = computed(() => appStore.getEnabledToolCount(props.agent))
/** 平台中文标签 */
const platformLabel = computed(() => PLATFORM_LABELS[props.agent.platform] || '')
</script>

<style scoped>
.app-card {
  height: 100%;
  box-sizing: border-box;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all 0.18s;
}
.app-card:hover {
  border-color: var(--color-text-muted);
  box-shadow: var(--shadow-md);
}
.app-card.is-template {
  background: linear-gradient(to bottom right, var(--color-surface), rgba(254, 243, 199, 0.15));
  border-color: rgba(252, 211, 77, 0.5); /* amber-300 soft */
}
.app-card.is-template:hover {
  border-color: #f59e0b; /* amber-500 */
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.app-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-badge {
  font-size: 10px;
  font-weight: 600;
  color: #d97706; /* amber-600 */
  background: #fef3c7; /* amber-100 */
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}

.app-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.app-meta {
  display: flex;
  gap: 6px;
}
.stat-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-bg-secondary);
  padding: 3px 8px;
  border-radius: 20px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
  margin-top: 2px;
  flex-wrap: wrap;
}

.act-btn {
  flex: 1;
  min-width: 0;
  padding: 6px 4px;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  white-space: nowrap;
}
.act-btn:hover {
  background: var(--color-bg);
  color: var(--color-text);
  border-color: var(--color-text-muted);
}

.act-run {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
.act-run:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  color: #fff;
}

.act-delete:hover {
  color: var(--color-error);
  border-color: var(--color-error);
  background: rgba(239,68,68,0.06);
}
</style>
