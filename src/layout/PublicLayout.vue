<script setup lang="ts">
import PublicHeader from './PublicHeader.vue'
</script>

<template>
  <div class="public-layout">
    <PublicHeader />
    <main class="public-layout__main">
      <!-- Antes de entrar se salta entre home, login y recuperar contraseña.
           El corte seco hacía dudar de si la pantalla había cambiado. -->
      <RouterView v-slot="{ Component, route }">
        <Transition name="vista" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
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

/* Corta y discreta: acompaña el cambio, no lo hace esperar. */
.vista-enter-active,
.vista-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.vista-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.vista-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .vista-enter-active,
  .vista-leave-active {
    transition: opacity 0.01s;
    transform: none;
  }
}
</style>
