<script setup lang="ts">
/**
 * Pantalla de firma del contrato.
 *
 * Antes esto era un recorrido de cuatro pasos: aceptar un video, llenar un
 * formulario largo, firmar y agendar una reunión, todo en la misma página. El
 * cliente se caía en el formulario. Ahora los datos los da por Telegram —donde
 * ya está hablando— y este link abre una sola cosa: leer y firmar.
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { onboardingService } from '@/services/onboarding.service'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { TextoContrato } from '@/types'

import OnboardingStepContract from './components/OnboardingStepContract.vue'
import ContratoCorreoEstado from './components/ContratoCorreoEstado.vue'
import type { EnvioContrato } from '@/services/onboarding.service'
import { apiBaseUrl } from '@/config/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useToast()

const BOT_URL = 'https://t.me/BakanoAgencyBot'

const workspaceId = computed(() => route.params.workspaceId as string)
const pdfUrl = computed(() => `${apiBaseUrl()}/onboarding/${workspaceId.value}/contract.pdf`)
const conSesion = computed(() => Boolean(localStorage.getItem('access_token')))

const isLoading = ref(true)
const isSubmitting = ref(false)
const contractSubmitted = ref(false)
const workspaceName = ref('')
const envioInicial = ref<EnvioContrato | null>(null)
const recienFirmado = ref(false)

/** Los datos los llenó por Telegram; aquí solo se muestran. */
const contractData = ref<Record<string, any>>({
  rucBakano: '0993408804001',
  razonSocialBakano: 'BAKANOEC SAS',
  nombreCliente: '',
  rucCliente: '',
  representanteCliente: '',
  email: userStore.email || '',
})

const CAMPOS_OBLIGATORIOS = ['rucCliente', 'nombreCliente', 'representanteCliente', 'email', 'presupuestoPauta']

const contrato = ref<TextoContrato | null>(null)

const faltantes = computed(() =>
  CAMPOS_OBLIGATORIOS.filter((c) => !String(contractData.value[c] ?? '').trim())
)

onMounted(async () => {
  if (!workspaceId.value) {
    router.push('/')
    return
  }
  try {
    const response = await onboardingService.getStatus(workspaceId.value)
    if (response.preNegotiatedContract) Object.assign(contractData.value, response.preNegotiatedContract)
    if (response.contractData) Object.assign(contractData.value, response.contractData)
    if (response.contrato) {
      contrato.value = response.contrato
      contractData.value.rucBakano = response.contrato.bakano.ruc
      contractData.value.razonSocialBakano = response.contrato.bakano.razonSocial
    }
    workspaceName.value = response.workspaceName || ''
    contractSubmitted.value = response.onboardingStatus?.contractSubmitted || false
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
})

async function onFirmar(payload: { signatureBase64: string; nombreFirmado: string; correoEnvio: string }) {
  isSubmitting.value = true
  try {
    const r = await onboardingService.submitContract(workspaceId.value, {
      ...contractData.value,
      clientSignatureBase64: payload.signatureBase64,
      nombreFirmado: payload.nombreFirmado,
      correoEnvio: payload.correoEnvio,
    })
    contractData.value.email = payload.correoEnvio
    envioInicial.value = r.correo
    recienFirmado.value = true
    contractSubmitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error: any) {
    if (error?.response?.status === 409) {
      contractSubmitted.value = true
      return
    }
    toast.error(error?.response?.data?.error || 'No pudimos firmar tu contrato. Inténtalo de nuevo.')
  } finally {
    isSubmitting.value = false
  }
}

function irAMetrics() {
  router.push(`/app/workspaces/${workspaceId.value}`)
}

function onLogout() {
  userStore.clear()
  router.push({ name: 'AuthLogin' })
}
</script>

<template>
  <div class="firma">
    <header class="firma__head">
      <div class="firma__marca">
        <span class="firma__punto" />
        <span>Bakano</span>
        <span v-if="workspaceName" class="firma__entorno">· {{ workspaceName }}</span>
      </div>
      <button v-if="conSesion" class="firma__salir" @click="onLogout">
        <i class="fa-solid fa-right-from-bracket" /> Salir
      </button>
    </header>

    <!-- Cargando: el esqueleto tiene la forma de lo que viene -->
    <main v-if="isLoading" class="firma__caja">
      <span class="skel skel--titulo" />
      <span class="skel skel--linea" />
      <div class="firma__skel-datos">
        <span v-for="n in 4" :key="n" class="skel skel--dato" />
      </div>
      <span class="skel skel--firma" />
    </main>

    <!-- Firmado: a qué correo salió y si llegó -->
    <main v-else-if="contractSubmitted" class="firma__caja firma__caja--centrada">
      <span class="firma__icono"><i class="fa-solid fa-circle-check" /></span>
      <h1 class="firma__titulo">{{ recienFirmado ? '¡Listo, firmaste tu contrato!' : 'Tu contrato está firmado' }}</h1>
      <ContratoCorreoEstado :workspaceId="workspaceId" :envioInicial="envioInicial" />
      <div class="firma__acciones">
        <a class="firma__btn firma__btn--plano" :href="pdfUrl" target="_blank" rel="noopener">
          <i class="fa-solid fa-file-pdf" /> Ver el PDF
        </a>
        <a class="firma__btn firma__btn--plano" :href="BOT_URL" target="_blank" rel="noopener">
          <i class="fa-brands fa-telegram" /> Volver al chat
        </a>
        <button v-if="conSesion" class="firma__btn firma__btn--plano" @click="irAMetrics">Ir a mi entorno</button>
      </div>
    </main>

    <!-- Le faltan datos: se los pide por Telegram, no aquí -->
    <main v-else-if="faltantes.length" class="firma__caja firma__caja--centrada">
      <span class="firma__icono firma__icono--ambar"><i class="fa-solid fa-pen-to-square" /></span>
      <h1 class="firma__titulo">Falta completar tu contrato</h1>
      <p class="firma__sub">
        Los datos del contrato se llenan por el chat, en un minuto y sin formularios.
        Vuelve a Telegram y el bot te va preguntando uno por uno.
      </p>
      <div class="firma__acciones">
        <a class="firma__btn" :href="BOT_URL" target="_blank" rel="noopener">
          <i class="fa-brands fa-telegram" /> Completar en Telegram
        </a>
      </div>
    </main>

    <!-- Lo único que hace esta pantalla: firmar -->
    <main v-else class="firma__caja">
      <OnboardingStepContract
        :contractData="contractData"
        :contrato="contrato"
        :pdfUrl="pdfUrl"
        :isSubmitting="isSubmitting"
        @firmar="onFirmar"
      />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.firma {
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding: 1.25rem 1.25rem 3rem;
  font-family: 'Inter', system-ui, sans-serif;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  &__marca {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $primary-dark;
  }

  &__punto {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary, $secondary);
  }

  &__entorno {
    font-weight: 600;
    text-transform: none;
    letter-spacing: 0;
    color: $text-secondary;
  }

  &__salir {
    border: 1px solid rgba(107, 114, 128, 0.2);
    background: $white;
    color: $text-secondary;
    border-radius: 9px;
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;

    &:hover { border-color: $secondary; color: $secondary; }
  }

  &__caja {
    background: $white;
    border: 1px solid rgba(107, 114, 128, 0.16);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 16px 40px rgba(25, 20, 35, 0.06);
    display: grid;
    gap: 0.85rem;

    @media (max-width: 640px) { padding: 1.25rem; border-radius: 16px; }

    &--centrada {
      justify-items: center;
      text-align: center;
      padding-block: 3rem;
      gap: 0.6rem;
    }
  }

  &__icono {
    font-size: 2.6rem;
    line-height: 1;
    color: $alert-success;

    &--ambar { color: $alert-warning; }
  }

  &__titulo {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }

  &__sub {
    margin: 0;
    color: $text-secondary;
    font-size: 0.95rem;
    line-height: 1.6;
    max-width: 52ch;
  }

  &__acciones {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 0.75rem;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: linear-gradient(135deg, $primary, $secondary);
    color: $white;
    border: none;
    border-radius: 11px;
    padding: 0.7rem 1.4rem;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;

    &--plano {
      background: $white;
      color: $secondary;
      border: 1px solid rgba(107, 114, 128, 0.2);
    }
  }

  &__skel-datos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
    margin: 0.5rem 0;
  }
}

.skel {
  display: block;
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(133, 82, 156, 0.08) 25%, rgba(133, 82, 156, 0.16) 50%, rgba(133, 82, 156, 0.08) 75%);
  background-size: 200% 100%;
  animation: firma-brillo 1.2s ease-in-out infinite;

  &--titulo { height: 26px; width: 45%; }
  &--linea { height: 12px; width: 70%; }
  &--dato { height: 58px; }
  &--firma { height: 160px; }
}

@keyframes firma-brillo {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
