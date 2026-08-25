<script setup lang="ts">
import { computed } from 'vue'
import type { WorkspacePulse } from '@/services/internalPulse.service'
import { money, pct, ESTADO_LABEL, ESTADO_ICONO, nombreMes } from '../utils/format'

const props = defineProps<{ pulse: WorkspacePulse; recordando: boolean }>()
const emit = defineEmits<{ (e: 'definir-meta'): void; (e: 'recordar'): void }>()

const RADIO = 88
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

const avance = computed(() => Math.max(0, Math.min(props.pulse.progress.progressPct, 100)))
const offset = computed(() => CIRCUNFERENCIA * (1 - avance.value / 100))

/**
 * La marca del ritmo esperado. Es lo que convierte el anillo en un semáforo:
 * el % solo dice cuánto llevas, la marca dice cuánto deberías llevar hoy.
 */
const marcaRitmo = computed(() => {
  const p = Math.max(0, Math.min(props.pulse.progress.expectedPct, 100))
  return -90 + (p / 100) * 360
})

const estado = computed(() => props.pulse.progress.paceStatus)
const tieneMeta = computed(() => props.pulse.progress.hasTarget)
const periodo = computed(() => `${nombreMes(props.pulse.period.month)} ${props.pulse.period.year}`)

const diferencia = computed(() => {
  const d = props.pulse.progress.paceDiff
  return { positiva: d >= 0, texto: `${d >= 0 ? '+' : '−'}${money(Math.abs(d), true)}` }
})
</script>

<template>
  <section class="hero" :class="`hero--${estado}`">
    <div class="hero__glow" aria-hidden="true" />

    <div class="hero__ring">
      <svg viewBox="0 0 200 200" class="hero__svg" role="img" :aria-label="`Avance ${pct(avance)}`">
        <circle cx="100" cy="100" :r="RADIO" class="hero__track" />
        <circle
          v-if="tieneMeta"
          cx="100"
          cy="100"
          :r="RADIO"
          class="hero__fill"
          :stroke-dasharray="CIRCUNFERENCIA"
          :stroke-dashoffset="offset"
          transform="rotate(-90 100 100)"
        />
        <line
          v-if="tieneMeta"
          x1="100"
          y1="4"
          x2="100"
          y2="24"
          class="hero__marca"
          :transform="`rotate(${marcaRitmo + 90} 100 100)`"
        />
      </svg>

      <div class="hero__ring-center">
        <template v-if="tieneMeta">
          <span class="hero__pct">{{ pct(pulse.progress.progressPct) }}</span>
          <span class="hero__pct-label">de la meta</span>
        </template>
        <template v-else>
          <i class="fa-solid fa-bullseye hero__empty-icon" aria-hidden="true" />
          <span class="hero__pct-label">sin meta</span>
        </template>
      </div>
    </div>

    <div class="hero__body">
      <p class="hero__eyebrow">Meta del mes · {{ periodo }}</p>
      <h1 class="hero__title">{{ pulse.workspace.name }}</h1>

      <div class="hero__badge">
        <i :class="ESTADO_ICONO[estado]" aria-hidden="true" />
        <span>{{ ESTADO_LABEL[estado] }}</span>
      </div>

      <template v-if="tieneMeta">
        <p class="hero__amount">
          {{ money(pulse.totals.billed) }}
          <span>de {{ money(pulse.target!.targetAmount) }}</span>
        </p>
        <p class="hero__line">
          El mes corrió el <strong>{{ pct(pulse.progress.expectedPct) }}</strong> —
          vas <strong :class="diferencia.positiva ? 'is-up' : 'is-down'">{{ diferencia.texto }}</strong>
          contra el ritmo esperado.
        </p>
        <p class="hero__sub">
          Faltan {{ money(pulse.progress.gap, true) }} en {{ pulse.period.remainingDays }} días:
          <strong>{{ money(pulse.progress.dailyNeeded, true) }} por día</strong>.
        </p>
        <p class="hero__autor">
          <i class="fa-solid fa-user-pen" aria-hidden="true" />
          Meta puesta por <strong>{{ pulse.target!.setBy?.name ?? 'el equipo' }}</strong> ·
          cualquiera del equipo interno puede ajustarla.
        </p>
      </template>
      <template v-else>
        <p class="hero__amount">{{ money(pulse.totals.billed) }}<span>facturado este mes</span></p>
        <p class="hero__line hero__line--warn">
          <strong>Nadie ha definido la meta de {{ periodo }}.</strong>
          Sin meta no hay ritmo que medir ni alerta que dar — cualquiera del equipo interno
          puede ponerla, y queda registrado quién.
        </p>
        <p v-if="pulse.suggestedTarget" class="hero__sub">
          Su última meta fue {{ money(pulse.suggestedTarget.targetAmount) }} ({{ pulse.suggestedTarget.fromLabel }}).
        </p>
      </template>

      <div class="hero__actions">
        <button type="button" class="hero__cta" @click="emit('definir-meta')">
          <i class="fa-solid fa-bullseye" aria-hidden="true" />
          {{ tieneMeta ? 'Ajustar meta' : 'Definir meta del mes' }}
        </button>
        <button type="button" class="hero__ghost" :disabled="recordando" @click="emit('recordar')">
          <i class="fa-solid fa-bell" aria-hidden="true" />
          {{ recordando ? 'Enviando…' : 'Recordar al equipo' }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero {
  --acento: #{$secondary};
  position: relative;
  display: flex;
  align-items: center;
  gap: 2.5rem;
  overflow: hidden;
  border-radius: 24px;
  padding: 2rem 2.25rem;
  background: linear-gradient(135deg, $primary-dark 0%, #2b1d3d 100%);
  color: $white;
  box-shadow: 0 18px 40px rgba(25, 20, 35, 0.22);

  &--atrasado { --acento: #{$alert-warning}; }
  &--sin_meta { --acento: #{$primary}; }
  &--en_linea { --acento: #{$alert-info}; }
  &--adelante,
  &--cumplida { --acento: #{$alert-success}; }
}

.hero__glow {
  position: absolute;
  top: -45%;
  right: -10%;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--acento) 45%, transparent) 0%, transparent 68%);
  pointer-events: none;
}

.hero__ring {
  position: relative;
  flex: 0 0 auto;
  width: 200px;
  height: 200px;
}

.hero__svg { width: 100%; height: 100%; }

.hero__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.12);
  stroke-width: 14;
}

.hero__fill {
  fill: none;
  stroke: var(--acento);
  stroke-width: 14;
  stroke-linecap: round;
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--acento) 60%, transparent));
  transition: stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.hero__marca {
  stroke: $white;
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.85;
}

.hero__ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
}

.hero__pct { font-size: 2.5rem; font-weight: 900; letter-spacing: -0.03em; line-height: 1; }
.hero__empty-icon { font-size: 2rem; color: var(--acento); }
.hero__pct-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.65; }

.hero__body { position: relative; flex: 1; min-width: 0; }

.hero__eyebrow {
  margin: 0;
  color: var(--acento);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero__title { margin: 0.35rem 0 0.75rem; font-size: 1.9rem; font-weight: 800; letter-spacing: -0.02em; }

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  background: color-mix(in srgb, var(--acento) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--acento) 45%, transparent);
  font-size: 0.78rem;
  font-weight: 700;
}

.hero__amount {
  margin: 0.9rem 0 0.5rem;
  font-size: 1.6rem;
  font-weight: 800;

  span { margin-left: 0.5rem; font-size: 0.95rem; font-weight: 600; opacity: 0.6; }
}

.hero__line {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  opacity: 0.9;

  &--warn { color: #ffd9e2; }

  .is-up { color: $alert-success; }
  .is-down { color: $alert-warning; }
}

.hero__sub { margin: 0.35rem 0 0; font-size: 0.85rem; opacity: 0.7; }

.hero__autor {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.55rem 0 0;
  font-size: 0.78rem;
  opacity: 0.6;

  strong { opacity: 1; }
}

.hero__actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.25rem; }

.hero__cta,
.hero__ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 12px;
  padding: 0.75rem 1.2rem;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:hover { transform: translateY(-1px); }
  &:disabled { opacity: 0.6; cursor: wait; transform: none; }
}

.hero__cta { border: 0; background: $primary; color: $white; }

.hero__ghost {
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.06);
  color: $white;
}

@media (max-width: 900px) {
  .hero { flex-direction: column; align-items: flex-start; gap: 1.5rem; padding: 1.5rem; }
  .hero__ring { width: 160px; height: 160px; align-self: center; }
  .hero__pct { font-size: 2rem; }
  .hero__title { font-size: 1.5rem; }
}
</style>
