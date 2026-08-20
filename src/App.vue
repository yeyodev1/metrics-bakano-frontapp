<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import GlobalToast from '@/components/common/GlobalToast.vue'
import GlobalConfirmModal from '@/components/common/GlobalConfirmModal.vue'
import GlobalUserFormModal from '@/components/common/GlobalUserFormModal.vue'
import GlobalSuperadminModal from '@/components/common/GlobalSuperadminModal.vue'
import AppUpdater from '@/components/common/AppUpdater.vue'
import { sesionFresca } from '@/router/session'

const router = useRouter()
const userStore = useUserStore()

// Handle expired / invalid token globally.
// The httpBase interceptor fires this event on every 401 response
// that HAD an Authorization header — i.e. a real authenticated request.
function handleTokenExpired(): void {
  // La ruta se llama 'AuthLogin'. Con 'Login' vue-router rechazaba la
  // navegación: la sesión quedaba borrada pero el usuario se quedaba mirando
  // una pantalla que ya no podía cargar nada.
  if (router.currentRoute.value.name === 'AuthLogin') return

  userStore.clear()                             // Wipes localStorage + store state
  router.push({ name: 'AuthLogin', replace: true })
}

onMounted(() => {
  window.addEventListener('auth:token-expired', handleTokenExpired)

  // El guard ya pide /me antes de la primera ruta protegida; esto cubre las
  // públicas (p. ej. caer en "/" con sesión) sin volver a pedirlo.
  sesionFresca()
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
