<template>
  <div class="user-layout">
    <!-- Main Content Area -->
    <main class="layout-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// User layout can be extremely minimal, mostly just a container.
// Individual views like AppRunView handle their own internal nav if needed,
// or we can add a global user header here later.
</script>

<style scoped>
.user-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
}

.layout-main {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}
</style>