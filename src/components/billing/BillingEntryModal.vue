<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
    <div class="modal-box">

      <!-- Step 1: Enter amount -->
      <div v-if="step === 1">
        <div class="modal-header">
          <div class="modal-header-icon">
            <i class="fa-solid fa-dollar-sign" />
          </div>
          <div>
            <h2>Registrar Facturación</h2>
            <p class="modal-subtitle">{{ workspaceName }} · {{ formattedDate }}</p>
          </div>
          <button class="modal-close" @click="handleClose">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div class="modal-body">
          <div class="field">
            <label>¿Cuánto facturaste hoy?</label>
            <div class="amount-input-wrap" :class="{ focused: amountFocused }">
              <span class="currency">USD</span>
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
              />
            </div>
          </div>

          <!-- Day total preview -->
          <Transition name="slide-down">
            <div v-if="localAmount > 0" class="day-total-preview">
              <div class="preview-inner">
                <i class="fa-solid fa-chart-column preview-icon" />
                <div>
                  <span class="preview-label">Total del día con tu ingreso</span>
                  <span class="preview-amount">${{ formatAmount(projectedTotal) }}</span>
                </div>
              </div>
            </div>
          </Transition>

          <div class="field">
            <label>Notas <span class="optional">(opcional)</span></label>
            <textarea
              v-model="localNotes"
              placeholder="Ej: Ventas de temporada alta"
              rows="2"
              class="notes-input"
            />
          </div>

          <div class="confirm-field">
            <div class="confirm-field-label">
              <i class="fa-solid fa-shield-halved" />
              Para continuar, escribe <strong>"confirmar"</strong>
            </div>
            <input
              v-model="confirmWord"
              type="text"
              placeholder='Escribe "confirmar"'
              class="confirm-input"
              :class="{ valid: isConfirmWordValid }"
              autocomplete="off"
              spellcheck="false"
            />
            <div v-if="isConfirmWordValid" class="confirm-valid-msg">
              <i class="fa-solid fa-circle-check" /> Listo para continuar
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="handleClose">
            Cancelar
          </button>
          <button class="btn-primary" :disabled="!canProceed" @click="step = 2">
            Continuar
            <i class="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>

      <!-- Step 2: Final confirmation -->
      <div v-else-if="step === 2">
        <div class="modal-header modal-header--warning">
          <div class="modal-header-icon modal-header-icon--warning">
            <i class="fa-solid fa-triangle-exclamation" />
          </div>
          <div>
            <h2>¿Estás seguro?</h2>
            <p class="modal-subtitle">Esta acción no se puede deshacer al día siguiente</p>
          </div>
        </div>

        <div class="modal-body">
          <div class="confirm-summary">
            <div class="summary-row">
              <div class="summary-row-label">
                <i class="fa-solid fa-dollar-sign" />
                Tu facturación
              </div>
              <span class="summary-row-value">${{ formatAmount(localAmount) }}</span>
            </div>
            <div class="summary-row summary-row--total">
              <div class="summary-row-label">
                <i class="fa-solid fa-chart-column" />
                Total del día
              </div>
              <span class="summary-row-value summary-row-value--total">${{ formatAmount(projectedTotal) }}</span>
            </div>
            <div v-if="localNotes" class="summary-row">
              <div class="summary-row-label">
                <i class="fa-solid fa-note-sticky" />
                Notas
              </div>
              <span class="summary-row-value summary-row-value--notes">{{ localNotes }}</span>
            </div>
          </div>

          <div class="warning-notice">
            <i class="fa-solid fa-circle-exclamation warning-notice-icon" />
            <p>Una vez que confirmes, <strong>no podrás modificar este dato mañana</strong>. Asegúrate de que el monto es correcto.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="step = 1">
            <i class="fa-solid fa-arrow-left" /> Volver
          </button>
          <button class="btn-confirm" :disabled="loading" @click="handleConfirm">
            <div v-if="loading" class="spinner" />
            <template v-else>
              <i class="fa-solid fa-check" />
              Confirmar
            </template>
          </button>
        </div>
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
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirmed', payload: { amount: number; notes?: string }): void
}>()

const step = ref(1)
const localAmount = ref<number>(0)
const localNotes = ref('')
const confirmWord = ref('')
const amountFocused = ref(false)

const isConfirmWordValid = computed(() =>
  confirmWord.value.trim().toLowerCase() === 'confirmar'
)

const canProceed = computed(() => localAmount.value > 0 && isConfirmWordValid.value)

const projectedTotal = computed(() => props.currentDayTotal + localAmount.value)

const formattedDate = computed(() => {
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
  emit('confirmed', {
    amount: localAmount.value,
    notes: localNotes.value.trim() || undefined,
  })
}

watch(() => props.modelValue, (val) => {
  if (val) {
    step.value = 1
    localAmount.value = 0
    localNotes.value = ''
    confirmWord.value = ''
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
  backdrop-filter: blur(2px);
}

.modal-box {
  background: #fff;
  border-radius: 18px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

// ── Header ───────────────────────────────────────────────
.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #f1f5f9;

  h2 {
    margin: 0 0 4px;
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
  }

  .modal-subtitle {
    margin: 0;
    font-size: 12px;
    color: #94a3b8;
    font-weight: 500;
    text-transform: capitalize;
  }

  &--warning {
    background: #fffbeb;
    border-bottom-color: #fde68a;
  }
}

.modal-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;

  &--warning {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }
}

.modal-close {
  margin-left: auto;
  width: 30px;
  height: 30px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 13px;
  flex-shrink: 0;
  transition: all 0.15s;

  &:hover { background: #e2e8f0; color: #0f172a; }
}

// ── Body ─────────────────────────────────────────────────
.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 7px;
  }

  .optional {
    font-weight: 400;
    color: #94a3b8;
    text-transform: none;
    letter-spacing: 0;
  }
}

.amount-input-wrap {
  display: flex;
  align-items: center;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;

  &.focused { border-color: #0f1117; }

  .currency {
    padding: 0 14px;
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    background: #f8fafc;
    height: 48px;
    display: flex;
    align-items: center;
    border-right: 2px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .amount-input {
    border: none;
    outline: none;
    padding: 0 16px;
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    flex: 1;
    height: 48px;
    background: transparent;
    letter-spacing: -0.5px;

    &::placeholder { color: #e2e8f0; font-weight: 400; }
  }
}

.day-total-preview {
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 10px;
  padding: 12px 14px;
}

.preview-inner {
  display: flex;
  align-items: center;
  gap: 10px;

  .preview-icon {
    color: #059669;
    font-size: 16px;
    flex-shrink: 0;
  }

  .preview-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #059669;
    margin-bottom: 1px;
  }

  .preview-amount {
    font-size: 18px;
    font-weight: 800;
    color: #065f46;
    letter-spacing: -0.5px;
  }
}

.notes-input {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #374151;
  resize: none;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus { outline: none; border-color: #0f1117; }
  &::placeholder { color: #cbd5e1; }
}

.confirm-field {
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: 12px;
  padding: 14px;
}

.confirm-field-label {
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;

  i { font-size: 13px; color: #d97706; }
  strong { color: #0f172a; }
}

.confirm-input {
  width: 100%;
  border: 2px solid #fcd34d;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.2s, background 0.2s;

  &:focus { outline: none; border-color: #f59e0b; }

  &.valid {
    border-color: #059669;
    background: #f0fdf4;
    color: #065f46;
  }

  &::placeholder { font-weight: 400; color: #d97706; }
}

.confirm-valid-msg {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #059669;

  i { font-size: 12px; }
}

// ── Confirm summary ──────────────────────────────────────
.confirm-summary {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;

  &:last-child { border-bottom: none; }
  &--total { background: #f0fdf4; }
}

.summary-row-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #64748b;

  i { font-size: 12px; }
}

.summary-row-value {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;

  &--total { color: #059669; font-size: 18px; }
  &--notes { font-size: 13px; font-weight: 500; color: #374151; text-align: right; max-width: 55%; }
}

.warning-notice {
  display: flex;
  gap: 10px;
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: 10px;
  padding: 12px 14px;

  .warning-notice-icon {
    color: #d97706;
    font-size: 15px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #92400e;
    line-height: 1.5;

    strong { color: #0f172a; }
  }
}

// ── Footer ───────────────────────────────────────────────
.modal-footer {
  padding: 0 24px 24px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-cancel {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: #94a3b8; color: #374151; }
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;

  i { font-size: 11px; }

  &:disabled { opacity: 0.35; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: 0.85; }
}

.btn-confirm {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  min-width: 110px;
  justify-content: center;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: 0.85; }
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

// ── Transitions ──────────────────────────────────────────
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-6px); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
