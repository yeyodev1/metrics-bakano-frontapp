<template>
  <div class="tar">
    <p class="tar__titulo">
      Anuncios este mes
      <span>{{ actividad.activos }} activos · {{ actividad.pausados }} pausados</span>
    </p>
    <p v-if="actividad.error" class="tar__error">{{ actividad.error }}</p>
    <dl v-else class="tar__metricas">
      <div><dt>Impresiones</dt><dd>{{ num(actividad.impresiones) }}</dd></div>
      <div><dt>Clics</dt><dd>{{ num(actividad.clics) }}</dd></div>
      <div><dt>CTR</dt><dd>{{ actividad.ctr !== null ? actividad.ctr.toFixed(2) + '%' : '—' }}</dd></div>
      <div><dt>CPC</dt><dd>{{ actividad.cpc !== null ? money(actividad.cpc) : '—' }}</dd></div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import type { AdsActivity } from '../composables/useTraffickerDashboard'

defineProps<{ actividad: AdsActivity }>()

const num = (n: number) => new Intl.NumberFormat('es-EC').format(n || 0)
const money = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0)
</script>

<style lang="scss" scoped>
.tar {
  padding: 0.8rem 0.9rem;
  margin-top: 0.9rem;
  background: rgba($primary-dark, 0.02);
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 10px;
}

.tar__titulo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: $primary-dark;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  span { font-weight: 600; color: $text-secondary; text-transform: none; letter-spacing: 0; }
}

.tar__error { margin: 0; font-size: 0.76rem; line-height: 1.5; color: #b45309; }

.tar__metricas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));
  gap: 0.6rem;
  margin: 0;

  dt { font-size: 0.65rem; color: $text-secondary; text-transform: uppercase; }
  dd { margin: 0.1rem 0 0; font-size: 0.92rem; font-weight: 800; color: $primary-dark; }
}
</style>
