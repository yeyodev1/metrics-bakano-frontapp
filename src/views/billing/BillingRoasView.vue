<template>
  <div class="billing-view">
    <!-- PREMIUM CRM ANNOUNCEMENT BANNER -->
    <section v-if="!isFlorindaWorkspace" class="crm-announcement">
      <div class="crm-announcement__content">
        <div class="crm-announcement__badge">
          <i class="fa-solid fa-bolt"></i> Nueva Experiencia
        </div>
        <h2 class="crm-announcement__title">Toda tu analítica se ha mudado al CRM</h2>
        <p class="crm-announcement__desc">
          Tus dashboards detallados de Meta Ads y rendimiento orgánico te esperan en nuestra nueva plataforma integral. Accede a embudos, reportes consolidados y más.
        </p>
      </div>
      <div class="crm-announcement__actions">
        <a href="https://crm.bakano.ec" target="_blank" rel="noopener noreferrer" class="crm-announcement__btn-primary">
          Abrir CRM <i class="fa-solid fa-arrow-right" />
        </a>
        <a href="https://api.leadconnectorhq.com/widget/bookings/soporte-tecnico-crm" target="_blank" rel="noopener noreferrer" class="crm-announcement__btn-secondary">
          <i class="fa-solid fa-headset" /> Soporte
        </a>
      </div>
    </section>

    <!-- Header -->
    <BillingHeader
      v-if="showStandardBilling"
      :isBoloncity="analytics.isBoloncity.value"
      :workspaceName="analytics.workspaceName.value"
      :monthLabel="analytics.monthLabel.value"
      :loading="analytics.loading.value"
      :isCurrentMonth="analytics.isCurrentMonth.value"
      @prev-month="analytics.prevMonth()"
      @next-month="analytics.nextMonth()"
    />

    <template v-if="showStandardBilling">
      <!-- Skeleton Loading -->
      <div v-if="analytics.loading.value && !analytics.monthData.value" class="skel-wrap">
        <div class="skel-kpi-row">
          <div v-for="i in 4" :key="i" class="skel-kpi"><div class="skel-shimmer" /></div>
        </div>
        <div class="skel-chart-placeholder"><div class="skel-shimmer" /></div>
        <div class="skel-days">
          <div v-for="i in 3" :key="i" class="skel-day"><div class="skel-shimmer" /></div>
        </div>
      </div>

      <!-- KPIs -->
      <BillingKpis v-if="analytics.monthData.value" :totals="analytics.monthTotals.value" />

      <!-- Chart -->
      <BillingChart
        v-if="analytics.monthData.value"
        :monthData="analytics.monthData.value"
        :monthLabel="analytics.monthLabel.value"
        :hasAnyData="analytics.hasAnyData.value"
      />

      <!-- Day List (includes filters, pending banner, and days) -->
      <BillingDayList
        v-if="analytics.monthData.value"
        :daysToShow="analytics.daysToShow.value"
        :pendingDays="analytics.pendingDays.value"
        :loading="analytics.loading.value"
        :canEnterBilling="analytics.canEnterBilling.value"
        v-model:filterOnlyWithData="analytics.filterOnlyWithData.value"
        v-model:filterMyEntries="analytics.filterMyEntries.value"
        :todayStr="analytics.todayStr.value"
        :canRegisterOnDay="analytics.canRegisterOnDay"
        @add-entry="openModalForAdd"
        @edit-entry="openModalForEdit"
      />
    </template>

    <!-- Boloncity specific view -->
    <SalesDashboardSection
      v-if="workspaceId === '69bdadc67386136fc3682734'"
      :workspace-id="workspaceId"
    />

    <FlorindaSalesSection
      v-if="isFlorindaWorkspace"
      :workspace-id="workspaceId"
    />

    <template v-if="showStandardBilling">
      <!-- Sticky CTA -->
      <div v-if="analytics.isCurrentMonth.value && analytics.canEnterBilling.value && !analytics.todayHasMyEntry.value" class="today-cta">
        <button class="btn-today-register" @click="openModalForAdd({ date: analytics.todayStr.value, total: analytics.todayDaySummary.value?.totalAmount ?? 0 })">
          <i class="fa-solid fa-plus" />
          Registrar facturación de hoy
        </button>
      </div>

      <!-- Modal -->
      <BillingEntryModal
        v-model="showModal"
        :current-day-total="modalDayTotal"
        :workspace-name="analytics.workspaceName.value"
        :date="modalDate"
        :loading="submitting"
        :edit-mode="modalEditMode"
        :existing-amount="modalExistingAmount"
        :existing-notes="modalExistingNotes"
        :existing-online-revenue="modalExistingOnlineRevenue"
        :existing-branches="modalExistingBranches"
        :entry-id="modalEntryId"
        :calendar-entry-map="analytics.calendarEntryMap.value"
        @confirmed="handleEntry"
      />
    </template>

    <!-- Toasts -->
    <Transition name="toast-fade">
      <div v-if="successMsg" class="success-toast">
        <i class="fa-solid fa-circle-check" />
        {{ successMsg }}
      </div>
    </Transition>

    <Transition name="toast-fade">
      <div v-if="analytics.errorMsg.value || errorMsg" class="error-toast">
        <i class="fa-solid fa-circle-xmark" />
        {{ analytics.errorMsg.value || errorMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { billingService } from '@/services/billing.service'
import { useBillingAnalytics } from '@/composables/useBillingAnalytics'

import BillingHeader from '@/components/billing/BillingHeader.vue'
import BillingKpis from '@/components/billing/BillingKpis.vue'
import BillingChart from '@/components/billing/BillingChart.vue'
import BillingDayList from '@/components/billing/BillingDayList.vue'
import BillingEntryModal from '@/components/billing/BillingEntryModal.vue'
import SalesDashboardSection from '@/components/billing/SalesDashboardSection.vue'
import FlorindaSalesSection from '@/components/billing/FlorindaSalesSection.vue'

const route = useRoute()
const workspaceId = computed(() => route.params.workspaceId as string)
const isFlorindaWorkspace = computed(() => workspaceId.value === '69d7c73318a77b5e0db9f74e')

// Abstracted Analytics Logic
const analytics = useBillingAnalytics(workspaceId)
const showStandardBilling = computed(() => !analytics.isBoloncity.value && !isFlorindaWorkspace.value)

// Modal State (kept local as it drives the modal UI specific to this view)
const showModal = ref(false)
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const modalDate = ref('')
const modalDayTotal = ref(0)
const modalEditMode = ref(false)
const modalEntryId = ref<string | undefined>(undefined)
const modalExistingAmount = ref<number | undefined>(undefined)
const modalExistingNotes = ref<string | undefined>(undefined)
const modalExistingOnlineRevenue = ref<number | undefined>(undefined)
const modalExistingBranches = ref<{ branchId: string; amount: number }[] | undefined>(undefined)

function openModalForAdd(payload: { date: string; total: number }) {
  modalDate.value = payload.date
  modalDayTotal.value = payload.total
  modalEditMode.value = false
  modalEntryId.value = undefined
  modalExistingAmount.value = undefined
  modalExistingNotes.value = undefined
  modalExistingOnlineRevenue.value = undefined
  modalExistingBranches.value = undefined
  showModal.value = true
}

function openModalForEdit(payload: { entry: any; date: string; total: number }) {
  modalDate.value = payload.date
  modalDayTotal.value = payload.total - payload.entry.amount
  modalEditMode.value = true
  modalEntryId.value = payload.entry._id
  modalExistingAmount.value = payload.entry.amount
  modalExistingNotes.value = payload.entry.notes
  modalExistingOnlineRevenue.value = payload.entry.onlineRevenue
  modalExistingBranches.value = payload.entry.branches
  showModal.value = true
}

async function handleEntry(payload: { amount: number; notes?: string; onlineRevenue?: number; entryId?: string; date?: string; branches?: { branchId: string; amount: number }[] }) {
  submitting.value = true
  try {
    if (payload.entryId) {
      await billingService.updateEntry(workspaceId.value, payload.entryId, { amount: payload.amount, notes: payload.notes, onlineRevenue: payload.onlineRevenue, branches: payload.branches })
      successMsg.value = '✓ Facturación actualizada correctamente'
    } else {
      const entryDate = payload.date || modalDate.value
      await billingService.createEntry(workspaceId.value, { amount: payload.amount, notes: payload.notes, date: entryDate, onlineRevenue: payload.onlineRevenue, branches: payload.branches })
      successMsg.value = (analytics.dateStr(entryDate) === analytics.todayStr.value) 
        ? '✓ Facturación de hoy registrada' 
        : `✓ Facturación del ${entryDate} registrada`
    }
    showModal.value = false
    setTimeout(() => (successMsg.value = ''), 4000)
    await analytics.fetchTodayStatus()
    analytics.fetchMonth()
  } catch (e: any) {
    errorMsg.value = e?.message || 'Error al guardar la facturación'
    setTimeout(() => (errorMsg.value = ''), 5000)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (isFlorindaWorkspace.value) return
  await analytics.fetchTodayStatus()
  analytics.fetchMonth()
})
</script>

<style scoped lang="scss">
.billing-view {
  padding: 16px 16px 80px;
  width: 100%;
  max-width: 100%;

  @media (min-width: 640px) {
    padding: 28px 32px 80px;
  }
}

// CRM PREMIUM BANNER
.crm-announcement {
  background: linear-gradient(135deg, $primary-dark 0%, #2b1d3d 100%);
  border-radius: 16px;
  padding: 24px 32px;
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  color: $white;
  box-shadow: 0 10px 25px rgba(25, 20, 35, 0.15);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -10%;
    width: 60%;
    height: 200%;
    background: radial-gradient(circle, rgba($primary, 0.15) 0%, transparent 60%);
    pointer-events: none;
  }

  &__content {
    flex: 1;
    z-index: 1;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba($primary, 0.2);
    color: lighten($primary, 15%);
    padding: 5px 12px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
    border: 1px solid rgba($primary, 0.3);
  }

  &__title {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 8px;
    color: $white;
    letter-spacing: -0.3px;
  }

  &__desc {
    font-size: 14.5px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    line-height: 1.5;
    max-width: 600px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 1;
    flex-shrink: 0;
  }

  &__btn-primary {
    background: $primary;
    color: $white;
    padding: 11px 22px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 15px rgba($primary, 0.3);

    &:hover {
      background: lighten($primary, 5%);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba($primary, 0.4);
    }
  }

  &__btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    color: $white;
    padding: 11px 22px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    border: 1px solid rgba(255, 255, 255, 0.15);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
  }

  @media (max-width: 820px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
    gap: 20px;

    &__actions {
      width: 100%;
      flex-direction: column;
    }

    &__btn-primary, &__btn-secondary {
      width: 100%;
      justify-content: center;
    }
  }
}

// Skeletons
.skel-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.skel-kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.skel-kpi {
  height: 88px;
  background: $white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.skel-chart-placeholder {
  height: 380px;
  background: $white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.skel-days {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.skel-day {
  height: 60px;
  background: $white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.skel-shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 400% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

// Sticky CTA
.today-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  z-index: 50;

  @media (min-width: 1024px) {
    left: 240px; // account for sidebar
  }

  .btn-today-register {
    background: $primary;
    color: $white;
    border: none;
    padding: 14px 32px;
    border-radius: 100px;
    font-weight: 800;
    font-size: 15px;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba($primary, 0.4);
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;

    &:hover {
      background: lighten($primary, 5%);
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba($primary, 0.5);
    }
  }
}

// Toasts
.success-toast, .error-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 14px 20px;
  border-radius: 12px;
  color: $white;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 9999;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}
.success-toast {
  background: #10b981;
}
.error-toast {
  background: #ef4444;
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-20px) scale(0.95); }
</style>
