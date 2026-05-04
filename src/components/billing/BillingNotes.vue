<script setup lang="ts">
defineProps({
  modelValue: {
    type: String,
    required: true,
  }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="field">
    <label class="field-label">
      Notas <span class="optional">(opcional)</span>
    </label>
    <textarea
      :value="modelValue"
      placeholder="Ej: Ventas de temporada alta, descuentos especiales…"
      rows="2"
      class="notes-input"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<style lang="scss" scoped>
.field { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
}

.notes-input {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #374151;
  resize: none;
  outline: none;
  background: #f9fafb;
  font-family: inherit;
  transition: border-color 0.15s;
  box-sizing: border-box;

  &:focus { border-color: #7c3aed; background: #fff; }
  &::placeholder { color: #9ca3af; }
}
</style>
