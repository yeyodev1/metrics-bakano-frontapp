<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { onboardingService } from '@/services/onboarding.service'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'

import OnboardingSidebar from './components/OnboardingSidebar.vue'
import OnboardingStepVideo from './components/OnboardingStepVideo.vue'
import OnboardingStepContract from './components/OnboardingStepContract.vue'
import OnboardingStepScheduling from './components/OnboardingStepScheduling.vue'
import OnboardingStepDone from './components/OnboardingStepDone.vue'
import OnboardingContractModal from './components/OnboardingContractModal.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useToast()

const workspaceId = computed(() => route.params.workspaceId as string)

const isLoading = ref(true)
const isSubmitting = ref(false)
const currentStep = ref(1)

// Status
const videoAccepted = ref(false)
const contractSubmitted = ref(false)
const meetingScheduled = ref(false)

// Contract Data
const contractData = ref({
  rucBakano: '0993213210001',
  nombreCliente: userStore.name || '',
  rucCliente: '',
  representanteCliente: userStore.firstName && userStore.lastName ? `${userStore.firstName} ${userStore.lastName}` : '',
  cantidadGuiones: 0,
  videosEntretenimiento: 0,
  videosVenta: 0,
  numeroFunnels: 0,
  frecuenciaSesiones: 'Semanales',
  valorMensual: 1000,
  diasPago: 5,
  plazoMeses: 6,
  mesesPermanencia: 3,
  mensualidadesPenalidad: 1,
  email: userStore.email || ''
})

const showPreviewModal = ref(false)
const pendingContractPayload = ref<any>(null)

let pollingInterval: number | undefined

onMounted(async () => {
  if (!workspaceId.value) {
    router.push('/')
    return
  }
  try {
    const response = await onboardingService.getStatus(workspaceId.value)

    if (response.preNegotiatedContract) {
      Object.assign(contractData.value, response.preNegotiatedContract)
    }

    const status = response.onboardingStatus
    videoAccepted.value = status?.videoGenesisAccepted || false
    contractSubmitted.value = status?.contractSubmitted || false
    meetingScheduled.value = status?.meetingScheduled || false

    // El paso de recursos se eliminó del flujo: quien lo tuviera pendiente o
    // completado aterriza directo en la agenda.
    if (meetingScheduled.value) {
      currentStep.value = 4
      setTimeout(() => {
        router.push(`/app/workspaces/${workspaceId.value}`)
      }, 3000)
    } else if (contractSubmitted.value) {
      currentStep.value = 3
      startPolling()
    } else if (videoAccepted.value) {
      currentStep.value = 2
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  stopPolling()
})

async function onAcceptVideo() {
  isSubmitting.value = true
  try {
    await onboardingService.acceptVideo(workspaceId.value)
    videoAccepted.value = true
    currentStep.value = 2
  } catch (error) {
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

function handlePreview(eventPayload: any) {
  pendingContractPayload.value = {
    ...contractData.value,
    clientSignatureBase64: eventPayload.signatureBase64
  }
  showPreviewModal.value = true
}

function closePreviewModal() {
  showPreviewModal.value = false
}

async function onSubmitContract() {
  isSubmitting.value = true
  try {
    if (!pendingContractPayload.value) return
    
    await onboardingService.submitContract(workspaceId.value, pendingContractPayload.value)
    contractSubmitted.value = true
    closePreviewModal()
    toast.success('¡Información Recibida! En breve se creará el grupo de WhatsApp y se te enviará el PDF del contrato con las firmas oficiales.')
    currentStep.value = 3
    startPolling()
  } catch (error) {
    console.error(error)
    toast.error('Hubo un error al procesar tu contrato.')
  } finally {
    isSubmitting.value = false
  }
}

async function onMeetingScheduled() {
  isSubmitting.value = true
  try {
    await onboardingService.markMeetingScheduled(workspaceId.value)
    meetingScheduled.value = true
    stopPolling()
    currentStep.value = 4
    setTimeout(() => {
      router.push(`/app/workspaces/${workspaceId.value}`)
    }, 5000)
  } catch (error) {
    console.error(error)
    toast.error('Hubo un error al marcar la sesión como agendada.')
  } finally {
    isSubmitting.value = false
  }
}

function startPolling() {
  if (pollingInterval) return
  pollingInterval = window.setInterval(async () => {
    try {
      const status = await onboardingService.getStatus(workspaceId.value)
      if (status?.onboardingStatus?.meetingScheduled) {
        meetingScheduled.value = true
        stopPolling()
        currentStep.value = 4
        setTimeout(() => {
          router.push(`/app/workspaces/${workspaceId.value}`)
        }, 5000)
      }
    } catch (e) {
      console.error("Polling error", e)
    }
  }, 3000)
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = undefined
  }
}

// Temporary logout for development
function onLogout() {
  userStore.clear()
  router.push({ name: 'AuthLogin' })
}
</script>

<template>
  <div class="onboarding-flow-wrapper">
    <div v-if="isLoading" class="onboarding-loading">
      <i class="fa-solid fa-spinner fa-spin"></i> Cargando tu experiencia...
    </div>

    <div v-else class="onboarding-glass-card">
      <OnboardingSidebar 
        :currentStep="currentStep" 
        @logout="onLogout" 
      />

      <!-- RIGHT MAIN AREA -->
      <div class="card-main">
        <div class="main-content-wrapper">
          <Transition name="fade" mode="out-in">
            <OnboardingStepVideo 
              v-if="currentStep === 1" 
              :isSubmitting="isSubmitting"
              @accept="onAcceptVideo"
            />
            
            <OnboardingStepContract 
              v-else-if="currentStep === 2"
              :contractData="contractData"
              :isSubmitting="isSubmitting"
              @preview="handlePreview"
            />

            <OnboardingStepScheduling
              v-else-if="currentStep === 3"
              @scheduled="onMeetingScheduled"
            />

            <OnboardingStepDone
              v-else-if="currentStep === 4"
            />
          </Transition>
        </div>
      </div>
    </div>
  </div>

  <OnboardingContractModal 
    :show="showPreviewModal"
    :contractData="contractData"
    :isSubmitting="isSubmitting"
    @close="closePreviewModal"
    @confirm="onSubmitContract"
  />
</template>

<style lang="scss" scoped>
.onboarding-flow-wrapper {
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, sans-serif;
}

.onboarding-loading {
  width: 100%;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  color: $primary;
  gap: 1.5rem;
}

.onboarding-glass-card {
  display: flex;
  width: 100%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-height: 70vh;

  @media (max-width: 992px) {
    flex-direction: column;
    border-radius: 24px;
  }
}

.card-main {
  flex: 1;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
}

.main-content-wrapper {
  width: 100%;
  max-width: 600px;

  /* Let step 2 grow a bit more if needed */
  :deep(.step-content--large) {
    max-width: 700px;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
