<script setup lang="ts">
import { } from 'vue'

const props = defineProps({
  isSaving: {
    type: Boolean,
    required: true,
  },
  canEdit: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['saveDraft', 'activate'])
</script>

<template>
  <div v-if="canEdit" class="builder-actions">
    <div class="builder-actions__content">
      <button
        class="btn-draft"
        :disabled="isSaving"
        @click="emit('saveDraft')"
      >
        <i v-if="isSaving" class="fa-solid fa-spinner fa-spin" />
        <i v-else class="fa-solid fa-floppy-disk" />
        <span>Guardar como borrador</span>
      </button>

      <button
        class="btn-activate"
        :disabled="isSaving"
        @click="emit('activate')"
      >
        <span class="btn-activate__glow"></span>
        <i v-if="isSaving" class="fa-solid fa-spinner fa-spin" />
        <i v-else class="fa-solid fa-bolt" />
        <span>Publicar y Activar</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.builder-actions {
  position: sticky;
  bottom: 2rem;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
  display: flex;
  justify-content: center;
  margin-top: 2rem;

  &__content {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: rgba($white, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba($primary-dark, 0.05);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba($primary-dark, 0.1);
    animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);

    @media (max-width: 480px) {
      flex-direction: column;
      width: calc(100% - 2rem);
      padding: 1rem;
    }
  }
}

.btn-draft, .btn-activate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.8rem 1.75rem;
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;

  @media (max-width: 480px) {
    width: 100%;
  }

  i {
    font-size: 1rem;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-draft {
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.1);
  color: $primary-dark;

  &:hover:not(:disabled) {
    border-color: $primary;
    color: $primary;
    background: rgba($primary, 0.02);
  }
}

.btn-activate {
  position: relative;
  background: $primary;
  border: none;
  color: $white;
  overflow: hidden;

  &__glow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba($white, 0.2) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba($primary, 0.4);

    .btn-activate__glow {
      opacity: 1;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
