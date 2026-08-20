<script setup lang="ts">
import { computed, ref } from 'vue'
import financeBillingService, { type IFinanceInvoice } from '@/services/financeBilling.service'
import { useToast } from '@/composables/useToast'
import WireDetailsCard from './WireDetailsCard.vue'
import { money, periodEs } from './format'

/**
 * Pago por transferencia como modal: los datos bancarios y la subida del
 * comprobante en un solo lugar, sin empujar el resto de la vista hacia abajo
 * como hacia la seccion incrustada de antes.
 */
const props = defineProps<{ workspaceId: string; invoice: IFinanceInvoice; stripeEnabled: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'submitted'): void; (e: 'pay-card'): void }>()

const { addToast } = useToast()

const receiptFile = ref<File | null>(null)
const grossAmount = ref<number | null>(
  Math.max(Number((props.invoice.amount - (props.invoice.paidAmount || 0)).toFixed(2)), 0)
)
const feeAmount = ref<number>(0)
const submitting = ref(false)

const netAmount = computed(() => {
  const gross = Number(grossAmount.value || 0)
  const fee = Number(feeAmount.value || 0)
  return Math.max(Number((gross - fee).toFixed(2)), 0)
})

const saldo = computed(() =>
  Math.max(Number((props.invoice.amount - (props.invoice.paidAmount || 0)).toFixed(2)), 0)
)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  if (file && file.size > 10 * 1024 * 1024) {
    addToast({ type: 'warning', message: 'El comprobante no puede superar los 10 MB.' })
    input.value = ''
    receiptFile.value = null
    return
  }
  receiptFile.value = file
}

async function submitTransfer() {
  if (!receiptFile.value) {
    addToast({ type: 'warning', message: 'Adjunta el comprobante de tu transferencia.' })
    return
  }
  if (!grossAmount.value || grossAmount.value <= 0) {
    addToast({ type: 'warning', message: 'Indica el monto que enviaste.' })
    return
  }
  if (netAmount.value <= 0) {
    addToast({ type: 'warning', message: 'El neto (monto menos fee) debe ser mayor a cero.' })
    return
  }

  submitting.value = true
  try {
    const form = new FormData()
    form.append('receipt', receiptFile.value)
    form.append('grossAmount', String(grossAmount.value))
    form.append('feeAmount', String(feeAmount.value || 0))
    form.append('invoiceId', props.invoice._id)

    await financeBillingService.submitReceipt(props.workspaceId, form)
    addToast({
      type: 'success',
      title: 'Comprobante recibido',
      message: 'Lo verificaremos en un máximo de 48 horas laborables.',
      duration: 7000,
    })
    emit('submitted')
  } catch (error) {
    const err = error as { message?: string }
    addToast({ type: 'error', message: err.message || 'No se pudo subir el comprobante.' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="tm__overlay" @click.self="emit('close')">
    <div class="tm" role="dialog" aria-modal="true">
      <header class="tm__head">
        <div>
          <h2><i class="fa-solid fa-building-columns" aria-hidden="true" /> Pago por transferencia</h2>
          <p class="tm__sub">
            {{ periodEs(invoice.period) }} · Saldo <strong>{{ money(saldo, invoice.currency) }}</strong>
          </p>
        </div>
        <button type="button" class="tm__close" aria-label="Cerrar" @click="emit('close')">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </header>

      <div class="tm__body">
        <div class="tm__notice">
          <i class="fa-solid fa-circle-info" aria-hidden="true" />
          <div>
            <strong>Antes de transferir:</strong>
            <ul>
              <li>La verificación es <strong>manual</strong>: hasta <strong>48 horas laborables</strong>.</li>
              <li>Tus sistemas se activan recién cuando aprobemos el pago.</li>
              <li>El fee de la transferencia lo asume quien envía.</li>
              <li>Con tarjeta la activación es <strong>inmediata</strong>.</li>
            </ul>
            <button v-if="stripeEnabled" type="button" class="tm__card-btn" @click="emit('pay-card')">
              <i class="fa-regular fa-credit-card" aria-hidden="true" /> Mejor pagar con tarjeta
            </button>
          </div>
        </div>

        <WireDetailsCard />

        <form class="tm__form" @submit.prevent="submitTransfer">
          <h3><i class="fa-solid fa-file-arrow-up" aria-hidden="true" /> Ya transferí: subir comprobante</h3>

          <label class="tm__field">
            <span>Comprobante (imagen o PDF, máx 10 MB)</span>
            <input type="file" accept="image/*,application/pdf" @change="onFileChange" />
          </label>

          <div class="tm__row">
            <label class="tm__field">
              <span>Monto enviado (USD)</span>
              <input v-model.number="grossAmount" type="number" min="0.01" step="0.01" required />
            </label>
            <label class="tm__field">
              <span>Fee bancario (USD)</span>
              <input v-model.number="feeAmount" type="number" min="0" step="0.01" />
            </label>
          </div>

          <p class="tm__net">Se acreditará: <strong>{{ money(netAmount) }}</strong></p>

          <button type="submit" class="tm__submit" :disabled="submitting">
            <i class="fa-solid fa-file-arrow-up" aria-hidden="true" />
            {{ submitting ? 'Subiendo…' : 'Subir comprobante' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tm__overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba($primary-dark, 0.55);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}

.tm {
  background: #f8fafc;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  box-shadow: 0 18px 50px rgba($primary-dark, 0.3);
  overflow: hidden;
}

.tm__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.3rem;
  background: $white;
  border-bottom: 1px solid rgba($primary-dark, 0.08);

  h2 {
    font-size: 1rem; font-weight: 800; color: $primary-dark; margin: 0;
    display: flex; align-items: center; gap: 0.5rem;
    i { color: #6366f1; }
  }
}

.tm__sub { font-size: 0.8rem; color: $text-secondary; margin: 0.2rem 0 0; }

.tm__close {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  border: 1px solid rgba($primary-dark, 0.12); background: none;
  color: $text-secondary; cursor: pointer;
  &:hover { color: $primary-dark; border-color: rgba($primary-dark, 0.3); }
}

.tm__body {
  padding: 1.1rem 1.3rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tm__notice {
  display: flex;
  gap: 0.7rem;
  background: rgba(#6366f1, 0.06);
  border: 1px solid rgba(#6366f1, 0.18);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  font-size: 0.8rem;
  color: $primary-dark;

  > i { color: #6366f1; margin-top: 0.15rem; }

  ul { margin: 0.35rem 0 0.5rem; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 0.2rem; }
}

.tm__card-btn {
  display: inline-flex; align-items: center; gap: 0.45rem;
  background: #6366f1; color: $white; border: none; border-radius: 9px;
  padding: 0.5rem 0.9rem; font-family: inherit; font-size: 0.76rem;
  font-weight: 700; cursor: pointer;
  &:hover { filter: brightness(1.08); }
}

.tm__form {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 1rem 1.1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  h3 {
    font-size: 0.86rem; font-weight: 800; color: $primary-dark; margin: 0;
    display: flex; align-items: center; gap: 0.45rem;
    i { color: #1ea362; font-size: 0.78rem; }
  }
}

.tm__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;

  span { font-size: 0.74rem; font-weight: 700; color: $text-secondary; }

  input {
    border: 1px solid rgba($primary-dark, 0.15);
    border-radius: 9px;
    padding: 0.55rem 0.7rem;
    font-family: inherit;
    font-size: 0.85rem;
    color: $primary-dark;
    background: $white;

    &:focus { outline: none; border-color: #6366f1; }
  }
}

.tm__row { display: flex; gap: 0.8rem; flex-wrap: wrap; }

.tm__net {
  font-size: 0.84rem; color: $primary-dark; margin: 0;
  strong { color: #1ea362; }
}

.tm__submit {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: #1ea362; color: $white; border: none; border-radius: 10px;
  padding: 0.7rem 1rem; font-family: inherit; font-size: 0.84rem;
  font-weight: 800; cursor: pointer;

  &:hover:not(:disabled) { filter: brightness(1.06); }
  &:disabled { opacity: 0.7; cursor: default; }
}
</style>
