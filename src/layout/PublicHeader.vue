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
          <span class="public-header__cta-label">Iniciar sesión</span>
          <svg class="public-header__cta-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
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
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.55rem 1.35rem;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 8%) 100%);
    color: $white;
    font-family: $font-principal;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba($primary, 0.35);
    transition:
      box-shadow 0.25s ease,
      transform 0.18s ease;

    // Shimmer layer
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg,
          transparent 40%,
          rgba($white, 0.18) 50%,
          transparent 60%);
      transform: translateX(-100%);
      transition: transform 0.55s ease;
    }

    &:hover {
      box-shadow: 0 4px 20px rgba($primary, 0.5);
      transform: translateY(-2px);

      &::before {
        transform: translateX(100%);
      }

      .public-header__cta-icon {
        transform: translateX(3px);
      }
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba($primary, 0.35);
    }

    @media (min-width: 768px) {
      padding: 0.6rem 1.5rem;
      font-size: 0.9rem;
    }
  }

  &__cta-label {
    position: relative;
    z-index: 1;
  }

  &__cta-icon {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
}
</style>
