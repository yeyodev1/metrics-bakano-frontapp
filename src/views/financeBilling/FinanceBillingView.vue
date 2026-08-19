<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import financeBillingService, {
  type IFinanceBilling,
  type IFinanceInvoice,
} from '@/services/financeBilling.service'
import { useToast } from '@/composables/useToast'
import WireDetailsCard from './WireDetailsCard.vue'

const route = useRoute()
const router = useRouter()
const { addToast } = useToast()

const workspaceId = computed(() => String(route.params.workspaceId))

const billing = ref<IFinanceBilling | null>(null)
const loading = ref(true)
const notLinked = ref(false)
const loadError = ref('')

const payingInvoiceId = ref<string | null>(null)

// ── Transferencia ────────────────────────────────────────
const transferInvoice = ref<IFinanceInvoice | null>(null)
const transferOpen = ref(false)
const receiptFile = ref<File | null>(null)
const grossAmount = ref<number | null>(null)
const feeAmount = ref<number>(0)
const submitting = ref(false)

const netAmount = computed(() => {
  const gross = Number(grossAmount.value || 0)
  const fee = Number(feeAmount.value || 0)
  return Math.max(Number((gross - fee).toFixed(2)), 0)
})

const OPEN_STATUSES = ['pending', 'partial', 'overdue']

// ── Consumo CRM (GoHighLevel): cargos ya cobrados, NO deuda ──
const showAllCrm = ref(false)
const CRM_PREVIEW_COUNT = 10

const crm = computed(() => {
  const data = billing.value?.crmConsumption
  return data && data.items.length ? data : null
})

const crmVisibleItems = computed(() => {
  if (!crm.value) return []
  return showAllCrm.value ? crm.value.items : crm.value.items.slice(0, CRM_PREVIEW_COUNT)
})

const STATUS_META: Record<string, { label: string; icon: string; tone: string }> = {
  pending: { label: 'Pendiente', icon: 'fa-regular fa-clock', tone: 'warn' },
  partial: { label: 'Pago parcial', icon: 'fa-solid fa-circle-half-stroke', tone: 'warn' },
  paid: { label: 'Pagada', icon: 'fa-solid fa-circle-check', tone: 'ok' },
  overdue: { label: 'Vencida', icon: 'fa-solid fa-triangle-exclamation', tone: 'bad' },
  waived: { label: 'Condonada', icon: 'fa-solid fa-gift', tone: 'muted' },
  cancelled: { label: 'Anulada', icon: 'fa-solid fa-ban', tone: 'muted' },
}

const SUBMISSION_META: Record<string, { label: string; icon: string; tone: string }> = {
  pending: { label: 'En verificación', icon: 'fa-regular fa-clock', tone: 'warn' },
  approved: { label: 'Aprobado', icon: 'fa-solid fa-circle-check', tone: 'ok' },
  rejected: { label: 'Rechazado', icon: 'fa-solid fa-circle-xmark', tone: 'bad' },
}

const METHOD_LABELS: Record<string, string> = {
  stripe: 'Tarjeta (Stripe)',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  efectivo: 'Efectivo',
  otro: 'Otro',
}

function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(value || 0)
}

function dateEs(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value)
  )
}

function periodEs(period: string) {
  const [year, month] = period.split('-').map(Number)
  const label = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(
    new Date(year, (month || 1) - 1, 1)
  )
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function balance(invoice: IFinanceInvoice) {
  return Math.max(Number((invoice.amount - (invoice.paidAmount || 0)).toFixed(2)), 0)
}

function isOpen(invoice: IFinanceInvoice) {
  return OPEN_STATUSES.includes(invoice.status)
}

async function load() {
  loading.value = true
  notLinked.value = false
  loadError.value = ''
  try {
    billing.value = await financeBillingService.getBilling(workspaceId.value)
  } catch (error) {
    const err = error as { status?: number; message?: string }
    if (err.status === 404) {
      notLinked.value = true
    } else {
      loadError.value = err.message || 'No se pudo cargar tu facturación.'
    }
  } finally {
    loading.value = false
  }
}

async function payWithCard(invoice: IFinanceInvoice) {
  payingInvoiceId.value = invoice._id
  try {
    const { url } = await financeBillingService.createCheckout(workspaceId.value, invoice._id)
    window.location.href = url
  } catch (error) {
    const err = error as { message?: string }
    addToast({ type: 'error', message: err.message || 'No se pudo generar el link de pago.' })
    payingInvoiceId.value = null
  }
}

function openTransfer(invoice: IFinanceInvoice) {
  transferInvoice.value = invoice
  transferOpen.value = true
  grossAmount.value = balance(invoice)
  feeAmount.value = 0
  receiptFile.value = null
}

function closeTransfer() {
  transferOpen.value = false
  transferInvoice.value = null
}

function backToCard() {
  const invoice = transferInvoice.value
  closeTransfer()
  if (invoice) payWithCard(invoice)
}

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
    if (transferInvoice.value) form.append('invoiceId', transferInvoice.value._id)

    await financeBillingService.submitReceipt(workspaceId.value, form)
    addToast({
      type: 'success',
      title: 'Comprobante recibido',
      message: 'Lo verificaremos en un máximo de 48 horas laborables.',
      duration: 7000,
    })
    closeTransfer()
    await load()
  } catch (error) {
    const err = error as { message?: string }
    addToast({ type: 'error', message: err.message || 'No se pudo subir el comprobante.' })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  const pago = route.query.pago
  if (pago === 'exitoso') {
    addToast({
      type: 'success',
      title: '¡Pago recibido!',
      message: 'Tu pago con tarjeta fue procesado. Puede tardar unos segundos en reflejarse.',
      duration: 8000,
    })
    router.replace({ query: {} })
  } else if (pago === 'cancelado') {
    addToast({ type: 'info', message: 'El pago fue cancelado. Puedes intentarlo cuando quieras.' })
    router.replace({ query: {} })
  }
  await load()
})
</script>

<template>
  <div class="finance-billing">
    <header class="fb-header">
      <div>
        <h1><i class="fa-solid fa-credit-card" aria-hidden="true" /> Mi suscripción</h1>
        <p v-if="billing" class="fb-header__sub">{{ billing.client.name }} · Bakano</p>
      </div>
    </header>

    <!-- Skeleton -->
    <div v-if="loading" class="fb-skeleton">
      <div v-for="i in 3" :key="i" class="fb-skeleton__block" />
    </div>

    <!-- Sin vincular -->
    <div v-else-if="notLinked" class="fb-empty">
      <i class="fa-regular fa-folder-open" aria-hidden="true" />
      <h3>Tu facturación aún no está habilitada aquí</h3>
      <p>Estamos preparando tu espacio de facturación. Escríbenos si necesitas un detalle de tus pagos.</p>
    </div>

    <div v-else-if="loadError" class="fb-empty fb-empty--error">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <h3>No pudimos cargar tu facturación</h3>
      <p>{{ loadError }}</p>
      <button type="button" class="fb-btn fb-btn--primary" @click="load">Reintentar</button>
    </div>

    <template v-else-if="billing">
      <!-- Resumen -->
      <section class="fb-summary">
        <article class="fb-summary__card">
          <span class="fb-summary__label">Saldo pendiente</span>
          <strong class="fb-summary__value" :class="{ 'fb-summary__value--warn': billing.summary.pendingBalance > 0 }">
            {{ money(billing.summary.pendingBalance) }}
          </strong>
        </article>
        <article class="fb-summary__card">
          <span class="fb-summary__label">Total pagado</span>
          <strong class="fb-summary__value fb-summary__value--ok">{{ money(billing.summary.totalPaid) }}</strong>
        </article>
        <article class="fb-summary__card">
          <span class="fb-summary__label">Facturas abiertas</span>
          <strong class="fb-summary__value">{{ billing.summary.openInvoices }}</strong>
        </article>
      </section>

      <!-- Facturas -->
      <section class="fb-section">
        <h2>Tus facturas</h2>
        <div v-if="!billing.invoices.length" class="fb-empty fb-empty--inline">
          <i class="fa-regular fa-file" aria-hidden="true" />
          <p>Todavía no tienes facturas emitidas.</p>
        </div>

        <ul class="fb-invoices">
          <li v-for="invoice in billing.invoices" :key="invoice._id" class="fb-invoice">
            <div class="fb-invoice__main">
              <div class="fb-invoice__title">
                <strong>{{ periodEs(invoice.period) }}</strong>
                <span v-if="invoice.splitLabel" class="fb-invoice__split">{{ invoice.splitLabel }}</span>
                <span class="fb-badge" :class="`fb-badge--${STATUS_META[invoice.status]?.tone || 'muted'}`">
                  <i :class="STATUS_META[invoice.status]?.icon" aria-hidden="true" />
                  {{ STATUS_META[invoice.status]?.label || invoice.status }}
                </span>
              </div>
              <div class="fb-invoice__figures">
                <span>Total: <strong>{{ money(invoice.amount, invoice.currency) }}</strong></span>
                <span>Pagado: {{ money(invoice.paidAmount, invoice.currency) }}</span>
                <span v-if="isOpen(invoice)">Saldo: <strong>{{ money(balance(invoice), invoice.currency) }}</strong></span>
                <span>Vence: {{ dateEs(invoice.dueDate) }}</span>
              </div>
            </div>

            <div v-if="isOpen(invoice) && balance(invoice) > 0" class="fb-invoice__actions">
              <button
                v-if="billing.summary.stripeEnabled"
                type="button"
                class="fb-btn fb-btn--primary"
                :disabled="payingInvoiceId === invoice._id"
                @click="payWithCard(invoice)"
              >
                <i class="fa-regular fa-credit-card" aria-hidden="true" />
                <span>
                  {{ payingInvoiceId === invoice._id ? 'Abriendo pago seguro…' : `Pagar con tarjeta · ${money(balance(invoice), invoice.currency)}` }}
                  <small>Activación inmediata</small>
                </span>
              </button>
              <button type="button" class="fb-link" @click="openTransfer(invoice)">
                Pagar por transferencia internacional
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Transferencia -->
      <section v-if="transferOpen" class="fb-section fb-transfer">
        <div class="fb-transfer__head">
          <h2><i class="fa-solid fa-building-columns" aria-hidden="true" /> Pago por transferencia</h2>
          <button type="button" class="fb-link" @click="closeTransfer">Cerrar</button>
        </div>

        <div class="fb-notice">
          <i class="fa-solid fa-circle-info" aria-hidden="true" />
          <div>
            <strong>Antes de transferir, toma en cuenta:</strong>
            <ul>
              <li>La verificación es <strong>manual</strong> y toma hasta <strong>48 horas laborables</strong>.</li>
              <li>Tus sistemas se activan recién cuando aprobemos el pago.</li>
              <li>El costo/fee de la transferencia lo asume quien envía.</li>
              <li>Con tarjeta la activación es <strong>inmediata</strong>.</li>
            </ul>
            <button
              v-if="billing.summary.stripeEnabled"
              type="button"
              class="fb-btn fb-btn--primary fb-btn--small"
              @click="backToCard"
            >
              <i class="fa-regular fa-credit-card" aria-hidden="true" /> Mejor pagar con tarjeta
            </button>
          </div>
        </div>

        <WireDetailsCard />

        <form class="fb-form" @submit.prevent="submitTransfer">
          <h3>Ya transferí: subir comprobante</h3>
          <p v-if="transferInvoice" class="fb-form__target">
            Factura: <strong>{{ periodEs(transferInvoice.period) }}</strong> · Saldo
            {{ money(balance(transferInvoice), transferInvoice.currency) }}
          </p>

          <label class="fb-form__field">
            <span>Comprobante (imagen o PDF, máx 10 MB)</span>
            <input type="file" accept="image/*,application/pdf" @change="onFileChange" />
          </label>

          <div class="fb-form__row">
            <label class="fb-form__field">
              <span>Monto enviado (USD)</span>
              <input v-model.number="grossAmount" type="number" min="0.01" step="0.01" required />
            </label>
            <label class="fb-form__field">
              <span>Fee bancario (USD)</span>
              <input v-model.number="feeAmount" type="number" min="0" step="0.01" />
            </label>
          </div>

          <p class="fb-form__net">
            Se acreditará: <strong>{{ money(netAmount) }}</strong>
          </p>

          <p class="fb-form__sla">
            <i class="fa-regular fa-clock" aria-hidden="true" />
            Verificación manual: hasta 48 horas laborables después de subirlo.
          </p>

          <button type="submit" class="fb-btn fb-btn--secondary" :disabled="submitting">
            <i class="fa-solid fa-file-arrow-up" aria-hidden="true" />
            {{ submitting ? 'Subiendo…' : 'Subir comprobante' }}
          </button>
        </form>
      </section>

      <!-- Comprobantes en curso -->
      <section v-if="billing.submissions.length" class="fb-section">
        <h2>Tus comprobantes</h2>
        <ul class="fb-history">
          <li v-for="submission in billing.submissions" :key="submission._id" class="fb-history__item">
            <div class="fb-history__main">
              <span class="fb-badge" :class="`fb-badge--${SUBMISSION_META[submission.status]?.tone || 'muted'}`">
                <i :class="SUBMISSION_META[submission.status]?.icon" aria-hidden="true" />
                {{ SUBMISSION_META[submission.status]?.label || submission.status }}
              </span>
              <span>Enviado: <strong>{{ money(submission.grossAmount, submission.currency) }}</strong></span>
              <span>Fee: {{ money(submission.feeAmount, submission.currency) }}</span>
              <span>Neto: <strong>{{ money(submission.netAmount, submission.currency) }}</strong></span>
              <span class="fb-history__date">{{ dateEs(submission.createdAt) }}</span>
            </div>
            <p v-if="submission.status === 'pending'" class="fb-history__note">
              <i class="fa-regular fa-clock" aria-hidden="true" />
              Respuesta máxima: {{ dateEs(submission.reviewDueAt) }}
            </p>
            <p v-else-if="submission.status === 'rejected' && submission.reviewNote" class="fb-history__note fb-history__note--bad">
              <i class="fa-solid fa-circle-xmark" aria-hidden="true" /> {{ submission.reviewNote }}
            </p>
          </li>
        </ul>
      </section>

      <!-- Historial de pagos -->
      <section class="fb-section">
        <h2>Pagos realizados</h2>
        <div v-if="!billing.payments.length" class="fb-empty fb-empty--inline">
          <i class="fa-regular fa-credit-card" aria-hidden="true" />
          <p>Aún no registramos pagos tuyos.</p>
        </div>
        <ul v-else class="fb-history">
          <li v-for="payment in billing.payments" :key="payment._id" class="fb-history__item">
            <div class="fb-history__main">
              <span class="fb-badge fb-badge--ok">
                <i class="fa-solid fa-circle-check" aria-hidden="true" /> Aprobado
              </span>
              <strong>{{ money(payment.amount, payment.currency) }}</strong>
              <span>{{ METHOD_LABELS[payment.method] || payment.method }}</span>
              <span>{{ periodEs(payment.period) }}</span>
              <span class="fb-history__date">{{ dateEs(payment.paidAt) }}</span>
              <a v-if="payment.receiptUrl" :href="payment.receiptUrl" target="_blank" rel="noopener" class="fb-link">
                Ver comprobante
              </a>
            </div>
          </li>
        </ul>
      </section>

      <!-- Consumo CRM (GoHighLevel) -->
      <section v-if="crm" class="fb-section fb-crm">
        <div class="fb-crm__head">
          <h2><i class="fa-solid fa-plug-circle-bolt" aria-hidden="true" /> Consumo CRM (GoHighLevel)</h2>
          <p class="fb-crm__sub">
            Lo que tu cuenta consume del CRM que Bakano te provee. Estos cargos
            <strong>ya fueron cobrados por Stripe</strong> — no son deuda pendiente.
          </p>
        </div>

        <div class="fb-summary">
          <article class="fb-summary__card">
            <span class="fb-summary__label">Consumo de este mes</span>
            <strong class="fb-summary__value">{{ money(crm.totals.currentMonth) }}</strong>
          </article>
          <article class="fb-summary__card">
            <span class="fb-summary__label">Total acumulado</span>
            <strong class="fb-summary__value">{{ money(crm.totals.total) }}</strong>
          </article>
        </div>

        <div v-if="crm.totals.byMonth.length" class="fb-crm__months">
          <article v-for="month in crm.totals.byMonth" :key="month.period" class="fb-crm__month">
            <span class="fb-crm__month-label">{{ periodEs(month.period) }}</span>
            <strong>{{ money(month.total) }}</strong>
            <span class="fb-crm__month-count">{{ month.count }} cargo{{ month.count === 1 ? '' : 's' }}</span>
          </article>
        </div>

        <ul class="fb-history">
          <li v-for="item in crmVisibleItems" :key="item._id" class="fb-history__item">
            <div class="fb-history__main">
              <span class="fb-badge fb-badge--ok">
                <i class="fa-solid fa-circle-check" aria-hidden="true" /> Pagado
              </span>
              <strong>{{ money(item.amount, item.currency) }}</strong>
              <span>{{ item.description || 'Consumo CRM' }}</span>
              <span class="fb-history__date">{{ dateEs(item.paidAt) }}</span>
            </div>
          </li>
        </ul>
        <button
          v-if="crm.items.length > CRM_PREVIEW_COUNT"
          type="button"
          class="fb-link"
          @click="showAllCrm = !showAllCrm"
        >
          {{ showAllCrm ? 'Ver menos' : `Ver los ${crm.items.length} cargos` }}
        </button>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.finance-billing {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem;
  max-width: 960px;
  margin: 0 auto;
}

.fb-header {
  h1 {
    margin: 0;
    font-size: clamp(1.25rem, 3vw, 1.6rem);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__sub {
    margin: 0.25rem 0 0;
    color: #6b7280;
    font-size: 0.9rem;
  }
}

.fb-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &__block {
    height: 88px;
    border-radius: 12px;
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: fb-shimmer 1.2s infinite;
  }
}

@keyframes fb-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

.fb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  padding: 2.5rem 1rem;
  background: #fff;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  color: #6b7280;

  i {
    font-size: 1.8rem;
  }

  h3 {
    margin: 0;
    color: #111827;
  }

  p {
    margin: 0;
    max-width: 420px;
  }

  &--inline {
    padding: 1.25rem;
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
  }

  &--error i {
    color: #ef4444;
  }
}

.fb-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  &__card {
    flex: 1 1 160px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__label {
    font-size: 0.78rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__value {
    font-size: clamp(1.15rem, 2.5vw, 1.5rem);

    &--warn {
      color: #b45309;
    }

    &--ok {
      color: #047857;
    }
  }
}

.fb-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  h2 {
    margin: 0;
    font-size: 1.05rem;
  }
}

.fb-invoices {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fb-invoice {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  &__main {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1 1 260px;
    min-width: 0;
  }

  &__title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  &__split {
    font-size: 0.78rem;
    color: #6b7280;
  }

  &__figures {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1rem;
    font-size: 0.85rem;
    color: #4b5563;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
    flex: 0 1 auto;
  }
}

.fb-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;

  &--ok {
    background: #ecfdf5;
    color: #047857;
  }

  &--warn {
    background: #fffbeb;
    color: #b45309;
  }

  &--bad {
    background: #fef2f2;
    color: #b91c1c;
  }

  &--muted {
    background: #f3f4f6;
    color: #6b7280;
  }
}

.fb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  span small {
    display: block;
    font-weight: 500;
    font-size: 0.72rem;
    opacity: 0.85;
  }

  &--primary {
    background: #e6285c;
    color: #fff;

    &:hover:not(:disabled) {
      background: #c81e4e;
    }
  }

  &--secondary {
    background: #111827;
    color: #fff;

    &:hover:not(:disabled) {
      background: #1f2937;
    }
  }

  &--small {
    padding: 0.45rem 0.75rem;
    font-size: 0.82rem;
    margin-top: 0.5rem;
  }
}

.fb-link {
  background: none;
  border: none;
  padding: 0.2rem;
  color: #6b7280;
  font-size: 0.82rem;
  text-decoration: underline;
  cursor: pointer;
  text-align: center;

  &:hover {
    color: #374151;
  }
}

.fb-transfer {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;

    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
}

.fb-notice {
  display: flex;
  gap: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 12px;
  padding: 1rem;
  color: #78350f;

  > i {
    font-size: 1.1rem;
    margin-top: 0.15rem;
  }

  ul {
    margin: 0.4rem 0 0;
    padding-left: 1.1rem;

    li {
      margin-bottom: 0.2rem;
    }
  }
}

.fb-form {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  h3 {
    margin: 0;
    font-size: 0.95rem;
  }

  &__target {
    margin: 0;
    font-size: 0.85rem;
    color: #4b5563;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;

    .fb-form__field {
      flex: 1 1 160px;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.82rem;
    color: #374151;

    input {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 0.5rem 0.65rem;
      font-size: 0.9rem;
    }
  }

  &__net {
    margin: 0;
    font-size: 1rem;

    strong {
      font-size: 1.15rem;
      color: #047857;
    }
  }

  &__sla {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: #b45309;
  }
}

.fb-crm {
  &__head {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  &__sub {
    margin: 0;
    font-size: 0.85rem;
    color: #6b7280;

    strong {
      color: #047857;
    }
  }

  &__months {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__month {
    flex: 1 1 140px;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }

  &__month-label {
    font-size: 0.78rem;
    color: #6b7280;
  }

  &__month-count {
    font-size: 0.75rem;
    color: #9ca3af;
  }
}

.fb-history {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__item {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  &__main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.9rem;
    font-size: 0.87rem;
  }

  &__date {
    color: #6b7280;
    font-size: 0.8rem;
  }

  &__note {
    margin: 0;
    font-size: 0.8rem;
    color: #b45309;
    display: flex;
    align-items: center;
    gap: 0.35rem;

    &--bad {
      color: #b91c1c;
    }
  }
}
</style>
