<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isUpdateAvailable = ref(false)
let currentVersion = ''
let checkInterval: ReturnType<typeof setInterval>

const checkVersion = async () => {
  if (isUpdateAvailable.value) return

  try {
    // Bust cache to always fetch the latest version.json
    const res = await fetch(`/version.json?t=${Date.now()}`)
    if (!res.ok) return
    
    const data = await res.json()
    
    if (!currentVersion) {
      currentVersion = data.version
    } else if (currentVersion !== data.version) {
      isUpdateAvailable.value = true
    }
  } catch (error) {
    console.error('Error checking for app updates:', error)
  }
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    checkVersion()
  }
}

const refreshApp = () => {
  window.location.reload()
}

onMounted(() => {
  // Check immediately upon mount
  checkVersion()
  
  // Check every 5 minutes while the app is open
  checkInterval = setInterval(checkVersion, 5 * 60 * 1000)
  
  // Also check when the user returns to the tab
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  clearInterval(checkInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div v-if="isUpdateAvailable" class="app-updater-toast">
    <div class="app-updater-toast__content">
      <div class="app-updater-toast__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l-5.75 3.64"/>
        </svg>
      </div>
      <div>
        <h4>¡Actualización Disponible!</h4>
        <p>Hay una nueva versión de la aplicación. Por favor, refresca para obtener las últimas mejoras.</p>
      </div>
    </div>
    <button @click="refreshApp" class="app-updater-toast__button">
      Refrescar página
    </button>
  </div>
</template>

<style lang="scss" scoped>
.app-updater-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: $white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 9999;
  max-width: 320px;
  animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  border: 1px solid rgba($primary-dark, 0.05);

  &__content {
    display: flex;
    gap: 16px;
    align-items: flex-start;

    h4 {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 600;
      color: $primary-dark;
    }

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
      color: $text-secondary;
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $alert-info-bg;
    color: $alert-info;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__button {
    background-color: $primary;
    color: $white;
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;

    &:hover {
      background-color: darken($primary, 10%);
    }
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Mobile responsive
@media (max-width: 480px) {
  .app-updater-toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
  }
}
</style>
