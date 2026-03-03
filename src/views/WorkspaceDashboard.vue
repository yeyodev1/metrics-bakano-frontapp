<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { metaService } from '@/services/meta.service'
import { useUserStore } from '@/stores/user'
import type { Workspace, ApiError } from '@/types'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale, Filler } from 'chart.js'
import type { ChartOptions, ChartData } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale, Filler)
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workspaceId = route.params.workspaceId as string

const workspace = ref<Workspace | null>(null)
const isLoading = ref(true)
const error = ref('')

// 2. Metrics & Insight state
const adsInsights = ref<any[]>([])
const dailySpend = ref<any[]>([])
const datePreset = ref('this_month')
const spendByPlatform = ref<any[]>([])
const adsSpendByPlatform = ref<any[]>([])
const isLoadingInsights = ref(false)

const pageInfo = ref<any>(null)
const igInfo = ref<any>(null)
const recentPosts = ref<any[]>([])
const recentPostsIg = ref<any[]>([])
const isLoadingOrganic = ref(false)

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

const fbSpend = computed(() => {
  if (!spendByPlatform.value.length) return 0
  const fb = spendByPlatform.value.find(p => p.publisher_platform === 'facebook')
  return fb ? parseFloat(fb.spend) : 0
})

const igSpend = computed(() => {
  if (!spendByPlatform.value.length) return 0
  const ig = spendByPlatform.value.find(p => p.publisher_platform === 'instagram')
  return ig ? parseFloat(ig.spend) : 0
})

const totalPlatformSpend = computed(() => fbSpend.value + igSpend.value)
const fbSpendPercent = computed(() => totalPlatformSpend.value ? (fbSpend.value / totalPlatformSpend.value) * 100 : 0)
const igSpendPercent = computed(() => totalPlatformSpend.value ? (igSpend.value / totalPlatformSpend.value) * 100 : 0)

// Metrics Helpers
function getPurchaseROAS(ad: any) {
  if (!ad.purchase_roas) return '0.00'
  const roas = ad.purchase_roas.find((r: any) => r.action_type === 'omni_purchase') || ad.purchase_roas[0]
  return roas ? parseFloat(roas.value).toFixed(2) : '0.00'
}

function getCPA(ad: any) {
  if (!ad.cost_per_action_type) return '0.00'
  const cpa = ad.cost_per_action_type.find((c: any) => c.action_type === 'omni_purchase') || ad.cost_per_action_type[0]
  return cpa ? parseFloat(cpa.value).toFixed(2) : '0.00'
}

function getPurchases(ad: any) {
  if (!ad.actions) return '0'
  const purchases = ad.actions.find((a: any) => a.action_type === 'omni_purchase' || a.action_type.includes('purchase'))
  return purchases ? purchases.value : '0'
}

function getAdFbSpend(adId: string) {
  if (!adsSpendByPlatform.value.length) return 0
  const fb = adsSpendByPlatform.value.find(p => p.ad_id === adId && p.publisher_platform === 'facebook')
  return fb ? parseFloat(fb.spend) : 0
}

function getAdIgSpend(adId: string) {
  if (!adsSpendByPlatform.value.length) return 0
  const ig = adsSpendByPlatform.value.find(p => p.ad_id === adId && p.publisher_platform === 'instagram')
  return ig ? parseFloat(ig.spend) : 0
}

// Chart Settings
const chartOptions = ref<ChartOptions<'line'>>({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(23, 15, 35, 0.95)',
      padding: 12,
      titleFont: { size: 13, family: "'Inter', sans-serif", weight: 'bold' },
      bodyFont: { size: 14, family: "'Inter', sans-serif" },
      cornerRadius: 8,
      displayColors: true,
      usePointStyle: true,
    }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#6b7280' }
    },
    y: {
      grid: { color: 'rgba(0, 0, 0, 0.05)', tickLength: 0 },
      border: { dash: [4, 4], display: false },
      ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#6b7280', callback: (val: any) => '$' + val },
      beginAtZero: true
    }
  },
  elements: {
    line: {
      tension: 0.4 // Smooth curves
    }
  }
})

const chartData = computed<ChartData<'line'>>(() => {
  // If we have dailySpend data, use it for a time-series chart (Metricool style)
  if (dailySpend.value.length) {
    // Sort by date to ensure the line goes from left to right
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
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#7C3AED',
          pointBorderWidth: 2,
          pointRadius: sortedDaily.length > 15 ? 0 : 3, // Hide points if too many for cleaner look
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
          data: sortedDaily.map(d => parseFloat(d.spend || '0'))
        }
      ]
    }
  }

  // Fallback to per-ad spend if daily data is not available
  const topAds = [...adsInsights.value].sort((a, b) => parseFloat(b.spend || '0') - parseFloat(a.spend || '0')).slice(0, 8)

  return {
    labels: topAds.map(ad => ad.ad_name ? (ad.ad_name.length > 20 ? ad.ad_name.substring(0, 20) + '...' : ad.ad_name) : 'Sin nombre'),
    datasets: [
      {
        label: 'Inversión ($)',
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        borderWidth: 2,
        data: topAds.map(ad => parseFloat(ad.spend || '0'))
      }
    ]
  }
})



// 3. Methods
async function fetchAdsInsights() {
  if (!workspace.value?.metaAds?.adAccountId) return;
  isLoadingInsights.value = true
  try {
    // We pass the currently selected datePreset
    const data = await metaService.getAdsInsights(workspaceId, workspace.value.metaAds.adAccountId, datePreset.value)
    adsInsights.value = data.insights || []
    dailySpend.value = data.dailySpend || []
    spendByPlatform.value = data.spendByPlatform || []
    adsSpendByPlatform.value = data.adsSpendByPlatform || []
  } catch (err) {
    console.error('Error fetching insights:', err)
  } finally {
    isLoadingInsights.value = false
  }
}

async function fetchOrganicInsights() {
  if (!workspace.value?.metaAds?.pageId) return;
  isLoadingOrganic.value = true
  try {
    const data = await metaService.getOrganicInsights(workspaceId)
    pageInfo.value = data.pageInfo
    igInfo.value = data.igInfo
    recentPosts.value = data.recentPosts || []
    recentPostsIg.value = data.recentPostsIg || []
  } catch (err) {
    console.error('Error fetching organic insights:', err)
  } finally {
    isLoadingOrganic.value = false
  }
}

async function fetchWorkspace() {
  isLoading.value = true
  error.value = ''
  try {
    const { workspace: data } = await workspaceService.getWorkspace(workspaceId)
    workspace.value = data
    if (data.metaAds?.adAccountId) {
      void fetchAdsInsights()
    }
    if (data.metaAds?.pageId) {
      void fetchOrganicInsights()
    }
  } catch (err: unknown) {
    const e = err as ApiError
    error.value = e.message || 'Error al cargar el entorno.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchWorkspace()
})
</script>

<template>
  <div class="workspace-dashboard">
    <!-- Header Context -->
    <header class="workspace-dashboard__header">
      <div class="workspace-dashboard__context">
        <div class="workspace-dashboard__ws-info">
          <i class="fa-solid fa-layer-group" />
          <h1 v-if="workspace">{{ workspace.name }}</h1>
          <span v-else-if="isLoading">Cargando...</span>
        </div>
        
        <div v-if="userStore.role === 'superadmin'" class="workspace-dashboard__superadmin-badge">
          <i class="fa-solid fa-shield-check" /> Superadmin Mode
        </div>
      </div>

      <div class="workspace-dashboard__nav-actions">
        <button class="workspace-dashboard__btn-ghost" @click="router.push({ name: 'WorkspaceSettings', params: { workspaceId } })" title="Configurar Entorno">
          <i class="fa-solid fa-gear" />
          <span class="workspace-dashboard__nav-text">Ajustes</span>
        </button>  
        <button v-if="userStore.role === 'superadmin'" class="workspace-dashboard__back-btn" @click="router.push({ name: 'SuperadminDashboard' })">
          <i class="fa-solid fa-arrow-left" />
          <span class="workspace-dashboard__nav-text">Volver a Global</span>
        </button>
      </div>
    </header>

    <!-- Initial Skeleton Loading -->
    <div v-if="isLoading" class="workspace-dashboard__skeleton">
      <div class="workspace-dashboard__skeleton-row skeleton-shimmer" style="height: 180px; border-radius: 20px;" />
      <div class="workspace-dashboard__skeleton-grid">
        <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
        <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
        <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
      </div>
      <div class="workspace-dashboard__skeleton-row skeleton-shimmer" style="height: 400px; border-radius: 24px;" />
    </div>

    <div v-else-if="error" class="workspace-dashboard__error-state">
      <i class="fa-solid fa-circle-exclamation" />
      <p>{{ error }}</p>
      <button @click="router.push({ name: 'SuperadminDashboard' })">Volver al Dashboard</button>
    </div>

    <main v-else class="workspace-dashboard__content">
      <!-- Welcome Card -->
      <section class="workspace-dashboard__welcome-card">
        <div class="workspace-dashboard__welcome-text">
          <h2>¡Bienvenido al entorno operativo!</h2>
          <p>Desde aquí podrás gestionar tus campañas y conectar tus fuentes de datos.</p>
        </div>
        <div class="workspace-dashboard__illustrations">
          <i class="fa-solid fa-chart-line" />
        </div>
      </section>

      <!-- DASHBOARD DE MÉTRICAS (SOLO SI TIENE C/P) -->
      <section v-if="workspace?.metaAds?.adAccountId" class="workspace-dashboard__metrics-section">
        <div class="workspace-dashboard__metrics-header">
          <div class="workspace-dashboard__metrics-title">
            <h2><i class="fa-solid fa-chart-pie" /> Rendimiento de Campañas</h2>
            <div class="workspace-dashboard__date-selector">
              <button 
                class="workspace-dashboard__date-btn" 
                :class="{ 'workspace-dashboard__date-btn--active': datePreset === 'this_month' }"
                @click="datePreset = 'this_month'; fetchAdsInsights();"
              >
                Mes Actual
              </button>
              <button 
                class="workspace-dashboard__date-btn" 
                :class="{ 'workspace-dashboard__date-btn--active': datePreset === 'last_30d' }"
                @click="datePreset = 'last_30d'; fetchAdsInsights();"
              >
                Últimos 30 días
              </button>
            </div>
          </div>
        </div>

        <!-- Initial or Refresh Insights Skeleton Loading -->
        <div v-if="isLoadingInsights && !aggregatedMetrics" class="workspace-dashboard__skeleton-grid" style="margin-top: 2rem;">
          <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
          <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
          <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
        </div>

        <div v-else-if="isLoadingInsights && aggregatedMetrics" class="workspace-dashboard__skeleton-grid" style="margin-top: 2rem;">
          <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
          <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
          <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
        </div>

        <div v-if="!isLoadingInsights && !aggregatedMetrics" class="workspace-dashboard__metrics-empty">
          <i class="fa-solid fa-chart-column" />
          <p>No se encontraron datos de campañas gastando en el periodo seleccionado.</p>
        </div>

        <div v-else class="workspace-dashboard__metrics-container">
          <div v-if="aggregatedMetrics" class="workspace-dashboard__kpi-grid">
            <!-- KPI: Inversión -->
            <div class="workspace-dashboard__kpi-card" :class="{ 'workspace-dashboard__kpi-card--spend-detailed': totalPlatformSpend > 0 }">
              <div class="workspace-dashboard__kpi-main-info">
                <div class="workspace-dashboard__kpi-icon workspace-dashboard__kpi-icon--spend">
                  <i class="fa-solid fa-money-bill-trend-up" />
                </div>
                <div class="workspace-dashboard__kpi-data">
                  <span class="workspace-dashboard__kpi-label">Inversión Total</span>
                  <span class="workspace-dashboard__kpi-value">${{ aggregatedMetrics.spend.toFixed(2) }}</span>
                </div>
              </div>

              <div v-if="totalPlatformSpend > 0" class="workspace-dashboard__kpi-platform-split">
                <div class="workspace-dashboard__split-bar">
                  <div class="workspace-dashboard__split-segment workspace-dashboard__split-segment--fb" :style="{ width: fbSpendPercent + '%' }"></div>
                  <div class="workspace-dashboard__split-segment workspace-dashboard__split-segment--ig" :style="{ width: igSpendPercent + '%' }"></div>
                </div>
                <div class="workspace-dashboard__split-labels">
                  <span v-if="fbSpend > 0" class="workspace-dashboard__split-label workspace-dashboard__split-label--fb">
                    <i class="fa-brands fa-facebook" /> ${{ fbSpend.toFixed(2) }}
                    <small>({{ Math.round(fbSpendPercent) }}%)</small>
                  </span>
                  <span v-if="igSpend > 0" class="workspace-dashboard__split-label workspace-dashboard__split-label--ig">
                    <i class="fa-brands fa-instagram" /> ${{ igSpend.toFixed(2) }}
                    <small>({{ Math.round(igSpendPercent) }}%)</small>
                  </span>
                </div>
              </div>
            </div>
            
            <!-- KPI: Clicks -->
            <div class="workspace-dashboard__kpi-card">
              <div class="workspace-dashboard__kpi-icon workspace-dashboard__kpi-icon--clicks">
                <i class="fa-solid fa-hand-pointer" />
              </div>
              <div class="workspace-dashboard__kpi-data">
                <span class="workspace-dashboard__kpi-label">Clics Totales</span>
                <span class="workspace-dashboard__kpi-value">{{ aggregatedMetrics.clicks.toLocaleString() }}</span>
              </div>
            </div>

            <!-- KPI: CPC -->
            <div class="workspace-dashboard__kpi-card">
              <div class="workspace-dashboard__kpi-icon workspace-dashboard__kpi-icon--cpc">
                <i class="fa-solid fa-bullseye" />
              </div>
              <div class="workspace-dashboard__kpi-data">
                <span class="workspace-dashboard__kpi-label">Costo por Clic (CPC)</span>
                <span class="workspace-dashboard__kpi-value">${{ aggregatedMetrics.cpc.toFixed(2) }}</span>
              </div>
            </div>

            <!-- KPI: Impresiones -->
            <div class="workspace-dashboard__kpi-card">
              <div class="workspace-dashboard__kpi-icon workspace-dashboard__kpi-icon--impressions">
                <i class="fa-solid fa-eye" />
              </div>
              <div class="workspace-dashboard__kpi-data">
                <span class="workspace-dashboard__kpi-label">Impresiones</span>
                <span class="workspace-dashboard__kpi-value">{{ aggregatedMetrics.impressions.toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- GRÁFICO DE RENDIMIENTO -->
          <section v-if="adsInsights.length" class="workspace-dashboard__chart-section">
            <div class="workspace-dashboard__chart-header">
              <h2><i class="fa-solid fa-ranking-star" /> Tendencia de Inversión por Anuncio (Top 8)</h2>
            </div>
            <div class="workspace-dashboard__chart-container">
              <Line :data="chartData" :options="chartOptions" />
            </div>
          </section>

          <!-- TABLA DETALLADA DE ANUNCIOS -->
          <section v-if="adsInsights.length" class="workspace-dashboard__ads-list-section">
            <div class="workspace-dashboard__ads-header">
              <h2><i class="fa-solid fa-list-ul" /> Desglose por Anuncio</h2>
            </div>
            
            <div class="workspace-dashboard__table-container">
              <table class="workspace-dashboard__ads-table">
                <thead>
                  <tr>
                    <th>Campaña & Anuncio</th>
                    <th>Inversión</th>
                    <th>Compras</th>
                    <th>CPA</th>
                    <th>ROAS</th>
                    <th>Clics / CPC</th>
                    <th>Impresiones</th>
                    <th>Ver</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ad in adsInsights" :key="ad.ad_id" class="workspace-dashboard__ad-row">
                    <td>
                      <div class="workspace-dashboard__ad-identity">
                        <span class="workspace-dashboard__ad-campaign"><i class="fa-solid fa-folder-open" /> {{ ad.campaign_name || 'Desconocida' }}</span>
                        <strong class="workspace-dashboard__ad-name">{{ ad.ad_name || 'Anuncio sin nombre' }}</strong>
                        <span class="workspace-dashboard__ad-id">ID: {{ ad.ad_id }}</span>
                      </div>
                    </td>
                    <td class="workspace-dashboard__ad-numeric">
                      <div class="workspace-dashboard__ad-spend">
                        <strong>${{ parseFloat(ad.spend || 0).toFixed(2) }}</strong>
                        <div v-if="getAdFbSpend(ad.ad_id) || getAdIgSpend(ad.ad_id)" class="workspace-dashboard__ad-spend-breakdown">
                          <span v-if="getAdFbSpend(ad.ad_id)"><i class="fa-brands fa-facebook"></i> ${{ getAdFbSpend(ad.ad_id).toFixed(2) }}</span>
                          <span v-if="getAdIgSpend(ad.ad_id)"><i class="fa-brands fa-instagram"></i> ${{ getAdIgSpend(ad.ad_id).toFixed(2) }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="workspace-dashboard__ad-numeric">
                      <span class="workspace-dashboard__badge--purchases">{{ getPurchases(ad) }}</span>
                    </td>
                    <td class="workspace-dashboard__ad-numeric">
                      <strong>${{ getCPA(ad) }}</strong>
                    </td>
                    <td class="workspace-dashboard__ad-numeric">
                      <span class="workspace-dashboard__badge--roas" :class="{ 'warning': parseFloat(getPurchaseROAS(ad)) < 2, 'success': parseFloat(getPurchaseROAS(ad)) >= 2 }">
                        {{ getPurchaseROAS(ad) }}x
                      </span>
                    </td>
                    <td>
                      <div class="workspace-dashboard__ad-clics-info">
                        <strong>{{ parseInt(ad.clicks || 0).toLocaleString() }}</strong> clics
                        <span class="workspace-dashboard__small-cpc">(${{ parseFloat(ad.cpc || 0).toFixed(2) }})</span>
                      </div>
                    </td>
                    <td class="workspace-dashboard__ad-numeric">
                      {{ parseInt(ad.impressions || 0).toLocaleString() }}
                    </td>
                    <td>
                      <a :href="`https://adsmanager.facebook.com/adsmanager/manage/ads?act=${workspace?.metaAds?.adAccountId?.replace('act_', '')}&selected_ad_ids=${ad.ad_id}`" target="_blank" class="workspace-dashboard__ad-link-btn" title="Ver en Facebook Ad Manager">
                        <i class="fa-solid fa-arrow-up-right-from-square" />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <!-- DASHBOARD ORGÁNICO -->
      <section v-if="workspace?.metaAds?.pageId" class="workspace-dashboard__organic-section">
        <div class="workspace-dashboard__metrics-header">
          <h2><i class="fa-solid fa-users" /> Resumen de Comunidad Orgánica</h2>
        </div>

        <!-- Organic Metrics Skeleton Loading -->
        <div v-if="isLoadingOrganic" class="workspace-dashboard__skeleton-grid">
          <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
          <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
          <div class="workspace-dashboard__skeleton-card skeleton-shimmer" />
        </div>

        <div v-else-if="pageInfo" class="workspace-dashboard__kpi-grid">
          <!-- KPI: Followers -->
          <div class="workspace-dashboard__kpi-card">
            <div class="workspace-dashboard__kpi-icon workspace-dashboard__kpi-icon--clicks" style="color: #1877F2; background: rgba(24, 119, 242, 0.1);">
              <i class="fa-brands fa-facebook" />
            </div>
            <div class="workspace-dashboard__kpi-data">
              <span class="workspace-dashboard__kpi-label">Seguidores FB</span>
              <span class="workspace-dashboard__kpi-value">{{ parseInt(pageInfo.followers_count || 0).toLocaleString() }}</span>
            </div>
          </div>
          
          <!-- KPI: IG Followers -->
          <div v-if="igInfo" class="workspace-dashboard__kpi-card">
            <div class="workspace-dashboard__kpi-icon workspace-dashboard__kpi-icon--ig" style="color: #E4405F; background: rgba(228, 64, 95, 0.1);">
              <i class="fa-brands fa-instagram" />
            </div>
            <div class="workspace-dashboard__kpi-data">
              <span class="workspace-dashboard__kpi-label">Seguidores (@{{ igInfo.username }})</span>
              <span class="workspace-dashboard__kpi-value">{{ parseInt(igInfo.followers_count || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- TABLA DE PUBLICACIONES RECIENTES FACEBOOK -->
      <section v-if="workspace?.metaAds?.pageId && !isLoadingOrganic && recentPosts.length" class="workspace-dashboard__ads-list-section workspace-dashboard__ads-list-section--organic">
        <div class="workspace-dashboard__ads-header">
          <h2><i class="fa-brands fa-facebook" style="color: #1877F2;"/> Últimas 5 Publicaciones Facebook</h2>
        </div>
        
        <div class="workspace-dashboard__table-container">
          <table class="workspace-dashboard__ads-table">
            <thead>
              <tr>
                <th>Publicación</th>
                <th>Fecha</th>
                <th>Compartidos</th>
                <th>Ver Post</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in recentPosts" :key="post.id" class="workspace-dashboard__ad-row">
                <td>
                  <div class="workspace-dashboard__post-identity">
                    <img v-if="post.full_picture" :src="post.full_picture" class="workspace-dashboard__post-img" alt="Post img"/>
                    <div v-else class="workspace-dashboard__post-img-placeholder"><i class="fa-solid fa-file-lines" /></div>
                    <div class="workspace-dashboard__post-text">
                       <span class="workspace-dashboard__post-msg">{{ post.message ? (post.message.length > 50 ? post.message.substring(0, 50) + '...' : post.message) : 'Sin texto / Solo elemento visual' }}</span>
                       <span class="workspace-dashboard__ad-id">ID: {{ post.id }}</span>
                    </div>
                  </div>
                </td>
                <td class="workspace-dashboard__ad-numeric">
                  {{ new Date(post.created_time).toLocaleDateString() }}
                </td>
                <td class="workspace-dashboard__ad-numeric">
                  <strong><i class="fa-solid fa-share"/> {{ post.shares?.count || 0 }}</strong>
                </td>
                <td>
                  <a v-if="post.permalink_url" :href="post.permalink_url" target="_blank" class="workspace-dashboard__ad-link-btn" title="Ver en Facebook">
                    <i class="fa-solid fa-arrow-up-right-from-square" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <!-- TABLA DE PUBLICACIONES RECIENTES INSTAGRAM -->
      <section v-if="workspace?.metaAds?.pageId && !isLoadingOrganic && recentPostsIg.length" class="workspace-dashboard__ads-list-section workspace-dashboard__ads-list-section--organic">
        <div class="workspace-dashboard__ads-header">
          <h2><i class="fa-brands fa-instagram" style="color: #E4405F;"/> Últimas 5 Publicaciones Instagram</h2>
        </div>
        
        <div class="workspace-dashboard__table-container">
          <table class="workspace-dashboard__ads-table">
            <thead>
              <tr>
                <th>Publicación</th>
                <th>Fecha</th>
                <th>Me gusta / Comentarios</th>
                <th>Ver Post</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in recentPostsIg" :key="post.id" class="workspace-dashboard__ad-row">
                <td>
                  <div class="workspace-dashboard__post-identity">
                    <img v-if="post.media_url" :src="post.media_url" class="workspace-dashboard__post-img" alt="Post img"/>
                    <div v-else class="workspace-dashboard__post-img-placeholder"><i class="fa-solid fa-file-lines" /></div>
                    <div class="workspace-dashboard__post-text">
                       <span class="workspace-dashboard__post-msg">{{ post.caption ? (post.caption.length > 50 ? post.caption.substring(0, 50) + '...' : post.caption) : 'Sin texto' }}</span>
                       <span class="workspace-dashboard__ad-id">ID: {{ post.id }}</span>
                    </div>
                  </div>
                </td>
                <td class="workspace-dashboard__ad-numeric">
                  {{ new Date(post.timestamp).toLocaleDateString() }}
                </td>
                <td class="workspace-dashboard__ad-numeric">
                  <strong><i class="fa-solid fa-heart" style="color: #E4405F; margin-right: 4px;"/> {{ post.like_count || 0 }}</strong>
                  <span style="opacity: 0.5; margin: 0 8px;">|</span>
                  <strong><i class="fa-solid fa-comment" style="color: #3b82f6; margin-right: 4px;"/> {{ post.comments_count || 0 }}</strong>
                </td>
                <td>
                  <a v-if="post.permalink" :href="post.permalink" target="_blank" class="workspace-dashboard__ad-link-btn" title="Ver en Instagram">
                    <i class="fa-solid fa-arrow-up-right-from-square" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Pantalla Vacía si no hay Integraciones -->
      <section v-if="!workspace?.metaAds?.pageId" class="workspace-dashboard__empty-setup">
        <div class="workspace-dashboard__setup-illustration">
          <i class="fa-solid fa-chart-line" />
        </div>
        <h3>No hay fuentes de datos conectadas</h3>
        <p>Para visualizar tus métricas y KPIs, primero debes conectar Meta Ads en la configuración de tu entorno.</p>
        <button class="workspace-dashboard__btn-primary-lg" @click="router.push({ name: 'WorkspaceSettings', params: { workspaceId } })">
          <i class="fa-solid fa-gear" /> Ir a Configuración
        </button>
      </section>

    </main>
  </div>
</template>

<style lang="scss" scoped>
.workspace-dashboard {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 1600px;
  margin: 0;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.08);
  }

  &__nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__nav-text {
    @media (max-width: 600px) {
      display: none;
    }
  }

  &__context {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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

  &__ws-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    i {
      color: $primary;
      font-size: 1.5rem;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      color: $primary-dark;
    }
  }

  &__super-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: $text-secondary;
    padding: 0.25rem 0.75rem;
    background: rgba($alert-warning, 0.1);
    border-radius: 6px;
    width: fit-content;

    i {
      color: $alert-warning;
    }

    strong {
      color: $primary-dark;
    }
  }

  &__back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba($primary-dark, 0.1);
    background: $white;
    color: $text-secondary;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary-dark, 0.03);
      color: $primary-dark;
    }
  }

  &__btn-ghost {
    background: transparent;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: $primary-dark;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary-dark, 0.05);
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  &__empty-setup {
    background: $white;
    padding: 4rem 2rem;
    border-radius: 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: $text-secondary;
    border: 1px dashed rgba($primary-dark, 0.15);

    h3 {
      color: $primary-dark;
      margin: 0;
      font-size: 1.4rem;
    }

    p {
      max-width: 400px;
      margin: 0 0 1rem;
    }
  }

  &__btn-primary-lg {
    background: $primary;
    color: $white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    &:hover {
      opacity: 0.9;
    }
  }

  &__setup-illustration {
    width: 80px;
    height: 80px;
    background: rgba($primary, 0.1);
    color: $primary;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  &__welcome-card {
    background: linear-gradient(135deg, $primary-dark 0%, #2a223c 100%);
    color: $white;
    padding: 2.5rem;
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    p {
      margin: 0;
      opacity: 0.8;
    }
  }

  &__illustrations {
    font-size: 4rem;
    opacity: 0.2;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.5rem;
  }

  &__card {
    background: $white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba($primary-dark, 0.05);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);

    h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    p {
      margin: 0;
      color: $text-secondary;
      font-size: 0.9rem;
      line-height: 1.5;
      flex: 1;
    }

    &--disabled {
      opacity: 0.7;
      background: #fafafa;

      button {
        background: #ddd;
        color: #888;
        cursor: not-allowed;
        border: none;
        padding: 0.75rem;
        border-radius: 8px;
        width: 100%;
        font-weight: 600;
      }
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__icon-meta,
  &__icon-google {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  &__icon-meta {
    background: rgba(#1877f2, 0.1);
    color: #1877f2;
  }

  &__icon-google {
    background: rgba(#db4437, 0.1);
    color: #db4437;
  }

  &__btn-meta {
    background: $primary;
    color: $white;
    border: none;
    padding: 0.8rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($primary, 0.3);
    }
  }

  &__loading,
  &__error-state {
    padding: 5rem 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  &__spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba($primary, 0.1);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
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

  // ── Meta Ads Specific Styles ───────────────────────────
  &__card--connected {
    border-color: rgba($primary, 0.3);
    background: linear-gradient(to bottom right, $white, rgba($primary, 0.02));
  }

  &__card-titles {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    h3 {
      margin: 0;
    }
  }

  &__status-tag {
    font-size: 0.7rem;
    background: rgba($BAKANO-GREEN, 0.1);
    color: $BAKANO-GREEN;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-weight: 800;
    text-transform: uppercase;
  }

  &__connected-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba($primary-dark, 0.03);
    border-radius: 10px;
    margin: 0.5rem 0;
  }

  &__info-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: $text-secondary;

    i {
      color: $primary;
      width: 16px;
      text-align: center;
    }

    strong {
      color: $primary-dark;
    }
  }

  &__btn-outline {
    background: $white;
    border: 1px solid rgba($primary-dark, 0.1);
    padding: 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: $text-secondary;
    transition: all 0.2s;
    flex: 1;

    &:hover {
      background: rgba($primary, 0.05);
      border-color: $primary;
      color: $primary;
    }
  }

  &__btn-ghost {
    background: transparent;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: $text-secondary;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary-dark, 0.05);
      color: $primary-dark;
    }
  }

  &__actions-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    margin-top: 0.5rem;

    .workspace-dashboard__btn-meta {
      flex: 1;
    }
  }

  &__error-msg {
    color: $alert-error;
    font-size: 0.85rem;
    margin: 0.5rem 0 0;
  }

  // ── Page Picker Modal ────────────────────────────────
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba($primary-dark, 0.8);
    backdrop-filter: blur(8px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  &__modal {
    background: $white;
    width: 100%;
    max-width: 500px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
  }

  &__modal-header {
    padding: 2rem;
    background: rgba($primary, 0.03);
    border-bottom: 1px solid rgba($primary-dark, 0.05);

    h3 {
      margin: 0 0 0.5rem;
      font-size: 1.4rem;
    }

    p {
      margin: 0;
      color: $text-secondary;
      font-size: 0.95rem;
    }
  }

  &__page-list {
    max-height: 400px;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__page-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border: 1px solid rgba($primary-dark, 0.05);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      background: rgba($primary, 0.02);
      transform: translateX(4px);
    }

    &>i {
      margin-left: auto;
      opacity: 0.3;
    }
  }

  &__page-icon {
    width: 44px;
    height: 44px;
    background: $primary-light;
    color: $primary;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  &__page-info {
    display: flex;
    flex-direction: column;

    .workspace-dashboard__page-name {
      font-weight: 700;
      color: $primary-dark;
    }

    .workspace-dashboard__page-id {
      font-size: 0.8rem;
      color: $text-secondary;
    }
  }

  &__empty-pages {
    padding: 3rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: $text-secondary;

    i {
      font-size: 2.5rem;
      opacity: 0.2;
    }
  }

  &__modal-footer {
    padding: 1rem 2rem;
    background: rgba($primary-dark, 0.02);
    border-top: 1px solid rgba($primary-dark, 0.05);
    display: flex;
    justify-content: flex-end;

    button {
      padding: 0.5rem 1rem;
    }
  }

  // ── Metrics Dashboard ────────────────────────────────
  &__metrics-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px dashed rgba($primary-dark, 0.1);
    position: relative;
  }

  &__insights-loader {
    position: absolute;
    inset: -1rem;
    background: rgba($white, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    border-radius: 24px;
    transition: all 0.3s ease;
  }

  &__loader-card {
    background: $white;
    padding: 2rem 3rem;
    border-radius: 20px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    border: 1px solid rgba($primary, 0.1);

    span {
      font-size: 1rem;
      font-weight: 700;
      color: $primary-dark;
      letter-spacing: -0.01em;
    }

    .workspace-dashboard__spinner--md {
      width: 40px;
      height: 40px;
      border-width: 4px;
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
    opacity: 0.5;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  &__metrics-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  &__metrics-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &__date-selector {
    display: flex;
    background: rgba($primary-dark, 0.05);
    padding: 3px;
    border-radius: 10px;
    gap: 4px;
  }

  &__date-btn {
    border: none;
    background: transparent;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: $primary-dark;
      background: rgba($white, 0.5);
    }

    &--active {
      background: $white;
      color: $primary;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }

  &__dates-tag {
    display: none; // Unused now
  }

  &__kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
  }

  &__kpi-card {
    background: $white;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid rgba($primary-dark, 0.05);
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.04);
    }

    &--spend-detailed {
      flex-direction: column;
      align-items: stretch;
      justify-content: center;
      gap: 1.2rem;
    }
  }

  &__kpi-main-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__kpi-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;

    &--spend {
      background: rgba($BAKANO-GREEN, 0.1);
      color: $BAKANO-GREEN;
    }

    &--clicks {
      background: rgba(#1877f2, 0.1);
      color: #1877f2;
    }

    &--cpc {
      background: rgba($alert-warning, 0.1);
      color: $alert-warning;
    }

    &--impressions {
      background: rgba($primary, 0.1);
      color: $primary;
    }
  }

  &__kpi-data {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__kpi-label {
    font-size: 0.85rem;
    color: $text-secondary;
    font-weight: 500;
  }

  &__kpi-value {
    font-size: 1.4rem;
    font-weight: 800;
    color: $primary-dark;
  }

  &__kpi-platform-split {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding-top: 1rem;
    border-top: 1px dashed rgba($primary-dark, 0.1);
  }

  &__split-bar {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: rgba($primary-dark, 0.05);
    display: flex;
    overflow: hidden;
  }

  &__split-segment {
    transition: width 0.4s ease;

    &--fb {
      background: #1877F2;
    }

    &--ig {
      background: #E1306C;
    }
  }

  &__split-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
  }

  &__split-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: $primary-dark;
    font-weight: 700;

    small {
      opacity: 0.6;
      font-weight: 600;
      font-size: 0.75rem;
    }

    &--fb i {
      color: #1877F2;
    }

    &--ig i {
      color: #E1306C;
    }
  }

  // ==== CHART SECTION ====
  &__chart-section {
    background: $white;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba($primary-dark, 0.03);
    border: 1px solid rgba($primary-dark, 0.05);
    padding: 1.5rem 2rem;
    overflow: hidden;
  }

  &__chart-header {
    margin-bottom: 1.5rem;

    h2 {
      margin: 0;
      font-size: 1.2rem;
      color: $primary-dark;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      i {
        color: $primary;
        font-size: 1.1rem;
      }
    }
  }

  &__chart-container {
    height: 350px;
    width: 100%;
    position: relative;
    padding: 0.5rem 0;
  }

  // ==== ADS TABLE SECTION ====
  &__ads-list-section {
    background: $white;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba($primary-dark, 0.03);
    border: 1px solid rgba($primary-dark, 0.05);
    overflow: hidden;
  }

  &__ads-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    background: #fafafa;

    h2 {
      margin: 0;
      font-size: 1.2rem;
      color: $primary-dark;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      i {
        color: $primary;
        font-size: 1.1rem;
      }
    }
  }

  &__table-container {
    width: 100%;
    overflow-x: auto;
  }

  &__ads-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;

    th,
    td {
      padding: 1.2rem 1.5rem;
      text-align: left;
      border-bottom: 1px solid rgba($primary-dark, 0.04);
    }

    th {
      font-weight: 600;
      color: $text-secondary;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: $white;
    }

    tbody tr {
      transition: background 0.15s;

      &:hover {
        background: #fcfcfc;
      }

      &:last-child td {
        border-bottom: none;
      }
    }
  }

  &__ad-identity {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__ad-campaign {
    font-size: 0.8rem;
    color: $text-secondary;
    display: flex;
    align-items: center;
    gap: 0.4rem;

    i {
      opacity: 0.6;
    }
  }

  &__ad-name {
    font-size: 1rem;
    color: $primary-dark;
    line-height: 1.3;
  }

  &__ad-id {
    font-size: 0.75rem;
    color: rgba($text-secondary, 0.6);
    font-family: monospace;
  }

  &__ad-numeric {
    white-space: nowrap;
    color: $primary-dark;

    strong {
      font-size: 1.05rem;
    }
  }

  &__ad-spend {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__ad-spend-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.75rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba($primary-dark, 0.04);
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      color: $text-secondary;

      .fa-facebook {
        color: #1877F2;
      }

      .fa-instagram {
        color: #E1306C;
      }
    }
  }

  &__badge--roas,
  &__badge--purchases {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.95rem;
  }

  &__badge--roas {
    background: rgba($primary, 0.1);
    color: $primary;

    &.success {
      background: rgba(39, 174, 96, 0.15);
      color: #27ae60;
    }

    &.warning {
      background: rgba(235, 87, 87, 0.15);
      color: #eb5757;
    }
  }

  &__badge--purchases {
    background: rgba($secondary, 0.15);
    color: darken(#f1c40f, 20%);
  }

  &__ad-clics-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    color: $text-secondary;

    strong {
      color: $primary-dark;
    }
  }

  &__small-cpc {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  &__ad-link-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: transparent;
    color: $text-secondary;
    border: 1px solid rgba($primary-dark, 0.1);
    transition: all 0.2s ease;

    &:hover {
      background: rgba(#1877f2, 0.1);
      color: #1877f2;
      border-color: rgba(#1877f2, 0.3);
      transform: translateY(-2px);
    }
  }

  &__metrics-loading,
  &__metrics-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    background: $white;
    border-radius: 12px;
    border: 1px dashed rgba($primary-dark, 0.1);
    color: $text-secondary;
    gap: 1rem;

    i {
      font-size: 2rem;
      opacity: 0.5;
    }
  }

  // ==== ORGANIC SECTION ====
  &__organic-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 1rem;
    padding-top: 2rem;
    border-top: 1px dashed rgba($primary-dark, 0.1);
  }

  &__post-identity {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__post-img {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
    background: rgba($primary-dark, 0.05);
    flex-shrink: 0;
  }

  &__post-img-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: rgba($primary-dark, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba($primary-dark, 0.3);
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;

    @media (min-width: 768px) {
      padding: 0;
    }
  }

  &__skeleton-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;

    @media (min-width: 1024px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__skeleton-card {
    height: 120px;
    background: rgba($white, 0.5);
    border-radius: 20px;
    border: 1px solid rgba($primary-dark, 0.05);
  }

  &__skeleton-row {
    background: rgba($white, 0.5);
    border: 1px solid rgba($primary-dark, 0.05);
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

  &__post-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  &__post-msg {
    font-size: 0.9rem;
    color: $primary-dark;
    font-weight: 600;
    white-space: wrap;
  }
}

// Transitions
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
