<script setup lang="ts">
import { computed } from 'vue'
import type { TargetHistoryRow } from '@/services/internalPulse.service'
import { money, pct, nombreMes } from '../utils/format'

const props = defineProps<{ history: TargetHistoryRow[] }>()

const techo = computed(() =>
  Math.max(...props.history.flatMap((h) => [h.targetAmount, h.billedAmount]), 1),
)

const altura = (valor: number) => `${Math.max((valor / techo.value) * 100, 2)}%`
</script>

<template>
  <section class="hist">
    <header class="hist__head">
      <h2 class="hist__title">Meta vs facturación</h2>
      <span class="hist__legend">
        <span class="hist__key hist__key--meta">Meta</span>
        <span class="hist__key hist__key--real">Facturado</span>
      </span>
    </header>

    <div class="hist__grid">
      <div v-for="h in history" :key="h.label" class="hist__col">
        <div class="hist__bars">
          <div class="hist__bar hist__bar--meta" :style="{ height: altura(h.targetAmount) }" :title="`Meta ${money(h.targetAmount)}`" />
          <div
            class="hist__bar hist__bar--real"
            :class="{ 'is-ok': h.hasTarget && h.progressPct >= 100 }"
            :style="{ height: altura(h.billedAmount) }"
            :title="`Facturado ${money(h.billedAmount)}`"
          />
        </div>
        <p class="hist__month">{{ nombreMes(h.month).slice(0, 3) }}</p>
        <p class="hist__pct" :class="{ 'is-none': !h.hasTarget, 'is-ok': h.hasTarget && h.progressPct >= 100 }">
          {{ h.hasTarget ? pct(h.progressPct) : 'sin meta' }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hist {
  border: 1px solid #e8e6ef;
  border-radius: 18px;
  padding: 1.15rem 1.25rem;
  background: $white;
}

.hist__head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.hist__title { margin: 0; color: $primary-dark; font-size: 1rem; font-weight: 800; }
.hist__legend { display: flex; gap: 0.7rem; }

.hist__key {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: $text-secondary;
  font-size: 0.72rem;
  font-weight: 700;

  &::before { content: ''; width: 10px; height: 10px; border-radius: 3px; }
  &--meta::before { background: rgba($secondary, 0.35); }
  &--real::before { background: $primary; }
}

.hist__grid { display: flex; align-items: flex-end; gap: 0.85rem; }
.hist__col { flex: 1; min-width: 0; text-align: center; }

.hist__bars { display: flex; align-items: flex-end; justify-content: center; gap: 3px; height: 110px; }

.hist__bar {
  width: 42%;
  border-radius: 5px 5px 0 0;

  &--meta { background: rgba($secondary, 0.28); }
  &--real { background: $primary; }
  &--real.is-ok { background: $alert-success; }
}

.hist__month { margin: 0.4rem 0 0; color: $primary-dark; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }

.hist__pct {
  margin: 0.1rem 0 0;
  color: $text-secondary;
  font-size: 0.7rem;
  font-weight: 700;

  &.is-ok { color: $alert-success; }
  &.is-none { color: #cbd0da; font-weight: 600; }
}
</style>
