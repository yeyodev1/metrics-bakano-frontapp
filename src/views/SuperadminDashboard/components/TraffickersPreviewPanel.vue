<script setup lang="ts">
import { ref } from 'vue'
import { billingService } from '@/services/billing.service'
import type { WorkspaceUser } from '@/types'

const previewTraffickerUser = ref<WorkspaceUser | null>(null)
const isTraffickerPreviewOpen = ref(false)
const traffickerPreviewData = ref<{ workspace: { _id: string; name: string } | null; roas: number; revenue: number; spend: number }[]>([])
const isLoadingTraffickerPreview = ref(false)

async function open(user: WorkspaceUser): Promise<void> {
  previewTraffickerUser.value = user
  isTraffickerPreviewOpen.value = true
  isLoadingTraffickerPreview.value = true
  traffickerPreviewData.value = []

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const results = await Promise.all(
    (user.workspaces ?? []).map(async (ws: any) => {
      const wsId = ws.workspaceId?._id
      if (!wsId) return null
      try {
        const data = await billingService.getMonthData(wsId, year, month)
        return { workspace: ws.workspaceId, roas: data.avgROAS ?? 0, revenue: data.totalAmount ?? 0, spend: data.totalMetaSpend ?? 0 }
      } catch {
        return { workspace: ws.workspaceId, roas: 0, revenue: 0, spend: 0 }
      }
    })
  )
  traffickerPreviewData.value = results.filter(Boolean) as any[]
  isLoadingTraffickerPreview.value = false
}

function trf_roasCardClass(roas: number) {
  if (!roas) return 'trf-preview-card--gray'
  if (roas >= 4) return 'trf-preview-card--green'
  if (roas >= 3) return 'trf-preview-card--teal'
  if (roas >= 1) return 'trf-preview-card--orange'
  return 'trf-preview-card--red'
}

function trf_roasLabel(roas: number) {
  if (!roas) return 'Sin datos'
  if (roas >= 4) return 'En objetivo'
  if (roas >= 3) return 'Cerca'
  if (roas >= 1) return 'En riesgo'
  return 'Crítico'
}

function trf_formatAmount(val: number) {
  return (val || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

defineExpose({ open })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isTraffickerPreviewOpen"
        class="superadmin-dashboard__trf-overlay"
        @click.self="isTraffickerPreviewOpen = false"
      >
        <div class="superadmin-dashboard__trf-panel">
          <div class="superadmin-dashboard__trf-panel-head">
            <div class="superadmin-dashboard__trf-panel-identity">
              <div class="superadmin-dashboard__trf-avatar superadmin-dashboard__trf-avatar--lg">
                {{ (previewTraffickerUser?.name || previewTraffickerUser?.email || '?')[0].toUpperCase() }}
              </div>
              <div>
                <p class="superadmin-dashboard__trf-panel-badge">
                  <i class="fa-solid fa-eye" /> Viendo como Trafficker
                </p>
                <h3>{{ previewTraffickerUser?.name || previewTraffickerUser?.email }}</h3>
                <p>{{ previewTraffickerUser?.email }}</p>
              </div>
            </div>
            <button class="superadmin-dashboard__trf-panel-close" @click="isTraffickerPreviewOpen = false">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>

          <!-- Loading -->
          <div v-if="isLoadingTraffickerPreview" class="superadmin-dashboard__trf-panel-loading">
            <span class="superadmin-dashboard__spinner" />
            <p>Cargando ROAS de los entornos...</p>
          </div>

          <!-- Empty -->
          <div v-else-if="traffickerPreviewData.length === 0" class="superadmin-dashboard__trf-panel-empty">
            <i class="fa-solid fa-layer-group" />
            <p>Este trafficker no tiene entornos asignados.</p>
          </div>

          <!-- Workspace cards -->
          <div v-else class="superadmin-dashboard__trf-panel-grid">
            <div
              v-for="item in traffickerPreviewData"
              :key="item.workspace?._id"
              class="superadmin-dashboard__trf-preview-card"
              :class="trf_roasCardClass(item.roas)"
            >
              <div class="trf-preview-card__head">
                <span class="trf-preview-card__name">{{ item.workspace?.name }}</span>
                <span class="trf-preview-card__roas" :class="trf_roasCardClass(item.roas)">
                  {{ item.roas > 0 ? item.roas.toFixed(2) + 'x' : '—' }}
                </span>
              </div>
              <div class="trf-preview-card__status">{{ trf_roasLabel(item.roas) }}</div>
              <!-- Progress bar -->
              <div class="trf-preview-card__bar-track">
                <div
                  class="trf-preview-card__bar-fill"
                  :class="trf_roasCardClass(item.roas)"
                  :style="{ width: Math.min((item.roas / 4) * 100, 100) + '%' }"
                />
              </div>
              <div class="trf-preview-card__metrics">
                <span><i class="fa-solid fa-building-columns" /> ${{ trf_formatAmount(item.revenue) }}</span>
                <span><i class="fa-brands fa-meta" /> ${{ trf_formatAmount(item.spend) }}</span>
              </div>
            </div>
          </div>

          <!-- Aggregate -->
          <div v-if="!isLoadingTraffickerPreview && traffickerPreviewData.length > 0" class="superadmin-dashboard__trf-panel-summary">
            <span>
              ROAS promedio:
              <strong>{{
                (() => {
                  const withData = traffickerPreviewData.filter(d => d.roas > 0)
                  if (!withData.length) return '—'
                  return (withData.reduce((s, d) => s + d.roas, 0) / withData.length).toFixed(2) + 'x'
                })()
              }}</strong>
            </span>
            <span>
              En objetivo (≥4x):
              <strong>{{ traffickerPreviewData.filter(d => d.roas >= 4).length }} / {{ traffickerPreviewData.length }}</strong>
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
// Teleport overlay styles must be global or deep
:global(.superadmin-dashboard__trf-overlay) {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;

  @media (min-width: 640px) { align-items: stretch; }
}

:global(.superadmin-dashboard__trf-panel) {
  background: $white;
  width: 100%;
  max-width: 680px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px 28px 40px;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.25s ease;

  @media (max-width: 640px) {
    max-height: 90vh;
    border-radius: 20px 20px 0 0;
    animation: slideInUp 0.25s ease;
  }
}

@keyframes slideInRight {
  from { transform: translateX(60px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

@keyframes slideInUp {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

:global(.superadmin-dashboard__trf-panel-head) {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

:global(.superadmin-dashboard__trf-panel-identity) {
  display: flex;
  align-items: center;
  gap: 14px;

  h3 { margin: 0 0 2px; font-size: 18px; font-weight: 800; color: $primary-dark; }
  p  { margin: 0; font-size: 12px; color: $text-secondary; }
}

:global(.superadmin-dashboard__trf-panel-badge) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #b45309;
  background: #fef3c7;
  padding: 2px 8px;
  border-radius: 100px;
  margin-bottom: 4px !important;
}

:global(.superadmin-dashboard__trf-panel-close) {
  width: 34px;
  height: 34px;
  border: 1.5px solid rgba($primary, 0.15);
  border-radius: 8px;
  background: $white;
  color: $text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;

  &:hover { background: rgba($primary, 0.06); color: $primary; }
}

:global(.superadmin-dashboard__trf-panel-loading),
:global(.superadmin-dashboard__trf-panel-empty) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  color: $text-secondary;
  font-size: 14px;

  i { font-size: 32px; opacity: 0.35; }
  p { margin: 0; }
}

:global(.superadmin-dashboard__trf-panel-loading) {
  flex-direction: row;
  justify-content: center;
}

:global(.superadmin-dashboard__trf-panel-grid) {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: 480px) { grid-template-columns: repeat(2, 1fr); }
}

:global(.superadmin-dashboard__trf-preview-card) {
  border-radius: 12px;
  padding: 14px 16px;
  border: 1.5px solid transparent;
  border-left-width: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &.trf-preview-card--green  { border-color: #16a34a; background: linear-gradient(135deg, #f0fdf4, $white 70%); }
  &.trf-preview-card--teal   { border-color: #0891b2; background: linear-gradient(135deg, #ecfeff, $white 70%); }
  &.trf-preview-card--orange { border-color: #d97706; background: linear-gradient(135deg, #fffbeb, $white 70%); }
  &.trf-preview-card--red    { border-color: #dc2626; background: linear-gradient(135deg, #fef2f2, $white 70%); }
  &.trf-preview-card--gray   { border-color: #d1d5db; background: $white; }
}

:global(.trf-preview-card__head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

:global(.trf-preview-card__name) {
  font-size: 13px;
  font-weight: 700;
  color: $primary-dark;
}

:global(.trf-preview-card__roas) {
  font-size: 18px;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 8px;

  &.trf-preview-card--green  { color: #16a34a; background: #dcfce7; }
  &.trf-preview-card--teal   { color: #0891b2; background: #cffafe; }
  &.trf-preview-card--orange { color: #d97706; background: #fef3c7; }
  &.trf-preview-card--red    { color: #dc2626; background: #fee2e2; }
  &.trf-preview-card--gray   { color: #6b7280; background: #f3f4f6; }
}

:global(.trf-preview-card__status) {
  font-size: 11px;
  font-weight: 600;
  color: $text-secondary;
}

:global(.trf-preview-card__bar-track) {
  height: 6px;
  background: #f3f4f6;
  border-radius: 100px;
  overflow: hidden;
}

:global(.trf-preview-card__bar-fill) {
  height: 100%;
  border-radius: 100px;
  transition: width 0.5s ease;

  &.trf-preview-card--green  { background: #16a34a; }
  &.trf-preview-card--teal   { background: #0891b2; }
  &.trf-preview-card--orange { background: #d97706; }
  &.trf-preview-card--red    { background: #dc2626; }
  &.trf-preview-card--gray   { background: #9ca3af; }
}

:global(.trf-preview-card__metrics) {
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

:global(.superadmin-dashboard__trf-panel-summary) {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  background: rgba($primary, 0.04);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: $text-secondary;

  strong { color: $primary-dark; font-weight: 800; }
}

.superadmin-dashboard__trf-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  background: $primary-light;
  color: $primary;

  &--lg {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}

.superadmin-dashboard__spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  &--sm {
    width: 14px;
    height: 14px;
    border-width: 2px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
