<template>
  <div class="file-preview-list">
    <transition-group name="preview-slide">
      <div
        v-for="item in files"
        :key="item.id"
        class="preview-item"
      >
        <!-- 图片预览 -->
        <div v-if="item.contentType === 'image'" class="preview-image">
          <img :src="item.previewUrl" :alt="item.file.name" />
          <button class="remove-btn" @click="handleRemove(item.id)" title="移除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- 视频预览 -->
        <div v-else-if="item.contentType === 'video'" class="preview-video">
          <video :src="item.previewUrl" muted></video>
          <div class="video-overlay">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <button class="remove-btn" @click="handleRemove(item.id)" title="移除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- 音频预览 -->
        <div v-else-if="item.contentType === 'audio'" class="preview-file">
          <div class="file-icon audio-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            </svg>
          </div>
          <div class="file-info">
            <div class="file-name">{{ item.file.name }}</div>
            <div class="file-size">{{ formatSize(item.file.size) }}</div>
          </div>
          <button class="remove-btn" @click="handleRemove(item.id)" title="移除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- 文件预览 -->
        <div v-else class="preview-file">
          <div class="file-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          </div>
          <div class="file-info">
            <div class="file-name">{{ item.file.name }}</div>
            <div class="file-size">{{ formatSize(item.file.size) }}</div>
          </div>
          <button class="remove-btn" @click="handleRemove(item.id)" title="移除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
/**
 * 待发送附件预览列表。
 * 按 contentType 区分图片/视频/音频/文件展示，支持移除。
 */
import { formatFileSize } from '@/utils/file'

defineProps({
  files: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['remove'])

/** 移除指定附件并向上 emit */
function handleRemove(id) {
  emit('remove', id)
}

/** 格式化文件大小展示 */
function formatSize(bytes) {
  return formatFileSize(bytes)
}
</script>

<style scoped>
.file-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.preview-item {
  position: relative;
  flex-shrink: 0;
}

.preview-image {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-video {
  position: relative;
  width: 140px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  border: 1px solid var(--color-border);
}

.preview-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  pointer-events: none;
}

.preview-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  min-width: 200px;
  max-width: 300px;
}

.file-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
}

.audio-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;
}

.preview-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
}

.preview-file .remove-btn {
  position: static;
  opacity: 1;
  background: transparent;
  color: var(--color-text-secondary);
}

.preview-file .remove-btn:hover {
  background: var(--color-bg);
  color: var(--color-error);
}

/* 动画 */
.preview-slide-enter-active,
.preview-slide-leave-active {
  transition: all 0.3s;
}

.preview-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.preview-slide-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
