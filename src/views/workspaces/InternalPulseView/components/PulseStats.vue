<script setup lang="ts">
import { computed } from 'vue'
import type { WorkspacePulse } from '@/services/internalPulse.service'
import { money, pct, diaCorto } from '../utils/format'

const props = defineProps<{ pulse: WorkspacePulse }>()

const tarjetas = computed(() => {
  const p = props.pulse
  return [
    {
      icono: 'fa-solid fa-sack-dollar',
      label: 'Facturado del mes',
      valor: money(p.totals.billed, true),
      pie: `${p.discipline.registeredDays} días con registro`,
      tono: 'brand',
    },
    {
      icono: 'fa-solid fa-crosshairs',
      label: 'Proyección a fin de mes',
      valor: money(p.progress.projection, true),
      pie: p.progress.hasTarget
        ? `${pct(p.progress.projectedPct)} de la meta si sigue este ritmo`
        : 'Sin meta con qué compararla',
      tono: p.progress.projectedPct >= 100 ? 'ok' : 'warn',
    },
    {
      icono: 'fa-solid fa-gauge-high',
      label: 'Ritmo diario necesario',
      valor: money(p.progress.dailyNeeded, true),
      pie: `Promedio actual ${money(p.totals.avgDaily, true)}/día`,
      tono: p.progress.dailyNeeded > p.totals.avgDaily * 1.2 ? 'warn' : 'ok',
    },
    {
      icono: 'fa-solid fa-bolt',
      label: 'ROAS del mes',
      valor: p.totals.metaSpend > 0 ? `${p.totals.roas.toFixed(2)}x` : '—',
      pie: `Gasto Meta ${money(p.totals.metaSpend, true)}`,
      tono: p.totals.roas >= 2 ? 'ok' : p.totals.roas > 0 && p.totals.roas < 1 ? 'bad' : 'neutral',
    },
    {
      icono: 'fa-solid fa-fire',
      label: 'Racha de registro',
      valor: `${p.discipline.streak} ${p.discipline.streak === 1 ? 'día' : 'días'}`,
      pie: p.discipline.missingCount
        ? `${p.discipline.missingCount} días del mes sin registrar`
        : 'Mes completo, sin huecos',
      tono: p.discipline.missingCount ? 'warn' : 'ok',
    },
    {
      icono: 'fa-solid fa-medal',
      label: 'Mejor día',
      valor: p.totals.bestDay ? money(p.totals.bestDay.amount, true) : '—',
      pie: p.totals.bestDay ? diaCorto(p.totals.bestDay.dateStr) : 'Aún sin registros',
      tono: 'neutral',
    },
  ]
})
</script>

<template>
  <div class="stats">
    <article v-for="t in tarjetas" :key="t.label" class="stats__card" :class="`stats__card--${t.tono}`">
      <span class="stats__icon"><i :class="t.icono" aria-hidden="true" /></span>
      <div class="stats__body">
        <p class="stats__label">{{ t.label }}</p>
        <p class="stats__value">{{ t.valor }}</p>
        <p class="stats__foot">{{ t.pie }}</p>
      </div>
    </article>
  </div>
</template>

<style scoped lang="scss">
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 0.9rem;
  margin-top: 1.25rem;
}

.stats__card {
  --tono: #{$text-secondary};
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  border: 1px solid #e8e6ef;
  border-radius: 16px;
  padding: 1rem 1.1rem;
  background: $white;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(25, 20, 35, 0.08); }

  &--brand { --tono: #{$primary}; }
  &--ok { --tono: #{$alert-success}; }
  &--warn { --tono: #{$alert-warning}; }
  &--bad { --tono: #{$alert-error}; }
}

.stats__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 11px;
  background: color-mix(in srgb, var(--tono) 12%, transparent);
  color: var(--tono);
}

.stats__body { min-width: 0; }

.stats__label {
  margin: 0;
  color: $text-secondary;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stats__value { margin: 0.2rem 0 0.15rem; color: $primary-dark; font-size: 1.35rem; font-weight: 800; }
.stats__foot { margin: 0; color: $text-secondary; font-size: 0.76rem; line-height: 1.4; }
</style>
