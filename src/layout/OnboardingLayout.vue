<template>
  <div class="onboarding-shell">
    <div class="onboarding-shell__logo">
      <img :src="logoDark" alt="Bakano" class="onboarding-shell__img-logo" width="130" />
    </div>
    <div class="onboarding-shell__content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import logoDark from '@/assets/logos/bakano-dark.png'
</script>

<style lang="scss" scoped>
.onboarding-shell {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f5ff 0%, #f0ebff 50%, #e8e0ff 100%);
  display: flex;
  flex-direction: column;

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  &__img-logo {
    display: block;
    height: auto;
  }

  &__content {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 0 1rem 3rem;
  }
}
</style>
