<template>
  <header class="rh">
    <div class="rh__glow" aria-hidden="true" />

    <div class="rh__content">
      <div class="rh__text">
        <span class="rh__eyebrow">
          <i class="fa-solid fa-folder-open" /> Recursos de marca
        </span>

        <h1 class="rh__title">El material con el que la IA escribe</h1>

        <p class="rh__sub">
          Logo, línea gráfica y catálogo. Con esto los guiones suenan a esta
          marca; sin esto, suenan a cualquiera.
        </p>

        <!-- Nombra lo que falta. Un contador solo no dice qué hacer. -->
        <p v-if="missing.length" class="rh__gap">
          <i class="fa-solid fa-circle-exclamation" />
          Falta <strong>{{ missingText }}</strong>
        </p>
        <p v-else class="rh__gap rh__gap--done">
          <i class="fa-solid fa-circle-check" />
          Marca completa
        </p>
      </div>

      <!-- Anillo de progreso: 3 categorías, no cantidad de archivos. -->
      <div class="rh__ring" role="img" :aria-label="`${done} de 3 categorías completas`">
        <svg viewBox="0 0 120 120">
          <circle class="rh__ring-track" cx="60" cy="60" r="52" />
          <circle
            class="rh__ring-fill"
            cx="60"
            cy="60"
            r="52"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="offset"
          />
        </svg>
        <span class="rh__ring-label">
          <strong>{{ done }}</strong>
          <small>de 3</small>
        </span>
      </div>
    </div>

    <div class="rh__stats">
      <span class="rh__stat">
        <strong>{{ total }}</strong> {{ total === 1 ? 'archivo' : 'archivos' }}
      </span>
      <span class="rh__stat rh__stat--muted">Máximo {{ MAX_MB }} MB por archivo</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MAX_MB } from '@/utils/brandResources'

const props = defineProps<{ total: number; missing: string[] }>()

const CIRCUMFERENCE = 2 * Math.PI * 52

const done = computed(() => 3 - props.missing.length)
const offset = computed(() => CIRCUMFERENCE * (1 - done.value / 3))

/** "logo y catálogo" lee mejor que una lista separada por comas. */
const missingText = computed(() => {
  const items = props.missing
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
})
</script>

<style scoped lang="scss">
.rh {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.5rem;
  overflow: hidden;
  color: $text-light;
  background: linear-gradient(135deg, $primary-dark 0%, $secondary-dark 100%);
  border-radius: 20px;
}

// Halo difuso que rompe el plano del degradado.
.rh__glow {
  position: absolute;
  top: -45%;
  right: -12%;
  width: 26rem;
  height: 26rem;
  background: radial-gradient(circle, rgba($primary, 0.45) 0%, transparent 68%);
  pointer-events: none;
}

.rh__content {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
}

.rh__text {
  display: flex;
  flex: 1 1 18rem;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.rh__eyebrow {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.7rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba($white, 0.12);
  border-radius: 20px;
}

.rh__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: $white;
}

.rh__sub {
  max-width: 34rem;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: rgba($white, 0.72);
}

.rh__gap {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 0.45rem;
  margin: 0.25rem 0 0;
  padding: 0.4rem 0.8rem;
  font-size: 0.79rem;
  background: rgba($alert-warning, 0.16);
  border: 1px solid rgba($alert-warning, 0.35);
  border-radius: 10px;

  i { color: $alert-warning; }
  strong { color: $white; }

  &--done {
    background: rgba($BAKANO-GREEN, 0.16);
    border-color: rgba($BAKANO-GREEN, 0.4);

    i { color: $BAKANO-GREEN; }
  }
}

.rh__ring {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 6.5rem;
  height: 6.5rem;

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  circle {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
  }
}

.rh__ring-track { stroke: rgba($white, 0.14); }

.rh__ring-fill {
  stroke: $BAKANO-GREEN;
  transition: stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.rh__ring-label {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;

  strong { font-size: 1.5rem; font-weight: 800; color: $white; }
  small { font-size: 0.62rem; color: rgba($white, 0.6); }
}

.rh__stats {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rh__stat {
  padding: 0.3rem 0.75rem;
  font-size: 0.74rem;
  color: rgba($white, 0.8);
  background: rgba($white, 0.1);
  border-radius: 8px;

  strong { color: $white; }

  &--muted { color: rgba($white, 0.5); background: transparent; }
}

@media (min-width: 700px) {
  .rh { padding: 1.9rem 2rem; }
  .rh__title { font-size: 1.8rem; }
}

@media (prefers-reduced-motion: reduce) {
  .rh__ring-fill { transition: none; }
}
</style>
