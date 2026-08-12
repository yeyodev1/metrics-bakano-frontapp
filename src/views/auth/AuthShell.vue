<template>
  <div class="auth-shell">
    <aside class="auth-shell__panel">
      <!-- Foto real del equipo en vez de degradados: quien entra aquí ya es
           cliente de Bakano y reconoce a la gente con la que trabaja. -->
      <img :src="fotoEquipo" alt="" class="auth-shell__foto" aria-hidden="true" />
      <div class="auth-shell__gfx" aria-hidden="true">
        <div class="auth-shell__orb auth-shell__orb--1" />
        <div class="auth-shell__orb auth-shell__orb--2" />
      </div>
      <div class="auth-shell__copy">
        <p class="auth-shell__tag">{{ panelTag }}</p>
        <h2 class="auth-shell__panel-title">{{ panelTitle }}</h2>
        <p class="auth-shell__panel-sub">{{ panelSub }}</p>
      </div>
    </aside>

    <main class="auth-shell__area">
      <div class="auth-shell__card">
        <slot name="banner" />

        <header class="auth-shell__header">
          <img :src="logoDark" alt="Bakano" class="auth-shell__logo" width="120" height="30" />
          <h1 class="auth-shell__title">{{ title }}</h1>
          <p class="auth-shell__subtitle">{{ subtitle }}</p>
        </header>

        <slot />

        <footer v-if="$slots.footer" class="auth-shell__footer">
          <slot name="footer" />
        </footer>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import logoDark from '@/assets/logos/bakano-dark.png'
import fotoEquipo from '@/assets/auth/equipo-trabajo.webp'

withDefaults(
  defineProps<{
    title: string
    subtitle: string
    panelTag?: string
    panelTitle?: string
    panelSub?: string
  }>(),
  {
    panelTag: 'Plataforma ROAS',
    panelTitle: 'Gestiona tus campañas con inteligencia.',
    panelSub: 'Visibilidad total sobre tu inversión publicitaria, en tiempo real.',
  }
)
</script>

<style lang="scss" scoped>
.auth-shell {
  display: flex;
  min-height: calc(100vh - 64px); // 64px = alto del header público
}

.auth-shell__panel {
  position: relative;
  display: none;
  flex: 0 0 50%;
  overflow: hidden;
  background: linear-gradient(145deg, $primary-dark 0%, darken($primary-dark, 4%) 100%);

  @media (min-width: 1024px) {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 3.5rem;
  }
}

.auth-shell__foto {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  // La foto es de fondo, no el contenido: se apaga para que el texto encima
  // pase contraste sin necesidad de una caja opaca sobre ella.
  opacity: 0.42;
  filter: grayscale(0.25);
}

.auth-shell__gfx {
  position: absolute;
  inset: 0;
  pointer-events: none;
  // Degradado hacia el pie: sostiene el texto sin tapar la foto arriba.
  background: linear-gradient(
    180deg,
    rgba($primary-dark, 0.35) 0%,
    rgba($primary-dark, 0.75) 55%,
    rgba($primary-dark, 0.95) 100%
  );
}

.auth-shell__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;

  &--1 {
    top: -80px;
    left: -100px;
    width: 380px;
    height: 380px;
    background: rgba($primary, 0.45);
    animation: auth-float 8s ease-in-out infinite;
  }

  &--2 {
    top: 40%;
    right: -60px;
    width: 280px;
    height: 280px;
    background: rgba($secondary, 0.4);
    animation: auth-float 11s ease-in-out infinite reverse;
  }

}

.auth-shell__copy {
  position: relative;
  z-index: 1;
}

.auth-shell__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  padding: 0.3rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgba($primary, 0.9);
  text-transform: uppercase;
  background-color: rgba($primary, 0.1);
  border: 1px solid rgba($primary, 0.25);
  border-radius: 100px;
}

.auth-shell__panel-title {
  margin: 0 0 1rem;
  font-size: clamp(1.6rem, 2.5vw, 2.1rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: $white;
}

.auth-shell__panel-sub {
  max-width: 360px;
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: rgba($text-light, 0.6);
}

.auth-shell__area {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.25rem;
  background-color: $white;

  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }
}

.auth-shell__card {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  width: 100%;
  max-width: 420px;
}

.auth-shell__logo {
  width: 120px;
  height: auto;
  margin-bottom: 1.5rem;
}

.auth-shell__title {
  margin: 0 0 0.4rem;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: $primary-dark;
}

.auth-shell__subtitle {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: $text-secondary;
}

.auth-shell__footer {
  padding-top: 0.25rem;
  font-size: 0.85rem;
  color: $text-secondary;
  text-align: center;
}

@keyframes auth-float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -24px); }
}

@media (prefers-reduced-motion: reduce) {
  .auth-shell__orb { animation: none; }
}
</style>

<style lang="scss">
/*
  Sin `scoped` a propósito: los estilos con scope no alcanzan el contenido que
  llega por slot, y estos primitivos los usan las tres pantallas de acceso.
  Namespace `auth-` para que no choquen con nada.
*/
.auth-shell .auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.auth-shell .auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.auth-shell .auth-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.auth-shell .auth-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: $primary-dark;
}

.auth-shell .auth-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.auth-shell .auth-input-icon {
  position: absolute;
  left: 0.9rem;
  font-size: 0.85rem;
  color: $text-secondary;
  pointer-events: none;
}

.auth-shell .auth-input {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.5rem;
  font-family: inherit;
  font-size: 0.95rem;
  color: $primary-dark;
  background: rgba($primary-dark, 0.03);
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;

  &::placeholder { color: rgba($text-secondary, 0.7); }

  &:focus {
    background: $white;
    border-color: $primary;
    box-shadow: 0 0 0 4px rgba($primary, 0.12);
  }

  &:disabled { opacity: 0.6; cursor: not-allowed; }

  &--has-eye { padding-right: 2.75rem; }
}

.auth-shell .auth-eye {
  position: absolute;
  right: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: $text-secondary;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover { color: $primary-dark; }
}

.auth-shell .auth-link {
  font-size: 0.8rem;
  font-weight: 700;
  color: $primary;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.auth-shell .auth-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.8rem 0.95rem;
  font-size: 0.85rem;
  line-height: 1.5;
  border-radius: 12px;

  i { margin-top: 0.15rem; flex-shrink: 0; }

  &--error {
    color: #991b1b;
    background: #fef2f2;
    border: 1.5px solid #fecaca;
  }

  &--ok {
    color: #14532d;
    background: #f0fdf4;
    border: 1.5px solid #bbf7d0;
  }

  &--info {
    color: $primary-dark;
    background: rgba($secondary, 0.07);
    border: 1.5px solid rgba($secondary, 0.2);
  }
}

.auth-shell .auth-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.9rem 1.25rem;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  color: $white;
  background: $primary;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: filter 0.2s, transform 0.2s;

  &:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
  &:focus-visible { outline: 2px solid $primary-dark; outline-offset: 2px; }

  &:disabled {
    color: rgba($white, 0.85);
    background: rgba($primary-dark, 0.18);
    cursor: not-allowed;
  }
}

.auth-shell .auth-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba($white, 0.35);
  border-top-color: $white;
  border-radius: 50%;
  animation: auth-spin 0.7s linear infinite;
}

.auth-shell .auth-hint {
  font-size: 0.78rem;
  line-height: 1.5;
  color: $text-secondary;
}

@keyframes auth-spin {
  to { transform: rotate(360deg); }
}
</style>
