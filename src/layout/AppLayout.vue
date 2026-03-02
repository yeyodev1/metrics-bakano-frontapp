<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import logoDark from '@/assets/logos/bakano-light.png'

const router = useRouter()
const userStore = useUserStore()

function logout(): void {
  userStore.clear()
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="app-layout">
    <aside class="app-layout__sidebar">
      <div class="app-layout__brand">
        <img :src="logoDark" alt="Bakano" class="app-layout__logo" width="110" height="28" />
      </div>

      <nav class="app-layout__nav">
        <RouterLink class="app-layout__nav-item" :to="{ name: 'SuperadminDashboard' }">
          <i class="fa-solid fa-grid-2" aria-hidden="true" />
          <span>Entornos</span>
        </RouterLink>
      </nav>

      <div class="app-layout__footer">
        <div class="app-layout__user">
          <div class="app-layout__user-avatar" aria-hidden="true">
            {{ userStore.email?.charAt(0).toUpperCase() }}
          </div>
          <div class="app-layout__user-info">
            <span class="app-layout__user-email">{{ userStore.email }}</span>
            <span class="app-layout__user-role">Superadmin</span>
          </div>
        </div>
        <button class="app-layout__logout" type="button" @click="logout" aria-label="Cerrar sesión">
          <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
        </button>
      </div>
    </aside>

    <main class="app-layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8f7f5;

  // ── Sidebar ────────────────────────────────────────────
  &__sidebar {
    display: none;
    flex-direction: column;
    width: 240px;
    flex-shrink: 0;
    background-color: $primary-dark;
    padding: 1.5rem 1rem;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;

    @media (min-width: 768px) {
      display: flex;
    }
  }

  &__brand {
    padding: 0.5rem 0.75rem 1.75rem;
    border-bottom: 1px solid rgba($white, 0.08);
    margin-bottom: 1.5rem;
  }

  &__logo {
    height: 26px;
    width: auto;
    display: block;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.875rem;
    border-radius: 8px;
    text-decoration: none;
    color: rgba($text-light, 0.65);
    font-size: 0.9rem;
    font-weight: 500;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    i {
      font-size: 1rem;
      width: 18px;
      text-align: center;
      flex-shrink: 0;
    }

    &:hover,
    &.router-link-active {
      background-color: rgba($white, 0.08);
      color: $white;
    }

    &.router-link-active {
      background-color: rgba($primary, 0.2);
      color: $primary;
    }
  }

  // ── Footer / user info ─────────────────────────────────
  &__footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba($white, 0.08);
    margin-top: auto;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex: 1;
    min-width: 0;
  }

  &__user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba($primary, 0.2);
    color: $primary;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__user-email {
    font-size: 0.75rem;
    color: rgba($text-light, 0.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-role {
    font-size: 0.7rem;
    color: $primary;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__logout {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: rgba($text-light, 0.4);
    cursor: pointer;
    padding: 0.4rem;
    border-radius: 6px;
    flex-shrink: 0;
    transition: color 0.15s ease, background-color 0.15s ease;

    &:hover {
      color: $primary;
      background-color: rgba($primary, 0.1);
    }
  }

  // ── Main ───────────────────────────────────────────────
  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
