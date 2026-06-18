<template>
  <div class="app-card">
    <div class="card-body">
      <!-- 顶部：名称 + 公开角标 -->
      <div class="card-top">
        <h3 class="app-name">{{ agent.name }}</h3>
        <span v-if="agent.is_public" class="badge-public">公开</span>
      </div>

      <!-- 平台标识 -->
      <div v-if="platformLabel" class="platform-tag">{{ platformLabel }}</div>

      <!-- 描述 -->
      <p class="app-desc">{{ agent.description || '暂无描述' }}</p>

      <!-- 工具数 -->
      <div class="app-meta">
        <span class="stat-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          {{ toolCount }} 个工具
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="card-actions">
        <button class="act-btn" @click="$emit('edit', agent.id)">编辑</button>
        <button class="act-btn" style="display:none" @click="$emit('advanced', agent)">高级配置</button>
        <button class="act-btn act-run" @click="$emit('run', agent.id)">运行</button>
        <button class="act-btn act-share" @click="$emit('share', agent)">分享</button>
        <button class="act-btn act-delete" @click="$emit('delete', agent)">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { PLATFORM_LABELS } from '@/constants/spTools'

const props = defineProps({
  agent: { type: Object, required: true }
})
const emit = defineEmits(['edit', 'run', 'share', 'delete', 'advanced'])

const appStore = useAppStore()
const toolCount = computed(() => appStore.getEnabledToolCount(props.agent))
const platformLabel = computed(() => PLATFORM_LABELS[props.agent.platform] || '')
</script>

<style scoped>
.app-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all 0.18s;
}
.app-card:hover {
  border-color: var(--color-text-muted);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-public {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(34,197,94,0.12);
  color: #16a34a;
  letter-spacing: 0.3px;
  flex-shrink: 0;
  align-self: flex-start;
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

.act-share:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.act-delete:hover {
  color: var(--color-error);
  border-color: var(--color-error);
  background: rgba(239,68,68,0.06);
}
</style>
