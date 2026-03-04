<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import HoldToConfirmButton from './HoldToConfirmButton.vue'

const { isVisible, options, proceed, cancel } = useConfirm()

const handleHoldConfirm = () => {
  proceed()
}

const handleNormalConfirm = () => {
  proceed()
}

</script>

<template>
  <Transition name="modal">
    <div v-if="isVisible" class="global-confirm-overlay" @click.self="cancel">
      <div class="global-confirm-modal">
        <div class="global-confirm-content">
          <div class="global-confirm-icon">
            <i class="fa-solid fa-triangle-exclamation" />
          </div>
          <h3 class="global-confirm-title">{{ options.title }}</h3>
          <p class="global-confirm-message">{{ options.message }}</p>
          
          <div v-if="options.requireHold" class="global-confirm-hint">
            <i class="fa-solid fa-hand-pointer" /> Mantén presionado para confirmar
          </div>
        </div>
        
        <div class="global-confirm-footer">
          <button class="btn-ghost" @click="cancel">{{ options.cancelText }}</button>
          
          <HoldToConfirmButton 
            v-if="options.requireHold"
            btnClass="btn-danger"
            @confirm="handleHoldConfirm"
          >
            {{ options.confirmText }}
          </HoldToConfirmButton>
          
          <button 
            v-else 
            class="btn-danger" 
            @click="handleNormalConfirm"
          >
            {{ options.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as *;

.global-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba($primary-dark, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.global-confirm-modal {
  background: $white;
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  text-align: center;
}

.global-confirm-content {
  padding: 2.5rem 2rem 1.5rem;
}

.global-confirm-icon {
  width: 64px;
  height: 64px;
  background: $alert-error-bg;
  color: $alert-error;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 8px 24px rgba($alert-error, 0.2);
}

.global-confirm-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: $primary-dark;
}

.global-confirm-message {
  margin: 0 0 1rem;
  color: $text-secondary;
  font-size: 0.95rem;
  line-height: 1.5;
}

.global-confirm-hint {
  font-size: 0.8rem;
  color: $text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: rgba($primary-dark, 0.03);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  display: inline-flex;
  margin-top: 0.5rem;
}

.global-confirm-footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 2rem 2rem;
}

.btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  color: $text-secondary;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: rgba($primary-dark, 0.05);
    color: $primary-dark;
  }
}

.btn-danger {
  background: $alert-error;
  color: $white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  box-shadow: 0 4px 12px rgba($alert-error, 0.3);

  &:hover {
    opacity: 0.95;
  }
}

// Transition
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;

  .global-confirm-modal {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .global-confirm-modal {
    transform: scale(0.9) translateY(20px);
  }
}
</style>
