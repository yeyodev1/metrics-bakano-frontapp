<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
    <div class="modal-box">

      <!-- HEADER -->
      <div class="modal-header" :class="editMode ? 'modal-header--edit' : ''">
        <div class="modal-header-icon">
          <i :class="editMode ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-dollar-sign'" />
        </div>
        <div class="modal-header-text">
          <h2>{{ editMode ? 'Editar Facturación' : 'Registrar Facturación' }}</h2>
          <p class="modal-subtitle">{{ workspaceName }} · {{ formattedDate }}</p>
        </div>
        <button class="modal-close" @click="handleClose" :disabled="loading">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <!-- EDIT NOTICE -->
      <div v-if="editMode" class="edit-notice">
        <i class="fa-solid fa-circle-info" />
        <span>Editando registro existente. Monto actual: <strong>${{ formatAmount(existingAmount ?? 0) }}</strong></span>
      </div>

      <!-- BODY -->
      <div class="modal-body">

        <!-- Amount input -->
        <div class="field">
          <label class="field-label">
            {{ editMode ? '¿Cuál es el monto correcto?' : '¿Cuánto facturaste hoy?' }}
          </label>
          <div class="amount-wrap" :class="{ focused: amountFocused, filled: localAmount > 0 }">
            <span class="currency-symbol">$</span>
            <input
              v-model.number="localAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="amount-input"
              @focus="amountFocused = true"
              @blur="amountFocused = false"
              @input="localAmount = Math.max(0, localAmount)"
              autofocus
            />
            <span class="currency-label">USD</span>
          </div>
        </div>

        <!-- Day total preview -->
        <Transition name="slide-down">
          <div v-if="localAmount > 0" class="total-preview">
            <div class="total-preview__row">
              <span class="total-preview__label">
                <i class="fa-solid fa-chart-column" />
                Total del día {{ editMode ? '(actualizado)' : 'con tu ingreso' }}
              </span>
              <span class="total-preview__value">${{ formatAmount(projectedTotal) }}</span>
            </div>
          </div>
        </Transition>

        <!-- Notes -->
        <div class="field">
          <label class="field-label">
            Notas <span class="optional">(opcional)</span>
          </label>
          <textarea
            v-model="localNotes"
            placeholder="Ej: Ventas de temporada alta, descuentos especiales…"
            rows="2"
            class="notes-input"
          />
        </div>

        <!-- Info notice -->
        <div class="info-notice" :class="editMode ? 'info-notice--blue' : 'info-notice--amber'">
          <i :class="editMode ? 'fa-solid fa-rotate' : 'fa-solid fa-calendar-check'" />
          <span v-if="editMode">Puedes editar este registro durante <strong>7 días</strong> desde la fecha de creación.</span>
          <span v-else>Podrás editar este registro durante los próximos <strong>7 días</strong>.</span>
        </div>

      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="handleClose" :disabled="loading">
          Cancelar
        </button>
        <button
          class="btn-save"
          :class="editMode ? 'btn-save--edit' : ''"
          :disabled="!canSave || loading"
          @click="handleConfirm"
        >
          <div v-if="loading" class="spinner" />
          <template v-else>
            <i :class="editMode ? 'fa-solid fa-check' : 'fa-solid fa-floppy-disk'" />
            {{ editMode ? 'Actualizar' : 'Guardar' }}
          </template>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  currentDayTotal: number
  workspaceName: string
  date: string
  loading?: boolean
  editMode?: boolean
  existingAmount?: number
  existingNotes?: string
  entryId?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirmed', payload: { amount: number; notes?: string; entryId?: string }): void
}>()

const localAmount = ref<number>(0)
const localNotes = ref('')
const amountFocused = ref(false)

const canSave = computed(() => localAmount.value > 0)

const projectedTotal = computed(() => {
  // In edit mode, currentDayTotal already excludes the existing entry amount
  return props.currentDayTotal + localAmount.value
})

const formattedDate = computed(() => {
  if (!props.date) return ''
  const d = new Date(props.date.substring(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })
})

function formatAmount(val: number) {
  return val.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleClose() {
  if (props.loading) return
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!canSave.value || props.loading) return
  emit('confirmed', {
    amount: localAmount.value,
    notes: localNotes.value.trim() || undefined,
    entryId: props.entryId,
  })
}

watch(() => props.modelValue, (val) => {
  if (val) {
    localAmount.value = (props.editMode && props.existingAmount) ? props.existingAmount : 0
    localNotes.value = (props.editMode && props.existingNotes) ? props.existingNotes : ''
    amountFocused.value = false
  }
})
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 17, 23, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(3px);
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

// ── Header ──────────────────────────────────────────────
.modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  padding: 22px 24px;

  &--edit {
    background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
  }
}

.modal-header-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.modal-header-text {
  flex: 1;

  h2 {
    margin: 0 0 2px;
    color: #fff;
    font-size: 17px;
    font-weight: 800;
  }
}

.modal-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 500;
}

.modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

// ── Edit notice ──────────────────────────────────────────
.edit-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
  padding: 10px 24px;
  font-size: 13px;
  color: #1e40af;

  i { flex-shrink: 0; color: #3b82f6; }
  strong { color: #1e3a5f; }
}

// ── Body ────────────────────────────────────────────────
.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

// ── Amount input ─────────────────────────────────────────
.amount-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  transition: border-color 0.15s, box-shadow 0.15s;
  overflow: hidden;

  &.focused {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    background: #fff;
  }

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

  /* Remove spinner arrows */
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

// ── Day total preview ────────────────────────────────────
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

// ── Notes ────────────────────────────────────────────────
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

// ── Info notice ──────────────────────────────────────────
.info-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;

  i { flex-shrink: 0; margin-top: 1px; }
  strong { font-weight: 700; }

  &--amber {
    background: #fffbeb;
    border: 1.5px solid #fde68a;
    color: #92400e;
    i { color: #d97706; }
  }

  &--blue {
    background: #eff6ff;
    border: 1.5px solid #bfdbfe;
    color: #1e40af;
    i { color: #3b82f6; }
  }
}

// ── Footer ───────────────────────────────────────────────
.modal-footer {
  display: flex;
  gap: 10px;
  padding: 0 24px 24px;
}

.btn-cancel {
  flex: 1;
  border: 2px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: #9ca3af; color: #374151; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-save {
  flex: 2;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s, transform 0.1s;

  &:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  &:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  &--edit {
    background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── Transitions ──────────────────────────────────────────
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
