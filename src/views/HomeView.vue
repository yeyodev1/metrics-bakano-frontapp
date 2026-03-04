<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToLogin() {
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero__gfx">
        <div class="hero__orb hero__orb--1" />
        <div class="hero__orb hero__orb--2" />
      </div>
      
      <div class="hero__content">
        <span class="hero__badge">Plataforma ROAS</span>
        <h1 class="hero__title">
          Toma el control absoluto de tus <span class="hero__title-highlight">campañas publicitarias</span>
        </h1>
        <p class="hero__subtitle">
          Visualiza tu ROAS, CPA y conversiones en tiempo real. La herramienta definitiva para escalar el rendimiento de tus estrategias en Meta Ads.
        </p>
        <div class="hero__actions">
          <button class="btn btn--primary" @click="goToLogin">
            Acceder al Dashboard
            <i class="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="features__grid">
        <div class="feature-card">
          <div class="feature-card__icon">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <h3 class="feature-card__title">Analítica en Tiempo Real</h3>
          <p class="feature-card__text">
            Conéctate directamente a la API de Meta y obtén datos precisos de tus campañas al instante. Sin demoras, cero conjeturas.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-card__icon">
            <i class="fa-solid fa-chart-pie"></i>
          </div>
          <h3 class="feature-card__title">Métricas de Rentabilidad</h3>
          <p class="feature-card__text">
            Visualiza tu Costo por Resultado (CPR), ROAS y CTR de un vistazo de manera gráfica e intuitiva.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-card__icon">
            <i class="fa-solid fa-users-gear"></i>
          </div>
          <h3 class="feature-card__title">Ecosistema Centralizado</h3>
          <p class="feature-card__text">
            Toda la información publicitaria de tu empresa organizada, segura y accesible desde un solo entorno de trabajo.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home-view {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* ============================================================
   HERO SECTION
   ============================================================ */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  padding: 4rem 1.5rem;
  background: linear-gradient(160deg, $primary-dark 0%, darken($primary-dark, 5%) 100%);
  overflow: hidden;
  text-align: center;

  &__gfx {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.45;

    &--1 {
      width: 50vw;
      height: 50vw;
      max-width: 600px;
      max-height: 600px;
      background: $primary;
      top: -10%;
      left: -10%;
      animation: float-hero 10s ease-in-out infinite;
    }

    &--2 {
      width: 40vw;
      height: 40vw;
      max-width: 500px;
      max-height: 500px;
      background: $secondary;
      bottom: -10%;
      right: -10%;
      animation: float-hero 14s ease-in-out infinite reverse;
    }
  }

  &__content {
    position: relative;
    z-index: 10;
    max-width: 860px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 1.2rem;
    background: rgba($white, 0.1);
    border: 1px solid rgba($white, 0.2);
    border-radius: 100px;
    color: rgba($white, 0.95);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    backdrop-filter: blur(10px);
  }

  &__title {
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 800;
    color: $white;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 0;

    &-highlight {
      display: block;
      background: linear-gradient(120deg, $primary, lighten($primary, 25%));
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  &__subtitle {
    font-size: clamp(1.1rem, 2vw, 1.25rem);
    color: rgba($white, 0.8);
    line-height: 1.6;
    max-width: 720px;
    margin: 0 auto;
  }

  &__actions {
    margin-top: 1rem;
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
}

/* ============================================================
   FEATURES SECTION
   ============================================================ */
.features {
  padding: 6rem 1.5rem;
  background-color: $primary-light;

  &__grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(3, 1fr);
      gap: 3rem;
    }
  }
}

.feature-card {
  background: $white;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: 0 4px 20px rgba($primary-dark, 0.04);
  border: 1px solid rgba($primary-dark, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba($primary-dark, 0.08);

    .feature-card__icon {
      background: $primary;
      color: $white;
      transform: scale(1.05);
    }
  }

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    background: rgba($primary, 0.1);
    color: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: $primary-dark;
    margin: 0 0 1rem;
    letter-spacing: -0.01em;
  }

  &__text {
    font-size: 0.95rem;
    color: $text-secondary;
    line-height: 1.6;
    margin: 0;
  }
}

/* ============================================================
   BUTTON UTILITIES
   ============================================================ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1rem 2.2rem;
  border-radius: 12px;
  font-family: $font-principal;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
  text-decoration: none;

  &--primary {
    background: $primary;
    color: $white;
    box-shadow: 0 4px 15px rgba($primary, 0.3);

    &:hover {
      background: lighten($primary, 4%);
      box-shadow: 0 6px 20px rgba($primary, 0.4);
      transform: translateY(-2px);

      i {
        transform: translateX(4px);
      }
    }

    i {
      transition: transform 0.2s ease;
    }
  }
}

/* ============================================================
   KEYFRAMES
   ============================================================ */
@keyframes float-hero {

  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-30px) scale(1.05);
  }
}
</style>

