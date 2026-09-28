<script setup lang="ts">
import { computed, ref } from 'vue'
import integracionesService, { type CrmRevisionResultado } from '@/services/integraciones.service'
import CrmHallazgoCard from './CrmHallazgoCard.vue'
import { diasEntre, hoyEcuador, sumarDias } from './format'

/**
 * Revisión manual: el equipo elige un rango y Bakano lee el CRM en ese momento.
 * Tarda (IA sobre conversaciones reales), así que el estado de carga lo dice.
 */
const props = defineProps<{ workspaceId: string }>()

const MAX_DIAS = 31

const hoy = hoyEcuador()
const desde = ref(sumarDias(hoy, -6))
const hasta = ref(hoy)
const avisarCliente = ref(false)

const running = ref(false)
const runError = ref('')
const resultado = ref<CrmRevisionResultado | null>(null)

const rangoError = computed(() => {
  if (!desde.value || !hasta.value) return 'Elige las dos fechas.'
  if (hasta.value > hoy) return 'La fecha "hasta" no puede ser futura.'
  if (desde.value > hasta.value) return '"Desde" tiene que ser antes de "hasta".'
  if (diasEntre(desde.value, hasta.value) > MAX_DIAS) return `El rango puede tener como máximo ${MAX_DIAS} días.`
  return ''
})

const desdeMin = computed(() => (hasta.value ? sumarDias(hasta.value, -(MAX_DIAS - 1)) : undefined))

function mensajeDeError(error: unknown) {
  const e = error as { status?: number; message?: string }
  if (e?.status === 403) return 'Solo el equipo de Bakano puede revisar el CRM.'
  // httpBase convierte un timeout (sin respuesta) en "Unknown error".
  if (!e?.message || e.message === 'Unknown error') {
    return 'La revisión tardó demasiado o no hubo respuesta. Prueba con un rango más corto.'
  }
  return e.message
}

async function onRevisar() {
  if (rangoError.value || running.value) return
  running.value = true
  runError.value = ''
  resultado.value = null
  try {
    resultado.value = await integracionesService.revisarCrm(props.workspaceId, {
      desde: desde.value,
      hasta: hasta.value,
      avisarCliente: avisarCliente.value,
    })
  } catch (error) {
    runError.value = mensajeDeError(error)
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div class="man">
    <h3 class="man__title">Revisión manual</h3>

    <form class="man__form" novalidate @submit.prevent="onRevisar">
      <div class="man__dates">
        <div class="man__field">
          <label for="rev-desde">Desde</label>
          <input id="rev-desde" v-model="desde" type="date" :min="desdeMin" :max="hasta || hoy" :disabled="running" />
        </div>
        <div class="man__field">
          <label for="rev-hasta">Hasta</label>
          <input id="rev-hasta" v-model="hasta" type="date" :min="desde" :max="hoy" :disabled="running" />
        </div>
      </div>
      <p class="man__hint" :class="{ 'is-error': rangoError }">
        {{ rangoError || `Máximo ${MAX_DIAS} días, sin fechas futuras.` }}
      </p>

      <label class="man__check">
        <input v-model="avisarCliente" type="checkbox" :disabled="running" />
        <span>Avisarle al cliente por Telegram con lo que encuentre</span>
      </label>

      <button type="submit" class="man__run" :disabled="!!rangoError || running">
        <i :class="running ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-magnifying-glass'" aria-hidden="true" />
        {{ running ? 'Revisando…' : 'Revisar ahora' }}
      </button>
    </form>

    <div class="man__live" aria-live="polite">
      <p v-if="running" class="man__loading">
        <i class="fa-solid fa-spinner fa-spin" aria-hidden="true" />
        <span>Leyendo conversaciones… puede tardar hasta un minuto.</span>
      </p>

      <p v-else-if="runError" class="man__error" role="alert">
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> {{ runError }}
      </p>

      <div v-else-if="resultado" class="man__result">
        <p class="man__summary">
          Leímos <strong>{{ resultado.conversaciones }}</strong>
          {{ resultado.conversaciones === 1 ? 'conversación' : 'conversaciones' }} y
          <strong>{{ resultado.oportunidades }}</strong>
          {{ resultado.oportunidades === 1 ? 'oportunidad' : 'oportunidades' }}.
          <template v-if="resultado.hallazgos.length">
            Encontramos <strong>{{ resultado.hallazgos.length }}</strong>
            {{ resultado.hallazgos.length === 1 ? 'cosa' : 'cosas' }} para atender.
          </template>
        </p>

        <p v-if="resultado.truncado" class="man__warn" role="status">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          <span>Había demasiado para leer de una vez y revisamos solo una parte. Prueba con un rango más corto.</span>
        </p>

        <ul v-if="resultado.hallazgos.length" class="man__list">
          <li v-for="(hallazgo, i) in resultado.hallazgos" :key="i">
            <CrmHallazgoCard :hallazgo="hallazgo" />
          </li>
        </ul>

        <div v-else class="man__empty">
          <i class="fa-regular fa-face-smile" aria-hidden="true" />
          <strong>Todo en orden</strong>
          <span>No encontramos clientes esperando respuesta ni oportunidades olvidadas en esas fechas.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.man { display: flex; flex-direction: column; gap: 0.9rem; }

.man__title { font-size: 0.88rem; font-weight: 800; color: $primary-dark; margin: 0; }

.man__form { display: flex; flex-direction: column; gap: 0.75rem; }

.man__dates {
  display: flex; flex-direction: column; gap: 0.75rem;
  @media (min-width: 561px) { flex-direction: row; }
}

.man__field {
  flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.35rem;
  label { font-size: 0.78rem; font-weight: 700; color: $primary-dark; }

  input {
    width: 100%; min-height: 46px; padding: 0.55rem 0.7rem;
    border: 1px solid rgba($primary-dark, 0.16); border-radius: 10px;
    font-family: inherit; font-size: 16px; color: $primary-dark; background: $white;
    &:focus { outline: none; border-color: $secondary; box-shadow: 0 0 0 3px $overlay-purple; }
    &:disabled { background: rgba($primary-dark, 0.03); }
  }
}

.man__hint {
  margin: -0.35rem 0 0; font-size: 0.72rem; color: $text-secondary;
  &.is-error { color: $alert-error; font-weight: 600; }
}

.man__check {
  display: flex; align-items: flex-start; gap: 0.6rem; min-height: 44px; padding: 0.35rem 0;
  font-size: 0.84rem; line-height: 1.4; color: $primary-dark; cursor: pointer;
  input { width: 20px; height: 20px; flex-shrink: 0; margin: 0; accent-color: $secondary; }
}

.man__run {
  min-height: 46px; padding: 0.6rem 1.2rem; border-radius: 10px; border: none;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: $primary-dark; color: $white;
  font-family: inherit; font-size: 0.86rem; font-weight: 700; cursor: pointer;

  &:disabled { opacity: 0.55; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid $secondary; outline-offset: 2px; }

  @media (min-width: 561px) { align-self: flex-start; }
}

.man__live { display: flex; flex-direction: column; }

@mixin man-banner($bg, $fg) {
  display: flex; align-items: flex-start; gap: 0.55rem; margin: 0;
  padding: 0.75rem 0.85rem; border-radius: 10px;
  background: $bg; color: $fg; font-size: 0.82rem; line-height: 1.45;
  i { margin-top: 0.15rem; }
}

.man__loading { @include man-banner($overlay-purple, $secondary-dark); font-weight: 600; }
.man__error { @include man-banner($alert-error-bg, $alert-error); }
.man__warn { @include man-banner($alert-warning-bg, $primary-dark); i { color: $alert-warning; } }

.man__result { display: flex; flex-direction: column; gap: 0.75rem; }

.man__summary { margin: 0; font-size: 0.86rem; line-height: 1.5; color: $primary-dark; }

.man__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }

.man__empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.35rem; text-align: center;
  padding: 1.6rem 1rem; border-radius: 12px; background: $alert-success-bg; color: $primary-dark;
  i { font-size: 1.5rem; color: $alert-success; }
  strong { font-size: 0.92rem; }
  span { font-size: 0.8rem; color: $text-secondary; max-width: 42ch; }
}
</style>
