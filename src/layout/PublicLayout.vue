<script setup lang="ts">
import PublicHeader from './PublicHeader.vue'
</script>

<template>
  <div class="public-layout">
    <PublicHeader />
    <main class="public-layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $white;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}
</style>
