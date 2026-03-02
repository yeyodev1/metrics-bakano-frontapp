<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// Handle expired / invalid token globally.
// The httpBase interceptor fires this event on every 401 response
// that HAD an Authorization header — i.e. a real authenticated request.
function handleTokenExpired(): void {
  // Already on Login — nothing to do
  if (router.currentRoute.value.name === 'Login') return

  userStore.clear()                             // Wipes localStorage + store state
  router.push({ name: 'Login', replace: true })
}

onMounted(() => {
  window.addEventListener('auth:token-expired', handleTokenExpired)
})

onUnmounted(() => {
  window.removeEventListener('auth:token-expired', handleTokenExpired)
})
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
