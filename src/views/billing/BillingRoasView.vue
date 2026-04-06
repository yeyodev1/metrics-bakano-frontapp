<template>
  <div class="billing-view">

    <!-- Header -->
    <div class="billing-header">
      <div class="header-left">
        <div class="header-icon-wrap">
          <i class="fa-solid fa-chart-column" />
        </div>
        <div>
          <h1>Facturación & ROAS</h1>
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

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-icon--green">
          <i class="fa-solid fa-dollar-sign" />
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Total Facturado</p>
          <p class="kpi-value">${{ formatAmount(monthData?.totalAmount ?? 0) }}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-icon--blue">
          <i class="fa-brands fa-meta" />
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Inversión Meta</p>
          <p class="kpi-value">${{ formatAmount(monthData?.totalMetaSpend ?? 0) }}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon-wrap" :class="roasIconClass(monthData?.avgROAS ?? 0)">
          <i class="fa-solid fa-arrow-trend-up" />
        </div>
        <div class="kpi-content">
          <p class="kpi-label">ROAS Promedio</p>
          <p class="kpi-value" :class="roasTextClass(monthData?.avgROAS ?? 0)">
            {{ monthData?.avgROAS ? monthData.avgROAS.toFixed(2) + 'x' : '—' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div v-if="chartData && hasAnyData" class="chart-card">
      <div class="chart-card-header">
        <i class="fa-solid fa-chart-bar chart-header-icon" />
        <h3>Facturación vs Inversión · {{ monthLabel }}</h3>
      </div>
      <div class="chart-wrap">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <div class="loading-spinner" />
      <p>Cargando datos...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!hasAnyData" class="state-box empty">
      <div class="empty-icon-wrap">
        <i class="fa-solid fa-chart-column" />
      </div>
      <h3>Sin datos este mes</h3>
      <p>Aún no hay facturación registrada para <strong>{{ monthLabel }}</strong>.</p>
      <p v-if="isCurrentMonth && canEnterBilling" class="empty-hint">
        <i class="fa-solid fa-circle-info" /> Sé el primero en registrar la facturación de hoy.
      </p>
    </div>

    <!-- Days list -->
    <div v-else class="days-list">
      <div
        v-for="day in daysToShow"
        :key="day.date"
        class="day-card"
        :class="{ 'day-today': isToday(day.date) }"
      >
        <div class="day-header">
          <div class="day-date-wrap">
            <div class="day-date-block">
              <span class="day-number">{{ dayNumber(day.date) }}</span>
              <span class="day-name">{{ dayName(day.date) }}</span>
            </div>
            <span v-if="isToday(day.date)" class="today-badge">
              <i class="fa-solid fa-circle-dot" /> Hoy
            </span>
          </div>
          <div class="day-roas-pill" :class="roasPillClass(day.avgROAS)">
            <i class="fa-solid fa-arrow-trend-up" />
            {{ day.avgROAS > 0 ? 'ROAS ' + day.avgROAS.toFixed(2) + 'x' : 'Sin ROAS' }}
          </div>
        </div>

        <div v-if="day.entryCount > 0" class="day-metrics">
          <div class="metric">
            <span class="metric-label">
              <i class="fa-solid fa-dollar-sign" /> Facturado
            </span>
            <span class="metric-value green">${{ formatAmount(day.totalAmount) }}</span>
          </div>
          <div class="metric-divider" />
          <div class="metric">
            <span class="metric-label">
              <i class="fa-brands fa-meta" /> Inversión
            </span>
            <span class="metric-value blue">${{ formatAmount(day.totalMetaSpend) }}</span>
          </div>
          <div class="metric-divider" />
          <div class="metric">
            <span class="metric-label">
              <i class="fa-solid fa-users" /> Entradas
            </span>
            <span class="metric-value">{{ day.entryCount }}</span>
          </div>
        </div>

        <!-- Who entered -->
        <div v-if="day.entries?.length" class="entry-list">
          <div
            v-for="entry in day.entries"
            :key="entry._id"
            class="entry-row"
            :class="{ 'entry-row--mine': (entry.userId === userStore.id) || (entry.userEmail === userStore.email) }"
          >
            <div class="entry-row__left">
              <div class="entry-avatar">{{ entry.userName.charAt(0).toUpperCase() }}</div>
              <div class="entry-row__info">
                <span class="entry-user">{{ entry.userName }}</span>
                <span v-if="(entry.userId === userStore.id) || (entry.userEmail === userStore.email)" class="entry-mine-tag">Tu registro</span>
              </div>
            </div>
            <div class="entry-row__right">
              <span class="entry-amount">${{ formatAmount(entry.amount) }}</span>
              <button
                v-if="canEditEntry(entry, day.date)"
                class="entry-edit-btn"
                @click.stop="openEditModal(entry, dateStr(day.date), day.totalAmount)"
              >
                <i class="fa-solid fa-pen-to-square" />
                Editar
              </button>
            </div>
          </div>
        </div>

        <!-- Register button -->
        <div v-if="canRegisterOnDay(day.date)" class="day-action">
          <button class="btn-register" @click="openModal(day.date, day.totalAmount)">
            <i class="fa-solid fa-plus" /> Registrar facturación
          </button>
        </div>

        <div v-else-if="day.entryCount === 0" class="no-data-row">
          <i class="fa-solid fa-minus" /> Sin datos registrados
        </div>
      </div>
    </div>

    <!-- Sticky CTA for today -->
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
      @confirmed="handleEntry"
    />

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
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useUserStore } from '@/stores/user'
import { billingService, type IMonthData, type IDaySummary } from '@/services/billing.service'
import BillingEntryModal from '@/components/billing/BillingEntryModal.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

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
// Any non-internal user with workspace access can enter billing.
// Internal team members can view but not enter (superadmin is the only exception).
const canEnterBilling = computed(() =>
  userStore.role === 'superadmin' || !userStore.isInternal
)
const todayHasMyEntry = computed(() => !!myEntryToday.value)

const daysToShow = computed(() => {
  if (!monthData.value) return []
  const days = [...(monthData.value.days ?? [])]
  if (isCurrentMonth.value) {
    const todayInList = days.find(d => dateStr(d.date) === todayStr.value)
    if (!todayInList) {
      days.unshift({ date: todayStr.value, totalAmount: 0, totalMetaSpend: 0, avgROAS: 0, entries: [], entryCount: 0 })
    }
  }
  return days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const chartData = computed(() => {
  if (!monthData.value?.days?.length) return null
  const sorted = [...monthData.value.days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  return {
    labels: sorted.map(d => dayNumber(d.date)),
    datasets: [
      {
        label: 'Facturación',
        data: sorted.map(d => d.totalAmount),
        backgroundColor: 'rgba(5, 150, 105, 0.8)',
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: 'Inversión Meta',
        data: sorted.map(d => d.totalMetaSpend),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderRadius: 5,
        borderSkipped: false,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const, labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } },
    title: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` $${ctx.parsed.y.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: { callback: (val: any) => `$${Number(val).toLocaleString('es-EC')}` },
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

// Can register a NEW entry only on today (if not already entered)
function canRegisterOnDay(date: string): boolean {
  if (!canEnterBilling.value) return false
  if (userStore.role === 'superadmin') return true
  if (dateStr(date) !== todayStr.value) return false
  return !todayHasMyEntry.value
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

async function handleEntry(payload: { amount: number; notes?: string; entryId?: string }) {
  submitting.value = true
  try {
    if (payload.entryId) {
      await billingService.updateEntry(workspaceId.value, payload.entryId, { amount: payload.amount, notes: payload.notes })
      successMsg.value = '✓ Facturación actualizada correctamente'
    } else {
      await billingService.createEntry(workspaceId.value, { amount: payload.amount, notes: payload.notes })
      successMsg.value = '✓ Facturación registrada correctamente'
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
  padding: 28px 32px 80px;
  max-width: 1100px;
  width: 100%;
}

// ── Header ───────────────────────────────────────────────
.billing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 20px;

  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.kpi-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: box-shadow 0.2s;

  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
}

.kpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;

  &.kpi-icon--green { background: #d1fae5; color: #059669; }
  &.kpi-icon--blue  { background: #dbeafe; color: #3b82f6; }
  &.kpi-icon--yellow { background: #fef3c7; color: #d97706; }
  &.kpi-icon--red   { background: #fee2e2; color: #dc2626; }
  &.kpi-icon--gray  { background: #f1f5f9; color: #94a3b8; }
}

.kpi-content {
  .kpi-label {
    margin: 0 0 3px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
  }

  .kpi-value {
    margin: 0;
    font-size: 21px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;

    &.roas-good   { color: #059669; }
    &.roas-medium { color: #d97706; }
    &.roas-bad    { color: #dc2626; }
    &.roas-none   { color: #94a3b8; }
  }
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

.chart-wrap { height: 260px; }

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

// ── Days List ────────────────────────────────────────────
.days-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.day-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 20px;
  transition: box-shadow 0.2s;

  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }

  &.day-today {
    border-color: #0f1117;
    box-shadow: 0 0 0 3px rgba(15, 17, 23, 0.06);
  }
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.day-date-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.day-date-block {
  display: flex;
  align-items: baseline;
  gap: 6px;

  .day-number {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }

  .day-name {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.today-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #0f1117;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  i { font-size: 8px; }
}

.day-roas-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;

  i { font-size: 11px; }

  &.pill-good   { background: #d1fae5; color: #065f46; }
  &.pill-medium { background: #fef3c7; color: #92400e; }
  &.pill-bad    { background: #fee2e2; color: #991b1b; }
  &.pill-none   { background: #f1f5f9; color: #64748b; }
}

.day-metrics {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 12px;
  background: #f8fafc;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 14px;

  .metric-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 4px;

    i { font-size: 9px; }
  }

  .metric-value {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;

    &.green { color: #059669; }
    &.blue  { color: #3b82f6; }
  }
}

.metric-divider {
  width: 1px;
  height: 36px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.entry-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  transition: border-color 0.15s, box-shadow 0.15s;

  &--mine {
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
}

.entry-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #0f1117;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.entry-user {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-mine-tag {
  font-size: 10px;
  font-weight: 700;
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.entry-amount {
  font-size: 14px;
  font-weight: 800;
  color: #059669;
  white-space: nowrap;
}

.entry-edit-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #1e40af;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
  flex-shrink: 0;

  i { font-size: 11px; }

  &:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }
}

.day-action { margin-top: 4px; }

.btn-register {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;

  i { font-size: 11px; }

  &:hover {
    border-color: #0f1117;
    background: #fff;
    color: #0f1117;
  }
}

.no-data-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #cbd5e1;
  font-style: italic;

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
