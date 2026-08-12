<template>
  <main class="nf">
    <div class="nf__glow" aria-hidden="true" />

    <section class="nf__panel">
      <p class="nf__brand"><span class="nf__dot" /> Bakano</p>

      <p class="nf__code" aria-hidden="true">404</p>
      <h1 class="nf__sr">Página no encontrada</h1>

      <p class="nf__eyebrow">{{ caso.eyebrow }}</p>
      <p class="nf__lead">{{ caso.titulo }}</p>
      <p class="nf__body">{{ caso.detalle }}</p>

      <p class="nf__path">
        <span class="nf__path-label">Intentaste abrir</span>
        <code>{{ intentado }}</code>
      </p>

      <div class="nf__actions">
        <RouterLink :to="destino" class="nf__btn nf__btn--primary">
          {{ etiqueta }}
          <i class="fa-solid fa-arrow-right" aria-hidden="true" />
        </RouterLink>
        <button v-if="puedeVolver" type="button" class="nf__btn" @click="volver">
          <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Volver atrás
        </button>
      </div>

      <p class="nf__help">
        Si llegaste desde un enlace que te compartió Bakano, avísale a tu contacto para
        que lo corrija.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resolveHomeRoute, homeRouteLabel, isWorkspaceIdValido } from '@/router/home'

const route = useRoute()
const router = useRouter()

const destino = computed(() => resolveHomeRoute())
const etiqueta = computed(() => homeRouteLabel())

/**
 * Un id de espacio mal formado no es "la página no existe": la página existe,
 * el identificador del enlace está roto. Decirlo evita que alguien reporte que
 * "se cayó la planificación" cuando lo que pasó es que el enlace vino cortado.
 */
const caso = computed(() => {
  const segmentos = route.path.split('/')
  const idx = segmentos.indexOf('workspaces')
  const posibleId = idx >= 0 ? segmentos[idx + 1] : undefined

  if (posibleId && !isWorkspaceIdValido(posibleId)) {
    return {
      eyebrow: 'Espacio de trabajo inválido',
      titulo: 'Este enlace no apunta a ningún espacio.',
      detalle:
        'El identificador del espacio de trabajo está mal formado, casi siempre porque el enlace se cortó al copiarlo o al pegarlo en un chat.',
    }
  }

  return {
    eyebrow: 'Ruta no encontrada',
    titulo: 'Esta página no existe.',
    detalle: 'El enlace puede estar mal escrito, o la página se movió de sitio.',
  }
})

/** La ruta que se intentó abrir, recortada para que no rompa el ancho. */
const intentado = computed(() => {
  const path = route.fullPath
  return path.length > 68 ? `${path.slice(0, 68)}…` : path
})

// Sin historial previo (link pegado, pestaña nueva) el botón de volver no lleva
// a ningún lado, así que no se muestra.
const puedeVolver = window.history.length > 1

function volver() {
  router.back()
}
</script>

<style scoped lang="scss">
.nf {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 2rem 1.5rem;
  // Solo horizontal: el resplandor se sale por los lados a propósito, pero
  // recortar en vertical dejaba el pie cortado en pantallas bajas.
  overflow-x: clip;
  background: $primary-dark;
}

// Una sola fuente de luz, detrás del número. El resto de la página es plano.
.nf__glow {
  position: absolute;
  top: -30%;
  left: 50%;
  width: min(46rem, 120vw);
  height: min(46rem, 120vw);
  background: radial-gradient(
    circle,
    rgba($primary, 0.28) 0%,
    rgba($secondary, 0.14) 42%,
    transparent 68%
  );
  transform: translateX(-50%);
  pointer-events: none;
}

.nf__panel {
  position: relative;
  width: 100%;
  max-width: 34rem;
  animation: nf-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.nf__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 2.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgba($primary-light, 0.5);
  text-transform: uppercase;
}

.nf__dot {
  width: 8px;
  height: 8px;
  background: $primary;
  border-radius: 50%;
}

.nf__code {
  margin: 0 0 1.25rem;
  font-size: clamp(5.5rem, 21vw, 10rem);
  font-weight: 900;
  line-height: 0.85;
  letter-spacing: -0.055em;
  color: transparent;
  background: linear-gradient(115deg, $primary 0%, $secondary 78%);
  background-clip: text;
  -webkit-background-clip: text;
}

/* El 404 grande es decorativo; el título real vive aquí para lectores de pantalla. */
.nf__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.nf__eyebrow {
  margin: 0 0 0.6rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: $primary;
  text-transform: uppercase;
}

.nf__lead {
  margin: 0 0 0.6rem;
  font-size: clamp(1.45rem, 4.5vw, 1.9rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: $primary-light;
}

.nf__body {
  max-width: 26rem;
  margin: 0 0 1.6rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: rgba($primary-light, 0.62);
}

.nf__path {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0 0 2rem;
  padding: 0.7rem 0.9rem;
  background: rgba($primary-light, 0.04);
  border-left: 2px solid rgba($primary, 0.6);
  border-radius: 0 8px 8px 0;

  code {
    min-width: 0;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 0.82rem;
    color: $primary-light;
    word-break: break-all;
  }
}

.nf__path-label {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba($primary-light, 0.42);
  text-transform: uppercase;
}

.nf__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 2rem;
}

.nf__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.72rem 1.25rem;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  color: $primary-light;
  text-decoration: none;
  background: rgba($primary-light, 0.07);
  border: 1px solid rgba($primary-light, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, transform 0.18s;

  &:hover { background: rgba($primary-light, 0.13); }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 3px; }

  &--primary {
    color: $white;
    background: $primary;
    border-color: $primary;

    &:hover { background: $primary; transform: translateY(-1px); }
  }
}

.nf__help {
  max-width: 26rem;
  margin: 0;
  padding-top: 1.4rem;
  font-size: 0.78rem;
  line-height: 1.55;
  color: rgba($primary-light, 0.38);
  border-top: 1px solid rgba($primary-light, 0.08);
}

// Portátil Windows escalado: cabe entero sin scroll.
@media (max-height: 780px) {
  .nf { padding: 1.5rem; }
  .nf__brand { margin-bottom: 1.5rem; }
  .nf__code { font-size: clamp(4rem, 14vh, 6.5rem); margin-bottom: 0.9rem; }
  .nf__body { margin-bottom: 1.1rem; }
  .nf__path { margin-bottom: 1.3rem; }
  .nf__actions { margin-bottom: 1.3rem; }
  .nf__help { padding-top: 1rem; }
}

@keyframes nf-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .nf__panel { animation: none; }
  .nf__btn:hover { transform: none; }
}
</style>
