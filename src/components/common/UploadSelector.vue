<template>
  <div class="upload-selector">
    <!-- 触发按钮 -->
    <button class="upload-trigger" @click="showMenu = !showMenu" title="添加内容">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>

    <!-- 菜单 -->
    <transition name="menu-fade">
      <div v-if="showMenu" class="upload-menu" @click.stop>
        <div class="menu-item" @click="handleSelectType('image')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <div class="menu-info">
            <div class="menu-title">图片</div>
            <div class="menu-desc">JPG, PNG, GIF, WebP</div>
          </div>
        </div>

        <div class="menu-item" @click="handleSelectType('video')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
          <div class="menu-info">
            <div class="menu-title">视频</div>
            <div class="menu-desc">MP4, WebM, OGG</div>
          </div>
        </div>

        <div class="menu-item" @click="handleSelectType('audio')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </div>
          <div class="menu-info">
            <div class="menu-title">音频</div>
            <div class="menu-desc">MP3, WAV, OGG</div>
          </div>
        </div>

        <div class="menu-item" @click="handleSelectType('file')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          </div>
          <div class="menu-info">
            <div class="menu-title">文件</div>
            <div class="menu-desc">PDF, TXT, CSV 等</div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="acceptTypes"
      @change="handleFileChange"
      style="display: none"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['file-selected'])

const showMenu = ref(false)
const fileInputRef = ref(null)
const currentType = ref('image')

const acceptTypes = computed(() => {
  const typeMap = {
    image: 'image/jpeg,image/png,image/gif,image/webp',
    video: 'video/mp4,video/webm,video/ogg',
    audio: 'audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/webm',
    file: '.pdf,.txt,.csv,.json,.xml'
  }
  return typeMap[currentType.value] || '*/*'
})

function handleSelectType(type) {
  currentType.value = type
  showMenu.value = false
  // 触发文件选择
  fileInputRef.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (file) {
    emit('file-selected', {
      file,
      type: currentType.value
    })
  }
  // 清空 input，允许重复选择同一文件
  event.target.value = ''
}

// 点击外部关闭菜单
function handleClickOutside(event) {
  if (!event.target.closest('.upload-selector')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.upload-selector {
  position: relative;
}

.upload-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.upload-trigger:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.upload-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 8px;
  min-width: 240px;
  z-index: 100;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: var(--color-bg-secondary);
}

.menu-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: white;
}

.menu-info {
  flex: 1;
  min-width: 0;
}

.menu-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 2px;
}

.menu-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 菜单动画 */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.2s;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
