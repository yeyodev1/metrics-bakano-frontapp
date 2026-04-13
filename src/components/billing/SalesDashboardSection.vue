<template>
  <div class="vto-root">

    <!-- ══ BANNER ══════════════════════════════════════════════════════════════ -->
    <div class="vto-banner">
      <div class="vto-banner__left">
        <div class="vto-banner__icon">
          <i class="fa-brands fa-whatsapp" />
        </div>
        <div>
          <h2 class="vto-banner__title">Ventas Online · Boloncity</h2>
          <p class="vto-banner__sub">
            <span class="vto-banner__sync-info">
              <i class="fa-regular fa-clock" />
              {{ lastSyncedAt ? `Actualizado ${formatSyncTime(lastSyncedAt)}` : 'Sin datos aún' }}
            </span>
          </p>
        </div>
      </div>
      <!-- Month navigation (right) -->
      <div class="vto-month-nav">
        <button class="vto-month-nav__btn" @click="prevMonth" :disabled="loading || rangeSyncing">
          <i class="fa-solid fa-chevron-left" />
        </button>
        <span class="vto-month-nav__label">{{ monthLabel }}</span>
        <button class="vto-month-nav__btn" @click="nextMonth" :disabled="loading || rangeSyncing || isCurrentMonth">
          <i class="fa-solid fa-chevron-right" />
        </button>
      </div>
    </div>

    <!-- ══ SYNC PANEL (admin only) ══════════════════════════════════════════════ -->
    <!-- ══ SYNC BAR (admin only) ════════════════════════════════════════════════ -->
    <div v-if="canSync" class="vto-syncbar">
      <!-- Compact trigger row -->
      <div class="vto-syncbar__row">
        <!-- Day picker toggle button -->
        <button
          class="vto-syncbar__trigger"
          :class="{ 'vto-syncbar__trigger--open': calendarOpen, 'vto-syncbar__trigger--past': backfillDate !== todayStr }"
          @click="calendarOpen = !calendarOpen"
        >
          <i class="fa-solid fa-calendar-days" />
          <span class="vto-syncbar__trigger-label">
            {{ backfillDate === todayStr ? 'Hoy · ' : 'Pasado · ' }}<strong>{{ backfillDateFormatted }}</strong>
          </span>
          <span v-if="selectedDayData" class="vto-syncbar__trigger-amount">${{ formatMoney(selectedDayData.totalRevenue) }}</span>
          <i class="fa-solid fa-chevron-down vto-syncbar__trigger-arrow" :class="{ 'vto-syncbar__trigger-arrow--up': calendarOpen }" />
        </button>

        <!-- Sync button (always visible) -->
        <button
          class="vto-sync-panel__btn vto-sync-panel__btn--primary"
          :disabled="syncing || rangeSyncing || noCallsLeft"
          @click="handleSync"
        >
          <i class="fa-solid" :class="syncing ? 'fa-spinner fa-spin' : 'fa-arrow-down-to-bracket'" />
          {{ syncing ? 'Trayendo...' : (selectedDayData ? 'Re-sincronizar' : (backfillDate === todayStr ? 'Traer hoy' : 'Traer ese día')) }}
        </button>

        <!-- Full month button -->
        <button
          class="vto-sync-panel__btn vto-sync-panel__btn--outline"
          :disabled="syncing || rangeSyncing || noCallsLeft"
          @click="handleRangeSync"
        >
          <i class="fa-solid" :class="rangeSyncing ? 'fa-spinner fa-spin' : 'fa-calendar-check'" />
          <span v-if="rangeSyncing && rangeProgress">{{ rangeProgress.done }}/{{ rangeProgress.total }}...</span>
          <span v-else>Todo {{ monthLabel }}</span>
        </button>

        <!-- Quota pill -->
        <span class="vto-syncbar__quota" :class="quotaBadgeClass">
          <i class="fa-solid fa-circle-nodes" />
          {{ apiUsage ? apiUsage.callsRemainingToday : '—' }}
        </span>
      </div>

      <!-- Calendar dropdown with transition -->
      <Transition name="vto-cal">
        <div v-if="calendarOpen" class="vto-syncbar__dropdown">
          <SalesDayCalendar
            v-model="backfillDate"
            :year="currentYear"
            :month="currentMonth"
            :days="monthData?.days ?? []"
            @update:model-value="calendarOpen = false"
          />
        </div>
      </Transition>
    </div>

    <!-- ══ SYNC TOAST ═══════════════════════════════════════════════════════════ -->
    <Transition name="vto-slide">
      <div v-if="syncMessage" class="vto-toast" :class="syncMessageType === 'error' ? 'vto-toast--err' : 'vto-toast--ok'">
        <i class="fa-solid" :class="syncMessageType === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'" />
        <span>{{ syncMessage }}</span>
      </div>
    </Transition>

    <!-- ══ SKELETON ══════════════════════════════════════════════════════════════ -->
    <div v-if="loading" class="vto-skeleton-wrap">
      <div class="vto-skeleton vto-skeleton--wide" />
      <div class="vto-skeleton-row">
        <div class="vto-skeleton vto-skeleton--card" v-for="n in 3" :key="n" />
      </div>
    </div>

    <!-- ══ ERROR STATE ══════════════════════════════════════════════════════════ -->
    <div v-else-if="!loading && loadError" class="vto-error">
      <div class="vto-error__icon"><i class="fa-solid fa-triangle-exclamation" /></div>
      <div class="vto-error__body">
        <p class="vto-error__title">No se pudo conectar al API</p>
        <p class="vto-error__msg">{{ loadError.message }}</p>
        <div class="vto-error__meta">
          <span v-if="loadError.status" class="vto-error__badge">HTTP {{ loadError.status }}</span>
          <span class="vto-error__endpoint">{{ loadError.endpoint }}</span>
        </div>
      </div>
      <button class="vto-error__retry" @click="loadData">
        <i class="fa-solid fa-rotate-right" /> Reintentar
      </button>
    </div>

    <!-- ══ EMPTY STATE ══════════════════════════════════════════════════════════ -->
    <div v-else-if="!loading && !loadError && !hasData" class="vto-empty">
      <div class="vto-empty__graphic">
        <i class="fa-brands fa-whatsapp" />
      </div>
      <h3 class="vto-empty__title">Sin ventas registradas para {{ monthLabel }}</h3>
      <p class="vto-empty__desc">
        Los datos se actualizan automáticamente cada noche a las 11PM.<br />
        También puedes traer las ventas de hoy en este momento:
      </p>
      <div v-if="canSync" class="vto-backfill">
        <!-- Single day sync -->
        <div class="vto-backfill__row">
          <div class="vto-backfill__date-wrap">
            <label class="vto-backfill__label"><i class="fa-solid fa-calendar-day" /> Un día</label>
            <input type="date" class="vto-backfill__input" v-model="backfillDate" :max="todayStr" />
          </div>
          <button class="vto-sync-main" :disabled="syncing || rangeSyncing || noCallsLeft" @click="handleSync">
            <i class="fa-solid" :class="syncing ? 'fa-spinner fa-spin' : 'fa-arrow-down-to-bracket'" />
            {{ syncing ? 'Trayendo...' : (backfillDate && backfillDate !== todayStr ? 'Traer ese día' : 'Traer hoy') }}
          </button>
        </div>
        <!-- Full month sync -->
        <div class="vto-backfill__row vto-backfill__divider">
          <span class="vto-backfill__or">o</span>
          <button class="vto-sync-range" :disabled="syncing || rangeSyncing || noCallsLeft" @click="handleRangeSync">
            <i class="fa-solid" :class="rangeSyncing ? 'fa-spinner fa-spin' : 'fa-calendar-check'" />
            <span v-if="rangeSyncing && rangeProgress">Sincronizando {{ rangeProgress.done }}/{{ rangeProgress.total }} días...</span>
            <span v-else>Traer todo {{ monthLabel }}</span>
          </button>
        </div>
        <p v-if="noCallsLeft" class="vto-empty__limit">
          <i class="fa-solid fa-lock" /> Límite diario de actualizaciones alcanzado. Disponible mañana.
        </p>
      </div>
    </div>

    <!-- ══ DATA ══════════════════════════════════════════════════════════════════ -->
    <template v-else-if="!loading && !loadError && monthData">

      <!-- ── HOY PANEL (solo mes actual) ───────────────────────────────────────── -->
      <div v-if="isCurrentMonth && todayData" class="vto-today">
        <div class="vto-today__header">
          <span class="vto-today__badge">HOY</span>
          <span class="vto-today__date">{{ todayFullDate }}</span>
          <div class="vto-today__sync-area">
            <button
              v-if="canSync"
              class="vto-sync-main"
              :disabled="syncing || noCallsLeft"
              @click="handleSync"
              :title="noCallsLeft ? 'Límite diario alcanzado' : 'Actualizar con datos de ahora mismo'"
            >
              <i class="fa-solid" :class="syncing ? 'fa-spinner fa-spin' : 'fa-rotate'" />
              {{ syncing ? 'Actualizando...' : 'Actualizar ahora' }}
            </button>
          </div>
        </div>

        <div class="vto-today__metrics">
          <div class="vto-today__metric">
            <i class="fa-brands fa-whatsapp vto-today__metric-icon vto-today__metric-icon--wa" />
            <div>
              <p class="vto-today__metric-val">{{ todayData.totalSessions }}</p>
              <p class="vto-today__metric-lbl">chats recibidos</p>
            </div>
          </div>
          <div class="vto-today__divider" />
          <div class="vto-today__metric">
            <i class="fa-solid fa-bag-shopping vto-today__metric-icon vto-today__metric-icon--orders" />
            <div>
              <p class="vto-today__metric-val">{{ todayData.totalOrders }}</p>
              <p class="vto-today__metric-lbl">pedidos realizados</p>
            </div>
          </div>
          <div class="vto-today__divider" />
          <div class="vto-today__metric">
            <i class="fa-solid fa-percent vto-today__metric-icon" :class="convTodayIcon" />
            <div>
              <p class="vto-today__metric-val" :class="convTodayText">{{ todayData.conversionRate.toFixed(1) }}%</p>
              <p class="vto-today__metric-lbl">tasa de cierre</p>
            </div>
          </div>
          <div class="vto-today__divider" />
          <div class="vto-today__metric">
            <i class="fa-solid fa-dollar-sign vto-today__metric-icon vto-today__metric-icon--revenue" />
            <div>
              <p class="vto-today__metric-val">${{ formatMoney(todayData.totalRevenue) }}</p>
              <p class="vto-today__metric-lbl">en ventas (sin delivery)</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sync button when no today data but current month -->
      <div v-else-if="isCurrentMonth && canSync" class="vto-sync-bar">
        <div class="vto-sync-bar__info">
          <i class="fa-solid fa-circle-info" />
          <span>Sin datos de hoy todavía — ¿traemos las ventas ahora?</span>
        </div>
        <div class="vto-backfill__row vto-backfill__row--inline">
          <input
            type="date"
            class="vto-backfill__input"
            v-model="backfillDate"
            :max="todayStr"
            title="Dejar vacío = hoy"
          />
          <button
            class="vto-sync-main"
            :disabled="syncing || noCallsLeft"
            @click="handleSync"
          >
            <i class="fa-solid" :class="syncing ? 'fa-spinner fa-spin' : 'fa-arrow-down-to-bracket'" />
            {{ syncing ? 'Trayendo...' : (backfillDate && backfillDate !== todayStr ? 'Traer día' : 'Traer hoy') }}
          </button>
        </div>
      </div>

      <!-- ── MES COMPLETO: KPIs ─────────────────────────────────────────────── -->
      <div class="vto-section-title">
        <i class="fa-solid fa-chart-pie" />
        Resumen de {{ monthLabel }}
      </div>

      <div class="vto-kpi-grid">
        <!-- Pedidos -->
        <div class="vto-kpi">
          <div class="vto-kpi__top">
            <span class="vto-kpi__label">Pedidos del mes</span>
            <div class="vto-kpi__icon vto-kpi__icon--purple"><i class="fa-solid fa-cart-shopping" /></div>
          </div>
          <p class="vto-kpi__value">{{ monthData.totalOrders.toLocaleString('es-EC') }}</p>
          <p class="vto-kpi__sub">de {{ monthData.totalSessions.toLocaleString('es-EC') }} chats recibidos</p>
          <!-- Mini progress bar -->
          <div class="vto-kpi__bar-track">
            <div
              class="vto-kpi__bar-fill vto-kpi__bar-fill--purple"
              :style="{ width: `${Math.min(100, (monthData.totalOrders / Math.max(monthData.totalSessions, 1)) * 100)}%` }"
            />
          </div>
        </div>

        <!-- Conversión -->
        <div class="vto-kpi">
          <div class="vto-kpi__top">
            <span class="vto-kpi__label">Tasa de cierre</span>
            <div class="vto-kpi__icon" :class="convMonthIcon"><i class="fa-solid fa-percent" /></div>
          </div>
          <p class="vto-kpi__value" :class="convMonthText">{{ monthData.monthConversionRate.toFixed(1) }}%</p>
          <p class="vto-kpi__sub">{{ conversionLabel(monthData.monthConversionRate) }}</p>
          <div class="vto-kpi__bar-track">
            <div
              class="vto-kpi__bar-fill"
              :class="convMonthBarClass"
              :style="{ width: `${Math.min(100, monthData.monthConversionRate)}%` }"
            />
          </div>
        </div>

        <!-- Ingresos -->
        <div class="vto-kpi">
          <div class="vto-kpi__top">
            <span class="vto-kpi__label">Ingresos netos</span>
            <div class="vto-kpi__icon vto-kpi__icon--green"><i class="fa-solid fa-dollar-sign" /></div>
          </div>
          <p class="vto-kpi__value">${{ formatMoney(monthData.totalRevenue) }}</p>
          <p class="vto-kpi__sub">+ ${{ formatMoney(monthData.totalBilled - monthData.totalRevenue) }} en delivery</p>
          <div class="vto-kpi__bar-track">
            <div class="vto-kpi__bar-fill vto-kpi__bar-fill--green" style="width: 100%" />
          </div>
        </div>
      </div>

      <!-- ── GRÁFICO DE BARRAS ──────────────────────────────────────────────── -->
      <div v-if="chartDays.length > 0" class="vto-chart-card">
        <div class="vto-card-header">
          <div class="vto-card-header__left">
            <i class="fa-solid fa-chart-column" />
            <span>Pedidos por día</span>
          </div>
          <span class="vto-card-header__month">{{ monthLabel }}</span>
        </div>
        <div class="vto-bars">
          <div
            v-for="day in chartDays"
            :key="day.date"
            class="vto-bars__col"
            :class="{ 'vto-bars__col--today': isToday(day.date) }"
            :title="`${dayName(day.date)} ${dayNum(day.date)}: ${day.totalOrders} pedidos · $${formatMoney(day.totalRevenue)}`"
          >
            <span class="vto-bars__num">{{ day.totalOrders }}</span>
            <div class="vto-bars__bar-wrap">
              <div
                class="vto-bars__bar"
                :style="{ height: `${barHeight(day.totalOrders)}%` }"
                :class="{ 'vto-bars__bar--today': isToday(day.date) }"
              />
            </div>
            <span class="vto-bars__label">{{ dayNum(day.date) }}</span>
          </div>
        </div>
      </div>

      <!-- ── TIENDAS ─────────────────────────────────────────────────────────── -->
      <div v-if="allStores.length > 0" class="vto-stores">
        <div class="vto-card-header">
          <div class="vto-card-header__left">
            <i class="fa-solid fa-store" />
            <span>Ventas por sucursal</span>
          </div>
          <span class="vto-card-header__month">{{ monthLabel }}</span>
        </div>

        <div class="vto-store-list">
          <div
            v-for="(store, idx) in allStores"
            :key="store.storeName"
            class="vto-store-row"
          >
            <div class="vto-store-row__rank">#{{ idx + 1 }}</div>
            <div class="vto-store-row__info">
              <p class="vto-store-row__name">
                <i class="fa-solid fa-location-dot" style="color: #9ca3af; font-size: 0.75rem;" />
                {{ store.storeName }}
              </p>
              <div class="vto-store-row__bar-wrap">
                <div
                  class="vto-store-row__bar"
                  :style="{ width: `${storeBarPct(store)}%` }"
                />
              </div>
            </div>
            <div class="vto-store-row__stats">
              <div class="vto-store-stat">
                <span class="vto-store-stat__val vto-store-stat__val--purple">{{ store.orders }}</span>
                <span class="vto-store-stat__lbl">pedidos</span>
              </div>
              <div class="vto-store-stat">
                <span class="vto-store-stat__val" :class="storeConvClass(store)">{{ storeConv(store) }}%</span>
                <span class="vto-store-stat__lbl">conversión</span>
              </div>
              <div class="vto-store-stat">
                <span class="vto-store-stat__val vto-store-stat__val--green">${{ formatMoney(store.revenue) }}</span>
                <span class="vto-store-stat__lbl">ingresos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── ACTIVIDAD RECIENTE ─────────────────────────────────────────────── -->
      <div v-if="daysWithData.length > 0" class="vto-activity">
        <div class="vto-card-header">
          <div class="vto-card-header__left">
            <i class="fa-solid fa-calendar-days" />
            <span>Actividad reciente</span>
          </div>
          <span class="vto-card-header__month">últimos {{ daysWithData.length }} días con ventas</span>
        </div>

        <div class="vto-activity-list">
          <div
            v-for="day in daysWithData"
            :key="day.date"
            class="vto-day-row"
            :class="{ 'vto-day-row--today': isToday(day.date) }"
          >
            <!-- Date column -->
            <div class="vto-day-row__date">
              <span class="vto-day-row__num">{{ dayNum(day.date) }}</span>
              <span class="vto-day-row__name">{{ dayName(day.date) }}</span>
              <span v-if="isToday(day.date)" class="vto-today-badge">HOY</span>
            </div>

            <!-- Funnel visual -->
            <div class="vto-day-row__funnel">
              <div class="vto-funnel-step">
                <i class="fa-brands fa-whatsapp" style="color: #25d366" />
                <span>{{ day.totalSessions }}</span>
                <small>chats</small>
              </div>
              <i class="fa-solid fa-chevron-right vto-funnel-arrow" />
              <div class="vto-funnel-step">
                <i class="fa-solid fa-cart-shopping" style="color: #7c3aed" />
                <span>{{ day.totalOrders }}</span>
                <small>pedidos</small>
              </div>
              <i class="fa-solid fa-chevron-right vto-funnel-arrow" />
              <div class="vto-funnel-step">
                <span class="vto-funnel-pct" :class="day.conversionRate >= 30 ? 'vto-funnel-pct--good' : 'vto-funnel-pct--mid'">
                  {{ day.conversionRate.toFixed(0) }}%
                </span>
                <small>cierre</small>
              </div>
            </div>

            <!-- Revenue -->
            <div class="vto-day-row__revenue">
              <span class="vto-day-row__amount">${{ formatMoney(day.totalRevenue) }}</span>
              <span class="vto-day-row__delivery">+${{ formatMoney(day.totalBilled - day.totalRevenue) }} delivery</span>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  salesSummaryService,
  type ISalesMonthData,
  type IApiUsage,
  type IStoreSummary,
} from '../../services/salesSummary.service'
import { useUserStore } from '../../stores/user'
import SalesDayCalendar from './SalesDayCalendar.vue'

const props = defineProps<{
  workspaceId: string
}>()

// Internal month navigation (self-managed)
const _now = new Date()
const currentYear  = ref(_now.getFullYear())
const currentMonth = ref(_now.getMonth() + 1)

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
}
function nextMonth() {
  if (isCurrentMonth.value) return
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
}

const userStore = useUserStore()
const canSync = computed(() => {
  if (userStore.role === 'superadmin' || userStore.role === 'admin') return true
  // Also allow users who are admin in this specific workspace (role: 'user' globally but 'admin' in workspace)
  return userStore.workspaces?.some(
    w => w.workspaceId === props.workspaceId && w.role === 'admin'
  ) ?? false
})

// ── State ──────────────────────────────────────────────────────────────────────
const loading  = ref(false)
const syncing  = ref(false)
const monthData = ref<ISalesMonthData | null>(null)
const apiUsage  = ref<IApiUsage | null>(null)
const syncMessage     = ref('')
const syncMessageType = ref<'ok' | 'error'>('ok')
const loadError = ref<{ message: string; status?: number; endpoint?: string } | null>(null)
const backfillDate = ref(new Date().toISOString().slice(0, 10))  // default = today
const calendarOpen = ref(false)

const backfillDateFormatted = computed(() => {
  if (!backfillDate.value) return '—'
  const [y, m, d] = backfillDate.value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })
})

const selectedDayData = computed(() =>
  monthData.value?.days?.find(d => d.date === backfillDate.value) ?? null
)
const rangeSyncing = ref(false)
const rangeProgress = ref<{ done: number; total: number } | null>(null)
let syncTimer: ReturnType<typeof setTimeout> | null = null

// ── Computed ───────────────────────────────────────────────────────────────────
const hasData = computed(() => (monthData.value?.days?.length ?? 0) > 0)

const isCurrentMonth = computed(() => {
  const now = new Date()
  return currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1
})

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value - 1, 1)
  return d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
})

const todayStr = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

const todayData = computed(() => {
  return monthData.value?.days?.find(d => d.date === todayStr.value) ?? null
})

const todayFullDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })
})

const lastSyncedAt = computed(() => {
  if (!monthData.value?.days?.length) return null
  const sorted = [...monthData.value.days].sort(
    (a, b) => new Date(b.syncedAt ?? '').getTime() - new Date(a.syncedAt ?? '').getTime()
  )
  const first = sorted[0]
  return first?.syncedAt ?? null
})

const noCallsLeft = computed(() =>
  apiUsage.value !== null && apiUsage.value.callsRemainingToday === 0
)

const daysWithData = computed(() =>
  (monthData.value?.days ?? [])
    .filter(d => d.totalSessions > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
)

const chartDays = computed(() =>
  (monthData.value?.days ?? []).filter(d => d.totalSessions > 0)
)

const allStores = computed((): IStoreSummary[] => {
  if (!monthData.value?.days) return []
  const map = new Map<string, IStoreSummary>()
  for (const day of monthData.value.days) {
    for (const store of day.byStore) {
      const ex = map.get(store.storeName)
      if (ex) {
        ex.sessions    += store.sessions
        ex.orders      += store.orders
        ex.revenue     += store.revenue
        ex.deliveryCost += store.deliveryCost
      } else {
        map.set(store.storeName, { ...store })
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.orders - a.orders)
})

const maxOrders = computed(() => Math.max(...chartDays.value.map(d => d.totalOrders), 1))
const maxStoreOrders = computed(() => Math.max(...allStores.value.map(s => s.orders), 1))

// ── Color helpers ──────────────────────────────────────────────────────────────
function convIcon(rate: number) {
  if (rate >= 40) return 'vto-kpi__icon--green'
  if (rate >= 25) return 'vto-kpi__icon--amber'
  return 'vto-kpi__icon--red'
}
function convText(rate: number) {
  if (rate >= 40) return 'vto--green'
  if (rate >= 25) return 'vto--amber'
  return 'vto--red'
}
function convBar(rate: number) {
  if (rate >= 40) return 'vto-kpi__bar-fill--green'
  if (rate >= 25) return 'vto-kpi__bar-fill--amber'
  return 'vto-kpi__bar-fill--red'
}
function conversionLabel(rate: number): string {
  if (rate >= 40) return 'Excelente rendimiento'
  if (rate >= 25) return 'Rendimiento normal'
  return 'Rendimiento bajo — revisar atención'
}

const convMonthIcon  = computed(() => convIcon(monthData.value?.monthConversionRate ?? 0))
const convMonthText  = computed(() => convText(monthData.value?.monthConversionRate ?? 0))
const convMonthBarClass = computed(() => convBar(monthData.value?.monthConversionRate ?? 0))

const convTodayIcon  = computed(() => convIcon(todayData.value?.conversionRate ?? 0).replace('vto-kpi__icon--', 'vto-today__metric-icon--'))
const convTodayText  = computed(() => convText(todayData.value?.conversionRate ?? 0))

const quotaBadgeClass = computed(() => {
  const rem = apiUsage.value?.callsRemainingToday ?? 999
  if (rem <= 5)  return 'vto-banner__quota--red'
  if (rem <= 15) return 'vto-banner__quota--amber'
  return 'vto-banner__quota--green'
})

// ── Helpers ────────────────────────────────────────────────────────────────────
function barHeight(orders: number): number {
  return Math.max(4, (orders / maxOrders.value) * 100)
}

function storeBarPct(store: IStoreSummary): number {
  return (store.orders / maxStoreOrders.value) * 100
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatSyncTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function dayNum(dateStr: string): string {
  return (dateStr.split('-')[2] ?? '').replace(/^0/, '')
}

function dayName(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-EC', { weekday: 'short' })
}

function isToday(dateStr: string): boolean {
  return dateStr === todayStr.value
}

function storeConv(store: IStoreSummary): string {
  if (store.sessions === 0) return '0.0'
  return ((store.orders / store.sessions) * 100).toFixed(1)
}

function storeConvClass(store: IStoreSummary): string {
  const r = store.sessions > 0 ? (store.orders / store.sessions) * 100 : 0
  return convText(r)
}

// ── Data loading ───────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  loadError.value = null
  try {
    const [month, usage] = await Promise.all([
      salesSummaryService.getMonthData(props.workspaceId, currentYear.value, currentMonth.value),
      salesSummaryService.getApiUsage(props.workspaceId),
    ])
    monthData.value = month
    apiUsage.value  = usage
  } catch (err: any) {
    const status = err?.response?.status
    const msg    = err?.response?.data?.message || err?.message || 'Error de red desconocido'
    const endpoint = `sales-summary/${props.workspaceId}/month`
    loadError.value = { message: msg, status, endpoint }
    console.error('[VentoOnline] loadData error:', status, msg)
  } finally {
    loading.value = false
  }
}

async function handleSync() {
  if (syncing.value) return
  syncing.value    = true
  syncMessage.value = ''
  if (syncTimer) clearTimeout(syncTimer)

  try {
    const dateArg = backfillDate.value || undefined
    const result = await salesSummaryService.triggerSync(props.workspaceId, dateArg || undefined)
    const r = result.result
    syncMessage.value = `✓ ${r.totalOrders} pedidos · ${r.conversionRate}% cierre · $${formatMoney(r.totalRevenue)} en ventas`
    syncMessageType.value = 'ok'
    await loadData()
  } catch (err: any) {
    syncMessage.value = err?.response?.data?.message || 'No se pudo actualizar. Intenta en unos minutos.'
    syncMessageType.value = 'error'
  } finally {
    syncing.value = false
    syncTimer = setTimeout(() => { syncMessage.value = '' }, 7000)
  }
}

async function handleRangeSync() {
  if (rangeSyncing.value) return
  rangeSyncing.value = true
  syncMessage.value = ''
  if (syncTimer) clearTimeout(syncTimer)

  // from = first day of selected month, to = today (or last day of month if past month)
  const from = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-01`
  const todayDate = new Date()
  const isThisMonth = currentYear.value === todayDate.getFullYear() && currentMonth.value === todayDate.getMonth() + 1
  const lastDay = isThisMonth
    ? todayStr.value
    : new Date(currentYear.value, currentMonth.value, 0).toISOString().slice(0, 10)

  // count days for progress display
  const start = new Date(from), end = new Date(lastDay)
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  rangeProgress.value = { done: 0, total: totalDays }

  try {
    const result = await salesSummaryService.syncRange(props.workspaceId, from, lastDay)

    const synced = result.results.filter(r => r.synced).length
    rangeProgress.value = { done: synced, total: totalDays }
    syncMessage.value = `✓ ${synced} de ${totalDays} días sincronizados`
    syncMessageType.value = 'ok'
    await loadData()
  } catch (err: any) {
    syncMessage.value = err?.response?.data?.message || 'Error al sincronizar el mes.'
    syncMessageType.value = 'error'
  } finally {
    rangeSyncing.value = false
    syncTimer = setTimeout(() => { syncMessage.value = ''; rangeProgress.value = null }, 8000)
  }
}

onMounted(loadData)
watch([currentYear, currentMonth], loadData)
</script>

<style lang="scss" scoped>
// ────────────────────────────────────────────────────────────────────────────
// TOKENS
// ────────────────────────────────────────────────────────────────────────────
$wa:     #25d366;
$purple: #7c3aed;
$purple-dark: #5b21b6;
$green:  #059669;
$amber:  #d97706;
$red:    #dc2626;
$surface: var(--color-surface, #fff);
$border:  var(--color-border, #e5e7eb);
$text:    var(--color-text-primary, #111827);
$muted:   var(--color-text-muted, #6b7280);
$radius:  0.875rem;

// Shared color classes
.vto--green { color: $green  !important; }
.vto--amber { color: $amber  !important; }
.vto--red   { color: $red    !important; }

// ── Root ───────────────────────────────────────────────────────────────────────
.vto-root {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 2px solid rgba(124, 58, 237, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

// ── Banner ─────────────────────────────────────────────────────────────────────
.vto-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  border: 1.5px solid #c4b5fd;
  border-radius: $radius;
  padding: 1rem 1.375rem;

  &__left {
    display: flex;
    align-items: center;
    gap: 0.875rem;
  }

  &__icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, $wa, #1aad4f);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 1.4rem;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    color: $purple-dark;
    margin: 0 0 0.25rem;
  }

  &__sub {
    font-size: 0.75rem;
    color: #6d28d9;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__sync-info {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    opacity: 0.8;
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.625rem;
  }

  &__sync-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

// ── Sync Bar ──────────────────────────────────────────────────────────────────
.vto-syncbar {
  position: relative;

  &__row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    background: #fff;
    border: 1.5px solid $border;
    border-radius: $radius;
    padding: 0.625rem 0.875rem;
  }

  &__trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 160px;
    height: 2.5rem;
    padding: 0 1rem;
    border-radius: 8px;
    border: 2px solid $border;
    background: #f9fafb;
    color: $text;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    font-size: 0.875rem;
    text-align: left;

    i:first-child { color: $purple; font-size: 0.9rem; }

    &:hover { border-color: $purple; background: #f5f3ff; }

    &--open {
      border-color: $purple;
      background: #f5f3ff;
      box-shadow: 0 0 0 3px rgba($purple, 0.12);
    }

    &--past {
      border-color: #f59e0b;
      background: #fffbeb;

      i:first-child { color: #d97706; }
      &:hover { border-color: #d97706; }
    }
  }

  &__trigger-label { flex: 1; }

  &__trigger-amount {
    font-size: 0.8125rem;
    font-weight: 700;
    color: $green;
    background: #ecfdf5;
    border-radius: 4px;
    padding: 1px 6px;
  }

  &__trigger-arrow {
    font-size: 0.6875rem;
    color: $muted;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &--up { transform: rotate(180deg); }
  }

  &__quota {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 700;
    border: 1.5px solid currentColor;
    white-space: nowrap;

    &.vto-banner__quota--green { color: $green; background: #ecfdf5; border-color: #a7f3d0; }
    &.vto-banner__quota--amber { color: $amber; background: #fffbeb; border-color: #fde68a; }
    &.vto-banner__quota--red   { color: $red;   background: #fef2f2; border-color: #fca5a5; }
  }

  &__dropdown {
    margin-top: 4px;
    overflow: hidden;
    border-radius: $radius;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  }
}

// ── Calendar transition ────────────────────────────────────────────────────────
.vto-cal-enter-active,
.vto-cal-leave-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.vto-cal-enter-from,
.vto-cal-leave-to {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.96);
}

// ── Sync Panel ────────────────────────────────────────────────────────────────
.vto-sync-panel {
  display: flex;
  align-items: center;
  gap: 0;
  background: #fff;
  border: 1.5px solid $border;
  border-radius: $radius;
  padding: 1rem 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;

  &__section {
    flex: 1;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__label {
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $muted;
    display: flex;
    align-items: center;
    gap: 0.3rem;

    i { color: $purple; }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__quota {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    border: 1.5px solid currentColor;

    &-num { font-weight: 800; font-size: 0.9375rem; }
    &-lbl { font-size: 0.625rem; font-weight: 600; opacity: 0.75; }

    &.vto-banner__quota--green { color: $green; background: #ecfdf5; border-color: #a7f3d0; }
    &.vto-banner__quota--amber { color: $amber; background: #fffbeb; border-color: #fde68a; }
    &.vto-banner__quota--red   { color: $red;   background: #fef2f2; border-color: #fca5a5; }
  }

  &__btn {
    height: 2.5rem;
    padding: 0 1.125rem;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    border: 1.5px solid transparent;

    &--primary {
      background: $purple;
      color: #fff;
      border-color: $purple;
      &:hover:not(:disabled) { background: $purple-dark; border-color: $purple-dark; }
    }

    &--past {
      background: $amber;
      color: #fff;
      border-color: $amber;
      &:hover:not(:disabled) { background: #b45309; border-color: #b45309; }
    }

    &--outline {
      background: transparent;
      color: $purple;
      border-color: $purple;
      &:hover:not(:disabled) { background: $purple; color: #fff; }
    }

    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  &__month-chip {
    font-size: 0.8125rem;
    font-weight: 600;
    color: $purple-dark;
    background: #f5f3ff;
    border: 1.5px solid #c4b5fd;
    border-radius: 6px;
    padding: 0.3rem 0.75rem;
    text-transform: capitalize;
    white-space: nowrap;
  }

  &__divider {
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    color: $muted;
    font-size: 0.75rem;
    font-weight: 600;
    align-self: center;

    @media (max-width: 600px) {
      width: 100%;
      text-align: center;
      padding: 0;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: $border; margin: 0 0.5rem; }

      span { display: inline-block; }
    }
  }

  &__quota {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    border-radius: 8px;
    border: 1.5px solid currentColor;
    align-self: center;

    i { font-size: 1rem; }

    &-num { font-size: 1.25rem; font-weight: 800; line-height: 1; display: block; }
    &-lbl  { font-size: 0.625rem; font-weight: 600; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.04em; display: block; }

    &.vto-banner__quota--green { color: $green;  background: #ecfdf5; border-color: #a7f3d0; }
    &.vto-banner__quota--amber { color: $amber;  background: #fffbeb; border-color: #fde68a; }
    &.vto-banner__quota--red   { color: $red;    background: #fef2f2; border-color: #fca5a5; }
  }
}

// ── Sync action bar ───────────────────────────────────────────────────────────
.vto-sync-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  border: 2px solid;
  transition: border-color 0.2s, background 0.2s;

  &--today {
    border-color: #c4b5fd;
    background: #f5f3ff;
  }

  &--past {
    border-color: #fde68a;
    background: #fffbeb;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.875rem;
    color: #374151;
  }

  &__badge {
    font-size: 0.625rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    padding: 2px 7px;
    border-radius: 4px;
    background: #7c3aed;
    color: #fff;

    .vto-sync-action--past & {
      background: #d97706;
    }
  }

  &__date {
    font-weight: 700;
    font-size: 0.9375rem;
    color: #111827;
    text-transform: capitalize;
  }

  &__existing {
    font-size: 0.8125rem;
    color: #059669;
    font-weight: 500;
  }

  &__missing {
    font-size: 0.8125rem;
    color: #9ca3af;
  }

  &__buttons {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
}

// ── Month nav ──────────────────────────────────────────────────────────────────
.vto-month-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.7);
  border: 1.5px solid #c4b5fd;
  border-radius: 10px;
  padding: 0.25rem 0.5rem;

  &__btn {
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    background: transparent;
    color: $purple-dark;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: rgba($purple, 0.1); }
    &:disabled { opacity: 0.3; cursor: not-allowed; }
  }

  &__label {
    font-size: 0.8125rem;
    font-weight: 700;
    color: $purple-dark;
    min-width: 7rem;
    text-align: center;
    text-transform: capitalize;
  }
}

// ── Sync buttons (compact, for banner) ────────────────────────────────────────
.vto-sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.375rem 0.75rem;
  background: $purple;
  color: #fff;
  border: 1.5px solid $purple;
  border-radius: 7px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: $purple-dark; border-color: $purple-dark; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }

  &--outline {
    background: transparent;
    color: $purple-dark;

    &:hover:not(:disabled) { background: $purple; color: #fff; }
  }
}

// ── Quota pill (compact) ───────────────────────────────────────────────────────
.vto-quota-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1.5px solid currentColor;

  &.vto-banner__quota--green { color: $green;  background: #ecfdf5; border-color: #a7f3d0; }
  &.vto-banner__quota--amber { color: $amber;  background: #fffbeb; border-color: #fde68a; }
  &.vto-banner__quota--red   { color: $red;    background: #fef2f2; border-color: #fca5a5; }
}

// ── Sync toast ─────────────────────────────────────────────────────────────────
.vto-toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.125rem;
  border-radius: $radius;
  font-size: 0.875rem;
  font-weight: 500;

  &--ok  { background: #ecfdf5; color: #065f46; border: 1.5px solid #a7f3d0; }
  &--err { background: #fef2f2; color: #7f1d1d; border: 1.5px solid #fca5a5; }

  i { font-size: 1.125rem; flex-shrink: 0; }
}

.vto-slide-enter-active, .vto-slide-leave-active { transition: all 0.25s ease; }
.vto-slide-enter-from, .vto-slide-leave-to { opacity: 0; transform: translateY(-8px); }

// ── Main sync button ───────────────────────────────────────────────────────────
.vto-sync-main {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.375rem;
  border-radius: 0.625rem;
  border: none;
  background: linear-gradient(135deg, $purple, $purple-dark);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(124, 58, 237, 0.45);
  }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
.vto-skeleton-wrap { display: flex; flex-direction: column; gap: 1rem; }

.vto-skeleton-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.vto-skeleton {
  border-radius: $radius;
  background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: vto-shimmer 1.4s infinite;

  &--wide { height: 5rem; }
  &--card { height: 6rem; }
}

@keyframes vto-shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

// ── Empty state ────────────────────────────────────────────────────────────────
// ── Backfill date picker ───────────────────────────────────────────────────────
.vto-backfill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;

  &__row {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex-wrap: wrap;
    justify-content: center;

    &--inline {
      justify-content: flex-end;
    }
  }

  &__label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  &__date-wrap {
    display: flex;
    flex-direction: column;
  }

  &__input {
    height: 2.25rem;
    padding: 0 0.75rem;

    &--sm { height: 1.875rem; font-size: 0.75rem; padding: 0 0.5rem; }
    border: 1.5px solid $border;
    border-radius: 8px;
    font-size: 0.8125rem;
    color: $text;
    background: #fff;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;

    &:focus { border-color: $purple; }
  }

  &__divider {
    margin-top: 0.25rem;
    justify-content: center;
  }

  &__or {
    font-size: 0.75rem;
    color: $muted;
    font-weight: 500;
  }
}

.vto-sync-range {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: 1.5px solid $purple;
  color: $purple;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover:not(:disabled) { background: $purple; color: #fff; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}

// ── Date chip (styled native date input) ──────────────────────────────────────
.vto-date-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.5rem;
  padding: 0 0.875rem;
  border-radius: 8px;
  border: 2px solid;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  user-select: none;

  &--today {
    border-color: $purple;
    background: #f5f3ff;
    color: $purple-dark;

    .vto-date-chip__badge { background: $purple; color: #fff; }
    &:hover { box-shadow: 0 0 0 3px rgba($purple, 0.15); }
  }

  &--past {
    border-color: $amber;
    background: #fffbeb;
    color: #92400e;

    .vto-date-chip__badge { background: $amber; color: #fff; }
    &:hover { box-shadow: 0 0 0 3px rgba($amber, 0.15); }
  }

  &__badge {
    font-size: 0.625rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }

  &__date {
    font-size: 0.9375rem;
    font-weight: 700;
    white-space: nowrap;
  }

  &__icon {
    font-size: 0.875rem;
    opacity: 0.6;
  }

  &__input {
    position: absolute;
    inset: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
    // Keep it in the DOM for native picker to work
  }
}

// ── Error State ────────────────────────────────────────────────────────────────
.vto-error {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  border-radius: $radius;
  padding: 1.25rem 1.5rem;
  margin-top: 1rem;

  &__icon {
    font-size: 1.25rem;
    color: #dc2626;
    margin-top: 2px;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    margin: 0 0 0.25rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: #991b1b;
  }

  &__msg {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    color: #b91c1c;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__badge {
    background: #dc2626;
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    letter-spacing: 0.03em;
  }

  &__endpoint {
    font-size: 0.6875rem;
    color: #b91c1c;
    font-family: monospace;
    background: rgba(220, 38, 38, 0.08);
    padding: 2px 6px;
    border-radius: 4px;
    word-break: break-all;
  }

  &__retry {
    flex-shrink: 0;
    padding: 0.5rem 1rem;
    background: #dc2626;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: background 0.15s;
    align-self: center;

    &:hover { background: #b91c1c; }

    i { font-size: 0.75rem; }
  }
}

.vto-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
  background: $surface;
  border: 1.5px dashed $border;
  border-radius: $radius;
  gap: 0.875rem;

  &__graphic {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: #f0fdf4;
    border: 2px solid #a7f3d0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    color: $wa;
  }

  &__title {
    font-size: 1.0625rem;
    font-weight: 700;
    color: $text;
    margin: 0;
  }

  &__desc {
    font-size: 0.8125rem;
    color: $muted;
    line-height: 1.65;
    margin: 0;
    max-width: 26rem;
  }

  &__limit {
    font-size: 0.75rem;
    color: $red;
    margin: 0;
  }
}

// ── Sync bar (no today data) ────────────────────────────────────────────────────
.vto-sync-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: #faf5ff;
  border: 1.5px solid #c4b5fd;
  border-radius: $radius;
  padding: 1rem 1.25rem;

  &__info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: $purple-dark;
    font-weight: 500;
    i { color: $purple; }
  }
}

// ── Today panel ────────────────────────────────────────────────────────────────
.vto-today {
  background: $surface;
  border: 1.5px solid $border;
  border-radius: $radius;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    background: linear-gradient(135deg, $purple, $purple-dark);
    flex-wrap: wrap;
  }

  &__badge {
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    background: rgba(255,255,255,0.25);
    color: #fff;
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
  }

  &__date {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    text-transform: capitalize;
    flex: 1;
  }

  &__sync-area { margin-left: auto; }

  &__metrics {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 1.25rem;
    gap: 0;
  }

  &__metric {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    flex: 1;
    min-width: 10rem;
    padding: 0.5rem 1rem;
  }

  &__metric-icon {
    font-size: 1.5rem;
    flex-shrink: 0;

    &--wa      { color: $wa; }
    &--orders  { color: $purple; }
    &--revenue { color: $green; }
    &--green   { color: $green; }
    &--amber   { color: $amber; }
    &--red     { color: $red; }
  }

  &__metric-val {
    font-size: 1.75rem;
    font-weight: 800;
    color: $text;
    margin: 0 0 0.1rem;
    line-height: 1;
  }

  &__metric-lbl {
    font-size: 0.6875rem;
    color: $muted;
    margin: 0;
  }

  &__divider {
    width: 1px;
    height: 2.5rem;
    background: $border;
    flex-shrink: 0;
    @media (max-width: 640px) { display: none; }
  }
}

// ── Section title ──────────────────────────────────────────────────────────────
.vto-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: $text;
  padding: 0 0.125rem;

  i { color: $purple; }
}

// ── KPI grid ───────────────────────────────────────────────────────────────────
.vto-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.vto-kpi {
  background: $surface;
  border: 1.5px solid $border;
  border-radius: $radius;
  padding: 1.25rem;
  transition: box-shadow 0.15s;

  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.875rem;
  }

  &__label {
    font-size: 0.75rem;
    font-weight: 600;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    color: #fff;

    &--purple { background: linear-gradient(135deg, $purple, $purple-dark); }
    &--green  { background: linear-gradient(135deg, $green, #047857); }
    &--amber  { background: linear-gradient(135deg, $amber, #b45309); }
    &--red    { background: linear-gradient(135deg, $red, #b91c1c); }
  }

  &__value {
    font-size: 2rem;
    font-weight: 800;
    color: $text;
    margin: 0 0 0.25rem;
    line-height: 1;
  }

  &__sub {
    font-size: 0.75rem;
    color: $muted;
    margin: 0 0 0.875rem;
  }

  &__bar-track {
    height: 4px;
    background: #f3f4f6;
    border-radius: 999px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s ease;

    &--purple { background: $purple; }
    &--green  { background: $green; }
    &--amber  { background: $amber; }
    &--red    { background: $red; }
  }
}

// ── Card header (shared) ────────────────────────────────────────────────────────
.vto-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;

  &__left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: $text;

    i { color: $purple; }
  }

  &__month {
    font-size: 0.75rem;
    color: $muted;
    text-transform: capitalize;
  }
}

// ── Bar chart ──────────────────────────────────────────────────────────────────
.vto-chart-card {
  background: $surface;
  border: 1.5px solid $border;
  border-radius: $radius;
  padding: 1.25rem;
}

.vto-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 8rem;
  padding-bottom: 1.375rem;
  position: relative;

  &__col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
    cursor: default;

    &--today .vto-bars__bar { background: $purple !important; }
    &--today .vto-bars__label { color: $purple; font-weight: 700; }
  }

  &__num {
    font-size: 0.6rem;
    color: $muted;
    margin-bottom: 2px;
    font-weight: 600;
    line-height: 1;
  }

  &__bar-wrap {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
  }

  &__bar {
    width: 100%;
    background: rgba($purple, 0.3);
    border-radius: 3px 3px 0 0;
    transition: background 0.15s;
    min-height: 3px;

    &--today { background: $purple; }

    .vto-bars__col:not(.vto-bars__col--today):hover & {
      background: rgba($purple, 0.6);
    }
  }

  &__label {
    position: absolute;
    bottom: 0;
    font-size: 0.6rem;
    color: $muted;
    text-align: center;
    line-height: 1;
  }
}

// ── Store list ─────────────────────────────────────────────────────────────────
.vto-stores {
  background: $surface;
  border: 1.5px solid $border;
  border-radius: $radius;
  padding: 1.25rem;
}

.vto-store-list { display: flex; flex-direction: column; gap: 0.875rem; }

.vto-store-row {
  display: flex;
  align-items: center;
  gap: 1rem;

  &__rank {
    width: 1.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: $muted;
    flex-shrink: 0;
    text-align: center;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: $text;
    margin: 0 0 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__bar-wrap {
    height: 4px;
    background: #f3f4f6;
    border-radius: 999px;
    overflow: hidden;
  }

  &__bar {
    height: 100%;
    background: linear-gradient(90deg, $purple, $purple-dark);
    border-radius: 999px;
    transition: width 0.6s ease;
  }

  &__stats {
    display: flex;
    gap: 1.25rem;
    flex-shrink: 0;
    @media (max-width: 480px) { gap: 0.75rem; }
  }
}

.vto-store-stat {
  text-align: center;

  &__val {
    display: block;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.15rem;

    &--purple { color: $purple; }
    &--green  { color: $green; }
  }

  &__lbl {
    font-size: 0.625rem;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}

// ── Activity list ──────────────────────────────────────────────────────────────
.vto-activity {
  background: $surface;
  border: 1.5px solid $border;
  border-radius: $radius;
  padding: 1.25rem;
}

.vto-activity-list { display: flex; flex-direction: column; }

.vto-day-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;

  &:last-child { border-bottom: none; }

  &--today {
    background: #faf5ff;
    margin: 0 -1.25rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    border-bottom-color: #e9d5ff;
  }

  &__date {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    min-width: 4.5rem;
    flex-shrink: 0;
  }

  &__num {
    font-size: 1.5rem;
    font-weight: 800;
    color: $text;
    line-height: 1;
  }

  &__name {
    font-size: 0.75rem;
    color: $muted;
    text-transform: capitalize;
  }

  &__funnel {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    flex-wrap: wrap;
  }

  &__revenue {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }

  &__amount {
    font-size: 1rem;
    font-weight: 700;
    color: $green;
  }

  &__delivery {
    font-size: 0.625rem;
    color: $muted;
  }
}

.vto-today-badge {
  font-size: 0.5625rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  background: $purple;
  color: #fff;
  border-radius: 999px;
  padding: 0.15rem 0.4rem;
}

.vto-funnel-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: $text;
  min-width: 3rem;
  text-align: center;

  small {
    font-size: 0.5625rem;
    color: $muted;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}

.vto-funnel-arrow {
  font-size: 0.5rem;
  color: #d1d5db;
}

.vto-funnel-pct {
  font-size: 0.9375rem;
  font-weight: 800;

  &--good { color: $green; }
  &--mid  { color: $amber; }
}
</style>
