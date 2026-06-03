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
@import '@/styles/colorVariables.module.scss';

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

/* Billing CTA — Ultra Premium */
.billing-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, $primary-dark 0%, $secondary 100%);
  color: $white;
  text-decoration: none;
  border: 1px solid rgba($white, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: auto;
  box-shadow: 0 4px 12px rgba($primary-dark, 0.15), inset 0 1px 1px rgba($white, 0.05);
  min-width: 240px;
  position: relative;
  overflow: hidden;

  /* Subtle shine effect */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba($white, 0.08), transparent);
    transform: skewX(-20deg);
    transition: all 0.5s;
  }

  &__icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba($white, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: $primary-light;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    z-index: 1;
  }

  &__label {
    font-size: 15px;
    font-weight: 800;
    color: $white;
    letter-spacing: -0.3px;
  }

  &__sub {
    font-size: 12px;
    color: rgba($white, 0.7);
    font-weight: 500;
  }

  &__arrow {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: rgba($white, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: rgba($white, 0.6);
    flex-shrink: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba($primary-dark, 0.25), inset 0 1px 1px rgba($white, 0.1);
    border-color: rgba($white, 0.15);

    &::before {
      left: 200%;
    }

    .billing-banner__icon {
      background: rgba($white, 0.15);
      color: $white;
    }

    .billing-banner__arrow {
      transform: translateX(4px);
      background: rgba($white, 0.15);
      color: $white;
    }
  }

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    min-width: unset;
    padding: 12px 16px;
    gap: 12px;
    
    &__icon {
      width: 36px;
      height: 36px;
      font-size: 16px;
      border-radius: 10px;
    }
    
    &__arrow {
      width: 28px;
      height: 28px;
      font-size: 12px;
      border-radius: 8px;
    }

    &__label {
      font-size: 14px;
    }

    &__sub {
      font-size: 11px;
    }
  }
}
</style>
