<script setup lang="ts">
import type { IBranch } from '@/types'

const props = defineProps({
  activeBranches: {
    type: Array as () => IBranch[],
    required: true,
  },
  modelValue: {
    type: Object as () => Record<string, number | null>,
    required: true,
  }
})

const emit = defineEmits(['update:modelValue'])

function handleInput() {
  emit('update:modelValue', { ...props.modelValue })
}
</script>

<template>
  <div class="branch-inputs-container">
    <div class="field" v-for="branch in activeBranches" :key="branch._id">
      <label class="field-label">
        <i class="fa-solid fa-store" style="color:#3b82f6" />
        Sede {{ branch.name }}
      </label>
      <div class="amount-wrap" :class="{ filled: (modelValue[branch._id] ?? 0) > 0 }">
        <span class="currency-symbol">$</span>
        <input v-model.number="modelValue[branch._id]" type="number" min="0" step="0.01" placeholder="0.00" class="amount-input" @input="handleInput" />
        <span class="currency-label">USD</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.branch-inputs-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 4px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
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

.currency-label {
  padding: 0 16px 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #9ca3af;
}
</style>
