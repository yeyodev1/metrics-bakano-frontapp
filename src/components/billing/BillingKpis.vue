<template>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-icon--green">
        <i class="fa-solid fa-dollar-sign" />
      </div>
      <div class="kpi-content">
        <p class="kpi-label">Total Facturado</p>
        <p class="kpi-value">${{ formatAmount(totals.totalAmount) }}</p>
      </div>
    </div>
    
    <div v-if="totals.totalOnlineRevenue > 0" class="kpi-card">
      <div class="kpi-icon-wrap kpi-icon--indigo">
        <i class="fa-solid fa-globe" />
      </div>
      <div class="kpi-content">
        <p class="kpi-label">Ventas Online</p>
        <p class="kpi-value">${{ formatAmount(totals.totalOnlineRevenue) }}</p>
      </div>
    </div>
    
    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-icon--blue">
        <i class="fa-brands fa-meta" />
      </div>
      <div class="kpi-content">
        <p class="kpi-label">Inversión Meta</p>
        <p class="kpi-value">${{ formatAmount(totals.totalMetaSpend) }}</p>
      </div>
    </div>
    
    <div class="kpi-card">
      <div class="kpi-icon-wrap" :class="roasIconClass(totals.avgROAS)">
        <i class="fa-solid fa-arrow-trend-up" />
      </div>
      <div class="kpi-content">
        <p class="kpi-label">ROAS Promedio</p>
        <p class="kpi-value" :class="roasTextClass(totals.avgROAS)">
          {{ totals.avgROAS ? totals.avgROAS.toFixed(2) + 'x' : '—' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  totals: {
    totalAmount: number
    totalOnlineRevenue: number
    totalMetaSpend: number
    avgROAS: number
  }
}>()

function formatAmount(val: number) {
  return val.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function roasTextClass(roas: number) {
  if (!roas) return 'roas-none'
  if (roas >= 3) return 'roas-good'
  if (roas >= 1) return 'roas-medium'
  return 'roas-bad'
}

function roasIconClass(roas: number) {
  if (!roas) return 'kpi-icon--gray'
  if (roas >= 3) return 'kpi-icon--green'
  if (roas >= 1) return 'kpi-icon--yellow'
  return 'kpi-icon--red'
}
</script>

<style scoped lang="scss">
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 820px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

.kpi-card {
  background: $white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

  &:hover { 
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); 
    border-color: #cbd5e1;
  }
}

.kpi-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;

  &.kpi-icon--green  { background: #dcfce7; color: #16a34a; }
  &.kpi-icon--blue   { background: #dbeafe; color: #2563eb; }
  &.kpi-icon--indigo { background: #e0e7ff; color: #4f46e5; }
  &.kpi-icon--yellow { background: #fef9c3; color: #ca8a04; }
  &.kpi-icon--red    { background: #fee2e2; color: #dc2626; }
  &.kpi-icon--gray   { background: #f1f5f9; color: #64748b; }
}

.kpi-content {
  min-width: 0;
  flex: 1;

  .kpi-label {
    margin: 0 0 4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .kpi-value {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    color: $primary-dark;
    letter-spacing: -0.5px;

    &.roas-none { color: #94a3b8; }
    &.roas-good { color: #16a34a; }
    &.roas-medium { color: #ca8a04; }
    &.roas-bad { color: #dc2626; }
  }
}
</style>
