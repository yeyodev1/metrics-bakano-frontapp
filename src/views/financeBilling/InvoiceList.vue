<script setup lang="ts">
import { computed } from 'vue'
import type { IFinanceInvoice } from '@/services/financeBilling.service'
import { money, dateEs, periodEs } from './format'

/** Las facturas del cliente: las abiertas (por pagar) primero y resaltadas. */
const props = defineProps<{
  invoices: IFinanceInvoice[]
  stripeEnabled: boolean
  payingInvoiceId: string | null
}>()

const emit = defineEmits<{
  (e: 'pay', invoice: IFinanceInvoice): void
  (e: 'transfer', invoice: IFinanceInvoice): void
}>()

const OPEN_STATUSES = ['pending', 'partial', 'overdue']

const STATUS_META: Record<string, { label: string; icon: string; tone: string }> = {
  pending: { label: 'Pendiente', icon: 'fa-regular fa-clock', tone: 'warn' },
  partial: { label: 'Pago parcial', icon: 'fa-solid fa-circle-half-stroke', tone: 'warn' },
  paid: { label: 'Pagada', icon: 'fa-solid fa-circle-check', tone: 'ok' },
  overdue: { label: 'Vencida', icon: 'fa-solid fa-triangle-exclamation', tone: 'bad' },
  waived: { label: 'Condonada', icon: 'fa-solid fa-gift', tone: 'muted' },
  cancelled: { label: 'Anulada', icon: 'fa-solid fa-ban', tone: 'muted' },
}

function balance(invoice: IFinanceInvoice) {
  return Math.max(Number((invoice.amount - (invoice.paidAmount || 0)).toFixed(2)), 0)
}

function isOpen(invoice: IFinanceInvoice) {
  return OPEN_STATUSES.includes(invoice.status)
}

const sorted = computed(() => [
  ...props.invoices.filter(isOpen),
  ...props.invoices.filter(i => !isOpen(i)),
])
</script>

<template>
  <section class="fbi">
    <h2><i class="fa-regular fa-file-lines" aria-hidden="true" /> Tus facturas</h2>
    <p v-if="!invoices.length" class="fbi__none">Todavía no tienes facturas emitidas.</p>
    <ul class="fbi__list">
      <li
        v-for="invoice in sorted"
        :key="invoice._id"
        class="fbi__item"
        :class="{ 'fbi__item--open': isOpen(invoice) && balance(invoice) > 0 }"
      >
        <div>
          <div class="fbi__title">
            <strong>{{ periodEs(invoice.period) }}</strong>
            <span v-if="invoice.splitLabel" class="fbi__split">{{ invoice.splitLabel }}</span>
            <span class="fbi__badge" :class="`fbi__badge--${STATUS_META[invoice.status]?.tone || 'muted'}`">
              <i :class="STATUS_META[invoice.status]?.icon" aria-hidden="true" />
              {{ STATUS_META[invoice.status]?.label || invoice.status }}
            </span>
          </div>
          <div class="fbi__figures">
            <span>Total <strong>{{ money(invoice.amount, invoice.currency) }}</strong></span>
            <span>Pagado {{ money(invoice.paidAmount, invoice.currency) }}</span>
            <span v-if="isOpen(invoice)">Saldo <strong>{{ money(balance(invoice), invoice.currency) }}</strong></span>
            <span>Vence {{ dateEs(invoice.dueDate) }}</span>
          </div>
        </div>

        <div v-if="isOpen(invoice) && balance(invoice) > 0" class="fbi__actions">
          <button
            v-if="stripeEnabled"
            type="button"
            class="fbi__pay"
            :disabled="payingInvoiceId === invoice._id"
            @click="emit('pay', invoice)"
          >
            <i class="fa-regular fa-credit-card" aria-hidden="true" />
            <span>
              {{ payingInvoiceId === invoice._id ? 'Abriendo pago seguro…' : 'Pagar con tarjeta' }}
              <small>Activación inmediata</small>
            </span>
          </button>
          <button type="button" class="fbi__alt" @click="emit('transfer', invoice)">
            <i class="fa-solid fa-building-columns" aria-hidden="true" /> Transferencia
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.fbi {
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

.fbi__none { font-size: 0.8rem; color: $text-secondary; margin: 0; }

.fbi__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.7rem; }

.fbi__item {
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;

  &--open { border-color: rgba(#6366f1, 0.35); background: rgba(#6366f1, 0.025); }
}

.fbi__title {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  strong { font-size: 0.9rem; color: $primary-dark; }
}

.fbi__split { font-size: 0.72rem; color: $text-secondary; }

.fbi__figures {
  display: flex; gap: 0.9rem; flex-wrap: wrap;
  font-size: 0.76rem; color: $text-secondary; margin-top: 0.25rem;
  strong { color: $primary-dark; }
}

.fbi__actions { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; }

.fbi__pay {
  display: inline-flex; align-items: center; gap: 0.55rem;
  background: #6366f1; color: $white; border: none; border-radius: 10px;
  padding: 0.55rem 1rem; font-family: inherit; font-size: 0.8rem; font-weight: 800;
  cursor: pointer; text-align: left;

  small { display: block; font-size: 0.62rem; font-weight: 600; opacity: 0.85; }
  &:hover:not(:disabled) { filter: brightness(1.08); }
  &:disabled { opacity: 0.75; cursor: default; }
}

.fbi__alt {
  display: inline-flex; align-items: center; gap: 0.45rem;
  background: none; border: 1px solid rgba($primary-dark, 0.15); border-radius: 10px;
  padding: 0.55rem 0.9rem; font-family: inherit; font-size: 0.76rem; font-weight: 700;
  color: $text-secondary; cursor: pointer;
  &:hover { color: $primary-dark; border-color: rgba($primary-dark, 0.3); }
}

.fbi__badge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.68rem; font-weight: 800; padding: 0.16rem 0.55rem; border-radius: 999px;

  &--ok { background: rgba(#10b981, 0.1); color: #0d9668; }
  &--warn { background: rgba(#d97706, 0.12); color: #b45309; }
  &--bad { background: rgba(#ef4444, 0.1); color: #dc2626; }
  &--muted { background: rgba($primary-dark, 0.06); color: $text-secondary; }
}
</style>
