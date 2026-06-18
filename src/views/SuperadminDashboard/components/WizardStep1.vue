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
