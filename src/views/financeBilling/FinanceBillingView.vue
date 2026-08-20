<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import financeBillingService, {
  type IFinanceBilling,
  type IFinanceInvoice,
} from '@/services/financeBilling.service'
import { useToast } from '@/composables/useToast'
import TransferModal from './TransferModal.vue'
import InvoiceList from './InvoiceList.vue'
import CrmConsumptionCard from './CrmConsumptionCard.vue'
import ReceiptThumb from './ReceiptThumb.vue'
import { money, dateEs, periodEs } from './format'

/**
 * Portal de suscripcion rediseñado: dos columnas en desktop (facturas y pagos
 * a la izquierda, comprobantes y consumo CRM a la derecha), recibos siempre
 * visibles con miniatura, y la transferencia como modal. La version anterior
 * apilaba todo en una columna y el comprobante subido ni siquiera tenia link.
 */
const route = useRoute()
const router = useRouter()
const { addToast } = useToast()

const workspaceId = computed(() => String(route.params.workspaceId))

const billing = ref<IFinanceBilling | null>(null)
const loading = ref(true)
const notLinked = ref(false)
const loadError = ref('')
const payingInvoiceId = ref<string | null>(null)
const transferInvoice = ref<IFinanceInvoice | null>(null)
const openingCardUpdate = ref(false)

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

async function load() {
  loading.value = true
  notLinked.value = false
  loadError.value = ''
  try {
    billing.value = await financeBillingService.getBilling(workspaceId.value)
  } catch (error) {
    const err = error as { status?: number; message?: string }
    if (err.status === 404) notLinked.value = true
    else loadError.value = err.message || 'No se pudo cargar tu facturación.'
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

/** Portal de Stripe restringido: solo deja actualizar la tarjeta de la sub. */
async function openCardUpdate() {
  openingCardUpdate.value = true
  try {
    const { url } = await financeBillingService.createCardUpdateSession(workspaceId.value)
    window.location.href = url
  } catch (error) {
    const err = error as { message?: string }
    addToast({ type: 'error', message: err.message || 'No se pudo abrir el cambio de tarjeta.' })
    openingCardUpdate.value = false
  }
}

function backToCard() {
  const invoice = transferInvoice.value
  transferInvoice.value = null
  if (invoice) payWithCard(invoice)
}

async function onSubmitted() {
  transferInvoice.value = null
  await load()
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
  } else if (route.query.tarjeta === 'lista') {
    addToast({
      type: 'success',
      title: 'Tarjeta al día',
      message: 'Si actualizaste tu tarjeta, los próximos cobros usarán la nueva.',
      duration: 7000,
    })
    router.replace({ query: {} })
  }
  await load()
})
</script>

<template>
  <div class="fb">
    <header class="fb__header">
      <div>
        <h1><i class="fa-solid fa-credit-card" aria-hidden="true" /> Mi suscripción</h1>
        <p v-if="billing" class="fb__sub">{{ billing.client.name }} · Bakano</p>
        <button
          v-if="billing?.summary.canUpdateCard"
          type="button"
          class="fb__card-btn"
          :disabled="openingCardUpdate"
          @click="openCardUpdate"
        >
          <i class="fa-solid fa-credit-card" aria-hidden="true" />
          {{ openingCardUpdate ? 'Abriendo portal seguro…' : 'Cambiar tarjeta' }}
        </button>
      </div>
      <div v-if="billing" class="fb__kpis">
        <div class="fb__kpi" :class="{ 'fb__kpi--warn': billing.summary.pendingBalance > 0 }">
          <span>Saldo pendiente</span>
          <strong>{{ money(billing.summary.pendingBalance) }}</strong>
        </div>
        <div class="fb__kpi fb__kpi--ok">
          <span>Total pagado</span>
          <strong>{{ money(billing.summary.totalPaid) }}</strong>
        </div>
        <div class="fb__kpi">
          <span>Facturas abiertas</span>
          <strong>{{ billing.summary.openInvoices }}</strong>
        </div>
      </div>
    </header>

    <div v-if="loading" class="fb__skeleton">
      <div v-for="i in 4" :key="i" class="fb__skeleton-block" />
    </div>

    <div v-else-if="notLinked" class="fb__empty">
      <i class="fa-regular fa-folder-open" aria-hidden="true" />
      <h3>Tu facturación aún no está habilitada aquí</h3>
      <p>Estamos preparando tu espacio de facturación. Escríbenos si necesitas un detalle de tus pagos.</p>
    </div>

    <div v-else-if="loadError" class="fb__empty fb__empty--error">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <h3>No pudimos cargar tu facturación</h3>
      <p>{{ loadError }}</p>
      <button type="button" class="fb__retry" @click="load">Reintentar</button>
    </div>

    <div v-else-if="billing" class="fb__grid">
      <!-- ── Columna principal ── -->
      <div class="fb__main">
        <InvoiceList
          :invoices="billing.invoices"
          :stripe-enabled="billing.summary.stripeEnabled"
          :paying-invoice-id="payingInvoiceId"
          @pay="payWithCard"
          @transfer="transferInvoice = $event"
        />

        <section class="fb__card">
          <h2><i class="fa-solid fa-circle-check" aria-hidden="true" /> Pagos realizados</h2>
          <p v-if="!billing.payments.length" class="fb__none">Aún no registramos pagos tuyos.</p>
          <ul class="fb__rows">
            <li v-for="payment in billing.payments" :key="payment._id" class="fb__row">
              <div class="fb__row-info">
                <strong class="fb__row-amount">{{ money(payment.amount, payment.currency) }}</strong>
                <span class="fb__row-detail">
                  {{ METHOD_LABELS[payment.method] || payment.method }} · {{ periodEs(payment.period) }}
                </span>
                <span class="fb__row-date">{{ dateEs(payment.paidAt) }}</span>
              </div>
              <ReceiptThumb v-if="payment.receiptUrl" :url="payment.receiptUrl" label="Ver recibo" />
            </li>
          </ul>
        </section>
      </div>

      <!-- ── Columna lateral ── -->
      <div class="fb__side">
        <section v-if="billing.submissions.length" class="fb__card">
          <h2><i class="fa-solid fa-file-arrow-up" aria-hidden="true" /> Tus comprobantes</h2>
          <ul class="fb__rows">
            <li v-for="submission in billing.submissions" :key="submission._id" class="fb__row fb__row--stack">
              <div class="fb__row-top">
                <span class="fb__badge" :class="`fb__badge--${SUBMISSION_META[submission.status]?.tone || 'muted'}`">
                  <i :class="SUBMISSION_META[submission.status]?.icon" aria-hidden="true" />
                  {{ SUBMISSION_META[submission.status]?.label || submission.status }}
                </span>
                <span class="fb__row-date">{{ dateEs(submission.createdAt) }}</span>
              </div>
              <div class="fb__row-info">
                <strong class="fb__row-amount">{{ money(submission.netAmount, submission.currency) }}</strong>
                <span class="fb__row-detail">
                  Enviado {{ money(submission.grossAmount, submission.currency) }}
                  · Fee {{ money(submission.feeAmount, submission.currency) }}
                </span>
              </div>
              <ReceiptThumb :url="submission.receiptUrl" label="Ver mi comprobante" />
              <p v-if="submission.status === 'pending'" class="fb__note">
                <i class="fa-regular fa-clock" aria-hidden="true" />
                Respuesta máxima: {{ dateEs(submission.reviewDueAt) }}
              </p>
              <p v-else-if="submission.status === 'rejected' && submission.reviewNote" class="fb__note fb__note--bad">
                <i class="fa-solid fa-circle-xmark" aria-hidden="true" /> {{ submission.reviewNote }}
              </p>
            </li>
          </ul>
        </section>

        <CrmConsumptionCard
          v-if="billing.crmConsumption && billing.crmConsumption.items.length"
          :crm="billing.crmConsumption"
        />
      </div>
    </div>

    <TransferModal
      v-if="transferInvoice && billing"
      :workspace-id="workspaceId"
      :invoice="transferInvoice"
      :stripe-enabled="billing.summary.stripeEnabled"
      @close="transferInvoice = null"
      @submitted="onSubmitted"
      @pay-card="backToCard"
    />
  </div>
</template>

<style lang="scss" scoped>
.fb {
  padding: 1.3rem 1.4rem 2.5rem;
  max-width: 1240px;
  margin: 0 auto;
  width: 100%;
}

.fb__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.2rem;

  h1 {
    font-size: 1.25rem; font-weight: 800; color: $primary-dark; margin: 0;
    display: flex; align-items: center; gap: 0.55rem;
    i { color: #6366f1; font-size: 1.05rem; }
  }
}

.fb__sub { font-size: 0.82rem; color: $text-secondary; margin: 0.2rem 0 0; }

.fb__card-btn {
  margin-top: 0.55rem; display: inline-flex; align-items: center; gap: 0.45rem;
  background: none; border: 1px solid rgba(#6366f1, 0.35); border-radius: 10px;
  padding: 0.45rem 0.85rem; font-family: inherit; font-size: 0.76rem; font-weight: 700;
  color: #6366f1; cursor: pointer;
  &:hover:not(:disabled) { background: rgba(#6366f1, 0.06); }
  &:disabled { opacity: 0.7; cursor: default; }
}

.fb__kpis { display: flex; gap: 0.7rem; flex-wrap: wrap; }

.fb__kpi {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 0.6rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 128px;

  span { font-size: 0.66rem; font-weight: 700; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.05em; }
  strong { font-size: 1.05rem; color: $primary-dark; }

  &--warn strong { color: #b45309; }
  &--ok strong { color: #0d9668; }
}

.fb__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.fb__main, .fb__side { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }

.fb__card {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  padding: 1.1rem 1.2rem;

  h2 {
    font-size: 0.88rem; font-weight: 800; color: $primary-dark; margin: 0 0 0.8rem;
    display: flex; align-items: center; gap: 0.5rem;
    i { color: #6366f1; font-size: 0.8rem; }
  }
}

.fb__none { font-size: 0.8rem; color: $text-secondary; margin: 0; }

.fb__badge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.68rem; font-weight: 800; padding: 0.16rem 0.55rem; border-radius: 999px;

  &--ok { background: rgba(#10b981, 0.1); color: #0d9668; }
  &--warn { background: rgba(#d97706, 0.12); color: #b45309; }
  &--bad { background: rgba(#ef4444, 0.1); color: #dc2626; }
  &--muted { background: rgba($primary-dark, 0.06); color: $text-secondary; }
}

.fb__rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }

.fb__row {
  display: flex; align-items: center; justify-content: space-between; gap: 0.8rem;
  padding: 0.65rem 0;
  border-bottom: 1px dashed rgba($primary-dark, 0.08);

  &:last-child { border-bottom: none; }

  &--stack { flex-direction: column; align-items: stretch; gap: 0.45rem; }
}

.fb__row-top { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; }

.fb__row-info { display: flex; flex-direction: column; gap: 0.08rem; min-width: 0; }

.fb__row-amount { font-size: 0.9rem; color: $primary-dark; }

.fb__row-detail { font-size: 0.74rem; color: $text-secondary; }

.fb__row-date { font-size: 0.7rem; color: $text-secondary; flex-shrink: 0; }

.fb__note {
  display: flex; align-items: flex-start; gap: 0.4rem;
  font-size: 0.74rem; color: $text-secondary; margin: 0;
  i { margin-top: 0.12rem; } &--bad { color: #dc2626; }
}

.fb__skeleton { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1rem; @media (max-width: 900px) { grid-template-columns: 1fr; } }

.fb__skeleton-block {
  height: 150px; border-radius: 14px;
  background: linear-gradient(100deg, rgba($primary-dark, 0.05) 40%, rgba($primary-dark, 0.02) 50%, rgba($primary-dark, 0.05) 60%);
  background-size: 200% 100%;
  animation: fb-shimmer 1.3s infinite;
}

.fb__empty {
  background: $white; border: 1px solid rgba($primary-dark, 0.08); border-radius: 14px;
  padding: 2.5rem 1.5rem; text-align: center; color: $text-secondary;

  i { font-size: 1.6rem; margin-bottom: 0.6rem; display: block; }
  h3 { font-size: 0.95rem; color: $primary-dark; margin: 0 0 0.3rem; }
  p { font-size: 0.8rem; margin: 0; }

  &--error i { color: #dc2626; }
}

.fb__retry {
  margin-top: 0.9rem;
  background: #6366f1; color: $white; border: none; border-radius: 10px;
  padding: 0.55rem 1.1rem; font-family: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer;
}

@keyframes fb-shimmer { to { background-position: -200% 0; } }
</style>
