<script setup lang="ts">
import { useRouter } from 'vue-router'
import logoLight from '@/assets/logos/bakano-dark.png'

const router = useRouter()

function goToLogin(): void {
  router.push({ name: 'Login' })
}
</script>

<template>
  <header class="public-header">
    <div class="public-header__inner">
      <a class="public-header__brand" href="/" aria-label="Bakano Home">
        <img
          :src="logoLight"
          alt="Bakano"
          class="public-header__logo"
          width="140"
          height="36"
        />
      </a>

      <nav class="public-header__nav" aria-label="Navegación principal">
        <button
          id="btn-login"
          class="public-header__cta"
          type="button"
          @click="goToLogin"
        >
          Iniciar sesión
        </button>
      </nav>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.public-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background-color: $white;
  border-bottom: 1px solid rgba($primary-dark, 0.1);

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    height: 64px;

    @media (min-width: 768px) {
      padding: 0 2rem;
    }
  }

  &__brand {
    display: flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0;
  }

  &__logo {
    height: 32px;
    width: auto;
    display: block;

    @media (min-width: 768px) {
      height: 36px;
    }
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    border: 1.5px solid $primary;
    background-color: transparent;
    color: $primary;
    font-family: $font-principal;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      color 0.2s ease,
      transform 0.15s ease;

    &:hover {
      background-color: $primary;
      color: $white;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    @media (min-width: 768px) {
      padding: 0.5rem 1.5rem;
      font-size: 0.95rem;
    }
  }
}
</style>
