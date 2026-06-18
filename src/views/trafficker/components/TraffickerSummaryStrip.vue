<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  cardsLength: { type: Number, required: true },
  avgRoas: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  totalSpend: { type: Number, required: true },
  cardsWithoutBillingLength: { type: Number, required: true },
  onTarget: { type: Number, required: true },
  remindAllActive: { type: Boolean, required: true },
  remindAllDone: { type: Boolean, required: true },
  remindAllTotal: { type: Number, required: true },
  remindAllErrors: { type: Number, required: true },
  remindAllDoneCount: { type: Number, required: true },
})

const emit = defineEmits<{
  (e: 'remindAll'): void
}>()

const stripRoasClass = computed(() => {
  const r = props.avgRoas
  if (!r) return ''
  if (r >= 4) return 'trf__strip-val--green'
  if (r >= 3) return 'trf__strip-val--teal'
  if (r >= 1) return 'trf__strip-val--orange'
  return 'trf__strip-val--red'
})

function fmt(v: number) {
  return (v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="trf__strip">
    <div class="trf__strip-item">
      <span class="trf__strip-label">ROAS promedio</span>
      <span class="trf__strip-val" :class="stripRoasClass">{{ avgRoas > 0 ? avgRoas.toFixed(2) + 'x' : '—' }}</span>
    </div>
    <div class="trf__strip-divider" />
    <div class="trf__strip-item">
      <span class="trf__strip-label">Facturación total</span>
      <span class="trf__strip-val">${{ fmt(totalRevenue) }}</span>
    </div>
    <div class="trf__strip-divider" />
    <div class="trf__strip-item">
      <span class="trf__strip-label">Gasto Meta total</span>
      <span class="trf__strip-val">${{ fmt(totalSpend) }}</span>
    </div>
    <div class="trf__strip-divider" />
    <div class="trf__strip-item">
      <span class="trf__strip-label">Clientes</span>
      <span class="trf__strip-val">{{ cardsLength }}</span>
    </div>
    <div class="trf__strip-divider" />
    <div class="trf__strip-item">
      <span class="trf__strip-label">Sin facturación</span>
      <span class="trf__strip-val" :class="cardsWithoutBillingLength > 0 ? 'trf__strip-val--red' : 'trf__strip-val--green'">
        {{ cardsWithoutBillingLength }}
      </span>
    </div>
    <div class="trf__strip-divider" />
    <div class="trf__strip-item">
      <span class="trf__strip-label">En objetivo ≥4x</span>
      <span class="trf__strip-val trf__strip-val--green">{{ onTarget }}</span>
    </div>

    <!-- Recordar a todos -->
    <div class="trf__strip-divider" />
    <div class="trf__strip-item">
      <button
        v-if="!remindAllDone"
        class="trf__remind-all-btn"
        :class="{ 'trf__remind-all-btn--active': remindAllActive }"
        :disabled="remindAllActive || cardsWithoutBillingLength === 0"
        @click="emit('remindAll')"
      >
        <i :class="remindAllActive ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-bell'" />
        <span v-if="remindAllActive">
          Enviando {{ remindAllDoneCount }} / {{ remindAllTotal }}…
        </span>
        <span v-else>
          Recordar a todos <span v-if="cardsWithoutBillingLength" class="trf__remind-all-count">{{ cardsWithoutBillingLength }}</span>
        </span>
      </button>
      <div v-else class="trf__remind-all-done">
        <i class="fa-solid fa-check" /> Enviado a {{ remindAllTotal - remindAllErrors }} entornos
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trf__strip {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0;
  background: white;
  border: 1.5px solid rgba($primary, 0.1);
  border-radius: 16px;
  padding: 16px 12px;
  margin-bottom: 28px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);

  &::-webkit-scrollbar { display: none; }

  @media (min-width: 640px) { padding: 20px 16px; }
}

.trf__strip-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 4px 20px;
  flex-shrink: 0;

  @media (min-width: 640px) { padding: 6px 28px; }
}

.trf__strip-label {
  font-size: 10px;
  font-weight: 700;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;

  @media (min-width: 640px) { font-size: 11px; }
}

.trf__strip-val {
  font-size: 22px;
  font-weight: 900;
  color: $primary-dark;
  font-variant-numeric: tabular-nums;

  @media (min-width: 640px) { font-size: 26px; }

  &--green  { color: #16a34a; }
  &--teal   { color: #0891b2; }
  &--orange { color: #d97706; }
  &--red    { color: #dc2626; }
}

.trf__strip-divider {
  width: 1px;
  height: 42px;
  background: rgba($primary, 0.1);
  flex-shrink: 0;
}

.trf__remind-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid rgba(#d97706, 0.4);
  background: rgba(#d97706, 0.06);
  color: #b45309;
  transition: all 0.14s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(#d97706, 0.14);
    border-color: #d97706;
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--active {
    border-color: $primary;
    background: rgba($primary, 0.06);
    color: $primary-dark;
  }
}

.trf__remind-all-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #d97706;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
}

.trf__remind-all-done {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #15803d;

  i { font-size: 11px; }
}
</style>
