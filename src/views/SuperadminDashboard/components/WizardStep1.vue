<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'next'): void
  (e: 'cancel'): void
}>()

const name = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <div class="superadmin-dashboard__wizard-body">
    <div class="superadmin-dashboard__form-group">
      <label>Nombre del Entorno</label>
      <input 
        v-model="name" 
        type="text" 
        placeholder="Ej: Bakano Marketing" 
        autofocus 
        @keydown.enter.prevent="emit('next')" 
      />
    </div>
    <div class="superadmin-dashboard__modal-footer">
      <button type="button" class="superadmin-dashboard__btn-ghost" @click="emit('cancel')">Cancelar</button>
      <button 
        type="button" 
        class="superadmin-dashboard__btn-primary" 
        :disabled="!name.trim()" 
        @click="emit('next')"
      >
        Siguiente <i class="fa-solid fa-arrow-right" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__wizard-body {
  padding: 1.5rem 1.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.superadmin-dashboard__form-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary-dark;
  }

  input {
    width: 100%;
    padding: 0.8rem 1.1rem;
    border: 1px solid rgba($primary-dark, 0.15);
    border-radius: 8px;
    font-size: 0.95rem;
    color: $primary-dark;
    background: $white;
    transition: all 0.25s ease;
    outline: none;

    &::placeholder {
      color: rgba($primary-dark, 0.4);
    }

    &:hover {
      border-color: rgba($primary-dark, 0.3);
    }

    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 4px rgba($primary, 0.1);
    }
  }
}

.superadmin-dashboard__modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba($primary-dark, 0.08);
}

.superadmin-dashboard__btn-ghost {
  background: transparent;
  border: 1px solid rgba($primary-dark, 0.15);
  color: $primary-dark;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($primary-dark, 0.04);
    border-color: rgba($primary-dark, 0.3);
  }
}

.superadmin-dashboard__btn-primary {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  color: $white;
  border: none;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.65rem 1.4rem;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(#a855f7, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(#a855f7, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
}
</style>
