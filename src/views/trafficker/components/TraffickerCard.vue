<script setup lang="ts">
import type { PropType } from 'vue'
import { RouterLink } from 'vue-router'
import type { Card } from '../composables/useTraffickerDashboard'

const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true,
  },
  isReminding: {
    type: Boolean,
    default: false,
  },
  isReminded: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'goDetail'): void
  (e: 'remind'): void
}>()

function fmt(v: number) {
  return (v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function cardClass(roas: number) {
  if (!roas) return 'trf-card--gray'
  if (roas >= 4) return 'trf-card--green'
  if (roas >= 3) return 'trf-card--teal'
  if (roas >= 1) return 'trf-card--orange'
  return 'trf-card--red'
}

function roasBadge(roas: number) {
  if (!roas) return 'badge--gray'
  if (roas >= 4) return 'badge--green'
  if (roas >= 3) return 'badge--teal'
  if (roas >= 1) return 'badge--orange'
  return 'badge--red'
}

function roasLabel(roas: number) {
  if (!roas) return 'Sin datos'
  if (roas < 1) return 'Crítico'
  if (roas < 4) return 'En peligro'
  return 'Óptimo'
}

function roasLabelClass(roas: number) {
  if (!roas) return 'roas-label--gray'
  if (roas < 1) return 'roas-label--red'
  if (roas < 4) return 'roas-label--orange'
  return 'roas-label--green'
}
</script>

<template>
  <div
    class="trf-card"
    :class="cardClass(card.roas)"
    @click="emit('goDetail')"
  >
    <!-- Top row: name + status badges -->
    <div class="trf-card__top">
      <div class="trf-card__name-wrap">
        <div class="trf-card__avatar">
          <img v-if="card.pageId" :src="`https://graph.facebook.com/${card.pageId}/picture?type=normal`" :alt="card.name" class="trf-card__avatar-img" @error="($event.target as HTMLImageElement).style.display='none'" />
          <span v-else>{{ card.name[0]?.toUpperCase() }}</span>
        </div>
        <div>
          <p class="trf-card__name">{{ card.name }}</p>
          <div class="trf-card__badges">
            <span class="trf-card__badge" :class="card.revenue > 0 ? 'trf-card__badge--ok' : 'trf-card__badge--missing'">
              <i :class="card.revenue > 0 ? 'fa-solid fa-check' : 'fa-solid fa-xmark'" />
              Facturación
            </span>
            <span class="trf-card__badge" :class="card.spend > 0 ? 'trf-card__badge--ok' : 'trf-card__badge--neutral'">
              <i :class="card.spend > 0 ? 'fa-brands fa-meta' : 'fa-solid fa-minus'" />
              Pauta
            </span>
          </div>
        </div>
      </div>
      <div class="trf-card__roas-wrap">
        <div class="trf-card__roas" :class="roasBadge(card.roas)">
          {{ card.roas > 0 ? card.roas.toFixed(2) + 'x' : '—' }}
        </div>
        <span class="trf-card__roas-label" :class="roasLabelClass(card.roas)">
          {{ roasLabel(card.roas) }}
        </span>
      </div>
    </div>

    <!-- Missing billing warning -->
    <div v-if="card.revenue === 0" class="trf-card__billing-alert">
      <i class="fa-solid fa-triangle-exclamation" />
      <span>Facturación pendiente — debe ser registrada</span>
    </div>

    <!-- Metrics row -->
    <div class="trf-card__metrics">
      <div class="trf-card__metric trf-card__metric--revenue">
        <div class="trf-card__metric-icon"><i class="fa-solid fa-building-columns" /></div>
        <div>
          <span class="trf-card__metric-label">Facturación</span>
          <span class="trf-card__metric-val">${{ fmt(card.revenue) }}</span>
        </div>
      </div>
      <div class="trf-card__metric-sep" />
      <div class="trf-card__metric trf-card__metric--online">
        <div class="trf-card__metric-icon"><i class="fa-solid fa-globe" /></div>
        <div>
          <span class="trf-card__metric-label">Online</span>
          <span class="trf-card__metric-val">${{ fmt(card.onlineRevenue) }}</span>
        </div>
      </div>
      <div class="trf-card__metric-sep" />
      <div class="trf-card__metric trf-card__metric--spend">
        <div class="trf-card__metric-icon"><i class="fa-brands fa-meta" /></div>
        <div>
          <span class="trf-card__metric-label">Gasto Meta</span>
          <span class="trf-card__metric-val">${{ fmt(card.spend) }}</span>
        </div>
      </div>
    </div>

    <!-- Progress bar toward 4x -->
    <div class="trf-card__progress">
      <div class="trf-card__progress-track">
        <div
          class="trf-card__progress-fill"
          :class="roasBadge(card.roas)"
          :style="{ width: Math.min((card.roas / 4) * 100, 100) + '%' }"
        />
      </div>
      <div class="trf-card__progress-info">
        <span class="trf-card__progress-ratio">
          {{ card.roas > 0 ? Math.round(Math.min((card.roas / 4) * 100, 100)) + '%' : '0%' }} del objetivo 4x
        </span>
        <span v-if="card.metaConnected" class="trf-card__meta-dot">
          <i class="fa-brands fa-meta" /> Meta
        </span>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="trf-card__actions" @click.stop>
      <button class="trf-card__action trf-card__action--primary" @click="emit('goDetail')">
        <i class="fa-solid fa-arrow-up-right-from-square" /> Ver detalle
      </button>
      <RouterLink
        class="trf-card__action"
        :to="{ name: 'BillingRoas', params: { workspaceId: card.id } }"
      >
        <i class="fa-solid fa-chart-column" /> Facturación
      </RouterLink>
      <RouterLink
        v-if="card.metaConnected"
        class="trf-card__action"
        :to="{ name: 'BillingRoas', params: { workspaceId: card.id } }"
      >
        <i class="fa-brands fa-meta" /> Meta Ads
      </RouterLink>
      <button
        class="trf-card__action trf-card__action--remind"
        :class="{
          'trf-card__action--reminding': isReminding,
          'trf-card__action--reminded': isReminded,
        }"
        :disabled="isReminding || isReminded"
        @click="emit('remind')"
        :title="isReminded ? 'Recordatorio enviado' : 'Enviar recordatorio de facturación a colaboradores'"
      >
        <i
          :class="isReminded
            ? 'fa-solid fa-check'
            : isReminding
              ? 'fa-solid fa-spinner fa-spin'
              : 'fa-solid fa-bell'"
        />
        {{ isReminded ? 'Enviado' : isReminding ? 'Enviando…' : 'Recordar' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trf-card {
  background: white;
  border-radius: 16px;
  border: 1.5px solid rgba($primary, 0.09);
  border-left: 5px solid transparent;
  padding: 20px;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  }

  &--green  {
    border-left-color: #16a34a;
    background: linear-gradient(160deg, #f0fdf4 0%, white 55%);
  }
  &--teal   {
    border-left-color: #0891b2;
    background: linear-gradient(160deg, #ecfeff 0%, white 55%);
  }
  &--orange {
    border-left-color: #f97316;
    background: linear-gradient(160deg, #fff7ed 0%, white 55%);
  }
  &--red    {
    border-left-color: #ef4444;
    background: linear-gradient(160deg, #fef2f2 0%, white 55%);
    animation: pulse-shadow 2.5s ease-in-out infinite;
  }
  &--gray   {
    border-left-color: #cbd5e1;
    background: white;
  }
}

@keyframes pulse-shadow {
  0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  50%       { box-shadow: 0 4px 20px rgba(220,38,38,0.18); }
}

.trf-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.trf-card__name-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.trf-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba($primary, 0.1);
  color: $primary;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  &-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
    display: block;
  }
}

.trf-card__name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
  color: $primary-dark;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.trf-card__status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  margin: 0;

  i { font-size: 10px; }

  &.status--green  { color: #16a34a; }
  &.status--teal   { color: #0891b2; }
  &.status--orange { color: #d97706; }
  &.status--red    { color: #dc2626; }
  &.status--gray   { color: #9ca3af; }
}

.trf-card__roas {
  font-size: 26px;
  font-weight: 900;
  padding: 6px 12px;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;

  &.badge--green  { color: #fff;    background: #16a34a; }
  &.badge--teal   { color: #fff;    background: #0891b2; }
  &.badge--orange { color: #fff;    background: #f97316; }
  &.badge--red    { color: #fff;    background: #ef4444; }
  &.badge--gray   { color: #475569; background: #e2e8f0; }
}

.trf-card__metrics {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: rgba($primary, 0.03);
  border: 1px solid rgba($primary, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.trf-card__metric {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  flex: 1;

  &--revenue .trf-card__metric-icon { color: #16a34a; background: #dcfce7; }
  &--online  .trf-card__metric-icon { color: #6366f1; background: #e0e7ff; }
  &--spend   .trf-card__metric-icon { color: #1877f2; background: rgba(#1877f2, 0.1); }
}

.trf-card__metric-sep {
  width: 1px;
  background: rgba($primary, 0.1);
  margin: 8px 0;
  flex-shrink: 0;
}

.trf-card__metric-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
  background: rgba($primary, 0.08);
  color: $primary;
}

.trf-card__metric-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.trf-card__metric-val {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: $primary-dark;
  font-variant-numeric: tabular-nums;
}

.trf-card__progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trf-card__progress-track {
  height: 7px;
  background: #f3f4f6;
  border-radius: 100px;
  overflow: hidden;
}

.trf-card__progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  &.badge--green  { background: #16a34a; }
  &.badge--teal   { background: #0891b2; }
  &.badge--orange { background: #f97316; }
  &.badge--red    { background: #ef4444; }
  &.badge--gray   { background: #cbd5e1; }
}

.trf-card__progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trf-card__progress-ratio {
  font-size: 11px;
  color: $text-secondary;
  font-weight: 500;
}

.trf-card__meta-dot {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  color: #1877f2;
  background: rgba(#1877f2, 0.08);
  padding: 2px 6px;
  border-radius: 100px;
}

.trf-card__actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid rgba($primary, 0.07);
}

.trf-card__action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.14s;
  border: 1.5px solid rgba($primary, 0.18);
  background: white;
  color: $primary-dark;

  i { font-size: 11px; }

  &:hover { background: rgba($primary, 0.07); border-color: $primary; }

  &--primary {
    background: $primary;
    color: white;
    border-color: $primary;

    &:hover { background: darken($primary, 8%); }
  }

  &--remind {
    border-color: rgba(#d97706, 0.3);
    color: #b45309;

    &:hover:not(:disabled) {
      background: rgba(#d97706, 0.08);
      border-color: #d97706;
    }
  }

  &--reminding {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--reminded {
    background: rgba(#16a34a, 0.08);
    border-color: #16a34a;
    color: #15803d;
    cursor: default;
  }
}

.trf-card__roas-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.trf-card__roas-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.3px;
  white-space: nowrap;

  &--red    { color: #dc2626; }
  &--orange { color: #d97706; }
  &--green  { color: #16a34a; }
  &--gray   { color: #9ca3af; }
}

.trf-card__billing-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #c2410c;

  i { font-size: 14px; flex-shrink: 0; }
}

.trf-card__badges {
  display: flex;
  gap: 5px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.trf-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 100px;
  letter-spacing: 0.2px;

  i { font-size: 9px; }

  &--ok      { background: #dcfce7; color: #15803d; }
  &--missing { background: #fee2e2; color: #dc2626; }
  &--neutral { background: #f1f5f9; color: #64748b; }
}
</style>
