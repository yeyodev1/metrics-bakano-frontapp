<template>
  <div class="onboarding-shell">
    <div class="onboarding-shell__logo">
      <i class="fa-solid fa-bolt" />
      <span class="onboarding-shell__brand">metrics.bakano.ec</span>
    </div>
    <div class="onboarding-shell__content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
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
    gap: 0.6rem;
    padding: 1.5rem 2rem;

    i { font-size: 1.4rem; color: #7c3aed; }
  }

  &__brand {
    font-size: 1.1rem;
    font-weight: 700;
    color: #7c3aed;
    letter-spacing: -0.02em;
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
