<template>
  <div class="app-card" :class="cardClass">
    <!-- 右上角：发布态 + 可见性 -->
    <div v-if="!agent.isTemplate" class="corner-badges" :class="{ 'is-workspace': variant === 'workspace' }" aria-label="App 状态">
      <span class="corner-badge" :class="publishBadgeClass">{{ publishLabel }}</span>
      <span class="corner-badge" :class="visibilityBadgeClass">{{ visibilityLabel }}</span>
    </div>

    <div class="card-body">
      <div class="card-top">
        <h3 class="app-name">{{ agent.name }}</h3>
        <span v-if="agent.isTemplate" class="template-badge">💡 官方模板</span>
      </div>

      <!-- 平台标签（workspace 风格：标题下方浅蓝标签） -->
      <div v-if="platformLabel && !agent.isTemplate" class="platform-tag" :class="{ 'is-workspace': variant === 'workspace' }">
        {{ platformLabel }}
      </div>

      <p class="app-desc">{{ agent.description || '暂无描述' }}</p>

      <!-- 非 workspace：工具数 -->
      <div v-if="variant !== 'workspace' && !agent.isTemplate" class="app-meta">
        <span class="stat-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          {{ toolCount }} 个预置工具
        </span>
      </div>

      <div class="card-actions">
        <template v-if="agent.isTemplate">
          <button class="act-btn act-run full" @click="$emit('use-template', agent)">
            一键使用该模板
          </button>
        </template>
        <template v-else-if="variant === 'workspace'">
          <button class="act-btn" @click.stop="$emit('edit', agent.id)">编辑</button>
          <button class="act-btn act-run" @click.stop="$emit('run', agent.id)">运行</button>
          <button class="act-btn" @click.stop="$emit('share', agent)">分享</button>
          <button class="act-btn act-delete" @click.stop="$emit('delete', agent)">删除</button>
        </template>
        <template v-else>
          <button class="act-btn" @click.stop="$emit('edit', agent.id)">编辑</button>
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
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { PLATFORM_LABELS } from '@/constants/spTools'
import { resolveAppPublishStatus } from '@/utils/appAdapter'

const props = defineProps({
  agent: { type: Object, required: true },
  /** workspace：对齐线上工作区卡片样式 */
  variant: { type: String, default: 'default' },
})

defineEmits(['edit', 'run', 'delete', 'advanced', 'use-template', 'share'])

const appStore = useAppStore()

const cardClass = computed(() => ({
  'is-template': props.agent.isTemplate,
  'is-workspace': props.variant === 'workspace',
  'has-corner-badges': !props.agent.isTemplate,
}))

const toolCount = computed(() => appStore.getEnabledToolCount(props.agent))

const platformLabel = computed(() => {
  if (props.agent.modelGroupName) return props.agent.modelGroupName
  return PLATFORM_LABELS[props.agent.platform] || ''
})

const publishStatus = computed(() => resolveAppPublishStatus({
  liveVersionId: props.agent.liveVersionId,
  isPendingConfig: props.agent.isPendingConfig,
}))
const publishLabel = computed(() => publishStatus.value.label)
const publishBadgeClass = computed(() => publishStatus.value.badgeClass)

const visibilityLabel = computed(() => (props.agent.isPublic ? '公开' : '私有'))
const visibilityBadgeClass = computed(() => (props.agent.isPublic ? 'badge-public' : 'badge-private'))
</script>

<style scoped>
.app-card {
  position: relative;
  box-sizing: border-box;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px 20px;
  transition: all 0.18s;
}

.app-card.is-workspace {
  width: 100%;
  min-width: 0;
}

.app-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.app-card.is-template {
  background: var(--color-surface);
  border-color: var(--color-border);
}

.corner-badges {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  z-index: 1;
  pointer-events: none;
}

.corner-badges.is-workspace {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.corner-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.25;
  white-space: nowrap;
}

.corner-badges.is-workspace .corner-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  line-height: 1.5;
}

.corner-badge.badge-live { color: #059669; background: rgba(16, 185, 129, 0.12); }
.corner-badge.badge-draft { color: #b45309; background: rgba(245, 158, 11, 0.12); }
.corner-badge.badge-pending-config { color: #7c3aed; background: rgba(124, 58, 237, 0.12); }
.corner-badge.badge-public { color: #2563eb; background: rgba(59, 130, 246, 0.12); }
.corner-badge.badge-private { color: var(--color-text-muted); background: var(--color-bg-secondary); }

.app-card.has-corner-badges .card-top {
  padding-right: 88px;
}

.app-card.is-workspace.has-corner-badges .card-top {
  padding-right: 120px;
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
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-badge {
  font-size: 10px;
  font-weight: 600;
  color: #d97706;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.platform-tag {
  display: inline-flex;
  width: fit-content;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-bg-secondary);
  padding: 2px 8px;
  border-radius: 4px;
}

.platform-tag.is-workspace {
  color: #0284c7;
  background: #e0f2fe;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
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
  gap: 6px;
  padding-top: 12px;
  margin-top: auto;
  flex-wrap: nowrap;
}

.act-btn {
  flex: 1;
  min-width: 0;
  padding: 7px 4px;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  white-space: nowrap;
}

.act-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.act-btn.full {
  flex: 1;
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
  background: rgba(239, 68, 68, 0.06);
}
</style>
