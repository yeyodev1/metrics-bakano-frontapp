<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { metaService } from '@/services/meta.service'
import { useUserStore } from '@/stores/user'
import type { Workspace, ApiError } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workspaceId = route.params.workspaceId as string

const workspace = ref<Workspace | null>(null)
const isLoading = ref(true)
const error = ref('')

// 2. Metrics & Insight state
const adsInsights = ref<any[]>([])
const spendByPlatform = ref<any[]>([])
const adsSpendByPlatform = ref<any[]>([])
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

// 3. Methods
async function fetchAdsInsights() {
  if (!workspace.value?.metaAds?.adAccountId) return;
  isLoadingInsights.value = true
  try {
    const data = await metaService.getAdsInsights(workspaceId)
    adsInsights.value = data.insights || []
    spendByPlatform.value = data.spendByPlatform || []
    adsSpendByPlatform.value = data.adsSpendByPlatform || []
  } catch (err) {
    console.error('Error fetching insights:', err)
  } finally {
    isLoadingInsights.value = false
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
        
        <div v-if="userStore.role === 'superadmin'" class="workspace-dashboard__super-badge">
          <i class="fa-solid fa-shield-halved" />
          <span>Navegando como <strong>Superadmin</strong></span>
        </div>
      </div>

      <div class="workspace-dashboard__nav-actions">
        <button class="workspace-dashboard__btn-ghost" @click="router.push({ name: 'WorkspaceSettings', params: { workspaceId } })" title="Configurar Entorno">
          <i class="fa-solid fa-gear" />
          <span class="workspace-dashboard__nav-text">Ajustes</span>
        </button>  
        <button class="workspace-dashboard__back-btn" @click="router.push({ name: 'SuperadminDashboard' })">
          <i class="fa-solid fa-arrow-left" />
          <span class="workspace-dashboard__nav-text">Volver a Global</span>
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="workspace-dashboard__loading">
      <div class="workspace-dashboard__spinner" />
      <p>Cargando datos del entorno...</p>
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
          <h2><i class="fa-solid fa-chart-pie" /> Rendimiento de Campañas</h2>
          <span class="workspace-dashboard__dates-tag">Últimos 30 días</span>
        </div>

        <div v-if="isLoadingInsights" class="workspace-dashboard__metrics-loading">
          <div class="workspace-dashboard__spinner workspace-dashboard__spinner--lg" />
          <p>Obteniendo métricas en tiempo real desde Meta...</p>
        </div>

        <div v-else-if="!aggregatedMetrics" class="workspace-dashboard__metrics-empty">
          <i class="fa-solid fa-chart-column" />
          <p>No se encontraron datos de campañas gastando en los últimos 30 días.</p>
        </div>

        <div v-else class="workspace-dashboard__kpi-grid">
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
      </section>

      <!-- TABLA DETALLADA DE ANUNCIOS -->
      <section v-if="workspace?.metaAds?.adAccountId && !isLoadingInsights && adsInsights.length" class="workspace-dashboard__ads-list-section">
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

      <!-- Pantalla Vacía si no hay Integraciones -->
      <section v-else class="workspace-dashboard__empty-setup">
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
  }

  &__metrics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 1.3rem;
      color: $primary-dark;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        color: $primary;
      }
    }
  }

  &__dates-tag {
    font-size: 0.8rem;
    background: rgba($primary, 0.1);
    color: $primary;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-weight: 700;
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
