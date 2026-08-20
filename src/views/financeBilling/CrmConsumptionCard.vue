<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ICrmConsumption } from '@/services/financeBilling.service'
import { money, dateEs, periodEs } from './format'

/** Consumo del CRM (GoHighLevel): ya cobrado por Stripe, informativo. */
const props = defineProps<{ crm: ICrmConsumption }>()

const PREVIEW = 6
const showAll = ref(false)
const visible = computed(() =>
  showAll.value ? props.crm.items : props.crm.items.slice(0, PREVIEW)
)
</script>

<template>
  <section class="crm">
    <h2><i class="fa-solid fa-plug-circle-bolt" aria-hidden="true" /> Consumo CRM</h2>
    <p class="crm__sub">
      Lo que tu cuenta consume del CRM (GoHighLevel).
      <strong>Ya cobrado por Stripe</strong> — no es deuda.
    </p>

    <div class="crm__totals">
      <div class="crm__total">
        <span>Este mes</span>
        <strong>{{ money(crm.totals.currentMonth) }}</strong>
      </div>
      <div class="crm__total">
        <span>Acumulado</span>
        <strong>{{ money(crm.totals.total) }}</strong>
      </div>
    </div>

    <ul v-if="crm.totals.byMonth.length" class="crm__months">
      <li v-for="month in crm.totals.byMonth" :key="month.period">
        <span>{{ periodEs(month.period) }}</span>
        <span class="crm__month-count">{{ month.count }} cargo{{ month.count === 1 ? '' : 's' }}</span>
        <strong>{{ money(month.total) }}</strong>
      </li>
    </ul>

    <ul class="crm__items">
      <li v-for="item in visible" :key="item._id">
        <div class="crm__item-info">
          <span class="crm__item-desc">{{ item.description || 'Consumo CRM' }}</span>
          <span class="crm__item-date">{{ dateEs(item.paidAt) }}</span>
        </div>
        <strong>{{ money(item.amount, item.currency) }}</strong>
      </li>
    </ul>

    <button
      v-if="crm.items.length > PREVIEW"
      type="button"
      class="crm__more"
      @click="showAll = !showAll"
    >
      {{ showAll ? 'Ver menos' : `Ver los ${crm.items.length} cargos` }}
    </button>
  </section>
</template>

<style lang="scss" scoped>
.crm {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  padding: 1.1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  h2 {
    font-size: 0.88rem; font-weight: 800; color: $primary-dark; margin: 0;
    display: flex; align-items: center; gap: 0.5rem;
    i { color: #6366f1; font-size: 0.8rem; }
  }
}

.crm__sub { font-size: 0.76rem; color: $text-secondary; margin: -0.4rem 0 0; }

.crm__totals { display: flex; gap: 0.7rem; }

.crm__total {
  flex: 1;
  background: rgba(#6366f1, 0.05);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;

  span { font-size: 0.68rem; font-weight: 700; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.04em; }
  strong { font-size: 1rem; color: $primary-dark; }
}

.crm__months {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;

  li {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.78rem; color: $primary-dark;
    padding: 0.4rem 0;
    border-bottom: 1px dashed rgba($primary-dark, 0.08);

    > span:first-child { flex: 1; }
    strong { font-size: 0.8rem; }
  }
}

.crm__month-count { font-size: 0.7rem; color: $text-secondary; }

.crm__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  li {
    display: flex; align-items: center; justify-content: space-between; gap: 0.6rem;
    font-size: 0.78rem;
    strong { color: $primary-dark; flex-shrink: 0; }
  }
}

.crm__item-info { display: flex; flex-direction: column; min-width: 0; }

.crm__item-desc {
  color: $primary-dark; font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.crm__item-date { font-size: 0.7rem; color: $text-secondary; }

.crm__more {
  align-self: flex-start;
  background: none; border: none; padding: 0;
  font-family: inherit; font-size: 0.76rem; font-weight: 700;
  color: #6366f1; cursor: pointer;
  &:hover { text-decoration: underline; }
}
</style>
