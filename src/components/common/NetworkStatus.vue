<script setup lang="ts">
/**
 * Aviso de conexión perdida, y solo eso. Dos formas según cuánto tenga que
 * perder el usuario: banner mientras navega (no tapa lo que ya cargó) y
 * pantalla completa solo si la app abrió sin red y no hay nada que mostrar.
 */
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { caido, arranqueSinRed, reintentar } = useNetworkStatus()

function recargar() {
  reintentar()
  // En arranque en frío no hay vista montada que sepa reintentar sola.
  if (arranqueSinRed.value) window.location.reload()
}
</script>

<template>
  <!-- Arranque en frío: no hay datos que proteger -->
  <div v-if="arranqueSinRed" class="net-screen">
    <div class="net-screen__icon"><i class="fa-solid fa-wifi" /></div>
    <h2>Sin conexión</h2>
    <p>No pudimos conectarnos. Revisa tu internet e intenta de nuevo.</p>
    <button class="net-screen__btn" @click="recargar">
      <i class="fa-solid fa-rotate-right" /> Reintentar
    </button>
  </div>

  <!-- Ya hay algo en pantalla: aviso que no estorba -->
  <Transition v-else name="net-slide">
    <div v-if="caido" class="net-banner">
      <i class="fa-solid fa-plug-circle-xmark" />
      <span>Sin conexión. Los datos pueden estar desactualizados.</span>
      <button class="net-banner__btn" @click="recargar">Reintentar</button>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.net-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  background: #991b1b;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);

  &__btn {
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #fff;
    border-radius: 8px;
    padding: 0.25rem 0.7rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;

    &:hover { background: rgba(255, 255, 255, 0.26); }
  }
}

.net-screen {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.75rem;
  padding: 2rem;

  &__icon {
    width: 76px;
    height: 76px;
    border-radius: 22px;
    background: rgba(#ef4444, 0.07);
    border: 2px dashed rgba(#ef4444, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    color: #ef4444;
    margin-bottom: 0.5rem;
  }

  h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: $primary-dark; }
  p  { margin: 0; font-size: 0.86rem; color: $text-secondary; max-width: 320px; line-height: 1.5; }

  &__btn {
    margin-top: 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    background: $primary;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 0.7rem 1.4rem;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;

    &:hover { opacity: 0.9; }
  }
}

.net-slide-enter-active,
.net-slide-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.net-slide-enter-from,
.net-slide-leave-to { transform: translateY(-100%); opacity: 0; }
</style>
