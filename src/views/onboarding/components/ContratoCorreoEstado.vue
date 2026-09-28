<script setup lang="ts">
/**
 * Después de firmar: a qué correo salió el contrato y si llegó.
 *
 * "Te llega a tu correo" sin más dejaba al cliente esperando algo que a veces
 * no salía o caía en spam. Aquí ve el estado real que da Resend, puede
 * reenviarlo o mandarlo a otro correo sin volver a Telegram.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onboardingService, type EstadoCorreoContrato } from '@/services/onboarding.service'

const props = defineProps({
  workspaceId: { type: String, required: true },
  /** Resultado del envío al firmar, para no esperar a la primera consulta. */
  envioInicial: { type: Object as () => { ok: boolean; correo?: string; motivo?: string } | null, default: null },
})

const estado = ref<EstadoCorreoContrato | null>(null)
const error = ref('')
const aviso = ref('')
const enviando = ref(false)
const otroCorreo = ref('')
const mostrarOtro = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let intentos = 0

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const INFO: Record<EstadoCorreoContrato['estado'], { icono: string; clase: string; texto: string }> = {
  sin_enviar: { icono: 'fa-envelope', clase: 'gris', texto: 'Todavía no se envió.' },
  enviando: { icono: 'fa-paper-plane', clase: 'azul', texto: 'Enviado. Esperando que tu correo lo reciba…' },
  entregado: { icono: 'fa-circle-check', clase: 'verde', texto: 'Llegó a tu correo.' },
  abierto: { icono: 'fa-envelope-open', clase: 'verde', texto: 'Llegó y ya lo abriste.' },
  demorado: { icono: 'fa-clock', clase: 'ambar', texto: 'Tu correo lo está demorando. Dale unos minutos.' },
  rebotado: { icono: 'fa-circle-xmark', clase: 'rojo', texto: 'No llegó: ese correo lo rechazó. Revisa que esté bien escrito o usa otro.' },
  desconocido: { icono: 'fa-paper-plane', clase: 'azul', texto: 'Enviado. Si no lo ves en unos minutos, revisa spam o reenvíalo.' },
}

const info = computed(() => (estado.value ? INFO[estado.value.estado] : null))
const llego = computed(() => estado.value?.estado === 'entregado' || estado.value?.estado === 'abierto')

async function consultar() {
  try {
    estado.value = await onboardingService.estadoCorreoContrato(props.workspaceId)
    error.value = ''
  } catch {
    error.value = 'No pudimos revisar el estado del correo.'
  }
  // Se sigue mirando un par de minutos mientras está en camino.
  const enCamino = estado.value && ['enviando', 'desconocido', 'demorado'].includes(estado.value.estado)
  if (enCamino && intentos++ < 24) timer = setTimeout(consultar, 5000)
}

async function reenviar(correo?: string) {
  enviando.value = true
  aviso.value = ''
  error.value = ''
  try {
    const r = await onboardingService.reenviarContrato(props.workspaceId, correo)
    aviso.value = r.motivo === 'reciente' ? `Ya va en camino a ${r.correo}. Dale un minuto.` : `Te lo mandamos de nuevo a ${r.correo}.`
    mostrarOtro.value = false
    otroCorreo.value = ''
  } catch (e: any) {
    const motivo = e?.response?.data?.motivo
    error.value =
      motivo === 'correo_invalido' ? 'Ese correo no parece válido.'
      : motivo === 'bloqueado' ? 'No podemos enviar a ese correo. Usa otro.'
      : 'No se pudo enviar. Inténtalo en un momento o pídeselo al bot de Telegram.'
  } finally {
    enviando.value = false
    intentos = 0
    if (timer) clearTimeout(timer)
    consultar()
  }
}

onMounted(() => {
  if (props.envioInicial && !props.envioInicial.ok && props.envioInicial.motivo !== 'reciente') {
    error.value = 'Tu contrato quedó firmado, pero el correo no salió. Toca "Reenviar".'
  }
  consultar()
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="correo">
    <p class="correo__destino">
      Te enviamos el contrato firmado a <strong>{{ estado?.correo || envioInicial?.correo || '…' }}</strong>
      <span class="correo__de">desde team@bakano.ec</span>
    </p>

    <div v-if="info" class="correo__estado" :class="`correo__estado--${info.clase}`" role="status">
      <i class="fa-solid" :class="[info.icono, { 'fa-beat-fade': estado?.estado === 'enviando' }]" />
      <span>{{ info.texto }}</span>
    </div>

    <p v-if="!llego || estado?.estado === 'entregado'" class="correo__spam">
      <i class="fa-solid fa-triangle-exclamation" />
      Si no lo ves en tu bandeja, revisa <strong>spam</strong> o <strong>promociones</strong>.
    </p>

    <p v-if="aviso" class="correo__ok">{{ aviso }}</p>
    <p v-if="error" class="correo__error">{{ error }}</p>

    <div class="correo__acciones">
      <button type="button" class="correo__btn" :disabled="enviando" @click="reenviar()">
        <i class="fa-solid" :class="enviando ? 'fa-spinner fa-spin' : 'fa-rotate-right'" /> Reenviar
      </button>
      <button type="button" class="correo__btn correo__btn--plano" @click="mostrarOtro = !mostrarOtro">
        <i class="fa-solid fa-at" /> Mandarlo a otro correo
      </button>
    </div>

    <form v-if="mostrarOtro" class="correo__otro" @submit.prevent="CORREO_RE.test(otroCorreo.trim()) && reenviar(otroCorreo.trim())">
      <input v-model="otroCorreo" type="email" placeholder="tucorreo@ejemplo.com" autocomplete="email" />
      <button type="submit" class="correo__btn" :disabled="enviando || !CORREO_RE.test(otroCorreo.trim())">Enviar</button>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.correo {
  display: grid;
  gap: 0.75rem;
  width: 100%;
  max-width: 460px;
  text-align: left;

  &__destino {
    margin: 0;
    color: $primary-dark;
    line-height: 1.5;

    strong { overflow-wrap: anywhere; }
  }

  &__de {
    display: block;
    font-size: 0.8rem;
    color: $text-secondary;
  }

  &__estado {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border-radius: 12px;
    padding: 0.75rem 0.9rem;
    font-weight: 600;
    font-size: 0.92rem;

    &--verde { background: $alert-success-bg; color: darken($alert-success, 12%); }
    &--azul { background: $alert-info-bg; color: darken($alert-info, 10%); }
    &--ambar { background: $alert-warning-bg; color: darken($alert-warning, 15%); }
    &--rojo { background: $alert-error-bg; color: darken($alert-error, 10%); }
    &--gris { background: $primary-light; color: $text-secondary; }
  }

  &__spam {
    margin: 0;
    font-size: 0.85rem;
    color: $text-secondary;

    i { color: $alert-warning; margin-right: 0.3rem; }
  }

  &__ok { margin: 0; font-size: 0.85rem; color: darken($alert-success, 12%); }
  &__error { margin: 0; font-size: 0.85rem; color: $alert-error; }

  &__acciones {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: linear-gradient(135deg, $primary, $secondary);
    color: $white;
    border: none;
    border-radius: 11px;
    padding: 0.65rem 1.1rem;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;

    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &--plano {
      background: $white;
      color: $secondary;
      border: 1px solid rgba($text-secondary, 0.25);
    }
  }

  &__otro {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    input {
      flex: 1;
      min-width: 200px;
      padding: 0.6rem 0.8rem;
      border: 1.5px solid rgba($text-secondary, 0.3);
      border-radius: 10px;
      font-size: 0.95rem;
    }
  }
}
</style>
