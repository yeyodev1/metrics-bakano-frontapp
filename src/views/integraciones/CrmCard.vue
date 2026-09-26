<script setup lang="ts">
import { computed, ref } from 'vue'
import integracionesService, {
  type CrmCredenciales,
  type CrmVista,
} from '@/services/integraciones.service'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import CrmConnectForm from './CrmConnectForm.vue'
import CrmStatusDetails from './CrmStatusDetails.vue'

/**
 * Tarjeta del CRM (GoHighLevel). Tres caras: sin conectar (beneficios +
 * formulario), conectado (detalle + acciones) y con error (motivo + formulario
 * para cambiar el token). Las llamadas viven aquí; la vista solo carga.
 */
const props = defineProps<{ workspaceId: string; crm: CrmVista | null }>()
const emit = defineEmits<{ 'update:crm': [crm: CrmVista | null] }>()

const { addToast } = useToast()
const { confirm } = useConfirm()

const editing = ref(false)
const saving = ref(false)
const formError = ref('')
const testing = ref(false)
const disconnecting = ref(false)

const busy = computed(() => saving.value || testing.value || disconnecting.value)
const showForm = computed(() => !props.crm || props.crm.estado === 'error' || editing.value)

const BENEFICIOS = [
  { icon: 'fa-brands fa-whatsapp', text: 'Revisamos cada día tus conversaciones de WhatsApp.' },
  { icon: 'fa-solid fa-filter-circle-dollar', text: 'Seguimos tus oportunidades en el embudo de ventas.' },
  { icon: 'fa-solid fa-bell', text: 'Te avisamos de los clientes que estaban listos para comprar.' },
]

function errorMessage(error: unknown, fallback: string) {
  return (error as { message?: string })?.message || fallback
}

async function onSubmit(credenciales: CrmCredenciales) {
  saving.value = true
  formError.value = ''
  const primeraVez = !props.crm
  try {
    const crm = await integracionesService.conectarCrm(props.workspaceId, credenciales)
    emit('update:crm', crm)
    editing.value = false
    addToast({
      type: 'success',
      title: primeraVez ? '¡CRM conectado!' : 'Token actualizado',
      message: 'Desde ahora revisamos tu CRM cada día.',
    })
  } catch (error) {
    formError.value = errorMessage(error, 'No pudimos conectar tu CRM. Revisa los datos e inténtalo de nuevo.')
  } finally {
    saving.value = false
  }
}

async function onTest() {
  testing.value = true
  try {
    const crm = await integracionesService.probarCrm(props.workspaceId)
    emit('update:crm', crm)
    if (crm.estado === 'conectado') {
      addToast({ type: 'success', message: 'La conexión con tu CRM funciona bien.' })
    } else {
      addToast({ type: 'error', message: crm.ultimoError || 'La conexión con tu CRM tiene un problema.' })
    }
  } catch (error) {
    addToast({ type: 'error', message: errorMessage(error, 'No pudimos probar la conexión.') })
  } finally {
    testing.value = false
  }
}

async function onDisconnect() {
  const ok = await confirm({
    title: '¿Desconectar tu CRM?',
    message: 'Dejaremos de revisar tus conversaciones y oportunidades, y ya no te avisaremos de clientes listos para comprar. Puedes volver a conectarlo cuando quieras.',
    confirmText: 'Desconectar',
    cancelText: 'Cancelar',
  })
  if (!ok) return

  disconnecting.value = true
  try {
    await integracionesService.desconectarCrm(props.workspaceId)
    emit('update:crm', null)
    editing.value = false
    formError.value = ''
    addToast({ type: 'info', message: 'Tu CRM quedó desconectado.' })
  } catch (error) {
    addToast({ type: 'error', message: errorMessage(error, 'No pudimos desconectar tu CRM.') })
  } finally {
    disconnecting.value = false
  }
}

function startEditing() {
  formError.value = ''
  editing.value = true
}
</script>

<template>
  <section class="crm-card" :class="{ 'crm-card--error': crm?.estado === 'error' }" aria-labelledby="crm-card-title">
    <header class="crm-card__head">
      <div class="crm-card__logo" aria-hidden="true"><i class="fa-solid fa-address-book" /></div>
      <div class="crm-card__title">
        <h2 id="crm-card-title">CRM · GoHighLevel</h2>
        <p>Conversaciones y oportunidades de tu negocio</p>
      </div>
      <span v-if="!crm" class="crm-card__badge crm-card__badge--off">
        <span class="crm-card__dot" aria-hidden="true" /> Sin conectar
      </span>
      <span v-else-if="crm.estado === 'conectado'" class="crm-card__badge crm-card__badge--ok">
        <span class="crm-card__dot" aria-hidden="true" /> Conectado
      </span>
      <span v-else class="crm-card__badge crm-card__badge--bad">
        <span class="crm-card__dot" aria-hidden="true" /> Con error
      </span>
    </header>

    <!-- Sin conectar: por qué vale la pena -->
    <ul v-if="!crm" class="crm-card__benefits">
      <li v-for="beneficio in BENEFICIOS" :key="beneficio.text">
        <i :class="beneficio.icon" aria-hidden="true" />
        <span>{{ beneficio.text }}</span>
      </li>
    </ul>

    <!-- Con error: el motivo, antes que nada -->
    <p v-if="crm?.estado === 'error'" class="crm-card__alert" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
      <span>
        <strong>La conexión dejó de funcionar.</strong>
        {{ crm.ultimoError || 'No pudimos leer tu CRM con el token guardado.' }}
        Actualiza el token para seguir revisando tu CRM.
      </span>
    </p>

    <CrmStatusDetails v-if="crm" :crm="crm" />

    <div v-if="crm && !editing" class="crm-card__actions">
      <button type="button" class="crm-card__btn crm-card__btn--primary" :disabled="busy" @click="onTest">
        <i :class="testing ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true" />
        {{ testing ? 'Probando…' : 'Probar conexión' }}
      </button>
      <button
        v-if="crm.estado === 'conectado'"
        type="button"
        class="crm-card__btn"
        :disabled="busy"
        @click="startEditing"
      >
        <i class="fa-solid fa-key" aria-hidden="true" /> Actualizar token
      </button>
      <button type="button" class="crm-card__btn crm-card__btn--danger" :disabled="busy" @click="onDisconnect">
        <i :class="disconnecting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-link-slash'" aria-hidden="true" />
        {{ disconnecting ? 'Desconectando…' : 'Desconectar' }}
      </button>
    </div>

    <div v-if="showForm" class="crm-card__form">
      <h3 v-if="crm">{{ crm.estado === 'error' ? 'Actualiza tu token' : 'Nuevo token' }}</h3>
      <CrmConnectForm
        :initial-location-id="crm?.locationId"
        :saving="saving"
        :error="formError"
        :submit-label="crm ? 'Guardar token' : 'Conectar'"
        :cancelable="editing"
        @submit="onSubmit"
        @cancel="editing = false"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.crm-card {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 16px;
  padding: 1.2rem 1.25rem;
  display: flex; flex-direction: column; gap: 1rem;
  box-shadow: 0 1px 2px rgba($primary-dark, 0.04);

  &--error { border-color: rgba(#ef4444, 0.3); }

  @media (max-width: 560px) { padding: 1rem; border-radius: 14px; }
}

.crm-card__head {
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
}

.crm-card__logo {
  width: 42px; height: 42px; flex-shrink: 0;
  display: grid; place-items: center; border-radius: 12px;
  background: rgba(#6366f1, 0.1); color: #6366f1; font-size: 1.05rem;
}

.crm-card__title {
  flex: 1; min-width: 0;
  h2 { font-size: 1rem; font-weight: 800; color: $primary-dark; margin: 0; }
  p { font-size: 0.76rem; color: $text-secondary; margin: 0.1rem 0 0; }
}

.crm-card__badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.28rem 0.7rem; border-radius: 999px;
  font-size: 0.72rem; font-weight: 800; white-space: nowrap;

  &--ok { background: rgba(#10b981, 0.12); color: #0d9668; }
  &--bad { background: rgba(#ef4444, 0.1); color: #dc2626; }
  &--off { background: rgba($primary-dark, 0.06); color: $text-secondary; }
}

.crm-card__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

.crm-card__benefits {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 0.55rem;

  li {
    display: flex; align-items: flex-start; gap: 0.6rem;
    font-size: 0.84rem; line-height: 1.45; color: $primary-dark;
    i { width: 1.1rem; text-align: center; margin-top: 0.15rem; color: #6366f1; }
  }
}

.crm-card__alert {
  display: flex; align-items: flex-start; gap: 0.55rem;
  margin: 0; padding: 0.75rem 0.85rem; border-radius: 10px;
  background: rgba(#ef4444, 0.07); border: 1px solid rgba(#ef4444, 0.2);
  font-size: 0.82rem; line-height: 1.45; color: #991b1b;
  i { margin-top: 0.15rem; color: #dc2626; }
}

.crm-card__actions {
  display: flex; gap: 0.55rem; flex-wrap: wrap;
  padding-top: 0.2rem;

  @media (max-width: 560px) { flex-direction: column; }
}

.crm-card__btn {
  min-height: 44px; padding: 0.55rem 1rem; border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
  font-family: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer;
  background: $white; color: $primary-dark; border: 1px solid rgba($primary-dark, 0.14);

  &:hover:not(:disabled) { border-color: rgba($primary-dark, 0.3); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

  &--primary {
    background: #6366f1; color: $white; border-color: #6366f1;
    &:hover:not(:disabled) { background: #4f46e5; border-color: #4f46e5; }
  }

  &--danger {
    color: #dc2626; border-color: rgba(#ef4444, 0.3);
    &:hover:not(:disabled) { background: rgba(#ef4444, 0.05); border-color: rgba(#ef4444, 0.5); }

    @media (min-width: 561px) { margin-left: auto; }
  }
}

.crm-card__form {
  border-top: 1px dashed rgba($primary-dark, 0.12);
  padding-top: 1rem;

  h3 { font-size: 0.88rem; font-weight: 800; color: $primary-dark; margin: 0 0 0.75rem; }
}

// Sin conexión todavía no hay nada arriba que separar del formulario.
.crm-card__benefits + .crm-card__form { border-top: none; padding-top: 0; }
</style>
