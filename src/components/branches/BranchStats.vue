<script setup lang="ts">
import { RouterLink } from 'vue-router'

const props = defineProps({
  total: {
    type: Number,
    required: true,
  },
  active: {
    type: Number,
    required: true,
  },
  inactive: {
    type: Number,
    required: true,
  },
  billingRoute: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="stats-section">
    <!-- Mini stat chips row -->
    <div class="stats-chips">
      <div class="stat-chip">
        <div class="stat-chip__icon stat-chip__icon--blue">
          <i class="fa-solid fa-building-user" />
        </div>
        <div class="stat-chip__info">
          <span class="stat-chip__value">{{ props.total }}</span>
          <span class="stat-chip__label">{{ props.total !== 1 ? 'Sedes totales' : 'Sede total' }}</span>
        </div>
      </div>

      <div class="stat-chip">
        <div class="stat-chip__icon stat-chip__icon--green">
          <i class="fa-solid fa-circle-check" />
        </div>
        <div class="stat-chip__info">
          <span class="stat-chip__value stat-chip__value--green">{{ props.active }}</span>
          <span class="stat-chip__label">{{ props.active !== 1 ? 'Activas' : 'Activa' }}</span>
        </div>
      </div>

      <div v-if="props.inactive > 0" class="stat-chip">
        <div class="stat-chip__icon stat-chip__icon--gray">
          <i class="fa-solid fa-circle-pause" />
        </div>
        <div class="stat-chip__info">
          <span class="stat-chip__value stat-chip__value--gray">{{ props.inactive }}</span>
          <span class="stat-chip__label">{{ props.inactive !== 1 ? 'Inactivas' : 'Inactiva' }}</span>
        </div>
      </div>
    </div>

    <!-- Billing CTA banner -->
    <RouterLink :to="props.billingRoute" class="billing-banner">
      <div class="billing-banner__icon">
        <i class="fa-solid fa-chart-line" />
      </div>
      <div class="billing-banner__text">
        <span class="billing-banner__label">Ver facturación</span>
        <span class="billing-banner__sub">Revisa los ingresos diarios por sede</span>
      </div>
      <div class="billing-banner__arrow">
        <i class="fa-solid fa-arrow-right" />
      </div>
    </RouterLink>
  </div>
</template>

<style lang="scss" scoped>
.stats-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.stats-chips {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  &__icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;

    &--blue { background: #eff6ff; color: #3b82f6; }
    &--green { background: #f0fdf4; color: #059669; }
    &--gray { background: #f8fafc; color: #94a3b8; }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__value {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;

    &--green { color: #059669; }
    &--gray { color: #94a3b8; }
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

/* Billing CTA — prominent card pushed to the right */
.billing-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #fff;
  text-decoration: none;
  border: none;
  transition: all 0.25s;
  margin-left: auto;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.2);
  min-width: 220px;

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    color: #60a5fa;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  &__label {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
  }

  &__sub {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 400;
  }

  &__arrow {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    flex-shrink: 0;
    transition: transform 0.2s, background 0.2s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.35);

    .billing-banner__arrow {
      transform: translateX(3px);
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }
  }
}
</style>
