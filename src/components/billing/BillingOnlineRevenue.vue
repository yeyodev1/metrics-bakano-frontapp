<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [Number, null] as any,
    required: true,
  }
})

const emit = defineEmits(['update:modelValue'])

function handleInput(val: any) {
  const num = val !== '' ? Math.max(0, Number(val)) : null
  emit('update:modelValue', num)
}
</script>

<template>
  <div class="field">
    <label class="field-label">
      <i class="fa-solid fa-globe" style="color:#6366f1" />
      Ventas online <span class="optional">(opcional)</span>
    </label>
    <div class="online-revenue-hint">
      <i class="fa-solid fa-circle-info" />
      <span>Incluye ventas por <strong>página web</strong> o <strong>WhatsApp</strong>. Mejora el cálculo de conversión digital. Si no tienes este dato, déjalo en blanco.</span>
    </div>
    <div class="amount-wrap" :class="{ filled: (modelValue ?? 0) > 0 }">
      <span class="currency-symbol">$</span>
      <input
        :value="modelValue"
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        class="amount-input"
        @input="handleInput(($event.target as HTMLInputElement).value)"
      />
    </div>
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

.online-revenue-hint {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #4338ca;
  line-height: 1.5;

  i { margin-top: 2px; flex-shrink: 0; }
  strong { font-weight: 700; }
}

.amount-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  transition: border-color 0.15s, box-shadow 0.15s;
  overflow: hidden;

  &.filled { border-color: #059669; }
}

.currency-symbol {
  padding: 0 12px 0 16px;
  font-size: 20px;
  font-weight: 800;
  color: #374151;
}

.amount-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  outline: none;
  padding: 14px 0;
  min-width: 0;

  &::placeholder { color: #d1d5db; font-weight: 400; }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; }
  -moz-appearance: textfield;
}
</style>
