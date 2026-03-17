<script setup lang="ts">
const props = defineProps({
  clientCount: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <div class="internal-planning-header">
    <div class="internal-planning-header__content">
      <div class="internal-planning-header__brand">
        <div class="internal-planning-header__icon">
          <i class="fa-solid fa-calendar-range" />
        </div>
        <div class="internal-planning-header__titles">
          <h1>Planificador Global</h1>
          <p>Visión completa de todos los clientes en tiempo real</p>
        </div>
      </div>

      <div class="internal-planning-header__stats">
        <div class="internal-planning-header__stat">
          <span class="internal-planning-header__stat-value">{{ clientCount }}</span>
          <span class="internal-planning-header__stat-label">Clientes</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.internal-planning-header {
  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 1rem;

    @media (min-width: 768px) {
      gap: 1.25rem;
    }
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 12%) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 8px 20px rgba($primary, 0.25);

    @media (min-width: 768px) {
      width: 52px;
      height: 52px;
      border-radius: 16px;
    }

    i {
      font-size: 1.2rem;
      color: $white;

      @media (min-width: 768px) {
        font-size: 1.4rem;
      }
    }
  }

  &__titles {
    h1 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 800;
      color: $primary-dark;
      letter-spacing: -0.03em;
      line-height: 1.1;

      @media (min-width: 768px) {
        font-size: 1.75rem;
        margin-bottom: 0.2rem;
      }
    }

    p {
      margin: 0;
      font-size: 0.8rem;
      color: $text-secondary;

      @media (min-width: 768px) {
        font-size: 0.9rem;
      }
    }
  }

  &__stats {
    display: flex;
    gap: 1rem;
  }

  &__stat {
    background: $white;
    border: 1px solid rgba($primary-dark, 0.06);
    border-radius: 12px;
    padding: 0.6rem 1.2rem;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    min-width: 90px;

    @media (min-width: 768px) {
      border-radius: 14px;
      padding: 0.75rem 1.5rem;
      gap: 0.1rem;
    }
  }

  &__stat-value {
    font-size: 1.4rem;
    font-weight: 800;
    color: $primary;
    line-height: 1;

    @media (min-width: 768px) {
      font-size: 1.6rem;
    }
  }

  &__stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $text-secondary;
    font-weight: 600;

    @media (min-width: 768px) {
      font-size: 0.7rem;
    }
  }
}
</style>
