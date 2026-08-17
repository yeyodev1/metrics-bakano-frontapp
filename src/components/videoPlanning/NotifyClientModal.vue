<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { videoPlanningService } from '@/services/videoPlanning.service'
import NotifyAuditPanel from './NotifyAuditPanel.vue'
import NotifyRecipientsPanel from './NotifyRecipientsPanel.vue'
import type { DestinatariosAviso, HistorialAvisos, UsuarioAviso } from '@/types/videoPlanning'

const props = defineProps<{ planningId: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'sent'): void }>()

const TEXTO_TIPO: Record<string, string> = {
  enviada: 'Primer aviso de esta planificación',
  revisada: 'Aviso de planificación revisada',
  recordatorio: 'Recordatorio: el cliente ya recibió este enlace',
}

const tab = ref<'destinatarios' | 'historial'>('destinatarios')
const data = ref<DestinatariosAviso | null>(null)
const historial = ref<HistorialAvisos | null>(null)
const cargando = ref(true)
const cargandoHistorial = ref(true)
const error = ref('')
const enviando = ref(false)
const confirmando = ref(false)
const resultado = ref('')

const totalAvisos = computed(() =>
  historial.value ? historial.value.resumen.whatsapp + historial.value.resumen.email : 0,
)
const puedeEnviar = computed(
  () => !!data.value?.puedeNotificar && !enviando.value && !cargando.value,
)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    data.value = await videoPlanningService.getDestinatarios(props.planningId)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudieron cargar los destinatarios.'
  } finally {
    cargando.value = false
  }
}

async function cargarHistorial() {
  cargandoHistorial.value = true
  try {
    historial.value = await videoPlanningService.getHistorialAvisos(props.planningId)
  } catch {
    historial.value = null
  } finally {
    cargandoHistorial.value = false
  }
}

/** El mismo usuario aparece en las dos listas: se refresca en ambas. */
function aplicarTelefono(actualizado: UsuarioAviso) {
  if (!data.value) return
  for (const lista of [data.value.correo, data.value.whatsapp]) {
    const i = lista.findIndex((x) => x.id === actualizado.id)
    if (i !== -1) lista[i] = { ...lista[i], ...actualizado }
  }
}

async function enviar() {
  // Un paso de confirmación porque esto sale al teléfono real del cliente.
  if (!confirmando.value) {
    confirmando.value = true
    return
  }
  enviando.value = true
  error.value = ''
  try {
    const r = await videoPlanningService.notificar(props.planningId)
    resultado.value = [
      r.whatsapp.enviado ? `WhatsApp a ${r.whatsapp.contactos.length}` : 'WhatsApp falló',
      r.email.enviado ? `correo a ${r.email.destinatarios.length}` : 'correo falló',
    ].join(' · ')
    emit('sent')
    await Promise.all([cargar(), cargarHistorial()])
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo notificar.'
  } finally {
    confirmando.value = false
    enviando.value = false
  }
}

onMounted(() => {
  cargar()
  cargarHistorial()
})
</script>

<template>
  <div class="notify" @click.self="emit('close')">
    <div class="notify__box">
      <header class="notify__head">
        <div>
          <p class="notify__eyebrow"><i class="fa-solid fa-paper-plane" /> Avisar al cliente</p>
          <h2 class="notify__title">{{ data?.entorno || 'Planificación' }}</h2>
          <p v-if="data" class="notify__sub">
            {{ data.totalVideos }} videos · {{ TEXTO_TIPO[data.tipoAviso] }}
            <span v-if="data.numeroEnvio > 1">(envío #{{ data.numeroEnvio }})</span>
          </p>
        </div>
        <button class="notify__close" @click="emit('close')"><i class="fa-solid fa-xmark" /></button>
      </header>

      <nav class="notify__tabs">
        <button :class="{ 'is-active': tab === 'destinatarios' }" @click="tab = 'destinatarios'">
          Destinatarios
        </button>
        <button :class="{ 'is-active': tab === 'historial' }" @click="tab = 'historial'">
          Historial
          <span v-if="totalAvisos" class="notify__badge">{{ totalAvisos }}</span>
        </button>
      </nav>

      <div class="notify__body">
        <p v-if="cargando && tab === 'destinatarios'" class="notify__loading">
          <i class="fa-solid fa-circle-notch fa-spin" /> Cargando…
        </p>
        <NotifyRecipientsPanel
          v-else-if="tab === 'destinatarios'"
          :planning-id="planningId"
          :data="data"
          @updated="aplicarTelefono"
        />
        <NotifyAuditPanel v-else :historial="historial" :loading="cargandoHistorial" />
      </div>

      <footer class="notify__foot">
        <p v-if="error" class="notify__error">{{ error }}</p>
        <p v-if="resultado" class="notify__ok"><i class="fa-solid fa-circle-check" /> {{ resultado }}</p>
        <p v-if="data && !data.puedeNotificar" class="notify__error">
          El cliente ya respondió esta planificación. Se podrá volver a avisar cuando se envíe una nueva.
        </p>

        <div class="notify__foot-actions">
          <button class="notify__btn-ghost" @click="emit('close')">Cerrar</button>
          <button
            v-if="tab === 'destinatarios'"
            class="notify__btn-send"
            :class="{ 'is-confirm': confirmando }"
            :disabled="!puedeEnviar"
            @click="enviar"
          >
            <i class="fa-solid" :class="enviando ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'" />
            <span v-if="enviando">Enviando…</span>
            <span v-else-if="confirmando">Sí, enviar de verdad</span>
            <span v-else>Enviar aviso</span>
          </button>
        </div>
        <p v-if="confirmando" class="notify__warn">
          Esto manda WhatsApp y correos reales al cliente ahora mismo.
        </p>
      </footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notify {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  &__box {
    background: $white;
    border-radius: 16px;
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.1rem 1.25rem 0.9rem;
    border-bottom: 1px solid rgba($primary-dark, 0.08);
  }

  &__eyebrow {
    margin: 0;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba($primary-dark, 0.5);
  }

  &__title { margin: 0.15rem 0 0; font-size: 1.15rem; color: $primary-dark; }
  &__sub { margin: 0.2rem 0 0; font-size: 0.8rem; color: rgba($primary-dark, 0.6); }

  &__close {
    border: none;
    background: rgba($primary-dark, 0.05);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    color: $primary-dark;
    flex-shrink: 0;
  }

  &__tabs {
    display: flex;
    gap: 0.25rem;
    padding: 0.6rem 1.25rem 0;
    border-bottom: 1px solid rgba($primary-dark, 0.08);

    button {
      border: none;
      background: none;
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba($primary-dark, 0.55);
      cursor: pointer;
      border-bottom: 2px solid transparent;

      &.is-active { color: $primary-dark; border-bottom-color: $primary-dark; }
    }
  }

  &__badge {
    background: rgba($primary-dark, 0.08);
    border-radius: 20px;
    padding: 0 0.4rem;
    font-size: 0.7rem;
    margin-left: 0.3rem;
  }

  &__body {
    padding: 1rem 1.25rem;
    overflow-y: auto;
    flex: 1;
  }

  &__loading {
    text-align: center;
    color: rgba($primary-dark, 0.6);
    font-size: 0.88rem;
    padding: 1rem 0;
    margin: 0;
  }

  &__foot {
    border-top: 1px solid rgba($primary-dark, 0.08);
    padding: 0.85rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &-actions { display: flex; justify-content: flex-end; gap: 0.6rem; }
  }

  &__error { margin: 0; font-size: 0.78rem; color: #b91c1c; }
  &__ok { margin: 0; font-size: 0.8rem; color: #15803d; }
  &__warn { margin: 0; font-size: 0.75rem; color: #92400e; text-align: right; }

  &__btn-ghost, &__btn-send {
    border-radius: 10px;
    padding: 0.5rem 0.9rem;
    font-size: 0.83rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
  }

  &__btn-ghost { background: none; border-color: rgba($primary-dark, 0.15); color: $primary-dark; }

  &__btn-send {
    background: #128c3f;
    color: $white;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;

    &.is-confirm { background: #b45309; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}
</style>
