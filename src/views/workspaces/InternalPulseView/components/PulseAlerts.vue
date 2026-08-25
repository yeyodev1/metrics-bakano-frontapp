<script setup lang="ts">
import type { PulseAlert } from '@/services/internalPulse.service'
import { diaCorto } from '../utils/format'

defineProps<{ alerts: PulseAlert[]; missingDays: string[] }>()

const ICONO: Record<string, string> = {
  critico: 'fa-solid fa-triangle-exclamation',
  atencion: 'fa-solid fa-circle-exclamation',
  info: 'fa-solid fa-circle-check',
}
</script>

<template>
  <section v-if="alerts.length" class="alerts">
    <h2 class="alerts__title">
      <i class="fa-solid fa-bell" aria-hidden="true" />
      Recordatorios del equipo
    </h2>

    <ul class="alerts__list">
      <li v-for="(a, i) in alerts" :key="`${a.code}-${i}`" class="alerts__item" :class="`alerts__item--${a.level}`">
        <i :class="ICONO[a.level]" aria-hidden="true" />
        <span>{{ a.message }}</span>
      </li>
    </ul>

    <div v-if="missingDays.length" class="alerts__days">
      <p class="alerts__days-label">Días sin facturación registrada</p>
      <div class="alerts__chips">
        <span v-for="d in missingDays" :key="d" class="alerts__chip">{{ diaCorto(d) }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.alerts {
  border: 1px solid #e8e6ef;
  border-radius: 18px;
  padding: 1.15rem 1.25rem;
  background: $white;
}

.alerts__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.85rem;
  color: $primary-dark;
  font-size: 0.95rem;
  font-weight: 800;

  i { color: $primary; }
}

.alerts__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.55rem; }

.alerts__item {
  --tono: #{$alert-info};
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  border-left: 3px solid var(--tono);
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  background: color-mix(in srgb, var(--tono) 8%, transparent);
  color: $primary-dark;
  font-size: 0.86rem;
  line-height: 1.5;

  i { margin-top: 0.15rem; color: var(--tono); }

  &--critico { --tono: #{$alert-error}; }
  &--atencion { --tono: #{$alert-warning}; }
  &--info { --tono: #{$alert-success}; }
}

.alerts__days { margin-top: 1rem; }

.alerts__days-label {
  margin: 0 0 0.45rem;
  color: $text-secondary;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.alerts__chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.alerts__chip {
  border-radius: 8px;
  padding: 0.28rem 0.55rem;
  background: $alert-warning-bg;
  color: #92400e;
  font-size: 0.74rem;
  font-weight: 700;
}
</style>
