<script setup lang="ts">
import { ref, computed } from 'vue'
import { videoPlanningService } from '@/services/videoPlanning.service'
import type { VideoPlanning } from '@/types/videoPlanning'
import { useToast } from '@/composables/useToast'

/**
 * Aparece en la vista del editor cuando hay videos editados: es el
 * recordatorio de que el cliente tiene que enterarse. El aviso manda
 * WhatsApp y correo REALES, por eso el botón pide un segundo click.
 */
const props = defineProps<{
  planning: VideoPlanning
  editadas: number
  total: number
}>()

const emit = defineEmits<{ (e: 'notified'): void }>()

const toast = useToast()
const enviando = ref(false)
const confirmando = ref(false)

const yaRevisado = computed(
  () => Boolean(props.planning.videosRevisadosEn) && !props.planning.revisionVideosAbierta,
)
const esperandoRevision = computed(() => Boolean(props.planning.revisionVideosAbierta))
const todosEditados = computed(() => props.editadas === props.total && props.total > 0)

async function notificar() {
  if (!confirmando.value) {
    confirmando.value = true
    // Si no confirma en 6 segundos, el boton vuelve a su estado normal.
    setTimeout(() => (confirmando.value = false), 6000)
    return
  }
  confirmando.value = false
  enviando.value = true
  try {
    const res = await videoPlanningService.notificarRevision(props.planning._id)
    const canales = [
      res.whatsapp.enviado ? 'WhatsApp' : null,
      res.email.enviado ? 'correo' : null,
    ].filter(Boolean)
    toast.success(`Aviso enviado por ${canales.join(' y ')} (${res.tipoAviso}).`)
    if (res.whatsapp.error) toast.error(res.whatsapp.error)
    if (res.email.error) toast.error(res.email.error)
    emit('notified')
  } catch (err: any) {
    toast.error(err?.data?.message || err?.message || 'No se pudo enviar el aviso.')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div
    v-if="editadas > 0"
    class="arb"
    :class="{ 'arb--done': yaRevisado, 'arb--waiting': esperandoRevision }"
  >
    <!-- El cliente ya reviso: nada que hacer -->
    <template v-if="yaRevisado">
      <i class="fa-solid fa-circle-check arb__icon" />
      <div class="arb__text">
        <strong>El cliente ya revisó estos videos</strong>
        <span>Su respuesta quedó registrada en la auditoría.</span>
      </div>
    </template>

    <!-- Ciclo abierto: se aviso y el cron insiste cada 4 horas -->
    <template v-else-if="esperandoRevision">
      <i class="fa-solid fa-hourglass-half arb__icon" />
      <div class="arb__text">
        <strong>Cliente avisado — esperando su revisión</strong>
        <span>Se le recuerda solo cada 4 horas hasta que revise.</span>
      </div>
      <button class="arb__btn arb__btn--ghost" :disabled="enviando" @click="notificar">
        <i v-if="enviando" class="fa-solid fa-spinner fa-spin" />
        {{ confirmando ? '¿Reenviar ahora?' : 'Reenviar aviso' }}
      </button>
    </template>

    <!-- Hay editados y el cliente aun no sabe: el paso que falta -->
    <template v-else>
      <i class="fa-solid fa-bullhorn arb__icon" />
      <div class="arb__text">
        <strong>
          {{ todosEditados ? '¡Todos los videos están editados!' : `${editadas} de ${total} videos editados` }}
        </strong>
        <span>Notifica al cliente para que los revise (WhatsApp + correo).</span>
      </div>
      <button class="arb__btn" :disabled="enviando" @click="notificar">
        <i v-if="enviando" class="fa-solid fa-spinner fa-spin" />
        <i v-else-if="confirmando" class="fa-solid fa-triangle-exclamation" />
        <i v-else class="fa-solid fa-paper-plane" />
        {{ confirmando ? '¿Confirmar envío real?' : 'Notificar al cliente' }}
      </button>
    </template>
  </div>
</template>

<style scoped lang="scss">
.arb {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 14px;
  padding: 0.85rem 1.1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;

  &--waiting {
    background: rgba(#f59e0b, 0.07);
    border-color: rgba(#f59e0b, 0.3);

    .arb__icon { color: #b45309; }
  }

  &--done {
    background: rgba(#10b981, 0.07);
    border-color: rgba(#10b981, 0.3);

    .arb__icon { color: #059669; }
  }

  &__icon {
    font-size: 1.15rem;
    color: $primary;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;

    strong { font-size: 0.85rem; font-weight: 800; color: $primary-dark; }
    span   { font-size: 0.76rem; color: $text-secondary; }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    background: $primary;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.55rem 1rem;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:hover:not(:disabled) { opacity: 0.88; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &--ghost {
      background: transparent;
      color: #b45309;
      border: 1px solid rgba(#b45309, 0.35);
    }
  }
}
</style>
