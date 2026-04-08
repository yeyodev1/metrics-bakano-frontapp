<template>
  <div class="trf-ws">

    <!-- Back bar -->
    <div class="trf-ws__back-bar">
      <button class="trf-ws__back-btn" @click="router.push({ name: 'TraffickerDashboard' })">
        <i class="fa-solid fa-arrow-left" />
        <span>Panel Trafficker</span>
      </button>
      <div class="trf-ws__breadcrumb-sep">/</div>
      <span class="trf-ws__breadcrumb-current">{{ workspaceName }}</span>
    </div>

    <!-- Header -->
    <div class="trf-ws__header">
      <div class="trf-ws__header-left">
        <div class="trf-ws__header-avatar">
          <img
            v-if="hasMeta"
            :src="`https://graph.facebook.com/${metaPageId}/picture?type=square`"
            @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
          />
          <i v-else class="fa-solid fa-building" />
        </div>
        <div>
          <h1>{{ workspaceName }}</h1>
          <div class="trf-ws__header-tags">
            <span v-if="hasMeta" class="trf-ws__tag trf-ws__tag--meta">
              <i class="fa-brands fa-meta" /> Meta conectado
            </span>
            <span v-else class="trf-ws__tag trf-ws__tag--warn">
              <i class="fa-solid fa-triangle-exclamation" /> Sin Meta Ads
            </span>
            <span class="trf-ws__tag trf-ws__tag--month">{{ monthLabel }}</span>
          </div>
        </div>
      </div>
      <div class="trf-ws__month-nav">
        <button class="trf-ws__nav-btn" @click="prevMonth" :disabled="isLoading">
          <i class="fa-solid fa-chevron-left" />
        </button>
        <div class="trf-ws__month-picker">
          <button
            class="trf-ws__month-display"
            :disabled="isLoading"
            @click="monthPickerOpen = !monthPickerOpen"
          >
            <i class="fa-regular fa-calendar" />
            <span>{{ monthLabel }}</span>
            <i class="fa-solid fa-chevron-down trf-ws__month-caret" :class="{ open: monthPickerOpen }" />
          </button>
          <Teleport to="body">
            <div v-if="monthPickerOpen" class="trf-ws__month-backdrop" @click="monthPickerOpen = false" />
          </Teleport>
          <div v-if="monthPickerOpen" class="trf-ws__month-dropdown">
            <button
              v-for="opt in monthOptions"
              :key="`${opt.year}-${opt.month}`"
              class="trf-ws__month-option"
              :class="{ active: opt.year === currentYear && opt.month === currentMonth }"
              @click="selectMonth(opt.year, opt.month)"
            >{{ opt.label }}</button>
          </div>
        </div>
        <button class="trf-ws__nav-btn" @click="nextMonth" :disabled="isLoading || isCurrentMonth">
          <i class="fa-solid fa-chevron-right" />
        </button>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="isLoading" class="trf-ws__skeleton">
      <!-- KPIs -->
      <div class="trf-ws__kpis">
        <div v-for="n in 4" :key="n" class="trf-ws__kpi trf-ws__kpi--sk">
          <div class="ws-sk ws-sk--icon" />
          <div class="ws-sk__text">
            <div class="ws-sk ws-sk--label" />
            <div class="ws-sk ws-sk--value" />
          </div>
        </div>
      </div>
      <!-- Formula bar -->
      <div class="trf-ws__formula-bar ws-sk--formula-wrap">
        <div class="ws-sk ws-sk--formula" />
      </div>
      <!-- Table skeleton -->
      <div class="trf-ws__section">
        <div class="trf-ws__section-header">
          <div class="ws-sk ws-sk--section-title" />
        </div>
        <div class="ws-sk--rows">
          <div v-for="n in 8" :key="n" class="ws-sk--row">
            <div class="ws-sk ws-sk--cell ws-sk--cell-date" />
            <div class="ws-sk ws-sk--cell ws-sk--cell-amount" />
            <div class="ws-sk ws-sk--cell ws-sk--cell-amount" />
            <div class="ws-sk ws-sk--cell ws-sk--cell-roas" />
          </div>
        </div>
      </div>
    </div>

    <template v-else>

      <!-- KPI row -->
      <div class="trf-ws__kpis">

        <!-- ROAS principal -->
        <div class="trf-ws__kpi trf-ws__kpi--roas" :class="roasKpiClass">
          <div class="trf-ws__kpi-icon">
            <i class="fa-solid fa-arrow-trend-up" />
          </div>
          <div>
            <p class="trf-ws__kpi-label">ROAS del Mes</p>
            <p class="trf-ws__kpi-big">{{ billingTotals.avgROAS > 0 ? billingTotals.avgROAS.toFixed(2) + 'x' : '—' }}</p>
            <p class="trf-ws__kpi-status">{{ roasStatusLabel(billingTotals.avgROAS) }}</p>
          </div>
        </div>

        <!-- Progress toward 4x -->
        <div class="trf-ws__kpi trf-ws__kpi--progress">
          <p class="trf-ws__kpi-label">Progreso hacia 4x</p>
          <div class="trf-ws__gauge-wrap">
            <div class="trf-ws__gauge-track">
              <div
                class="trf-ws__gauge-fill"
                :class="roasFillClass"
                :style="{ width: Math.min((billingTotals.avgROAS / 4) * 100, 100) + '%' }"
              />
            </div>
            <span class="trf-ws__gauge-pct">
              {{ billingTotals.avgROAS > 0 ? Math.round(Math.min((billingTotals.avgROAS / 4) * 100, 100)) + '%' : '—' }}
            </span>
          </div>
          <div class="trf-ws__gauge-legend">
            <span v-for="mark in roasMarks" :key="mark.label" class="trf-ws__gauge-mark" :class="mark.class">
              {{ mark.label }}
            </span>
          </div>
        </div>

        <!-- Revenue -->
        <div class="trf-ws__kpi">
          <div class="trf-ws__kpi-icon trf-ws__kpi-icon--green">
            <i class="fa-solid fa-building-columns" />
          </div>
          <div>
            <p class="trf-ws__kpi-label">Facturación Negocio</p>
            <p class="trf-ws__kpi-value">${{ formatAmount(billingTotals.totalAmount) }}</p>
            <p class="trf-ws__kpi-hint">Lo que factura el cliente</p>
          </div>
        </div>

        <!-- Spend -->
        <div class="trf-ws__kpi">
          <div class="trf-ws__kpi-icon trf-ws__kpi-icon--blue">
            <i class="fa-brands fa-meta" />
          </div>
          <div>
            <p class="trf-ws__kpi-label">Gasto en Meta Ads</p>
            <p class="trf-ws__kpi-value">${{ formatAmount(billingTotals.totalMetaSpend) }}</p>
            <p class="trf-ws__kpi-hint">Inversión publicitaria</p>
          </div>
        </div>

      </div>

      <!-- ROAS formula explainer -->
      <div class="trf-ws__formula-bar">
        <div class="trf-ws__formula">
          <span class="trf-ws__formula-piece trf-ws__formula-piece--green">
            ${{ formatAmount(billingTotals.totalAmount) }}
            <small>Facturación</small>
          </span>
          <span class="trf-ws__formula-op">÷</span>
          <span class="trf-ws__formula-piece trf-ws__formula-piece--blue">
            ${{ formatAmount(billingTotals.totalMetaSpend) }}
            <small>Gasto Meta</small>
          </span>
          <span class="trf-ws__formula-op">=</span>
          <span class="trf-ws__formula-piece" :class="roasPieceClass">
            {{ billingTotals.avgROAS > 0 ? billingTotals.avgROAS.toFixed(2) + 'x' : '—' }}
            <small>ROAS</small>
          </span>
          <span class="trf-ws__formula-target">
            <i class="fa-solid fa-bullseye" /> Objetivo ≥ 4x
          </span>
        </div>
      </div>

      <!-- Meta Ads section -->
      <section class="trf-ws__section" v-if="hasMeta">
        <div class="trf-ws__section-header">
          <h2><i class="fa-brands fa-meta" /> Meta Ads — Rendimiento</h2>
          <select v-model="datePreset" @change="loadMetaInsights" class="trf-ws__select">
            <option value="this_month">Este mes</option>
            <option value="last_month">Mes anterior</option>
            <option value="this_week">Esta semana</option>
            <option value="last_7d">Últimos 7 días</option>
            <option value="last_30d">Últimos 30 días</option>
          </select>
        </div>

        <div v-if="isLoadingMeta" class="trf-ws__meta-loading">
          <span class="trf-ws__spinner" />
          <span>Consultando Meta Ads...</span>
        </div>

        <div v-else-if="!metaInsights" class="trf-ws__meta-empty">
          <i class="fa-solid fa-plug-circle-xmark" />
          <p>No se pudieron obtener datos de Meta Ads. Verifica la integración.</p>
        </div>

        <div v-else>
          <!-- Meta KPIs -->
          <div class="trf-ws__meta-kpis">
            <div class="trf-ws__meta-kpi">
              <span class="trf-ws__meta-kpi-label">Gasto Total</span>
              <span class="trf-ws__meta-kpi-value">${{ formatAmount(metaInsights.summary?.spend ?? 0) }}</span>
            </div>
            <div class="trf-ws__meta-kpi">
              <span class="trf-ws__meta-kpi-label">Impresiones</span>
              <span class="trf-ws__meta-kpi-value">{{ formatCount(metaInsights.summary?.impressions ?? 0) }}</span>
            </div>
            <div class="trf-ws__meta-kpi">
              <span class="trf-ws__meta-kpi-label">Alcance</span>
              <span class="trf-ws__meta-kpi-value">{{ formatCount(metaInsights.summary?.reach ?? 0) }}</span>
            </div>
            <div class="trf-ws__meta-kpi">
              <span class="trf-ws__meta-kpi-label">Clics</span>
              <span class="trf-ws__meta-kpi-value">{{ formatCount(metaInsights.summary?.clicks ?? 0) }}</span>
            </div>
            <div class="trf-ws__meta-kpi">
              <span class="trf-ws__meta-kpi-label">CTR</span>
              <span class="trf-ws__meta-kpi-value">{{ metaInsights.summary?.ctr ? (metaInsights.summary.ctr).toFixed(2) + '%' : '—' }}</span>
            </div>
            <div class="trf-ws__meta-kpi">
              <span class="trf-ws__meta-kpi-label">CPM</span>
              <span class="trf-ws__meta-kpi-value">${{ formatAmount(metaInsights.summary?.cpm ?? 0) }}</span>
            </div>
            <div class="trf-ws__meta-kpi">
              <span class="trf-ws__meta-kpi-label">CPC</span>
              <span class="trf-ws__meta-kpi-value">${{ formatAmount(metaInsights.summary?.cpc ?? 0) }}</span>
            </div>
            <div class="trf-ws__meta-kpi">
              <span class="trf-ws__meta-kpi-label">Frecuencia</span>
              <span class="trf-ws__meta-kpi-value">{{ metaInsights.summary?.frequency ? Number(metaInsights.summary.frequency).toFixed(2) : '—' }}</span>
            </div>
          </div>

          <!-- Campaign breakdown -->
          <div v-if="metaCampaigns.length > 0" class="trf-ws__campaigns">
            <h3 class="trf-ws__campaigns-title">Campañas activas</h3>
            <div class="trf-ws__campaign-list">
              <div v-for="camp in metaCampaigns" :key="camp.campaign_id" class="trf-ws__campaign-row">
                <div class="trf-ws__campaign-name">
                  <span class="trf-ws__campaign-status" :class="camp.status === 'ACTIVE' ? 'active' : 'paused'" />
                  {{ camp.campaign_name }}
                </div>
                <div class="trf-ws__campaign-metrics">
                  <span title="Gasto"><i class="fa-solid fa-dollar-sign" /> ${{ formatAmount(Number(camp.spend) || 0) }}</span>
                  <span title="Impresiones"><i class="fa-solid fa-eye" /> {{ formatCount(Number(camp.impressions) || 0) }}</span>
                  <span title="Clics"><i class="fa-solid fa-arrow-pointer" /> {{ formatCount(Number(camp.clicks) || 0) }}</span>
                  <span v-if="camp.ctr" title="CTR"><i class="fa-solid fa-percent" /> {{ Number(camp.ctr).toFixed(2) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Daily billing log -->
      <section class="trf-ws__section">
        <div class="trf-ws__section-header">
          <h2><i class="fa-solid fa-calendar-days" /> Registro Diario de Facturación</h2>
          <RouterLink
            :to="{ name: 'BillingRoas', params: { workspaceId } }"
            class="trf-ws__link-btn"
          >
            <i class="fa-solid fa-external-link" /> Ir a Facturación
          </RouterLink>
        </div>

        <div v-if="billingDays.length === 0" class="trf-ws__meta-empty">
          <i class="fa-solid fa-calendar-xmark" />
          <p>No hay registros de facturación este mes.</p>
        </div>

        <div v-else class="trf-ws__billing-table-wrap">
          <table class="trf-ws__billing-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Facturación</th>
                <th>Gasto Meta</th>
                <th>ROAS del día</th>
                <th>Registros</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="day in billingDays"
                :key="day.dateStr"
                :class="{ 'trf-ws__billing-row--today': isToday(day.dateStr) }"
              >
                <td>
                  <span class="trf-ws__day-date">{{ formatDayDate(day.dateStr) }}</span>
                  <span v-if="isToday(day.dateStr)" class="trf-ws__today-pill">Hoy</span>
                </td>
                <td class="trf-ws__amount-cell">${{ formatAmount(day.totalAmount) }}</td>
                <td class="trf-ws__amount-cell trf-ws__amount-cell--meta">
                  <template v-if="day.totalMetaSpend > 0">
                    ${{ formatAmount(day.totalMetaSpend) }}
                  </template>
                  <span v-else class="trf-ws__no-data">—</span>
                </td>
                <td>
                  <span v-if="day.avgROAS > 0" class="trf-ws__roas-pill" :class="roapPillClass(day.avgROAS)">
                    {{ day.avgROAS.toFixed(2) }}x
                  </span>
                  <span v-else class="trf-ws__no-data">—</span>
                </td>
                <td class="trf-ws__count-cell">{{ (day as any).entries?.length ?? (day as any).entryCount ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Quick actions -->
      <div class="trf-ws__quick-actions">
        <RouterLink :to="{ name: 'BillingRoas', params: { workspaceId } }" class="trf-ws__action-btn">
          <i class="fa-solid fa-chart-column" />
          <span>Facturación & ROAS</span>
        </RouterLink>
        <RouterLink :to="{ name: 'AppDashboard', params: { workspaceId } }" class="trf-ws__action-btn">
          <i class="fa-solid fa-chart-line" />
          <span>Dashboard Cliente</span>
        </RouterLink>
        <RouterLink :to="{ name: 'WorkspaceBrandProfile', params: { workspaceId } }" class="trf-ws__action-btn">
          <i class="fa-solid fa-palette" />
          <span>Perfil de Marca</span>
        </RouterLink>
        <RouterLink :to="{ name: 'AppSettings', params: { workspaceId } }" class="trf-ws__action-btn">
          <i class="fa-solid fa-gear" />
          <span>Configuración</span>
        </RouterLink>
      </div>

    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { billingService, type IMonthData } from '@/services/billing.service'
import { metaService } from '@/services/meta.service'

const route = useRoute()
const router = useRouter()

const workspaceId = computed(() => route.params.workspaceId as string)
const workspaceName = ref('')
const hasMeta = ref(false)
const metaPageId = ref('')

const isLoading = ref(false)
const isLoadingMeta = ref(false)
const billing = ref<IMonthData>({ days: [], totalAmount: 0, totalMetaSpend: 0, avgROAS: 0 })

const billingTotals = computed(() => {
  const days = billing.value.days ?? []
  const totalAmount = days.reduce((s, d) => s + (d.totalAmount ?? 0), 0)
  const totalMetaSpend = days.reduce((s, d) => s + (d.totalMetaSpend ?? 0), 0)
  const avgROAS = totalMetaSpend > 0 ? totalAmount / totalMetaSpend : 0
  return { totalAmount, totalMetaSpend, avgROAS }
})
const metaInsights = ref<any>(null)
const datePreset = ref('this_month')

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

const isCurrentMonth = computed(() => {
  const now = new Date()
  return currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth() + 1
})

const monthLabel = computed(() => {
  return new Date(currentYear.value, currentMonth.value - 1, 1)
    .toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
})

const monthPickerOpen = ref(false)

const monthOptions = computed(() => {
  const opts: { year: number; month: number; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    opts.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()),
    })
  }
  return opts
})

function selectMonth(year: number, month: number) {
  currentYear.value = year
  currentMonth.value = month
  monthPickerOpen.value = false
  loadBilling(true)
}

const billingDays = computed(() =>
  (billing.value.days ?? []).filter(d => (d.totalAmount ?? 0) > 0 || (d.totalMetaSpend ?? 0) > 0)
)

const metaCampaigns = computed(() => {
  if (!metaInsights.value) return []
  return metaInsights.value.campaigns ?? metaInsights.value.ads ?? []
})

const roasMarks = [
  { label: '1x', class: 'mark--orange' },
  { label: '3x', class: 'mark--teal' },
  { label: '4x', class: 'mark--green' },
]

const roasKpiClass = computed(() => {
  const r = billingTotals.value.avgROAS
  if (!r) return 'trf-ws__kpi--gray'
  if (r >= 4) return 'trf-ws__kpi--green'
  if (r >= 3) return 'trf-ws__kpi--teal'
  if (r >= 1) return 'trf-ws__kpi--orange'
  return 'trf-ws__kpi--red'
})

const roasFillClass = computed(() => {
  const r = billingTotals.value.avgROAS
  if (!r) return 'fill--gray'
  if (r >= 4) return 'fill--green'
  if (r >= 3) return 'fill--teal'
  if (r >= 1) return 'fill--orange'
  return 'fill--red'
})

const roasPieceClass = computed(() => {
  const r = billingTotals.value.avgROAS
  if (!r) return ''
  if (r >= 4) return 'trf-ws__formula-piece--green'
  if (r >= 3) return 'trf-ws__formula-piece--teal'
  if (r >= 1) return 'trf-ws__formula-piece--orange'
  return 'trf-ws__formula-piece--red'
})

function roasStatusLabel(roas: number) {
  if (!roas) return 'Sin datos este mes'
  if (roas >= 4) return 'En objetivo'
  if (roas >= 3) return 'Cerca del objetivo'
  if (roas >= 1) return 'En riesgo'
  return 'CRÍTICO — Por debajo de 1x'
}

function roapPillClass(roas: number) {
  if (roas >= 4) return 'pill--green'
  if (roas >= 3) return 'pill--teal'
  if (roas >= 1) return 'pill--orange'
  return 'pill--red'
}

function formatAmount(val: number) {
  return (val || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCount(val: number) {
  return (val || 0).toLocaleString('es-EC')
}

function isToday(dateStr: string) {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

function formatDayDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-EC', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
}

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
  loadBilling(true)
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
  loadBilling(true)
}

async function loadBilling(showSkeleton = false) {
  if (showSkeleton) isLoading.value = true
  try {
    billing.value = await billingService.getMonthData(workspaceId.value, currentYear.value, currentMonth.value)
  } catch (e) {
    console.error('Error loading billing', e)
  } finally {
    isLoading.value = false
  }
}

async function loadMetaInsights() {
  if (!hasMeta.value) return
  isLoadingMeta.value = true
  try {
    metaInsights.value = await metaService.getAdsInsights(workspaceId.value, undefined, datePreset.value)
  } catch {
    metaInsights.value = null
  } finally {
    isLoadingMeta.value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    const { workspace } = await workspaceService.getWorkspace(workspaceId.value)
    workspaceName.value = workspace.name
    hasMeta.value = !!(workspace as any).metaAds?.pageId
    metaPageId.value = (workspace as any).metaAds?.pageId ?? ''
    await loadBilling()
    if (hasMeta.value) loadMetaInsights()
  } catch (e) {
    console.error('Error loading workspace', e)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped lang="scss">
.trf-ws {
  padding: 20px 20px 80px;
  width: 100%;

  @media (min-width: 640px) { padding: 28px 32px 80px; }
}

// ── Back bar ───────────────────────────────────────────────
.trf-ws__back-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  color: $text-secondary;
}

.trf-ws__back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: $primary;
  font-size: 13px;
  font-weight: 600;
  padding: 0;

  &:hover { text-decoration: underline; }
}

.trf-ws__breadcrumb-sep { opacity: 0.4; }
.trf-ws__breadcrumb-current { font-weight: 700; color: $primary-dark; }

// ── Header ─────────────────────────────────────────────────
.trf-ws__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.trf-ws__header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.trf-ws__header-avatar {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba($primary, 0.08);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
  }
}

.trf-ws__header h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 800;
  color: $primary-dark;
}

.trf-ws__header-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.trf-ws__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 100px;

  &--meta   { color: #1877f2; background: rgba(#1877f2, 0.1); }
  &--warn   { color: #b45309; background: #fef3c7; }
  &--month  { color: $primary; background: rgba($primary, 0.1); text-transform: capitalize; }
}

.trf-ws__month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: $primary-dark;
  white-space: nowrap;
  text-transform: capitalize;
}

.trf-ws__nav-btn {
  width: 32px;
  height: 32px;
  border: 1.5px solid rgba($primary, 0.25);
  border-radius: 8px;
  background: white;
  color: $primary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover:not(:disabled) { background: rgba($primary, 0.08); border-color: $primary; }
  &:disabled { opacity: 0.35; cursor: default; }
}

.trf-ws__month-picker {
  position: relative;
}

.trf-ws__month-display {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 13px;
  border: 1.5px solid rgba($primary, 0.2);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: $primary-dark;
  background: white;
  text-transform: capitalize;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  i { font-size: 12px; color: $primary; }

  .trf-ws__month-caret {
    font-size: 9px;
    opacity: 0.5;
    transition: transform 0.2s;
    &.open { transform: rotate(180deg); }
  }

  &:hover:not(:disabled) { border-color: $primary; background: rgba($primary, 0.04); }
  &:disabled { opacity: 0.45; cursor: default; }
}

.trf-ws__month-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
}

.trf-ws__month-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 999;
  background: white;
  border: 1.5px solid rgba($primary, 0.12);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.13);
  padding: 6px;
  min-width: 210px;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trf-ws__month-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: $primary-dark;
  cursor: pointer;
  text-align: left;
  text-transform: capitalize;
  transition: background 0.1s;

  &:hover { background: rgba($primary, 0.06); }

  &.active {
    background: rgba($primary, 0.1);
    color: $primary;
    font-weight: 700;
  }
}

// ── Skeleton ───────────────────────────────────────────────
@keyframes ws-shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

%ws-sk-base {
  background: linear-gradient(90deg, #eef0f3 25%, #e4e6ea 50%, #eef0f3 75%);
  background-size: 1200px 100%;
  animation: ws-shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

.ws-sk {
  @extend %ws-sk-base;

  &--icon         { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; }
  &--label        { width: 80px; height: 10px; margin-bottom: 8px; }
  &--value        { width: 120px; height: 28px; }
  &--formula      { width: 100%; height: 44px; border-radius: 10px; }
  &--section-title{ width: 200px; height: 18px; }
  &--cell         { border-radius: 6px; height: 14px;
    &-date   { width: 100px; }
    &-amount { width: 80px; }
    &-roas   { width: 50px; }
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
}

.trf-ws__kpi--sk {
  align-items: center;
}

.trf-ws__skeleton .trf-ws__formula-bar {
  display: flex;
  align-items: center;
}

.ws-sk--formula-wrap {
  display: flex;
  align-items: center;
}

.ws-sk--rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

.ws-sk--row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
  border-top: 1px solid rgba($primary, 0.05);

  &:first-child { border-top: none; }
}

// ── KPIs row ───────────────────────────────────────────────
.trf-ws__kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;

  @media (min-width: 768px) { grid-template-columns: 1.4fr 1.4fr 1fr 1fr; }
}

.trf-ws__kpi {
  background: white;
  border: 1.5px solid rgba($primary, 0.1);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;

  &--roas {
    border-left-width: 4px;
    &.trf-ws__kpi--green  { border-left-color: #16a34a; background: linear-gradient(135deg, #f0fdf4, white 60%); }
    &.trf-ws__kpi--teal   { border-left-color: #0891b2; background: linear-gradient(135deg, #ecfeff, white 60%); }
    &.trf-ws__kpi--orange { border-left-color: #d97706; background: linear-gradient(135deg, #fffbeb, white 60%); }
    &.trf-ws__kpi--red    { border-left-color: #dc2626; background: linear-gradient(135deg, #fef2f2, white 60%); }
    &.trf-ws__kpi--gray   { border-left-color: #d1d5db; }
  }

  &--progress {
    flex-direction: column;
    gap: 10px;
  }
}

.trf-ws__kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: rgba($primary, 0.08);
  color: $primary;

  &--green { background: #dcfce7; color: #16a34a; }
  &--blue  { background: rgba(#1877f2, 0.1); color: #1877f2; }
}

.trf-ws__kpi-label {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.trf-ws__kpi-big {
  margin: 0 0 4px;
  font-size: 32px;
  font-weight: 900;
  color: $primary-dark;
  line-height: 1;
}

.trf-ws__kpi-value {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 800;
  color: $primary-dark;
}

.trf-ws__kpi-status {
  margin: 0;
  font-size: 12px;
  color: $text-secondary;
  font-weight: 500;
}

.trf-ws__kpi-hint {
  margin: 0;
  font-size: 11px;
  color: $text-secondary;
}

// Gauge
.trf-ws__gauge-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trf-ws__gauge-track {
  flex: 1;
  height: 12px;
  background: #f3f4f6;
  border-radius: 100px;
  overflow: hidden;
}

.trf-ws__gauge-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.6s ease;

  &.fill--green  { background: #16a34a; }
  &.fill--teal   { background: #0891b2; }
  &.fill--orange { background: #d97706; }
  &.fill--red    { background: #dc2626; }
  &.fill--gray   { background: #9ca3af; }
}

.trf-ws__gauge-pct {
  font-size: 14px;
  font-weight: 700;
  color: $primary-dark;
  min-width: 36px;
  text-align: right;
}

.trf-ws__gauge-legend {
  display: flex;
  gap: 8px;
}

.trf-ws__gauge-mark {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 100px;

  &.mark--orange { color: #b45309; background: #fef3c7; }
  &.mark--teal   { color: #0e7490; background: #cffafe; }
  &.mark--green  { color: #15803d; background: #dcfce7; }
}

// ── Formula bar ────────────────────────────────────────────
.trf-ws__formula-bar {
  background: white;
  border: 1.5px solid rgba($primary, 0.1);
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 24px;
}

.trf-ws__formula {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.trf-ws__formula-piece {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 18px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 8px;
  background: #f9fafb;

  small {
    font-size: 10px;
    font-weight: 500;
    color: $text-secondary;
    margin-top: 2px;
  }

  &--green  { color: #15803d; background: #dcfce7; }
  &--blue   { color: #1877f2; background: rgba(#1877f2, 0.1); }
  &--teal   { color: #0e7490; background: #cffafe; }
  &--orange { color: #b45309; background: #fef3c7; }
  &--red    { color: #991b1b; background: #fee2e2; }
}

.trf-ws__formula-op {
  font-size: 22px;
  font-weight: 900;
  color: $text-secondary;
}

.trf-ws__formula-target {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: $primary;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba($primary, 0.08);
  padding: 6px 12px;
  border-radius: 8px;
}

// ── Section ────────────────────────────────────────────────
.trf-ws__section {
  background: white;
  border: 1.5px solid rgba($primary, 0.1);
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 20px;
}

.trf-ws__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.trf-ws__select {
  border: 1.5px solid rgba($primary, 0.2);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  color: $primary-dark;
  background: white;
  cursor: pointer;

  &:focus { outline: none; border-color: $primary; }
}

.trf-ws__link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: $primary;
  text-decoration: none;
  padding: 6px 12px;
  border: 1.5px solid rgba($primary, 0.25);
  border-radius: 8px;
  transition: all 0.15s;

  &:hover { background: rgba($primary, 0.06); border-color: $primary; }
}

.trf-ws__meta-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px;
  color: $text-secondary;
  font-size: 14px;
}

.trf-ws__meta-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: $text-secondary;
  font-size: 14px;
  text-align: center;

  i { font-size: 28px; opacity: 0.4; }
  p { margin: 0; }
}

// Meta KPIs grid
.trf-ws__meta-kpis {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;

  @media (min-width: 500px) { grid-template-columns: repeat(4, 1fr); }
}

.trf-ws__meta-kpi {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trf-ws__meta-kpi-label {
  font-size: 10px;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.trf-ws__meta-kpi-value {
  font-size: 18px;
  font-weight: 800;
  color: $primary-dark;
}

// Campaigns
.trf-ws__campaigns-title {
  font-size: 13px;
  font-weight: 700;
  color: $primary-dark;
  margin: 0 0 12px;
}

.trf-ws__campaign-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trf-ws__campaign-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f9fafb;
  border-radius: 10px;
  padding: 10px 14px;
  flex-wrap: wrap;
}

.trf-ws__campaign-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: $primary-dark;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trf-ws__campaign-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.active { background: #16a34a; }
  &.paused { background: #9ca3af; }
}

.trf-ws__campaign-metrics {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: $text-secondary;
    font-weight: 500;

    i { font-size: 10px; }
  }
}

// ── Billing table ──────────────────────────────────────────
.trf-ws__billing-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid rgba($primary, 0.08);
}

.trf-ws__billing-table {
  width: 100%;
  border-collapse: collapse;

  th {
    background: #f9fafb;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 700;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
    white-space: nowrap;
  }

  td {
    padding: 10px 14px;
    border-top: 1px solid rgba($primary, 0.06);
    font-size: 13px;
    color: $primary-dark;
  }

  tr:hover td { background: rgba($primary, 0.02); }
}

.trf-ws__billing-row--today td {
  background: rgba($primary, 0.04);
  font-weight: 600;
}

.trf-ws__day-date {
  font-weight: 500;
  text-transform: capitalize;
}

.trf-ws__today-pill {
  display: inline-flex;
  margin-left: 6px;
  font-size: 10px;
  font-weight: 700;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 1px 6px;
  border-radius: 100px;
}

.trf-ws__amount-cell {
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  &--meta { color: #1877f2; }
}

.trf-ws__no-data {
  color: $text-secondary;
  font-weight: 400;
}

.trf-ws__count-cell {
  color: $text-secondary;
  text-align: center;
}

.trf-ws__roas-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;

  &.pill--green  { color: #15803d; background: #dcfce7; }
  &.pill--teal   { color: #0e7490; background: #cffafe; }
  &.pill--orange { color: #b45309; background: #fef3c7; }
  &.pill--red    { color: #991b1b; background: #fee2e2; }
}

// ── Quick actions ──────────────────────────────────────────
.trf-ws__quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  @media (min-width: 600px) { grid-template-columns: repeat(4, 1fr); }
}

.trf-ws__action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1.5px solid rgba($primary, 0.12);
  border-radius: 12px;
  padding: 16px 12px;
  text-decoration: none;
  color: $primary-dark;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;

  i { font-size: 20px; color: $primary; }

  &:hover {
    background: rgba($primary, 0.05);
    border-color: $primary;
    transform: translateY(-1px);
  }
}
</style>
