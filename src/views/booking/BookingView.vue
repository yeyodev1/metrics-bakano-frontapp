<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import carlosPhoto from '@/assets/team/carlos.jpg'
import BookingCalendar from '@/components/booking/BookingCalendar.vue'
import BookingExistingAppointmentModal from '@/components/booking/BookingExistingAppointmentModal.vue'
import BookingExpertSelection from '@/components/booking/BookingExpertSelection.vue'
import BookingSalesGate from '@/components/booking/BookingSalesGate.vue'
import type { BookingExpert, ExpertKey, SalesBookingPayload } from '@/components/booking/booking.types'
import { bookingService, type SalesBookingEligibility } from '@/services/booking.service'

const route = useRoute()
const router = useRouter()
const selected = ref<ExpertKey | null>(null)
const salesEligibility = ref<SalesBookingEligibility | null>(null)
const salesLoading = ref(true)
const salesSubmitting = ref(false)
const salesError = ref('')
const forceNewSalesRequest = ref(false)
const checkExistingAppointment = ref(false)

const experts: BookingExpert[] = [
  { key: 'soporte', name: 'Carlos Jurado', role: 'Especialista en Tecnología', photo: carlosPhoto, initials: 'CJ', color: '#3B5BDB', gradient: 'linear-gradient(135deg, #3B5BDB, #6C5CE7)', accentBg: 'rgba(59, 91, 219, 0.08)', accentBorder: 'rgba(59, 91, 219, 0.2)', shadowColor: 'rgba(59, 91, 219, 0.25)', topics: ['Soporte técnico de la plataforma', 'CRM, reportes y metrics.bakano.ec', 'Integraciones y herramientas', 'Resolución de incidencias'], url: 'https://api.leadconnectorhq.com/widget/booking/aaHn06pmWuNFuF7tjDST', warning: 'Solo temas técnicos', warningDesc: 'Si tu consulta es sobre el funcionamiento de la plataforma, CRM, reportes o integraciones, estás en el lugar correcto. Cualquier otro tema será redirigido.', icon: 'fa-solid fa-laptop-code' },
  { key: 'meta', name: 'Denisse Quimi', role: 'Especialista en Meta Ads', photo: 'https://res.cloudinary.com/dpjzfua3n/image/upload/q_auto/f_auto/v1775356095/sorbito-de-verdad/collaborators/bakano-team-denisse.webp', initials: 'DQ', color: '#E91E8C', gradient: 'linear-gradient(135deg, #E91E8C, #FD79A8)', accentBg: 'rgba(233, 30, 140, 0.08)', accentBorder: 'rgba(233, 30, 140, 0.2)', shadowColor: 'rgba(233, 30, 140, 0.25)', topics: ['Anuncios en Facebook e Instagram', 'Estrategia y optimización de campañas', 'Creativos, copy y segmentación', 'Resultados y métricas de campañas'], url: 'https://api.leadconnectorhq.com/widget/booking/GNizdekhY5SQaYTPdKPP', warning: 'Solo Meta Ads', warningDesc: 'Si tu duda es sobre anuncios en Facebook o Instagram, estás en el lugar correcto. Otros temas serán redirigidos.', icon: 'fa-solid fa-chart-simple' },
  { key: 'ventas', name: 'Luis Reyes', role: 'Especialista en Ventas', photo: 'https://res.cloudinary.com/dpjzfua3n/image/upload/q_auto/f_auto/v1/sorbito-de-verdad/collaborators/bakano-team-luis', initials: 'LR', color: '#0EA5E9', gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', accentBg: 'rgba(14, 165, 233, 0.08)', accentBorder: 'rgba(14, 165, 233, 0.2)', shadowColor: 'rgba(14, 165, 233, 0.25)', topics: ['Nuevos servicios y contrataciones', 'Facturación y planes comerciales', 'Escalabilidad y crecimiento', 'Propuestas y negociación'], url: 'https://api.leadconnectorhq.com/widget/booking/B1bBr6Re26efMEFn0HFP', warning: 'Exclusivo ventas', warningDesc: 'Exclusivo para temas comerciales. Cualquier otro tema será cancelado y no podrás agendar nuevamente.', icon: 'fa-solid fa-handshake' },
]

const currentExpert = computed(() => experts.find((expert) => expert.key === selected.value) ?? null)
const existingAppointment = computed(() => salesEligibility.value?.salesAppointment?.startsAt)
const showExistingAppointment = computed(() => selected.value === 'ventas' && !salesLoading.value && checkExistingAppointment.value && !forceNewSalesRequest.value && !!salesEligibility.value?.salesAppointment)
const showSalesGate = computed(() => selected.value === 'ventas' && !showExistingAppointment.value && (salesLoading.value || !salesEligibility.value?.eligible || forceNewSalesRequest.value))

async function selectExpert(expert: BookingExpert) {
  selected.value = expert.key
  if (expert.key !== 'ventas') return
  salesError.value = ''
  forceNewSalesRequest.value = false
  checkExistingAppointment.value = true
  salesLoading.value = true
  try {
    const [eligibility, upcoming] = await Promise.all([
      bookingService.getSalesEligibility(String(route.params.workspaceId)),
      bookingService.getUpcomingSalesAppointment(String(route.params.workspaceId)),
    ])
    salesEligibility.value = { ...eligibility, salesAppointment: upcoming.salesAppointment }
    // A new request must always pass through the diagnostic form before the calendar.
    forceNewSalesRequest.value = !upcoming.salesAppointment
  } catch (error: any) {
    checkExistingAppointment.value = false
    forceNewSalesRequest.value = true
    salesError.value = error?.message || 'No pudimos verificar tus reuniones de ventas. Inténtalo nuevamente.'
  } finally {
    salesLoading.value = false
  }
}

function backToSelection() {
  selected.value = null
  checkExistingAppointment.value = false
  forceNewSalesRequest.value = false
}

function registerAnother() {
  checkExistingAppointment.value = false
  forceNewSalesRequest.value = true
  salesError.value = ''
}

async function loadSalesEligibility() {
  salesLoading.value = true
  try {
    salesEligibility.value = await bookingService.getSalesEligibility(String(route.params.workspaceId))
  } catch (error: any) {
    salesError.value = error?.message || 'No pudimos validar los requisitos para ventas.'
  } finally {
    salesLoading.value = false
  }
}

async function submitSalesRequest(payload: SalesBookingPayload) {
  salesSubmitting.value = true
  salesError.value = ''
  try {
    const { evidence, ...salesData } = payload
    salesEligibility.value = await bookingService.submitSalesRequest(String(route.params.workspaceId), salesData, evidence)
    // The submit response omits prior appointments; restore it so re-entering Luis always checks it.
    await loadSalesEligibility()
    forceNewSalesRequest.value = false
  } catch (error: any) {
    if (error?.status === 403) await loadSalesEligibility()
    else salesError.value = error?.message || 'No pudimos guardar la información comercial.'
  } finally {
    salesSubmitting.value = false
  }
}

onMounted(() => {
  loadSalesEligibility()
})
</script>

<template>
  <main class="booking-view">
    <BookingExpertSelection v-if="!selected" :experts="experts" @select="selectExpert" />
    <BookingExistingAppointmentModal v-else-if="showExistingAppointment" :appointment-date="existingAppointment" @register-another="registerAnother" />
    <BookingSalesGate v-else-if="showSalesGate" :eligibility="salesEligibility" :loading="salesLoading" :force-new-request="forceNewSalesRequest" :submitting="salesSubmitting" :server-error="salesError" @back="backToSelection" @billing="router.push({ name: 'BillingRoas', params: { workspaceId: route.params.workspaceId } })" @submit="submitSalesRequest" />
    <BookingCalendar v-else-if="currentExpert" :expert="currentExpert" @back="backToSelection" />
  </main>
</template>

<style scoped lang="scss">
.booking-view { display: flex; min-height: 100%; flex-direction: column; }
</style>
