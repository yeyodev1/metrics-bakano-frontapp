<template>
  <div class="billing-view">

    <!-- Header (hidden for Boloncity — SalesDashboardSection has its own header + month nav) -->
    <div v-if="!isBoloncity" class="billing-header">
      <div class="header-left">
        <div class="header-icon-wrap">
          <i class="fa-solid fa-chart-column" />
        </div>
        <div>
          <h1>{{ isBoloncity ? 'Ventas Online' : 'Facturación & ROAS' }}</h1>
          <p class="header-sub">{{ workspaceName || 'Cargando...' }}</p>
        </div>
      </div>
      <div class="month-nav">
        <button class="nav-btn" @click="prevMonth" :disabled="loading">
          <i class="fa-solid fa-chevron-left" />
        </button>
        <span class="month-label">{{ monthLabel }}</span>
        <button class="nav-btn" @click="nextMonth" :disabled="loading || isCurrentMonth">
          <i class="fa-solid fa-chevron-right" />
        </button>
      </div>
    </div>

    <!-- Manual billing UI (hidden for Boloncity — data comes from Tumesero automatically) -->
    <template v-if="!isBoloncity">

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-icon--green">
          <i class="fa-solid fa-dollar-sign" />
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Total Facturado</p>
          <p class="kpi-value">${{ formatAmount(monthTotals.totalAmount) }}</p>
        </div>
      </div>
      <div v-if="monthTotals.totalOnlineRevenue > 0" class="kpi-card">
        <div class="kpi-icon-wrap kpi-icon--indigo">
          <i class="fa-solid fa-globe" />
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Ventas Online</p>
          <p class="kpi-value">${{ formatAmount(monthTotals.totalOnlineRevenue) }}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-icon--blue">
          <i class="fa-brands fa-meta" />
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Inversión Meta</p>
          <p class="kpi-value">${{ formatAmount(monthTotals.totalMetaSpend) }}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon-wrap" :class="roasIconClass(monthTotals.avgROAS)">
          <i class="fa-solid fa-arrow-trend-up" />
        </div>
        <div class="kpi-content">
          <p class="kpi-label">ROAS Promedio</p>
          <p class="kpi-value" :class="roasTextClass(monthTotals.avgROAS)">
            {{ monthTotals.avgROAS ? monthTotals.avgROAS.toFixed(2) + 'x' : '—' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-row">
      <button
        class="filter-btn"
        :class="{ 'filter-btn--active': filterOnlyWithData }"
        @click="filterOnlyWithData = !filterOnlyWithData"
      >
        <i class="fa-solid fa-calendar-check" />
        Solo días con datos
      </button>
      <button
        v-if="canEnterBilling"
        class="filter-btn"
        :class="{ 'filter-btn--active': filterMyEntries }"
        @click="filterMyEntries = !filterMyEntries"
      >
        <i class="fa-solid fa-user" />
        Solo mis registros
      </button>
      <span v-if="filterOnlyWithData || filterMyEntries" class="filter-clear" @click="filterOnlyWithData = false; filterMyEntries = false">
        <i class="fa-solid fa-xmark" /> Limpiar filtros
      </span>
    </div>

    <!-- Chart -->
    <div v-if="chartData && hasAnyData" class="chart-card">
      <div class="chart-card-header">
        <i class="fa-solid fa-chart-bar chart-header-icon" />
        <h3>Facturación vs Inversión · {{ monthLabel }}</h3>
      </div>
      <div class="chart-wrap">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <div class="loading-spinner" />
      <p>Cargando datos...</p>
    </div>

    <!-- Pending banner -->
    <Transition name="slide-down">
      <div v-if="!loading && pendingDays.length > 0" class="pending-banner">
        <div class="pending-banner__icon">
          <i class="fa-solid fa-triangle-exclamation" />
        </div>
        <div class="pending-banner__text">
          <strong>{{ pendingDays.length }} {{ pendingDays.length === 1 ? 'día sin registrar' : 'días sin registrar' }}</strong>
          <span>este mes · completa tu historial de facturación</span>
        </div>
        <div class="pending-banner__dates">
          <span v-for="d in pendingDays.slice(0, 5)" :key="d.date" class="pending-date-chip">
            {{ dayNumber(d.date) }} {{ dayName(d.date) }}
          </span>
          <span v-if="pendingDays.length > 5" class="pending-date-more">+{{ pendingDays.length - 5 }} más</span>
        </div>
      </div>
    </Transition>

    <!-- Days list (all days of month, shown when not loading) -->
    <div v-if="!loading" class="days-list">
      <div
        v-for="day in daysToShow"
        :key="day.date"
        class="day-card"
        :class="{
          'day-today': isToday(day.date),
          'day-has-data': day.entryCount > 0,
          'day-pending': canRegisterOnDay(day),
          'day-empty': day.entryCount === 0 && !canRegisterOnDay(day),
        }"
      >
        <!-- Day strip: date + summary amounts + ROAS -->
        <div class="day-strip">
          <div class="day-strip__date">
            <span class="day-number">{{ dayNumber(day.date) }}</span>
            <span class="day-name">{{ dayName(day.date) }}</span>
            <span v-if="isToday(day.date)" class="today-badge">Hoy</span>
          </div>

          <div v-if="day.entryCount > 0" class="day-strip__amounts">
            <span class="amount-billed">
              <i class="fa-solid fa-dollar-sign" />
              ${{ formatAmount(day.totalAmount) }}
            </span>
            <span v-if="day.totalMetaSpend > 0" class="amount-meta">
              <i class="fa-brands fa-meta" />
              ${{ formatAmount(day.totalMetaSpend) }}
            </span>
          </div>

          <div class="day-strip__roas" :class="roasPillClass(day.avgROAS)">
            {{ day.avgROAS > 0 ? day.avgROAS.toFixed(2) + 'x' : '—' }}
          </div>
        </div>

        <!-- Entries -->
        <div v-if="day.entries?.length" class="entry-list">
          <div
            v-for="entry in day.entries"
            :key="entry._id"
            class="entry-row"
            :class="{ 'entry-row--mine': isMyEntry(entry) }"
          >
            <div class="entry-avatar">{{ entry.userName.charAt(0).toUpperCase() }}</div>
            <span class="entry-name">{{ shortName(entry.userName) }}</span>
            <span v-if="isMyEntry(entry)" class="entry-mine-tag">yo</span>
            <span class="entry-amount">${{ formatAmount(entry.amount) }}</span>
            <button
              v-if="canEditEntry(entry, day.date)"
              class="entry-edit-btn"
              @click.stop="openEditModal(entry, dateStr(day.date), day.totalAmount)"
            >
              <i class="fa-solid fa-pen-to-square" /> Editar
            </button>
          </div>
        </div>

        <!-- Pending CTA (no entry yet and user can register) -->
        <div v-if="canRegisterOnDay(day)" class="day-pending-cta" :class="{ 'day-pending-cta--today': isToday(day.date) }">
          <div class="day-pending-cta__left">
            <i class="fa-solid fa-circle-exclamation" />
            <span>{{ isToday(day.date) ? 'Aún no registraste hoy' : 'Facturación pendiente' }}</span>
          </div>
          <button class="btn-register-pending" @click="openModal(dateStr(day.date), day.totalAmount)">
            <i class="fa-solid fa-plus" />
            {{ isToday(day.date) ? 'Registrar ahora' : 'Completar' }}
          </button>
        </div>

        <div v-else-if="day.entryCount === 0" class="no-data-row">
          <i class="fa-solid fa-lock" /> Sin acceso / Sin datos
        </div>
      </div>
    </div>

    </template><!-- end v-if="!isBoloncity" -->

    <!-- WhatsApp Sales Section (Boloncity only) -->
    <SalesDashboardSection
      v-if="workspaceId === '69bdadc67386136fc3682734'"
      :workspace-id="workspaceId"
    />

    <!-- Sticky CTA + modal (manual billing only) -->
    <template v-if="!isBoloncity">
    <div v-if="isCurrentMonth && canEnterBilling && !todayHasMyEntry && !loading" class="today-cta">
      <button class="btn-today-register" @click="openModal(todayStr, todayDaySummary?.totalAmount ?? 0)">
        <i class="fa-solid fa-plus" />
        Registrar facturación de hoy
      </button>
    </div>

    <!-- Modal -->
    <BillingEntryModal
      v-model="showModal"
      :workspace-name="workspaceName"
      :current-day-total="modalDayTotal"
      :date="modalDate"
      :loading="submitting"
      :edit-mode="modalEditMode"
      :entry-id="modalEntryId"
      :existing-amount="modalExistingAmount"
      :existing-notes="modalExistingNotes"
      :calendar-entry-map="calendarEntryMap"
      @confirmed="handleEntry"
    />
    </template><!-- end v-if="!isBoloncity" (sticky CTA + modal) -->

    <!-- Success toast -->
    <Transition name="toast-fade">
      <div v-if="successMsg" class="success-toast">
        <i class="fa-solid fa-circle-check" />
        {{ successMsg }}
      </div>
    </Transition>

    <!-- Error toast -->
    <Transition name="toast-fade">
      <div v-if="errorMsg" class="error-toast">
        <i class="fa-solid fa-circle-exclamation" />
        {{ errorMsg }}
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { useUserStore } from '@/stores/user'
import { billingService, type IMonthData, type IDaySummary } from '@/services/billing.service'
import BillingEntryModal from '@/components/billing/BillingEntryModal.vue'
import SalesDashboardSection from '@/components/billing/SalesDashboardSection.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const route = useRoute()
const userStore = useUserStore()

const workspaceId = computed(() => route.params.workspaceId as string)
const workspaceName = ref('')

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)

const loading = ref(false)
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const monthData = ref<IMonthData | null>(null)
const todayDaySummary = ref<IDaySummary | null>(null)
const myEntryToday = ref<{ _id: string; amount: number } | null>(null)

// Filters
const filterOnlyWithData = ref(false)
const filterMyEntries = ref(false)

const showModal = ref(false)
const modalDate = ref('')
const modalDayTotal = ref(0)
const modalEditMode = ref(false)
const modalEntryId = ref<string | undefined>()
const modalExistingAmount = ref<number | undefined>()
const modalExistingNotes = ref<string | undefined>()

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const isCurrentMonth = computed(() => {
  const n = new Date()
  return currentYear.value === n.getFullYear() && currentMonth.value === n.getMonth() + 1
})

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value - 1, 1)
  return d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
})

const hasAnyData = computed(() => (monthData.value?.days?.length ?? 0) > 0)

// Calendar data: which dates have entries and from whom
const calendarEntryMap = computed(() => {
  const map: Record<string, { hasMyEntry: boolean; total: number; entryCount: number }> = {}
  for (const day of (monthData.value?.days ?? [])) {
    const key = dateStr(day.date)
    const hasMyEntry = day.entries?.some((e: any) => isMyEntry(e)) ?? false
    map[key] = { hasMyEntry, total: day.totalAmount, entryCount: day.entryCount }
  }
  return map
})

// Days the current user still needs to fill
const pendingDays = computed(() => {
  if (!canEnterBilling.value) return []
  return daysToShow.value.filter(d => canRegisterOnDay(d))
})

// Backend only returns days array — compute month totals client-side
const monthTotals = computed(() => {
  const days = monthData.value?.days ?? []
  const totalAmount = days.reduce((sum, d) => sum + d.totalAmount, 0)
  const totalOnlineRevenue = days.reduce((sum, d) => sum + (d.totalOnlineRevenue ?? 0), 0)
  const totalMetaSpend = days.reduce((sum, d) => sum + d.totalMetaSpend, 0)
  const avgROAS = totalMetaSpend > 0 ? totalAmount / totalMetaSpend : 0
  return { totalAmount, totalOnlineRevenue, totalMetaSpend, avgROAS }
})
// Any non-internal user with workspace access can enter billing.
// Internal team members can view but not enter (superadmin is the only exception).
const isBoloncity = computed(() => workspaceId.value === '69bdadc67386136fc3682734')
const canEnterBilling = computed(() =>
  userStore.role === 'superadmin' || !userStore.isInternal
)
const todayHasMyEntry = computed(() => !!myEntryToday.value)

const daysToShow = computed(() => {
  if (!monthData.value) return []
  const existingMap = new Map<string, any>()
  for (const d of (monthData.value.days ?? [])) {
    existingMap.set(dateStr(d.date), d)
  }

  // Build all days: current month → up to today; past months → full month
  const year = currentYear.value
  const month = currentMonth.value
  const daysInMonth = new Date(year, month, 0).getDate()
  const lastDay = isCurrentMonth.value ? new Date().getDate() : daysInMonth

  const all = []
  for (let d = 1; d <= lastDay; d++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    all.push(existingMap.get(key) ?? { date: key, totalAmount: 0, totalMetaSpend: 0, avgROAS: 0, entries: [], entryCount: 0 })
  }

  return all
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(d => {
      if (filterOnlyWithData.value && d.entryCount === 0) return false
      if (filterMyEntries.value && !d.entries?.some((e: any) => isMyEntry(e))) return false
      return true
    })
})

const chartData = computed(() => {
  if (!monthData.value?.days?.length) return null
  const sorted = [...monthData.value.days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  return {
    labels: sorted.map(d => `${dayName(d.date)} ${dayNumber(d.date)}`),
    datasets: [
      {
        label: 'Facturación',
        data: sorted.map(d => d.totalAmount),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#059669',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Inversión Meta',
        data: sorted.map(d => d.totalMetaSpend),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.06)',
        borderWidth: 2.5,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
      ...(sorted.some(d => (d.totalOnlineRevenue ?? 0) > 0) ? [{
        label: 'Ventas Online',
        data: sorted.map(d => d.totalOnlineRevenue ?? 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.06)',
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: false,
        borderDash: [4, 3],
      }] : []),
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { usePointStyle: true, pointStyle: 'circle', padding: 24, font: { weight: '600' } },
    },
    title: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#94a3b8',
      bodyColor: '#fff',
      padding: 12,
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, weight: '600' as const }, color: '#94a3b8' },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
      ticks: {
        callback: (val: any) => `$${Number(val).toLocaleString('es-EC')}`,
        font: { size: 11 },
        color: '#94a3b8',
      },
      border: { display: false },
    },
  },
}

async function fetchMonth() {
  if (!workspaceId.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    monthData.value = await billingService.getMonthData(workspaceId.value, currentYear.value, currentMonth.value)
  } catch (e: any) {
    errorMsg.value = e?.message || 'Error al cargar los datos'
    setTimeout(() => (errorMsg.value = ''), 4000)
  } finally {
    loading.value = false
  }
}

async function fetchTodayStatus() {
  if (!workspaceId.value) return
  try {
    const [summaryRes, myEntryRes] = await Promise.all([
      billingService.getDaySummary(workspaceId.value, todayStr.value),
      billingService.getMyEntryToday(workspaceId.value),
    ])
    todayDaySummary.value = summaryRes
    myEntryToday.value = myEntryRes.entry ? { _id: myEntryRes.entry._id, amount: myEntryRes.entry.amount } : null
  } catch { /* silent */ }
}

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else { currentMonth.value-- }
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else { currentMonth.value++ }
}

function openModal(date: string, currentTotal: number) {
  modalDate.value = date
  modalDayTotal.value = currentTotal
  modalEditMode.value = false
  modalEntryId.value = undefined
  modalExistingAmount.value = undefined
  modalExistingNotes.value = undefined
  showModal.value = true
}

function openEditModal(entry: { _id: string; amount: number; notes?: string }, date: string, dayTotal: number) {
  modalDate.value = date
  modalDayTotal.value = dayTotal - entry.amount // total excluding this entry
  modalEditMode.value = true
  modalEntryId.value = entry._id
  modalExistingAmount.value = entry.amount
  modalExistingNotes.value = entry.notes
  showModal.value = true
}

function isMyEntry(entry: any): boolean {
  return (!!userStore.id && entry.userId === userStore.id) ||
         (!!userStore.email && entry.userEmail === userStore.email)
}

function shortName(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return name
  return `${parts[0]} ${parts[1].charAt(0)}.`
}

// Can register a NEW entry on any past/today day if user hasn't entered yet
function canRegisterOnDay(day: { date: string; entries?: any[] }): boolean {
  if (!canEnterBilling.value) return false
  // No future dates
  const dayTime = new Date(dateStr(day.date) + 'T12:00:00').getTime()
  const todayTime = new Date(todayStr.value + 'T12:00:00').getTime()
  if (dayTime > todayTime) return false
  // Already has my entry?
  if (day.entries?.some((e: any) => isMyEntry(e))) return false
  return true
}

// Can edit OWN entry within 7 days
function canEditEntry(entry: { userId?: string; userEmail?: string }, entryDate: string): boolean {
  if (!canEnterBilling.value) return false
  if (userStore.role === 'superadmin') return true
  // Match by userId OR email as fallback (ObjectId string comparison can fail)
  const isOwner =
    (userStore.id && entry.userId && entry.userId === userStore.id) ||
    (userStore.email && entry.userEmail && entry.userEmail === userStore.email)
  if (!isOwner) return false
  const entryTime = new Date(dateStr(entryDate) + 'T12:00:00').getTime()
  const todayTime = new Date(todayStr.value + 'T12:00:00').getTime()
  const diffDays = Math.round((todayTime - entryTime) / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

async function handleEntry(payload: { amount: number; notes?: string; onlineRevenue?: number; entryId?: string; date?: string }) {
  submitting.value = true
  try {
    if (payload.entryId) {
      await billingService.updateEntry(workspaceId.value, payload.entryId, { amount: payload.amount, notes: payload.notes, onlineRevenue: payload.onlineRevenue })
      successMsg.value = '✓ Facturación actualizada correctamente'
    } else {
      const entryDate = payload.date || modalDate.value
      await billingService.createEntry(workspaceId.value, { amount: payload.amount, notes: payload.notes, date: entryDate, onlineRevenue: payload.onlineRevenue })
      successMsg.value = isToday(entryDate) ? '✓ Facturación de hoy registrada' : `✓ Facturación del ${entryDate} registrada`
    }
    showModal.value = false
    setTimeout(() => (successMsg.value = ''), 4000)
    await Promise.all([fetchMonth(), fetchTodayStatus()])
  } catch (e: any) {
    errorMsg.value = e?.message || 'Error al guardar la facturación'
    setTimeout(() => (errorMsg.value = ''), 5000)
  } finally {
    submitting.value = false
  }
}

// Normalize any date string (ISO full or YYYY-MM-DD) to just YYYY-MM-DD
function dateStr(date: string): string { return date.substring(0, 10) }
function isToday(date: string) { return dateStr(date) === todayStr.value }
function dayNumber(date: string) { return new Date(dateStr(date) + 'T12:00:00').getDate().toString() }
function dayName(date: string) { return new Date(dateStr(date) + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short' }) }
function formatAmount(val: number) { return val.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function roasTextClass(roas: number) {
  if (!roas) return 'roas-none'
  if (roas >= 3) return 'roas-good'
  if (roas >= 1) return 'roas-medium'
  return 'roas-bad'
}
function roasIconClass(roas: number) {
  if (!roas) return 'kpi-icon--gray'
  if (roas >= 3) return 'kpi-icon--green'
  if (roas >= 1) return 'kpi-icon--yellow'
  return 'kpi-icon--red'
}
function roasPillClass(roas: number) {
  if (!roas) return 'pill-none'
  if (roas >= 3) return 'pill-good'
  if (roas >= 1) return 'pill-medium'
  return 'pill-bad'
}

watch([currentYear, currentMonth], fetchMonth)

onMounted(async () => {
  workspaceName.value = localStorage.getItem('user_workspaceName') || ''
  await Promise.all([fetchMonth(), fetchTodayStatus()])
})
</script>

<style scoped lang="scss">
.billing-view {
  padding: 16px 16px 80px;
  max-width: 1100px;
  width: 100%;

  @media (min-width: 640px) {
    padding: 28px 32px 80px;
  }
}

// ── Header ───────────────────────────────────────────────
.billing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;

  h1 {
    margin: 0 0 3px;
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
  }

  .header-sub {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
}

.header-icon-wrap {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 10px;

  .month-label {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    text-transform: capitalize;
    min-width: 130px;
    text-align: center;
  }

  .nav-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 11px;
    transition: all 0.15s;

    &:hover:not(:disabled) {
      border-color: #0f1117;
      color: #0f1117;
      background: #fff;
    }

    &:disabled { opacity: 0.35; cursor: not-allowed; }
  }
}

// ── KPI Cards ────────────────────────────────────────────
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;           // mobile: 1 col
  gap: 10px;
  margin-bottom: 20px;

  @media (min-width: 480px) {
    grid-template-columns: repeat(3, 1fr); // tablet+: 3 cols
  }
}

.kpi-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: box-shadow 0.2s;
  min-width: 0;

  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
}

.kpi-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;

  &.kpi-icon--green  { background: #d1fae5; color: #059669; }
  &.kpi-icon--blue   { background: #dbeafe; color: #3b82f6; }
  &.kpi-icon--indigo { background: #e0e7ff; color: #6366f1; }
  &.kpi-icon--yellow { background: #fef3c7; color: #d97706; }
  &.kpi-icon--red    { background: #fee2e2; color: #dc2626; }
  &.kpi-icon--gray   { background: #f1f5f9; color: #94a3b8; }
}

.kpi-content {
  min-width: 0;
  flex: 1;

  .kpi-label {
    margin: 0 0 2px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .kpi-value {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.roas-good   { color: #059669; }
    &.roas-medium { color: #d97706; }
    &.roas-bad    { color: #dc2626; }
    &.roas-none   { color: #94a3b8; }
  }
}

// ── Filters ──────────────────────────────────────────────
.filters-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;

  i { font-size: 11px; }

  &:hover {
    border-color: #94a3b8;
    color: #374151;
  }

  &--active {
    background: #0f1117;
    border-color: #0f1117;
    color: #fff;
  }
}

.filter-clear {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.15s;

  i { font-size: 10px; }

  &:hover { color: #dc2626; }
}

// ── Chart ────────────────────────────────────────────────
.chart-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 20px;
}

.chart-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  .chart-header-icon {
    color: #64748b;
    font-size: 14px;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #374151;
    text-transform: capitalize;
  }
}

.chart-wrap { height: 280px; }

// ── States ───────────────────────────────────────────────
.state-box {
  text-align: center;
  padding: 56px 24px;
  color: #64748b;

  .loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #0f1117;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin: 0 auto 16px;
  }

  p { margin: 4px 0; font-size: 14px; }

  &.empty {
    .empty-icon-wrap {
      width: 64px;
      height: 64px;
      background: #f1f5f9;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 26px;
      color: #94a3b8;
    }

    h3 {
      margin: 0 0 8px;
      color: #374151;
      font-size: 17px;
      font-weight: 700;
    }

    .empty-hint {
      color: #059669;
      font-weight: 600;
      margin-top: 10px;
      font-size: 13px;

      i { margin-right: 4px; }
    }
  }
}

// ── Pending banner ────────────────────────────────────────
.pending-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  &__icon {
    width: 38px;
    height: 38px;
    background: #fef3c7;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d97706;
    font-size: 16px;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 120px;

    strong {
      font-size: 14px;
      font-weight: 800;
      color: #92400e;
    }

    span {
      font-size: 12px;
      color: #b45309;
    }
  }

  &__dates {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
}

.pending-date-chip {
  background: #fef3c7;
  color: #92400e;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  border: 1px solid #fde68a;
  white-space: nowrap;
}

.pending-date-more {
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
}

// ── Days List ────────────────────────────────────────────
.days-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
}

.day-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.15s;

  &.day-today {
    border-color: #0f1117;
    box-shadow: 0 0 0 3px rgba(15, 17, 23, 0.06);
  }

  &.day-pending {
    border-color: #fde68a;
    background: #fffdf5;

    &.day-today {
      border-color: #f59e0b;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
    }
  }

  &.day-empty {
    background: #fafafa;
    border-color: #f1f5f9;
  }
}

// ── Day strip ─────────────────────────────────────────────
.day-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;

  &__date {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 90px;
    flex-shrink: 0;
  }

  &__amounts {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
  }

  &__roas {
    font-size: 12px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 20px;
    white-space: nowrap;
    flex-shrink: 0;

    &.pill-good   { background: #d1fae5; color: #065f46; }
    &.pill-medium { background: #fef3c7; color: #92400e; }
    &.pill-bad    { background: #fee2e2; color: #991b1b; }
    &.pill-none   { background: #f1f5f9; color: #94a3b8; }
  }
}

.day-number {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.day-name {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.today-badge {
  background: #0f1117;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 2px;
}

.amount-billed {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 800;
  color: #059669;

  i { font-size: 11px; }
}

.amount-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;

  i { font-size: 11px; }
}

// ── Entry rows ────────────────────────────────────────────
.entry-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid #f1f5f9;
}

.entry-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.1s;

  &:last-child { border-bottom: none; }

  &:hover { background: #f8fafc; }

  &--mine {
    background: #f0f7ff;
    &:hover { background: #e8f2ff; }
  }
}

.entry-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #0f1117;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.entry-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.entry-mine-tag {
  font-size: 10px;
  font-weight: 700;
  color: #3b82f6;
  background: #dbeafe;
  padding: 1px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.entry-amount {
  font-size: 14px;
  font-weight: 800;
  color: #059669;
  white-space: nowrap;
  flex-shrink: 0;
}

.entry-edit-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  color: #3b82f6;
  border: 1.5px solid #bfdbfe;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;

  i { font-size: 10px; }

  &:hover {
    background: #3b82f6;
    color: #fff;
    border-color: #3b82f6;
  }
}

// ── Day pending CTA ───────────────────────────────────────
.day-pending-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 16px;
  background: #fef9ec;
  border-top: 1px solid #fde68a;

  &__left {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 600;
    color: #92400e;

    i { color: #f59e0b; font-size: 13px; }
  }

  &--today {
    background: #fffbeb;
    border-top-color: #f59e0b;

    .day-pending-cta__left {
      color: #78350f;
      font-weight: 700;
    }
  }
}

.btn-register-pending {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
  flex-shrink: 0;

  i { font-size: 10px; }

  &:hover {
    background: #d97706;
    transform: translateY(-1px);
  }
}

.no-data-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #d1d5db;
  padding: 8px 16px;
  border-top: 1px solid #f8fafc;

  i { font-size: 10px; }
}

// ── Sticky CTA ───────────────────────────────────────────
.today-cta {
  position: sticky;
  bottom: 20px;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.btn-today-register {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(15, 17, 23, 0.35);
  pointer-events: all;
  transition: opacity 0.2s, transform 0.2s;

  i { font-size: 12px; }

  &:hover { opacity: 0.88; transform: translateY(-1px); }
}

// ── Toast ────────────────────────────────────────────────
.success-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #059669;
  color: #fff;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(5, 150, 105, 0.35);
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #dc2626;
  color: #fff;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-fade-enter-active,
.toast-fade-leave-active { transition: all 0.3s ease; }
.toast-fade-enter-from,
.toast-fade-leave-to { opacity: 0; transform: translateY(8px); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
