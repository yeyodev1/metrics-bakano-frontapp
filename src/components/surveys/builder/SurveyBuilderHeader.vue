<script setup lang="ts">
import { } from 'vue'

const props = defineProps({
  isEditMode: {
    type: Boolean,
    required: true,
  },
  currentStatus: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['back'])
</script>

<template>
  <header class="builder-header">
    <div class="builder-header__left">
      <button class="builder-header__back" @click="emit('back')" aria-label="Volver">
        <i class="fa-solid fa-arrow-left" />
        <span>Volver</span>
      </button>
      <h1 class="builder-header__title">
        {{ isEditMode ? 'Editar Encuesta' : 'Nueva Encuesta' }}
      </h1>
    </div>

    <Transition name="fade">
      <div v-if="isEditMode" class="builder-header__status">
        <span 
          class="status-badge" 
          :class="`status-badge--${currentStatus}`"
        >
          <span class="status-badge__dot"></span>
          {{ currentStatus === 'draft' ? 'Borrador' : currentStatus === 'active' ? 'Activa' : 'Cerrada' }}
        </span>
      </div>
    </Transition>
  </header>
</template>

<style lang="scss" scoped>
.builder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba($primary-dark, 0.05);
  margin-bottom: 2rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding-bottom: 1.5rem;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 1.25rem;

    @media (max-width: 480px) {
      width: 100%;
      justify-content: space-between;
    }
  }

  &__back {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 12px;
    padding: 0.6rem 1rem;
    color: $primary-dark;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba($primary-dark, 0.02);

    i {
      font-size: 0.75rem;
      transition: transform 0.3s ease;
    }

    &:hover {
      border-color: $primary;
      color: $primary;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($primary, 0.1);

      i {
        transform: translateX(-3px);
      }
    }

    &:active {
      transform: translateY(0);
    }
  }

  &__title {
    font-size: 1.75rem;
    font-weight: 800;
    color: $primary-dark;
    letter-spacing: -0.02em;
    margin: 0;

    @media (max-width: 640px) {
      font-size: 1.5rem;
    }
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  backdrop-filter: blur(8px);

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &--draft {
    background: rgba($text-secondary, 0.08);
    color: $text-secondary;
    .status-badge__dot { background: $text-secondary; }
  }

  &--active {
    background: rgba($alert-success, 0.08);
    color: $alert-success;
    .status-badge__dot { 
      background: $alert-success;
      box-shadow: 0 0 8px rgba($alert-success, 0.5);
    }
  }

  &--closed {
    background: rgba($alert-error, 0.08);
    color: $alert-error;
    .status-badge__dot { background: $alert-error; }
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
