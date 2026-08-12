<script setup lang="ts">
import { useRouter } from 'vue-router'
import fotoEquipo from '@/assets/auth/equipo-reunion.webp'
import HomeProspecto from './home/HomeProspecto.vue'

const router = useRouter()

const anio = new Date().getFullYear()

function goToLogin() {
  // La ruta se llama 'AuthLogin'. Con 'Login' vue-router rechazaba la
  // navegación y el botón principal del home no hacía absolutamente nada.
  router.push({ name: 'AuthLogin' })
}
</script>

<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero">
      <img :src="fotoEquipo" alt="" class="hero__foto" aria-hidden="true" />
      <div class="hero__scrim" aria-hidden="true" />
      <div class="hero__gfx">
        <div class="hero__orb hero__orb--1" />
        <div class="hero__orb hero__orb--2" />
      </div>
      
      <div class="hero__content">
        <span class="hero__badge">metrics.bakano.ec</span>
        <h1 class="hero__title">
          El entorno de trabajo de <span class="hero__title-highlight">los clientes de Bakano</span>
        </h1>
        <p class="hero__subtitle">
          Facturación y ROAS, planificación de videos, guiones y aprobaciones. Todo lo de tu
          marca en un solo sitio. <strong>El acceso es solo para clientes de Bakano</strong>, con
          la cuenta que te dio tu equipo.
        </p>
        <div class="hero__actions">
          <button class="btn btn--primary" @click="goToLogin">
            Entrar a la plataforma
            <i class="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
          <!-- Esto no es una web de venta: quien llega aquí ya es cliente, y la
               otra mitad de las veces lo que necesita es recuperar su acceso. -->
          <RouterLink :to="{ name: 'AuthForgotPassword' }" class="hero__secondary">
            ¿Olvidaste tu contraseña?
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="features__grid">
        <div class="feature-card">
          <div class="feature-card__icon">
            <i class="fa-solid fa-chart-line"></i>
          </div>
          <h3 class="feature-card__title">Facturación y ROAS</h3>
          <p class="feature-card__text">
            Registra la facturación del día y mira el retorno de tu inversión en Meta Ads, con los datos que trae la propia API de Meta.
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-card__icon">
            <i class="fa-solid fa-clapperboard"></i>
          </div>
          <h3 class="feature-card__title">Planificación de videos</h3>
          <p class="feature-card__text">
            El plan del mes, los guiones generados con IA a partir de tu perfil de marca, y el estado de cada video hasta que se publica.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-card__icon">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <h3 class="feature-card__title">Aprobaciones</h3>
          <p class="feature-card__text">
            Revisa y aprueba lo que tu equipo de Bakano prepara, sin cadenas de WhatsApp ni archivos sueltos.
          </p>
        </div>
      </div>
    </section>

    <HomeProspecto />

    <!-- Sin esto, alguien sin acceso se quedaba sin a quién escribirle. -->
    <footer class="home-footer">
      <p class="home-footer__help">
        ¿Problemas para entrar? Escríbenos a
        <a href="mailto:soporte@bakano.ec">soporte@bakano.ec</a>
      </p>
      <p class="home-footer__legal">© {{ anio }} Bakano · metrics.bakano.ec</p>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.hero__foto {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  // Las caras quedaban justo detrás del titular y competían con él. Se baja el
  // encuadre y se apaga la foto: aquí es textura, no protagonista.
  object-position: center 78%;
  opacity: 0.16;
  filter: grayscale(0.4);
}

/* Capa oscura entre la foto y el texto: el titular se lee sobre color plano. */
.hero__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 55% at 50% 45%, rgba($primary-dark, 0.92) 0%, rgba($primary-dark, 0.55) 60%, transparent 100%),
    linear-gradient(180deg, rgba($primary-dark, 0.5) 0%, rgba($primary-dark, 0.2) 45%, rgba($primary-dark, 0.85) 100%);
}

.hero__secondary {
  padding: 0.5rem 0.75rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: rgba($white, 0.82);
  text-decoration: none;
  border-radius: 8px;

  &:hover { color: $white; background: rgba($white, 0.1); }
  &:focus-visible { outline: 2px solid $white; outline-offset: 2px; }
}

.home-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 2rem 1.5rem 2.5rem;
  border-top: 1px solid rgba($primary-dark, 0.08);

  p { margin: 0; font-size: 0.82rem; color: $text-secondary; }

  a { font-weight: 700; color: $primary; text-decoration: none; }
  a:hover { text-decoration: underline; }
}

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

