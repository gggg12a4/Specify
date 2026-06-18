<template>
  <div class="app">
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
    <!-- 全局 Toast 消息提示 -->
    <Toast ref="globalToastRef" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Toast from '@/components/common/Toast.vue'
import { setToastInstance } from '@/composables/useNotification'

const globalToastRef = ref(null)

onMounted(() => {
  console.log('AI Chat App 启动')
  if (globalToastRef.value) {
    setToastInstance(globalToastRef.value)
  }
})
</script>

<style>
.app {
  width: 100%;
  height: 100%;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
