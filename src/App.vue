<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import GlobalToast from '@/components/common/GlobalToast.vue'
import GlobalConfirmModal from '@/components/common/GlobalConfirmModal.vue'
import GlobalUserFormModal from '@/components/common/GlobalUserFormModal.vue'
import GlobalSuperadminModal from '@/components/common/GlobalSuperadminModal.vue'
import AppUpdater from '@/components/common/AppUpdater.vue'
import { authService } from '@/services/auth.service'

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

onMounted(async () => {
  window.addEventListener('auth:token-expired', handleTokenExpired)

  // Fetch current user if authenticated
  if (userStore.isAuthenticated && userStore.id) {
    try {
      const res = await authService.me()
      const user = res.user
      // Keep only fields that shouldn't override local settings, but DO update photoUrl
      userStore.setUser({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        workspaces: user.workspaces as any,
        isInternal: user.isInternal ?? userStore.isInternal,
        internalRole: user.internalRole ?? userStore.internalRole,
        workspaceId: userStore.workspaceId || undefined,
      })
    } catch {
      // Silently fail, user is still locally authenticated, maybe token expired and interceptor handles it
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('auth:token-expired', handleTokenExpired)
})
</script>

<template>
  <div class="app-container">
    <RouterView />
    <GlobalToast />
    <GlobalConfirmModal />
    <GlobalUserFormModal />
    <GlobalSuperadminModal />
    <AppUpdater />
  </div>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
