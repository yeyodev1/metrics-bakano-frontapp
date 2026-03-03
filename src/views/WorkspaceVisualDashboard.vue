<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { metaService } from '@/services/meta.service'
import { useUserStore } from '@/stores/user'
import type { Workspace } from '@/types'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js'
import type { ChartOptions, ChartData } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, PointElement, LineElement, BarElement, CategoryScale, LinearScale, Filler)

const route = useRoute()
const userStore = useUserStore()
const workspaceId = route.params.workspaceId as string

const workspace = ref<Workspace | null>(null)
const isLoading = ref(true)
const error = ref('')

// Metrics state
const adsInsights = ref<any[]>([])
const dailySpend = ref<any[]>([])
const datePreset = ref('this_month')
const spendByPlatform = ref<any[]>([])
const isLoadingInsights = ref(false)

const aggregatedMetrics = computed(() => {
  if (!adsInsights.value.length) return null
  let spend = 0
  let clicks = 0
  let impressions = 0
  adsInsights.value.forEach(ad => {
    spend += parseFloat(ad.spend || '0')
    clicks += parseInt(ad.clicks || '0', 10)
    impressions += parseInt(ad.impressions || '0', 10)
  })
  const cpc = clicks > 0 ? (spend / clicks) : 0
  return { spend, clicks, impressions, cpc }
})

// Platform Splits
const fbSpend = computed(() => {
  const fb = spendByPlatform.value.find(p => p.publisher_platform === 'facebook')
  return fb ? parseFloat(fb.spend) : 0
})
const igSpend = computed(() => {
  const ig = spendByPlatform.value.find(p => p.publisher_platform === 'instagram')
  return ig ? parseFloat(ig.spend) : 0
})

// New Metrics Computeds (CTR & CPC over time)
const sortedDailyMetrics = computed(() => {
  return [...dailySpend.value].sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
})

const ctrTimeSeriesData = computed<ChartData<'line'>>(() => {
  const metrics = sortedDailyMetrics.value
  return {
    labels: metrics.map(d => new Date(d.date_start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'CTR (%)',
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      data: metrics.map(d => {
        const clicks = parseInt(d.clicks || '0')
        const impressions = parseInt(d.impressions || '0')
        return impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0
      }),
      fill: true,
      tension: 0.4,
      pointRadius: metrics.length > 20 ? 0 : 4,
      pointBackgroundColor: '#fff'
    }]
  }
})

const cpcTimeSeriesData = computed<ChartData<'line'>>(() => {
  const metrics = sortedDailyMetrics.value
  return {
    labels: metrics.map(d => new Date(d.date_start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'CPC ($)',
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderWidth: 2,
      data: metrics.map(d => {
        const spend = parseFloat(d.spend || '0')
        const clicks = parseInt(d.clicks || '0')
        return clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0
      }),
      fill: true,
      tension: 0.4,
      pointRadius: metrics.length > 20 ? 0 : 4,
      pointBackgroundColor: '#fff'
    }]
  }
})

const engagementData = computed<ChartData<'bar'>>(() => {
  const metrics = sortedDailyMetrics.value
  return {
    labels: metrics.map(d => new Date(d.date_start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Clics',
        backgroundColor: '#7C3AED',
        data: metrics.map(d => parseInt(d.clicks || '0')),
        borderRadius: 4
      },
      {
        label: 'Impresiones (Base 100)',
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        data: metrics.map(d => Math.round(parseInt(d.impressions || '0') / 100)),
        borderRadius: 4
      }
    ]
  }
})

const cprTimeSeriesData = computed<ChartData<'line'>>(() => {
  const metrics = sortedDailyMetrics.value
  return {
    labels: metrics.map(d => new Date(d.date_start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'CPR ($) - Mensajes',
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      data: metrics.map(d => {
        const spend = parseFloat(d.spend || '0')
        // We look for conversation starters as the primary "Result"
        const actions = d.actions || []
        const results = actions.find((a: any) =>
          a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
          a.action_type === 'onsite_conversion.total_messaging_connection'
        )
        const count = results ? parseInt(results.value || '0') : 0
        return count > 0 ? Number((spend / count).toFixed(2)) : 0
      }),
      fill: true,
      tension: 0.4,
      pointRadius: metrics.length > 20 ? 0 : 4,
      pointBackgroundColor: '#fff'
    }]
  }
})

// Chart 1: Time Series (Daily Spend)
const timeSeriesOptions = ref<ChartOptions<'line'>>({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(23, 15, 35, 0.95)',
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      beginAtZero: true,
      ticks: { callback: (val) => '$' + val }
    }
  }
})

const percentageOptions = ref<ChartOptions<'line'>>({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { callback: (val) => val + '%' } }
  }
})

const numericOptions = ref<ChartOptions<'bar' | 'line'>>({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 6 } }
  }
})

const timeSeriesData = computed<ChartData<'line'>>(() => {
  const sortedDaily = [...dailySpend.value].sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
  return {
    labels: sortedDaily.map(d => new Date(d.date_start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Inversión Diaria ($)',
        borderColor: '#7C3AED',
        backgroundColor: function (context: any): any {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return undefined;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
          gradient.addColorStop(1, 'rgba(124, 58, 237, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#7C3AED',
        pointBorderWidth: 2,
        pointRadius: sortedDaily.length > 15 ? 0 : 3,
        data: sortedDaily.map(d => parseFloat(d.spend || '0'))
      }
    ]
  }
})

// Chart 2: Platform Distribution (Pie/Bar)
const platformData = computed<ChartData<'bar'>>(() => {
  return {
    labels: ['Facebook', 'Instagram'],
    datasets: [{
      label: 'Gasto por Plataforma',
      data: [fbSpend.value, igSpend.value],
      backgroundColor: ['#1877F2', '#E1306C'],
      borderRadius: 8,
    }]
  }
})

const platformOptions = ref<ChartOptions<'bar'>>({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { callback: (val) => '$' + val } }
  }
})

async function fetchAdsInsights() {
  if (!workspace.value?.metaAds?.adAccountId) return
  isLoadingInsights.value = true

  // Clear stale data to trigger skeletons immediately
  adsInsights.value = []
  dailySpend.value = []
  spendByPlatform.value = []

  try {
    const data = await metaService.getAdsInsights(workspaceId, workspace.value.metaAds.adAccountId, datePreset.value)
    adsInsights.value = data.insights || []
    dailySpend.value = data.dailySpend || []
    spendByPlatform.value = data.spendByPlatform || []
  } catch (err) {
    console.error('Error fetching insights:', err)
  } finally {
    isLoadingInsights.value = false
  }
}

async function fetchWorkspace() {
  isLoading.value = true
  try {
    const { workspace: data } = await workspaceService.getWorkspace(workspaceId)
    workspace.value = data
    if (data.metaAds?.adAccountId) {
      await fetchAdsInsights()
    }
  } catch (err: any) {
    error.value = err.message || 'Error al cargar el entorno.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchWorkspace)
</script>

<template>
  <div class="visual-dashboard">
    <header class="visual-dashboard__header">
      <div class="visual-dashboard__title-row">
        <div class="visual-dashboard__title-group">
          <h1><i class="fa-solid fa-chart-pie" /> Analítica Visual</h1>
          <div v-if="userStore.role === 'superadmin'" class="visual-dashboard__superadmin-badge">
            <i class="fa-solid fa-shield-check" /> Superadmin Mode
          </div>
        </div>
        <div class="visual-dashboard__date-selector">
          <button 
            :class="{ active: datePreset === 'this_month' }" 
            @click="datePreset = 'this_month'; fetchAdsInsights()"
          >Mes Actual</button>
          <button 
            :class="{ active: datePreset === 'last_30d' }" 
            @click="datePreset = 'last_30d'; fetchAdsInsights()"
          >Últimos 30 días</button>
        </div>
      </div>
    </header>

    <!-- Skeleton Loading (Initial or Refresh) -->
    <div v-if="isLoading || isLoadingInsights" class="visual-dashboard__skeleton">
      <div class="visual-dashboard__skeleton-kpi-grid">
        <div class="visual-dashboard__skeleton-card skeleton-card--hero skeleton-shimmer" />
        <div class="visual-dashboard__skeleton-card skeleton-shimmer" />
        <div class="visual-dashboard__skeleton-card skeleton-shimmer" />
      </div>
      <div class="visual-dashboard__skeleton-charts">
        <div class="visual-dashboard__skeleton-chart skeleton-shimmer" />
        <div class="visual-dashboard__skeleton-chart skeleton-shimmer" />
      </div>
    </div>

    <main v-else class="visual-dashboard__content">

      <!-- High Impact KPIs -->
      <section class="visual-dashboard__kpi-grid">
        <div v-if="aggregatedMetrics" class="visual-dashboard__kpi-card visual-dashboard__kpi-card--hero">
          <span class="label">Inversión Total</span>
          <span class="value">${{ aggregatedMetrics.spend.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</span>
          <div class="indicator success"><i class="fa-solid fa-arrow-trend-up" /> Activo</div>
        </div>
        <div v-if="aggregatedMetrics" class="visual-dashboard__kpi-card">
          <span class="label">Costo por Clic</span>
          <span class="value">${{ aggregatedMetrics.cpc.toFixed(2) }}</span>
        </div>
        <div v-if="aggregatedMetrics" class="visual-dashboard__kpi-card">
          <span class="label">Alcance (Impresiones)</span>
          <span class="value">{{ aggregatedMetrics.impressions.toLocaleString() }}</span>
        </div>
      </section>

      <!-- Graphical Layout -->
      <div class="visual-dashboard__charts-layout">
        <div class="visual-dashboard__chart-item visual-dashboard__chart-item--main">
          <div class="visual-dashboard__chart-header">
            <h3><i class="fa-solid fa-money-bill-trend-up" /> Evolución de Inversión Diaria</h3>
          </div>
          <div class="chart-container">
            <Line :data="timeSeriesData" :options="timeSeriesOptions" />
          </div>
        </div>

        <div class="visual-dashboard__chart-item">
          <div class="visual-dashboard__chart-header">
            <h3><i class="fa-solid fa-layer-group" /> Canales</h3>
          </div>
          <div class="chart-container">
            <Bar :data="platformData" :options="platformOptions" />
          </div>
        </div>

        <div class="visual-dashboard__chart-item">
          <div class="visual-dashboard__chart-header">
            <h3><i class="fa-solid fa-bolt" /> Efectividad (CTR %)</h3>
          </div>
          <div class="chart-container">
            <Line :data="ctrTimeSeriesData" :options="percentageOptions" />
          </div>
        </div>

        <div class="visual-dashboard__chart-item">
          <div class="visual-dashboard__chart-header">
            <h3><i class="fa-solid fa-hand-pointer" /> Engagement (Clics vs Imp/100)</h3>
          </div>
          <div class="chart-container">
            <Bar :data="engagementData" :options="numericOptions" />
          </div>
        </div>

        <div class="visual-dashboard__chart-item visual-dashboard__chart-item--full">
          <div class="visual-dashboard__chart-header">
            <h3><i class="fa-solid fa-bullseye" /> Evolución del CPR (Costo por Resultado)</h3>
          </div>
          <div class="chart-container chart-container--wide">
            <Line :data="cprTimeSeriesData" :options="timeSeriesOptions" />
          </div>
        </div>

        <div class="visual-dashboard__chart-item visual-dashboard__chart-item--full">
          <div class="visual-dashboard__chart-header">
            <h3><i class="fa-solid fa-tags" /> Evolución del CPC</h3>
          </div>
          <div class="chart-container chart-container--wide">
            <Line :data="cpcTimeSeriesData" :options="timeSeriesOptions" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.visual-dashboard {
  padding: 1rem; // Mobile first padding
  background: #f8f9fc;
  min-height: 100vh;

  @media (min-width: 768px) {
    padding: 2.5rem;
  }

  &__header {
    margin-bottom: 2rem;
  }

  &__title-row {
    display: flex;
    flex-direction: column; // Stack on mobile
    gap: 1.5rem;
    align-items: flex-start;

    @media (min-width: 768px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  &__title-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    @media (min-width: 1024px) {
      flex-direction: row;
      align-items: center;
      gap: 1.5rem;
    }

    h1 {
      font-size: 1.5rem;
      color: $primary-dark;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;

      @media (min-width: 768px) {
        font-size: 1.8rem;
      }

      i {
        color: $primary;
      }
    }
  }

  &__superadmin-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.05) 100%);
    color: $primary;
    border: 1px solid rgba($primary, 0.2);
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    animation: fadeIn 0.5s ease-out;

    i {
      font-size: 0.9rem;
    }
  }

  &__date-selector {
    display: flex;
    background: rgba($primary-dark, 0.05);
    padding: 4px;
    border-radius: 12px;
    gap: 4px;
    width: 100%; // Full width on mobile

    @media (min-width: 768px) {
      width: auto;
    }

    button {
      flex: 1; // Equal width on mobile
      border: none;
      background: transparent;
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
      font-weight: 700;
      color: $text-secondary;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;

      @media (min-width: 768px) {
        flex: none;
        padding: 0.6rem 1.2rem;
      }

      &:hover {
        color: $primary-dark;
      }

      &.active {
        background: $white;
        color: $primary;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
    }
  }

  &__kpi-grid {
    display: grid;
    grid-template-columns: 1fr; // Stack on mobile
    gap: 1rem;
    margin-bottom: 1.5rem;

    @media (min-width: 1024px) {
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
  }

  &__kpi-card {
    background: $white;
    padding: 1.25rem;
    border-radius: 20px;
    border: 1px solid rgba($primary-dark, 0.04);
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);

    @media (min-width: 768px) {
      padding: 1.5rem;
    }

    .label {
      font-size: 0.85rem;
      color: $text-secondary;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }

    .value {
      font-size: 1.5rem;
      font-weight: 800;
      color: $primary-dark;

      @media (min-width: 768px) {
        font-size: 1.8rem;
      }
    }

    &--hero {
      background: linear-gradient(135deg, $white 0%, rgba($primary, 0.05) 100%);
      position: relative;
      overflow: hidden;

      .value {
        font-size: 2rem;
        color: $primary;

        @media (min-width: 768px) {
          font-size: 2.8rem;
        }
      }

      .indicator {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.25rem 0.6rem;
        border-radius: 100px;

        @media (min-width: 768px) {
          top: 1.5rem;
          right: 1.5rem;
          font-size: 0.8rem;
          padding: 0.3rem 0.8rem;
        }

        &.success {
          background: rgba($BAKANO-GREEN, 0.1);
          color: $BAKANO-GREEN;
        }
      }
    }
  }

  &__charts-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;

    @media (min-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 1400px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__chart-item {
    background: $white;
    padding: 1.25rem;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba($primary-dark, 0.04);
    display: flex;
    flex-direction: column;

    &--main {
      @media (min-width: 1024px) {
        grid-column: span 2;
      }
    }

    &--full {
      @media (min-width: 1024px) {
        grid-column: 1 / -1;
      }
    }

    @media (min-width: 768px) {
      padding: 1.75rem;
      border-radius: 24px;
    }

    h3 {
      margin: 0;
      font-size: 1rem;
      color: $primary-dark;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      i {
        color: rgba($primary, 0.6);
        font-size: 0.9rem;
      }

      @media (min-width: 768px) {
        font-size: 1.05rem;
      }
    }
  }

  &__chart-header {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chart-container {
    height: 280px;
    width: 100%;

    @media (min-width: 768px) {
      height: 320px;
    }

    &--wide {
      @media (min-width: 768px) {
        height: 380px;
      }
    }
  }

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  &__skeleton-kpi-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @media (min-width: 1024px) {
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1.5rem;
    }
  }

  &__skeleton-card {
    height: 120px;
    background: rgba($white, 0.5);
    border-radius: 20px;
    border: 1px solid rgba($primary-dark, 0.05);

    &--hero {
      height: 140px;

      @media (min-width: 768px) {
        height: 160px;
      }
    }
  }

  &__skeleton-charts {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;

    @media (min-width: 1200px) {
      grid-template-columns: 2fr 1fr;
    }
  }

  &__skeleton-chart {
    height: 350px;
    background: rgba($white, 0.5);
    border-radius: 24px;
    border: 1px solid rgba($primary-dark, 0.05);

    @media (min-width: 768px) {
      height: 480px;
    }
  }

  .skeleton-shimmer {
    position: relative;
    overflow: hidden;
    background-color: rgba($primary-dark, 0.03);

    &::after {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background-image: linear-gradient(90deg,
          rgba(255, 255, 255, 0) 0,
          rgba(255, 255, 255, 0.2) 20%,
          rgba(255, 255, 255, 0.5) 60%,
          rgba(255, 255, 255, 0));
      animation: shimmer 2s infinite;
      content: '';
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: relative;

    @media (min-width: 768px) {
      gap: 2rem;
    }
  }

  &__insights-loader {
    position: absolute;
    inset: -0.5rem;
    background: rgba($white, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    border-radius: 20px;
    transition: all 0.3s ease;

    @media (min-width: 768px) {
      inset: -1rem;
      border-radius: 24px;
    }
  }

  &__loader-card {
    background: $white;
    padding: 1.5rem;
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    border: 1px solid rgba($primary, 0.1);
    width: 80%;
    max-width: 320px;

    @media (min-width: 768px) {
      padding: 2rem 3rem;
      border-radius: 20px;
      width: auto;
      gap: 1.5rem;
    }

    span {
      font-size: 0.9rem;
      font-weight: 700;
      color: $primary-dark;
      letter-spacing: -0.01em;
      text-align: center;

      @media (min-width: 768px) {
        font-size: 1rem;
      }
    }

    .spinner {
      width: 32px;
      height: 32px;
      border-width: 3px;

      @media (min-width: 768px) {
        width: 40px;
        height: 40px;
        border-width: 4px;
      }
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .is-refreshing {
    opacity: 0.6;
    pointer-events: none;
    filter: grayscale(0.2);
    transition: opacity 0.3s ease;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba($primary, 0.1);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;

    @media (min-width: 768px) {
      width: 50px;
      height: 50px;
      border-width: 5px;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
