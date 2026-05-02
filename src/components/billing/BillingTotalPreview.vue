<script setup lang="ts">
defineProps({
  amount: {
    type: Number,
    required: true,
  },
  editMode: {
    type: Boolean,
    default: false,
  }
})

function formatAmount(val: number) {
  return val.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <Transition name="slide-down">
    <div v-if="amount > 0" class="total-preview">
      <div class="total-preview__row">
        <span class="total-preview__label">
          <i class="fa-solid fa-chart-column" />
          Total del día {{ editMode ? '(actualizado)' : 'con tu ingreso' }}
        </span>
        <span class="total-preview__value">${{ formatAmount(amount) }}</span>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.total-preview {
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(5, 150, 105, 0.02) 100%);
  border: 1.5px solid rgba(5, 150, 105, 0.2);
  border-radius: 10px;
  padding: 12px 16px;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #064e3b;
    font-weight: 600;
    i { color: #059669; font-size: 12px; }
  }

  &__value {
    font-size: 18px;
    font-weight: 800;
    color: #059669;
  }
}

.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
