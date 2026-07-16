<template>
  <section class="florinda-sales">
    <header class="florinda-sales__header">
      <div class="florinda-sales__intro">
        <span class="florinda-sales__eyebrow"><i class="fa-solid fa-rotate" /> Sincronización automática diaria</span>
        <h2>Ventas Florinda</h2>
        <p>Datos devueltos por Techncore desde el 27 de noviembre de 2025.</p>
      </div>
      <nav class="florinda-sales__nav" aria-label="Cambiar mes">
        <button :disabled="loading || isFirstAvailableMonth" @click="previousMonth" aria-label="Mes anterior">
          <i class="fa-solid fa-chevron-left" />
        </button>
        <div class="florinda-sales__period" aria-live="polite">
          <small>Período</small>
          <strong>{{ monthLabel }}</strong>
        </div>
        <button :disabled="loading || isCurrentMonth" @click="nextMonth" aria-label="Mes siguiente">
          <i class="fa-solid fa-chevron-right" />
        </button>
        <button v-if="!isCurrentMonth" class="florinda-sales__today" :disabled="loading" @click="goToCurrentMonth">
          Este mes
        </button>
      </nav>
    </header>

    <div v-if="loading" class="florinda-sales__skeleton" role="status" aria-label="Cargando ventas del mes">
      <span class="sr-only">Actualizando resumen...</span>
      <div class="florinda-sales__skeleton-kpis">
        <div v-for="item in 4" :key="item" class="florinda-sales__skeleton-card skeleton-shimmer" />
      </div>
      <div class="florinda-sales__skeleton-ranking skeleton-shimmer" />
      <div class="florinda-sales__skeleton-chart skeleton-shimmer" />
      <div class="florinda-sales__skeleton-content">
        <div class="florinda-sales__skeleton-table skeleton-shimmer" />
        <div class="florinda-sales__skeleton-aside">
          <div class="skeleton-shimmer" />
        </div>
      </div>
    </div>
    <div v-else-if="errorMessage" class="florinda-sales__error">
      <i class="fa-solid fa-circle-exclamation" /> {{ errorMessage }}
      <button @click="loadMonth">Reintentar</button>
    </div>

    <template v-else-if="data">
      <div class="florinda-sales__kpis">
        <article class="florinda-sales__kpi florinda-sales__kpi--total">
          <span><i class="fa-solid fa-sack-dollar" /> Venta total</span>
          <strong>${{ money(data.totalSales) }}</strong>
          <small>Incluye IVA</small>
        </article>
        <article class="florinda-sales__kpi florinda-sales__kpi--net">
          <span><i class="fa-solid fa-arrow-trend-up" /> Venta neta</span>
          <strong>${{ money(data.netSales) }}</strong>
          <small>Antes de IVA</small>
        </article>
        <article class="florinda-sales__kpi florinda-sales__kpi--invoices">
          <span><i class="fa-solid fa-file-invoice-dollar" /> Facturas</span>
          <strong>{{ data.invoiceCount.toLocaleString('es-EC') }}</strong>
          <small>{{ data.lineItemCount.toLocaleString('es-EC') }} productos facturados</small>
        </article>
        <article class="florinda-sales__kpi florinda-sales__kpi--ticket">
          <span><i class="fa-solid fa-receipt" /> Ticket promedio</span>
          <strong>${{ money(averageTicket) }}</strong>
          <small>IVA ${{ money(data.tax) }} · descuentos ${{ money(data.discount) }}</small>
        </article>
      </div>

      <section v-if="sellerTotals.length" class="florinda-sales__ranking" aria-labelledby="seller-ranking-title">
        <header>
          <div class="florinda-sales__ranking-icon"><i class="fa-solid fa-trophy" /></div>
          <div>
            <span>Desempeño comercial</span>
            <h3 id="seller-ranking-title">Ranking de vendedores</h3>
          </div>
        </header>
        <div class="florinda-sales__ranking-list">
          <article
            v-for="(seller, index) in sellerTotals"
            :key="seller.name"
            class="florinda-sales__seller"
            :class="`florinda-sales__seller--${index + 1}`"
          >
            <div class="florinda-sales__seller-place">
              <i :class="sellerRankIcon(index)" />
              <span>#{{ index + 1 }}</span>
            </div>
            <div class="florinda-sales__seller-info">
              <strong :title="seller.name">{{ seller.name }}</strong>
              <small><i class="fa-solid fa-file-invoice" /> {{ seller.invoiceCount }} facturas</small>
            </div>
            <strong class="florinda-sales__seller-sales">${{ money(seller.totalSales) }}</strong>
          </article>
        </div>
      </section>

      <div class="florinda-sales__toolbar">
        <div>
          <strong><i class="fa-solid fa-calendar-days" /> Detalle diario</strong>
          <span>{{ visibleDays.length }} de {{ data.days.length }} días visibles</span>
        </div>
        <div class="florinda-sales__filters" role="group" aria-label="Filtrar días">
          <button :class="{ 'is-active': dayFilter === 'all' }" :aria-pressed="dayFilter === 'all'" @click="dayFilter = 'all'">
            <i class="fa-solid fa-list" /> Todos <span>{{ data.days.length }}</span>
          </button>
          <button :class="{ 'is-active': dayFilter === 'sales' }" :aria-pressed="dayFilter === 'sales'" @click="dayFilter = 'sales'">
            <i class="fa-solid fa-circle-dollar-to-slot" /> Con ventas <span>{{ daysWithSales.length }}</span>
          </button>
        </div>
      </div>

      <div v-if="daysWithSales.length" class="florinda-sales__chart">
        <div
          v-for="day in daysWithSales"
          :key="day.date"
          class="florinda-sales__bar-column"
          :title="`${longDate(day.date)}: $${money(day.totalSales)}`"
        >
          <span>${{ compactMoney(day.totalSales) }}</span>
          <div class="florinda-sales__bar-track">
            <div :style="{ height: `${barHeight(day.totalSales)}%` }" />
          </div>
          <small>{{ Number(day.date.slice(-2)) }}</small>
        </div>
      </div>

      <div v-if="daysWithSales.length" class="florinda-sales__content">
        <div class="florinda-sales__daily">
          <h3>Ventas por día</h3>
          <div class="florinda-sales__table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Facturas</th><th>Neto</th><th>IVA</th><th>Total</th></tr></thead>
              <tbody>
                <tr v-for="day in visibleDays" :key="day.date" :class="{ 'is-empty': day.invoiceCount === 0 }">
                  <td data-label="Fecha">{{ longDate(day.date) }}</td>
                  <td data-label="Facturas">{{ day.invoiceCount }}</td>
                  <td data-label="Neto">${{ money(day.netSales) }}</td>
                  <td data-label="IVA">${{ money(day.tax) }}</td>
                  <td data-label="Total"><strong>${{ money(day.totalSales) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside class="florinda-sales__breakdowns">
          <div>
            <h3><i class="fa-solid fa-comments" /> Canales del mes</h3>
            <p v-for="item in channelTotals" :key="item.name">
              <span><i class="fa-brands fa-whatsapp" /> {{ item.name }} <small>{{ item.invoiceCount }} fact.</small></span>
              <strong>${{ money(item.totalSales) }}</strong>
            </p>
          </div>
        </aside>
      </div>

      <div v-else class="florinda-sales__empty">
        <i class="fa-solid fa-receipt" />
        <h3>Sin ventas para {{ monthLabel }}</h3>
        <p>El cron actualizará automáticamente este período cada noche.</p>
      </div>

      <p v-if="lastSync" class="florinda-sales__sync-time">
        Última sincronización: {{ new Date(lastSync).toLocaleString('es-EC') }}
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { florindaSalesService, type IFlorindaBreakdown, type IFlorindaSalesMonth } from '@/services/florindaSales.service'

const props = defineProps<{ workspaceId: string }>()
const ecuadorDateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Guayaquil',
  year: 'numeric',
  month: 'numeric',
}).formatToParts(new Date())
const currentYear = Number(ecuadorDateParts.find(part => part.type === 'year')?.value)
const currentMonth = Number(ecuadorDateParts.find(part => part.type === 'month')?.value)
const selectedYear = ref(currentYear)
const selectedMonth = ref(currentMonth)
const loading = ref(false)
const errorMessage = ref('')
const data = ref<IFlorindaSalesMonth | null>(null)
const dayFilter = ref<'all' | 'sales'>('all')

const monthLabel = computed(() => new Date(selectedYear.value, selectedMonth.value - 1).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }))
const isCurrentMonth = computed(() => selectedYear.value === currentYear && selectedMonth.value === currentMonth)
const isFirstAvailableMonth = computed(() => selectedYear.value === 2025 && selectedMonth.value === 11)
const averageTicket = computed(() => data.value?.invoiceCount ? data.value.totalSales / data.value.invoiceCount : 0)
const daysWithSales = computed(() => (data.value?.days || []).filter(day => day.totalSales > 0))
const visibleDays = computed(() => [...(dayFilter.value === 'sales' ? daysWithSales.value : data.value?.days || [])].reverse())
const maxDailySales = computed(() => Math.max(...daysWithSales.value.map(day => day.totalSales), 1))
const lastSync = computed(() => data.value?.days.reduce<string | null>((latest, day) => !latest || day.syncedAt > latest ? day.syncedAt : latest, null) || null)

function aggregateBreakdown(key: 'byChannel' | 'bySeller'): IFlorindaBreakdown[] {
  const totals = new Map<string, IFlorindaBreakdown>()
  for (const day of daysWithSales.value) {
    for (const item of day[key]) {
      const current = totals.get(item.name) || { name: item.name, invoiceCount: 0, totalSales: 0 }
      current.invoiceCount += item.invoiceCount
      current.totalSales += item.totalSales
      totals.set(item.name, current)
    }
  }
  return [...totals.values()].sort((a, b) => b.totalSales - a.totalSales).slice(0, 6)
}

const channelTotals = computed(() => aggregateBreakdown('byChannel'))
const sellerTotals = computed(() => aggregateBreakdown('bySeller'))

function money(value: number) {
  return value.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function compactMoney(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)
}

function longDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })
}

function barHeight(value: number) {
  return Math.max(6, (value / maxDailySales.value) * 100)
}

function sellerRankIcon(index: number) {
  return index === 0 ? 'fa-solid fa-crown' : index < 3 ? 'fa-solid fa-medal' : 'fa-solid fa-star'
}

function previousMonth() {
  if (isFirstAvailableMonth.value) return
  if (selectedMonth.value === 1) { selectedMonth.value = 12; selectedYear.value-- }
  else selectedMonth.value--
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (selectedMonth.value === 12) { selectedMonth.value = 1; selectedYear.value++ }
  else selectedMonth.value++
}

function goToCurrentMonth() {
  selectedYear.value = currentYear
  selectedMonth.value = currentMonth
}

async function loadMonth() {
  loading.value = true
  errorMessage.value = ''
  try {
    data.value = await florindaSalesService.getMonth(props.workspaceId, selectedYear.value, selectedMonth.value)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'No se pudieron cargar las ventas.'
  } finally {
    loading.value = false
  }
}

onMounted(loadMonth)
watch([selectedYear, selectedMonth], loadMonth)
</script>

<style scoped lang="scss">
.florinda-sales {
  margin-top: 28px;
  padding: 24px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  border-radius: 20px;
  border: 1px solid #e7e2eb;
  background: #fbfafc;
  color: $primary-dark;
}

.florinda-sales__header { display: flex; justify-content: space-between; gap: 20px; align-items: center; margin-bottom: 20px; min-width: 0; }
.florinda-sales__intro { min-width: 0; }
.florinda-sales__header h2 { margin: 5px 0; font-size: 24px; }
.florinda-sales__header p { margin: 0; color: #6b6572; }
.florinda-sales__eyebrow { color: $BAKANO-GREEN; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
.florinda-sales__nav { display: flex; align-items: center; gap: 6px; flex-shrink: 0; background: white; border: 1px solid #e7e2eb; border-radius: 14px; padding: 6px; }
.florinda-sales__period { display: flex; min-width: 142px; flex-direction: column; align-items: center; line-height: 1.15; }
.florinda-sales__period small { color: #918a97; font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.florinda-sales__period strong { margin-top: 3px; text-align: center; text-transform: capitalize; }
.florinda-sales__nav button { width: 34px; height: 34px; border: 0; border-radius: 8px; background: #f1edf4; cursor: pointer; color: $secondary; }
.florinda-sales__nav button:disabled { opacity: .35; cursor: default; }
.florinda-sales__nav button:focus-visible, .florinda-sales__filters button:focus-visible, .florinda-sales__error button:focus-visible { outline: 2px solid $secondary; outline-offset: 2px; }
.florinda-sales__nav .florinda-sales__today { width: auto; padding: 0 12px; color: white; background: $secondary; font-size: 12px; font-weight: 800; }

.florinda-sales__kpis { display: flex; flex-wrap: wrap; gap: 12px; width: 100%; }
.florinda-sales__kpis article { display: flex; min-width: 180px; flex: 1 1 210px; flex-direction: column; background: white; border: 1px solid #ebe7ee; border-radius: 14px; padding: 18px; }
.florinda-sales__kpis span { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #77717e; font-weight: 700; text-transform: uppercase; }
.florinda-sales__kpis span i { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border-radius: 8px; font-size: 13px; }
.florinda-sales__kpis strong { font-size: 24px; margin: 7px 0 4px; }
.florinda-sales__kpis small { color: #8c8592; }
.florinda-sales__kpi--total { border-top: 3px solid #2ca56f !important; background: linear-gradient(145deg, #f3fff9, white 62%) !important; }
.florinda-sales__kpi--total span i { color: #147a4c; background: #d9f8e9; }
.florinda-sales__kpi--net { border-top: 3px solid #6e50c9 !important; background: linear-gradient(145deg, #f8f5ff, white 62%) !important; }
.florinda-sales__kpi--net span i { color: #6242bd; background: #ebe4ff; }
.florinda-sales__kpi--invoices { border-top: 3px solid #e09b31 !important; background: linear-gradient(145deg, #fffaf0, white 62%) !important; }
.florinda-sales__kpi--invoices span i { color: #b87513; background: #ffedcb; }
.florinda-sales__kpi--ticket { border-top: 3px solid #3188c8 !important; background: linear-gradient(145deg, #f2faff, white 62%) !important; }
.florinda-sales__kpi--ticket span i { color: #2476b2; background: #dcedfb; }

.florinda-sales__ranking { display: flex; align-items: stretch; gap: 18px; margin-top: 18px; padding: 18px; border: 1px solid #eadfab; border-radius: 16px; background: linear-gradient(120deg, #fffdf4, #fff 45%, #faf7ff); }
.florinda-sales__ranking > header { display: flex; min-width: 190px; align-items: center; gap: 11px; }
.florinda-sales__ranking-icon { display: flex; width: 42px; height: 42px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 12px; color: #8b650f; background: linear-gradient(145deg, #ffe89d, #f4c84f); box-shadow: 0 5px 14px rgba(174, 123, 16, .18); }
.florinda-sales__ranking header span { color: #9a7728; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.florinda-sales__ranking header h3 { margin: 3px 0 0; font-size: 16px; }
.florinda-sales__ranking-list { display: flex; min-width: 0; flex: 1; flex-wrap: wrap; gap: 8px; }
.florinda-sales__seller { display: flex; min-width: 210px; flex: 1 1 230px; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #eee9f0; border-radius: 12px; background: white; }
.florinda-sales__seller-place { display: flex; width: 34px; flex-shrink: 0; flex-direction: column; align-items: center; color: #8c8592; font-size: 10px; font-weight: 800; }
.florinda-sales__seller-place i { margin-bottom: 2px; font-size: 14px; }
.florinda-sales__seller--1 { border-color: #e8cf6f; box-shadow: 0 5px 14px rgba(174, 123, 16, .08); }
.florinda-sales__seller--1 .florinda-sales__seller-place { color: #bd8513; }
.florinda-sales__seller--2 .florinda-sales__seller-place { color: #8190a1; }
.florinda-sales__seller--3 .florinda-sales__seller-place { color: #bd754f; }
.florinda-sales__seller-info { display: flex; min-width: 0; flex: 1; flex-direction: column; }
.florinda-sales__seller-info strong { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.florinda-sales__seller-info small { margin-top: 3px; color: #918a97; font-size: 10px; }
.florinda-sales__seller-info small i { margin-right: 3px; color: #b3aab8; }
.florinda-sales__seller-sales { flex-shrink: 0; color: #147a4c; font-size: 13px; }

.florinda-sales__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 22px 0 12px; }
.florinda-sales__toolbar > div:first-child { display: flex; min-width: 0; flex-direction: column; }
.florinda-sales__toolbar > div:first-child strong i { margin-right: 6px; color: $secondary; }
.florinda-sales__toolbar > div:first-child span { margin-top: 3px; color: #918a97; font-size: 12px; }
.florinda-sales__filters { display: flex; gap: 4px; flex-shrink: 0; padding: 4px; border: 1px solid #e7e2eb; border-radius: 11px; background: white; }
.florinda-sales__filters button { display: flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 11px; border: 0; border-radius: 8px; color: #716979; background: transparent; cursor: pointer; font-weight: 700; }
.florinda-sales__filters button span { padding: 2px 6px; border-radius: 999px; background: #f1edf4; font-size: 10px; }
.florinda-sales__filters button.is-active { color: white; background: $secondary; }
.florinda-sales__filters button.is-active span { color: $secondary; background: white; }

.florinda-sales__chart { height: 230px; display: flex; gap: 6px; align-items: stretch; margin: 0 0 22px; padding: 20px 16px 10px; background: white; border: 1px solid #ebe7ee; border-radius: 14px; overflow-x: auto; }
.florinda-sales__bar-column { min-width: 27px; flex: 1; display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #77717e; }
.florinda-sales__bar-column > span { height: 20px; white-space: nowrap; }
.florinda-sales__bar-track { width: 100%; flex: 1; display: flex; align-items: flex-end; justify-content: center; }
.florinda-sales__bar-track div { width: 72%; max-width: 24px; border-radius: 6px 6px 2px 2px; background: linear-gradient(180deg, $secondary, $primary); }
.florinda-sales__bar-column small { margin-top: 6px; }

.florinda-sales__content { display: flex; align-items: flex-start; gap: 16px; width: 100%; min-width: 0; }
.florinda-sales__daily { min-width: 0; flex: 2 1 560px; }
.florinda-sales__breakdowns { min-width: 240px; flex: 1 1 280px; }
.florinda-sales__daily, .florinda-sales__breakdowns > div { background: white; border: 1px solid #ebe7ee; border-radius: 14px; padding: 18px; }
.florinda-sales h3 { margin: 0 0 14px; font-size: 15px; }
.florinda-sales__table-wrap { width: 100%; min-width: 0; overflow-x: auto; max-height: 430px; }
.florinda-sales table { width: 100%; border-collapse: collapse; font-size: 13px; }
.florinda-sales th, .florinda-sales td { padding: 11px 8px; text-align: right; border-bottom: 1px solid #f0edf2; white-space: nowrap; }
.florinda-sales th:first-child, .florinda-sales td:first-child { text-align: left; }
.florinda-sales tr.is-empty { color: #aaa4ad; }
.florinda-sales__breakdowns { display: flex; flex-direction: column; gap: 16px; }
.florinda-sales__breakdowns p { display: flex; justify-content: space-between; gap: 8px; margin: 0; padding: 9px 0; border-bottom: 1px solid #f0edf2; font-size: 13px; }
.florinda-sales__breakdowns p:last-child { border: 0; }
.florinda-sales__breakdowns p span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.florinda-sales__breakdowns h3 i { margin-right: 6px; color: #2ca56f; }
.florinda-sales__breakdowns p span > i { margin-right: 4px; color: #25b56a; }
.florinda-sales__breakdowns small { color: #918a97; display: block; }
.florinda-sales__error, .florinda-sales__empty { padding: 50px 20px; text-align: center; color: #716979; }
.florinda-sales__error button { margin-left: 10px; border: 0; color: $secondary; background: transparent; font-weight: 700; cursor: pointer; }
.florinda-sales__empty i { font-size: 30px; color: $secondary; }
.florinda-sales__empty h3 { margin: 12px 0 5px; }
.florinda-sales__sync-time { margin: 14px 0 0; color: #918a97; font-size: 11px; text-align: right; }

.florinda-sales__skeleton { display: flex; flex-direction: column; gap: 18px; width: 100%; }
.florinda-sales__skeleton-kpis { display: flex; flex-wrap: wrap; gap: 12px; }
.florinda-sales__skeleton-card { min-width: 180px; height: 116px; flex: 1 1 210px; border-radius: 14px; }
.florinda-sales__skeleton-ranking { width: 100%; height: 96px; border-radius: 16px; }
.florinda-sales__skeleton-chart { width: 100%; height: 230px; border-radius: 14px; }
.florinda-sales__skeleton-content { display: flex; gap: 16px; width: 100%; }
.florinda-sales__skeleton-table { min-width: 0; height: 300px; flex: 2 1 560px; border-radius: 14px; }
.florinda-sales__skeleton-aside { display: flex; min-width: 240px; flex: 1 1 280px; flex-direction: column; gap: 16px; }
.florinda-sales__skeleton-aside div { height: 142px; border-radius: 14px; }
.skeleton-shimmer { position: relative; overflow: hidden; background: #ece8ef; }
.skeleton-shimmer::after { position: absolute; inset: 0; content: ''; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .7), transparent); animation: florinda-shimmer 1.35s infinite; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

@keyframes florinda-shimmer { to { transform: translateX(100%); } }

@media (max-width: 900px) {
  .florinda-sales__header { align-items: stretch; flex-direction: column; }
  .florinda-sales__nav { align-self: flex-start; }
  .florinda-sales__content, .florinda-sales__skeleton-content { flex-direction: column; }
  .florinda-sales__daily, .florinda-sales__breakdowns, .florinda-sales__skeleton-table, .florinda-sales__skeleton-aside { width: 100%; min-width: 0; flex-basis: auto; }
  .florinda-sales__skeleton-aside { flex-direction: row; }
  .florinda-sales__skeleton-aside div { flex: 1 1 0; }
  .florinda-sales__ranking { flex-direction: column; }
  .florinda-sales__ranking > header { min-width: 0; }
}

@media (max-width: 600px) {
  .florinda-sales { margin-top: 12px; padding: 14px; border-radius: 16px; }
  .florinda-sales__header { gap: 14px; }
  .florinda-sales__header h2 { font-size: 21px; }
  .florinda-sales__header p { font-size: 13px; }
  .florinda-sales__nav { width: 100%; box-sizing: border-box; }
  .florinda-sales__period { min-width: 0; flex: 1; }
  .florinda-sales__nav .florinda-sales__today { padding: 0 9px; }
  .florinda-sales__kpis article, .florinda-sales__skeleton-card { width: 100%; min-width: 0; flex-basis: 100%; }
  .florinda-sales__ranking { padding: 14px; }
  .florinda-sales__ranking-list { flex-direction: column; }
  .florinda-sales__seller { width: 100%; min-width: 0; box-sizing: border-box; flex-basis: auto; }
  .florinda-sales__toolbar { align-items: stretch; flex-direction: column; gap: 10px; }
  .florinda-sales__filters { width: 100%; box-sizing: border-box; }
  .florinda-sales__filters button { justify-content: center; flex: 1; padding: 0 6px; }
  .florinda-sales__chart { padding-left: 10px; padding-right: 10px; }
  .florinda-sales__daily, .florinda-sales__breakdowns > div { padding: 14px; }
  .florinda-sales__table-wrap { overflow: visible; max-height: none; }
  .florinda-sales table, .florinda-sales tbody { display: flex; width: 100%; flex-direction: column; }
  .florinda-sales thead { display: none; }
  .florinda-sales tbody { gap: 8px; }
  .florinda-sales tr { display: flex; flex-wrap: wrap; width: 100%; padding: 10px 12px; box-sizing: border-box; border: 1px solid #f0edf2; border-radius: 10px; }
  .florinda-sales td { display: flex; width: 50%; justify-content: space-between; gap: 6px; padding: 5px 0; box-sizing: border-box; border: 0; text-align: right; font-size: 12px; }
  .florinda-sales td:nth-child(even) { padding-left: 12px; }
  .florinda-sales td:first-child { width: 100%; margin-bottom: 4px; padding-bottom: 8px; border-bottom: 1px solid #f0edf2; font-size: 13px; font-weight: 800; }
  .florinda-sales td::before { content: attr(data-label); color: #918a97; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .florinda-sales td:first-child::before { display: none; }
  .florinda-sales__skeleton-aside { flex-direction: column; }
  .florinda-sales__sync-time { text-align: left; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer::after { animation: none; }
}
</style>
