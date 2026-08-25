<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PulseDay } from '@/services/internalPulse.service'
import { money, diaCorto, pct } from '../utils/format'

const props = defineProps<{
  days: PulseDay[]
  targetAmount: number
  daysInMonth: number
}>()

const ANCHO = 720
const ALTO = 220

const acumulado = computed(() => {
  let suma = 0
  return props.days.map((d) => {
    suma += d.amount
    return { ...d, acumulado: suma }
  })
})

/**
 * La escala la manda el mayor entre meta y facturado: si el cliente ya superó
 * la meta, aplastar la curva contra el techo escondería justo la buena noticia.
 */
const techo = computed(() => {
  const maxAcum = acumulado.value.length ? acumulado.value[acumulado.value.length - 1].acumulado : 0
  return Math.max(maxAcum, props.targetAmount, 1)
})

const x = (i: number) => (props.daysInMonth <= 1 ? 0 : (i / (props.daysInMonth - 1)) * ANCHO)
const y = (valor: number) => ALTO - (valor / techo.value) * ALTO

const lineaFacturado = computed(() =>
  acumulado.value.map((d, i) => `${x(i).toFixed(1)},${y(d.acumulado).toFixed(1)}`).join(' '),
)

const areaFacturado = computed(() => {
  if (!acumulado.value.length) return ''
  const ultimo = x(acumulado.value.length - 1).toFixed(1)
  return `0,${ALTO} ${lineaFacturado.value} ${ultimo},${ALTO}`
})

/** La meta repartida pareja: la diagonal contra la que se mide todo el mes. */
const lineaMeta = computed(() => {
  if (!props.targetAmount) return ''
  return `0,${y(props.targetAmount / props.daysInMonth).toFixed(1)} ${ANCHO},${y(props.targetAmount).toFixed(1)}`
})

const maxDiario = computed(() => Math.max(...props.days.map((d) => d.amount), 1))
const hover = ref<number | null>(null)
const diaActivo = computed(() => (hover.value === null ? null : acumulado.value[hover.value]))

const avanceFinal = computed(() => {
  if (!props.targetAmount || !acumulado.value.length) return 0
  return (acumulado.value[acumulado.value.length - 1].acumulado / props.targetAmount) * 100
})
</script>

<template>
  <section class="track">
    <header class="track__head">
      <div>
        <h2 class="track__title">Carrera del mes</h2>
        <p class="track__sub">Facturación acumulada contra la meta repartida día a día.</p>
      </div>
      <div class="track__legend">
        <span class="track__key track__key--real">Facturado</span>
        <span class="track__key track__key--meta">Meta</span>
      </div>
    </header>

    <div class="track__chart">
      <svg :viewBox="`0 0 ${ANCHO} ${ALTO}`" preserveAspectRatio="none" class="track__svg">
        <defs>
          <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e6285c" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#e6285c" stop-opacity="0" />
          </linearGradient>
        </defs>

        <line v-for="n in 3" :key="n" x1="0" :y1="(ALTO / 4) * n" :x2="ANCHO" :y2="(ALTO / 4) * n" class="track__grid" />
        <polyline v-if="lineaMeta" :points="lineaMeta" class="track__meta" />
        <polygon v-if="areaFacturado" :points="areaFacturado" fill="url(#pulseFill)" />
        <polyline v-if="lineaFacturado" :points="lineaFacturado" class="track__real" />
      </svg>

      <p v-if="targetAmount" class="track__badge" :class="{ 'is-ok': avanceFinal >= 100 }">
        {{ pct(avanceFinal) }} de la meta
      </p>
    </div>

    <div class="track__bars">
      <button
        v-for="(d, i) in acumulado"
        :key="d.dateStr"
        type="button"
        class="track__bar"
        :class="{ 'track__bar--vacio': d.entryCount === 0, 'track__bar--activo': hover === i }"
        :style="{ height: `${Math.max((d.amount / maxDiario) * 100, 3)}%` }"
        :aria-label="`${diaCorto(d.dateStr)}: ${money(d.amount)}`"
        @mouseenter="hover = i"
        @mouseleave="hover = null"
        @focus="hover = i"
        @blur="hover = null"
      />
    </div>

    <p class="track__foot">
      <template v-if="diaActivo">
        <strong>{{ diaCorto(diaActivo.dateStr) }}</strong> · {{ money(diaActivo.amount) }} facturado ·
        acumulado {{ money(diaActivo.acumulado, true) }}
        <template v-if="diaActivo.entryCount === 0"> · <span class="is-warn">sin registro</span></template>
      </template>
      <template v-else>Pasa el cursor por las barras para ver el detalle de cada día.</template>
    </p>
  </section>
</template>

<style scoped lang="scss">
.track {
  border: 1px solid #e8e6ef;
  border-radius: 18px;
  padding: 1.25rem 1.35rem 1rem;
  background: $white;
}

.track__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.track__title { margin: 0; color: $primary-dark; font-size: 1rem; font-weight: 800; }
.track__sub { margin: 0.2rem 0 0; color: $text-secondary; font-size: 0.8rem; }

.track__legend { display: flex; gap: 0.75rem; flex-shrink: 0; }

.track__key {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: $text-secondary;
  font-size: 0.74rem;
  font-weight: 700;

  &::before { content: ''; width: 14px; height: 3px; border-radius: 2px; }
  &--real::before { background: $primary; }
  &--meta::before { background: repeating-linear-gradient(90deg, $secondary 0 4px, transparent 4px 7px); }
}

.track__chart { position: relative; margin-top: 1rem; }
.track__svg { width: 100%; height: 190px; overflow: visible; }
.track__grid { stroke: #f0eef5; stroke-width: 1; }
.track__meta { fill: none; stroke: $secondary; stroke-width: 2; stroke-dasharray: 6 5; vector-effect: non-scaling-stroke; }
.track__real { fill: none; stroke: $primary; stroke-width: 2.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }

.track__badge {
  position: absolute;
  top: 0;
  right: 0;
  margin: 0;
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  background: rgba($primary, 0.1);
  color: $primary;
  font-size: 0.74rem;
  font-weight: 800;

  &.is-ok { background: $alert-success-bg; color: $alert-success; }
}

.track__bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 46px;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0eef5;
}

.track__bar {
  flex: 1;
  min-width: 0;
  border: 0;
  border-radius: 3px 3px 0 0;
  background: rgba($primary, 0.55);
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease;

  &--vacio { background: repeating-linear-gradient(45deg, #e6e3ee 0 3px, #f5f3f9 3px 6px); }
  &--activo { background: $primary; }
}

.track__foot {
  margin: 0.6rem 0 0;
  color: $text-secondary;
  font-size: 0.78rem;

  strong { color: $primary-dark; }
  .is-warn { color: $alert-warning; font-weight: 700; }
}
</style>
