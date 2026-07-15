<template>
  <section class="florinda-sales">
    <header class="florinda-sales__header">
      <div>
        <span class="florinda-sales__eyebrow"><i class="fa-solid fa-rotate" /> Sincronización automática diaria</span>
        <h2>Ventas Florinda</h2>
        <p>Facturas registradas en Techncore desde enero de {{ currentYear }}.</p>
      </div>
      <nav class="florinda-sales__nav" aria-label="Cambiar mes">
        <button :disabled="loading || isJanuary" @click="previousMonth" aria-label="Mes anterior">
          <i class="fa-solid fa-chevron-left" />
        </button>
        <strong>{{ monthLabel }}</strong>
        <button :disabled="loading || isCurrentMonth" @click="nextMonth" aria-label="Mes siguiente">
          <i class="fa-solid fa-chevron-right" />
        </button>
      </nav>
    </header>

    <div v-if="loading" class="florinda-sales__loading">Actualizando resumen...</div>
    <div v-else-if="errorMessage" class="florinda-sales__error">
      <i class="fa-solid fa-circle-exclamation" /> {{ errorMessage }}
      <button @click="loadMonth">Reintentar</button>
    </div>

    <template v-else-if="data">
      <div class="florinda-sales__kpis">
        <article>
          <span>Venta total</span>
          <strong>${{ money(data.totalSales) }}</strong>
          <small>Incluye IVA</small>
        </article>
        <article>
          <span>Venta neta</span>
          <strong>${{ money(data.netSales) }}</strong>
          <small>Antes de IVA</small>
        </article>
        <article>
          <span>Facturas</span>
          <strong>{{ data.invoiceCount.toLocaleString('es-EC') }}</strong>
          <small>{{ data.lineItemCount.toLocaleString('es-EC') }} productos facturados</small>
        </article>
        <article>
          <span>Ticket promedio</span>
          <strong>${{ money(averageTicket) }}</strong>
          <small>IVA ${{ money(data.tax) }} · descuentos ${{ money(data.discount) }}</small>
        </article>
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
                <tr v-for="day in reversedDays" :key="day.date">
                  <td>{{ longDate(day.date) }}</td>
                  <td>{{ day.invoiceCount }}</td>
                  <td>${{ money(day.netSales) }}</td>
                  <td>${{ money(day.tax) }}</td>
                  <td><strong>${{ money(day.totalSales) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside class="florinda-sales__breakdowns">
          <div>
            <h3>Canales del mes</h3>
            <p v-for="item in channelTotals" :key="item.name">
              <span>{{ item.name }} <small>{{ item.invoiceCount }} fact.</small></span>
              <strong>${{ money(item.totalSales) }}</strong>
            </p>
          </div>
          <div>
            <h3>Vendedores del mes</h3>
            <p v-for="item in sellerTotals" :key="item.name">
              <span>{{ item.name }} <small>{{ item.invoiceCount }} fact.</small></span>
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
const now = new Date()
const currentYear = now.getFullYear()
const selectedYear = ref(currentYear)
const selectedMonth = ref(now.getMonth() + 1)
const loading = ref(false)
const errorMessage = ref('')
const data = ref<IFlorindaSalesMonth | null>(null)

const monthLabel = computed(() => new Date(selectedYear.value, selectedMonth.value - 1).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }))
const isCurrentMonth = computed(() => selectedYear.value === currentYear && selectedMonth.value === now.getMonth() + 1)
const isJanuary = computed(() => selectedYear.value === currentYear && selectedMonth.value === 1)
const averageTicket = computed(() => data.value?.invoiceCount ? data.value.totalSales / data.value.invoiceCount : 0)
const daysWithSales = computed(() => (data.value?.days || []).filter(day => day.totalSales > 0))
const reversedDays = computed(() => [...daysWithSales.value].reverse())
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

function previousMonth() {
  if (isJanuary.value) return
  if (selectedMonth.value === 1) { selectedMonth.value = 12; selectedYear.value-- }
  else selectedMonth.value--
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (selectedMonth.value === 12) { selectedMonth.value = 1; selectedYear.value++ }
  else selectedMonth.value++
}

async function loadMonth() {
  loading.value = true
  errorMessage.value = ''
  try {
    data.value = await florindaSalesService.getMonth(props.workspaceId, selectedYear.value, selectedMonth.value)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || 'No se pudieron cargar las ventas.'
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
  border-radius: 20px;
  border: 1px solid #e7e2eb;
  background: #fbfafc;
  color: $primary-dark;
}

.florinda-sales__header { display: flex; justify-content: space-between; gap: 20px; align-items: center; margin-bottom: 20px; }
.florinda-sales__header h2 { margin: 5px 0; font-size: 24px; }
.florinda-sales__header p { margin: 0; color: #6b6572; }
.florinda-sales__eyebrow { color: $BAKANO-GREEN; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
.florinda-sales__nav { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid #e7e2eb; border-radius: 12px; padding: 6px; }
.florinda-sales__nav strong { min-width: 140px; text-align: center; text-transform: capitalize; }
.florinda-sales__nav button { width: 34px; height: 34px; border: 0; border-radius: 8px; background: #f1edf4; cursor: pointer; color: $secondary; }
.florinda-sales__nav button:disabled { opacity: .35; cursor: default; }

.florinda-sales__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.florinda-sales__kpis article { background: white; border: 1px solid #ebe7ee; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; }
.florinda-sales__kpis span { font-size: 12px; color: #77717e; font-weight: 700; text-transform: uppercase; }
.florinda-sales__kpis strong { font-size: 24px; margin: 7px 0 4px; }
.florinda-sales__kpis small { color: #8c8592; }

.florinda-sales__chart { height: 230px; display: flex; gap: 6px; align-items: stretch; margin: 22px 0; padding: 20px 16px 10px; background: white; border: 1px solid #ebe7ee; border-radius: 14px; overflow-x: auto; }
.florinda-sales__bar-column { min-width: 27px; flex: 1; display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #77717e; }
.florinda-sales__bar-column > span { height: 20px; white-space: nowrap; }
.florinda-sales__bar-track { width: 100%; flex: 1; display: flex; align-items: flex-end; justify-content: center; }
.florinda-sales__bar-track div { width: 72%; max-width: 24px; border-radius: 6px 6px 2px 2px; background: linear-gradient(180deg, $secondary, $primary); }
.florinda-sales__bar-column small { margin-top: 6px; }

.florinda-sales__content { display: grid; grid-template-columns: minmax(0, 2fr) minmax(250px, 1fr); gap: 16px; }
.florinda-sales__daily, .florinda-sales__breakdowns > div { background: white; border: 1px solid #ebe7ee; border-radius: 14px; padding: 18px; }
.florinda-sales h3 { margin: 0 0 14px; font-size: 15px; }
.florinda-sales__table-wrap { overflow-x: auto; max-height: 430px; }
.florinda-sales table { width: 100%; border-collapse: collapse; font-size: 13px; }
.florinda-sales th, .florinda-sales td { padding: 11px 8px; text-align: right; border-bottom: 1px solid #f0edf2; white-space: nowrap; }
.florinda-sales th:first-child, .florinda-sales td:first-child { text-align: left; }
.florinda-sales__breakdowns { display: flex; flex-direction: column; gap: 16px; }
.florinda-sales__breakdowns p { display: flex; justify-content: space-between; gap: 8px; margin: 0; padding: 9px 0; border-bottom: 1px solid #f0edf2; font-size: 13px; }
.florinda-sales__breakdowns p:last-child { border: 0; }
.florinda-sales__breakdowns p span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.florinda-sales__breakdowns small { color: #918a97; display: block; }
.florinda-sales__loading, .florinda-sales__error, .florinda-sales__empty { padding: 50px 20px; text-align: center; color: #716979; }
.florinda-sales__error button { margin-left: 10px; border: 0; color: $secondary; background: transparent; font-weight: 700; cursor: pointer; }
.florinda-sales__empty i { font-size: 30px; color: $secondary; }
.florinda-sales__empty h3 { margin: 12px 0 5px; }
.florinda-sales__sync-time { margin: 14px 0 0; color: #918a97; font-size: 11px; text-align: right; }

@media (max-width: 900px) {
  .florinda-sales__kpis { grid-template-columns: repeat(2, 1fr); }
  .florinda-sales__content { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .florinda-sales { padding: 16px; }
  .florinda-sales__header { align-items: stretch; flex-direction: column; }
  .florinda-sales__nav { justify-content: space-between; }
  .florinda-sales__kpis { grid-template-columns: 1fr; }
  .florinda-sales__chart { padding-left: 10px; padding-right: 10px; }
}
</style>
