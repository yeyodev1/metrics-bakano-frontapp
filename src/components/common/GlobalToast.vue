<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return 'fa-circle-check'
    case 'error': return 'fa-circle-xmark'
    case 'warning': return 'fa-triangle-exclamation'
    case 'info':
    default: return 'fa-circle-info'
  }
}
</script>

<template>
  <div class="global-toasts">
    <TransitionGroup name="toast-list">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast" 
        :class="`toast--${toast.type}`"
      >
        <div class="toast__icon">
          <i class="fa-solid" :class="getIcon(toast.type)" />
        </div>
        <div class="toast__content">
          <h4 v-if="toast.title" class="toast__title">{{ toast.title }}</h4>
          <p class="toast__message">{{ toast.message }}</p>
        </div>
        <button class="toast__close" @click="removeToast(toast.id)" aria-label="Cerrar">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as *;

.global-toasts {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  min-width: 300px;
  max-width: 400px;
  background: $white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba($primary-dark, 0.1);
  display: flex;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  gap: 1rem;
  position: relative;
  overflow: hidden;

  // Add animated border to match brand
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
  }

  &--success {
    &::before {
      background: $alert-success;
    }

    .toast__icon {
      color: $alert-success;
      background: $alert-success-bg;
    }
  }

  &--error {
    &::before {
      background: $alert-error;
    }

    .toast__icon {
      color: $alert-error;
      background: $alert-error-bg;
    }
  }

  &--warning {
    &::before {
      background: $alert-warning;
    }

    .toast__icon {
      color: $alert-warning;
      background: $alert-warning-bg;
    }
  }

  &--info {
    &::before {
      background: $alert-info;
    }

    .toast__icon {
      color: $alert-info;
      background: $alert-info-bg;
    }
  }

  &__icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }

  &__content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__message {
    margin: 0;
    font-size: 0.9rem;
    color: $text-secondary;
    line-height: 1.4;
  }

  &__close {
    background: transparent;
    border: none;
    cursor: pointer;
    color: $text-secondary;
    opacity: 0.5;
    transition: opacity 0.2s;
    padding: 0;

    &:hover {
      opacity: 1;
    }
  }
}

// Transitions
.toast-list-enter-active,
.toast-list-leave-active,
.toast-list-move {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

.toast-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.toast-list-leave-active {
  position: absolute;
}
</style>
