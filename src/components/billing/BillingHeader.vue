<template>
  <div class="billing-header">
    <div class="header-left">
      <div class="header-icon-wrap">
        <i class="fa-solid fa-chart-column" />
      </div>
      <div>
        <h1>{{ isBoloncity ? 'Ventas Online' : 'Facturación & ROAS' }}</h1>
        <p class="header-sub">{{ workspaceName || 'Cargando...' }}</p>
      </div>
    </div>
    
    <div class="month-nav">
      <button class="nav-btn" @click="$emit('prev-month')" :disabled="loading">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <span class="month-label">{{ monthLabel }}</span>
      <button class="nav-btn" @click="$emit('next-month')" :disabled="loading || isCurrentMonth">
        <i class="fa-solid fa-chevron-right" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isBoloncity: boolean
  workspaceName: string
  monthLabel: string
  loading: boolean
  isCurrentMonth: boolean
}>()

defineEmits<{
  (e: 'prev-month'): void
  (e: 'next-month'): void
}>()
</script>

<style scoped lang="scss">
.billing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;

  h1 {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 800;
    color: $primary-dark;
    letter-spacing: -0.5px;
  }

  .header-sub {
    margin: 0;
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }
}

.header-icon-wrap {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, $primary-dark 0%, #2b1d3d 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $white;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(#2b1d3d, 0.2);
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: $white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);

  .month-label {
    font-size: 14px;
    font-weight: 700;
    color: $primary-dark;
    text-transform: capitalize;
    min-width: 140px;
    text-align: center;
  }

  .nav-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: #f8fafc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 12px;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: $primary;
      color: $white;
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
}
</style>
