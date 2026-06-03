<script setup lang="ts">
defineProps<{
  monthLabel: string
  isCurrentMonth: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'prev-month'): void
  (e: 'next-month'): void
}>()
</script>

<template>
  <div class="view-header">
    <div class="header-banner">
      <div class="header-banner__icon">
        <i class="fa-solid fa-store" />
      </div>
      <div class="header-banner__text">
        <h1 class="header-banner__title">Sucursales</h1>
        <p class="header-banner__subtitle">Gestiona y monitorea las sedes de este workspace</p>
      </div>
    </div>
    <div class="header-actions">
      <!-- Month Nav -->
      <div class="month-nav">
        <button class="nav-btn" @click="emit('prev-month')" :disabled="loading">
          <i class="fa-solid fa-chevron-left" />
        </button>
        <span class="month-label">{{ monthLabel }}</span>
        <button class="nav-btn" @click="emit('next-month')" :disabled="loading || isCurrentMonth">
          <i class="fa-solid fa-chevron-right" />
        </button>
      </div>

      <button class="btn-create" @click="emit('create')">
        <span class="btn-create__icon">
          <i class="fa-solid fa-plus" />
        </span>
        <span>Nueva sucursal</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/colorVariables.module.scss';

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.header-banner {
  display: flex;
  align-items: center;
  gap: 16px;

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__title {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.5px;
  }

  &__subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
    font-weight: 400;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.month-nav {
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);

  .nav-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    i { font-size: 13px; }

    &:hover:not(:disabled) {
      background: #f1f5f9;
      color: #0f172a;
      transform: scale(1.05);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  .month-label {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    min-width: 140px;
    text-align: center;
    text-transform: capitalize;
    letter-spacing: -0.2px;
  }
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, $primary 0%, $secondary 100%);
  color: $white;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba($secondary, 0.3);
  white-space: nowrap;

  &__icon {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    background: rgba($white, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    transition: transform 0.3s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($secondary, 0.4);

    .btn-create__icon {
      transform: rotate(90deg);
    }
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
