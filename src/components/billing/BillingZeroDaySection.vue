<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  }
})

const emit = defineEmits(['update:modelValue'])

const ZERO_REASONS = ['No abrimos', 'No hubo venta', 'Día festivo / feriado', 'Problemas técnicos']

function selectReason(r: string) {
  emit('update:modelValue', props.modelValue === r ? '' : r)
}

function handleInput(val: string) {
  emit('update:modelValue', val)
}
</script>

<template>
  <div class="zero-day-container">
    <!-- Zero day banner -->
    <div class="zero-day-banner">
      <div class="zero-day-banner__icon">
        <i class="fa-solid fa-store-slash" />
      </div>
      <div class="zero-day-banner__text">
        <strong>Día sin ventas — $0.00</strong>
        <p>Indica el motivo para que el equipo lo tenga registrado.</p>
      </div>
    </div>

    <!-- Zero reason (required when amount = 0) -->
    <div class="field">
      <label class="field-label">
        <i class="fa-solid fa-circle-exclamation" style="color:#dc2626" /> Razón del día sin ventas
        <span class="required-tag">Obligatorio</span>
      </label>
      <div class="zero-chips">
        <button v-for="r in ZERO_REASONS" :key="r" type="button" class="zero-chip" :class="{ 'zero-chip--active': modelValue === r }" @click.prevent="selectReason(r)">
          {{ r }}
        </button>
      </div>
      <input :value="modelValue" type="text" placeholder="O escribe tu propia razón…" class="zero-reason-input" maxlength="150" @input="handleInput(($event.target as HTMLInputElement).value)" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.zero-day-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.zero-day-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff7ed;
  border: 1.5px solid #fed7aa;
  border-radius: 10px;
  padding: 12px 14px;

  &__icon {
    width: 36px;
    height: 36px;
    background: #ffedd5;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ea580c;
    font-size: 16px;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;

    strong {
      display: block;
      font-size: 13px;
      font-weight: 800;
      color: #9a3412;
    }

    p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #c2410c;
      line-height: 1.4;
    }
  }
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

.required-tag {
  font-size: 10px;
  font-weight: 700;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 20px;
  padding: 2px 7px;
  margin-left: 6px;
  vertical-align: middle;
  letter-spacing: 0.3px;
}

.zero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.zero-chip {
  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;

  &:hover {
    border-color: #ea580c;
    color: #ea580c;
    background: #fff7ed;
  }

  &--active {
    background: #ea580c;
    border-color: #ea580c;
    color: #fff;

    &:hover {
      background: #c2410c;
      border-color: #c2410c;
      color: #fff;
    }
  }
}

.zero-reason-input {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #374151;
  outline: none;
  background: #f9fafb;
  font-family: inherit;
  transition: border-color 0.15s;
  box-sizing: border-box;

  &:focus { border-color: #ea580c; background: #fff; }
  &::placeholder { color: #9ca3af; }
}
</style>
