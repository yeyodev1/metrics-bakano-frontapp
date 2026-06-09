<template>
  <div class="onboarding-shell">
    <div class="onboarding-shell__header">
      <div class="onboarding-shell__logo">
        <img :src="logoDark" alt="Bakano" class="onboarding-shell__img-logo" width="130" />
      </div>
      <div class="onboarding-shell__actions">
        <RouterLink :to="`/app/workspaces/${$route.params.workspaceId}`" class="onboarding-shell__skip-btn">
          Hacer esto más tarde <i class="fa-solid fa-arrow-right"></i>
        </RouterLink>
      </div>
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

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
  }

  &__logo {
    display: flex;
    align-items: center;
  }

  &__img-logo {
    display: block;
    height: auto;
  }

  &__skip-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #4a5568;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      background: #ffffff;
      color: #2d3748;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
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
