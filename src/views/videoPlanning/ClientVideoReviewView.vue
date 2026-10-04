<script setup lang="ts">
/**
 * El cliente revisa sus VIDEOS TERMINADOS: los ve y aprueba o pide cambios,
 * video por video. Al enviar su revisión completa se corta el ciclo de
 * recordatorios y el equipo recibe la confirmación.
 *
 * Distinto de ClientVideoPlanningView, que aprueba los GUIONES antes de
 * grabar: aquí se juzga el resultado final.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { videoPlanningService } from '@/services/videoPlanning.service'
import type { CambioVideo, VideoPlanning, VideoItem } from '@/types/videoPlanning'
import { useToast } from '@/composables/useToast'
import VideoReviewCard from '@/components/videoPlanning/VideoReviewCard.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const workspaceId = computed(() => String(route.params.workspaceId))
const entryId = computed(() => String(route.params.entryId))

const planning = ref<VideoPlanning | null>(null)
const loading = ref(true)
const enviando = ref(false)
const confirmo = ref(false)
const enviada = ref(false)

type Verdict = { estado: 'APROBADO' | 'RECHAZADO' | null; cambios: CambioVideo[] }
const verdicts = reactive<Record<string, Verdict>>({})
/** Error del servidor por video (ej. un cambio de vanidad), por numero. */
const errores = reactive<Record<number, string>>({})

/**
 * Solo lo que el cliente puede juzgar: la version vigente de los videos que
 * esperan su veredicto. Los que ya aprobo no se vuelven a mandar.
 */
const videos = computed<VideoItem[]>(() =>
  (planning.value?.items ?? []).filter(
    (i) => i.edicion === 'EDITADO' && (!i.videoClienteAprobacion || i.videoClienteAprobacion === 'PENDIENTE'),
  ),
)

const locked = computed(
  () => enviada.value || (!!planning.value && !planning.value.revisionVideosAbierta),
)

const revisados = computed(
  () => videos.value.filter((i) => verdicts[i._id]?.estado).length,
)

/** Cada cambio necesita su segundo y qué cambiar. */
const faltaMotivo = computed(() =>
  videos.value.some(
    (i) =>
      verdicts[i._id]?.estado === 'RECHAZADO' &&
      (!verdicts[i._id].cambios.length ||
        verdicts[i._id].cambios.some((c) => !c.segundo.trim() || c.texto.trim().length < 8)),
  ),
)

const puedeEnviar = computed(
  () =>
    !locked.value &&
    videos.value.length > 0 &&
    revisados.value === videos.value.length &&
    !faltaMotivo.value &&
    confirmo.value,
)

async function cargar() {
  loading.value = true
  try {
    const res = await videoPlanningService.getByEntry(entryId.value)
    if (!res || String(res.workspaceId) !== workspaceId.value) {
      planning.value = null
      return
    }
    planning.value = res
    for (const item of res.items) {
      if (item.edicion !== 'EDITADO') continue
      verdicts[item._id] = { estado: null, cambios: [] }
    }
  } finally {
    loading.value = false
  }
}

async function enviar() {
  if (!planning.value || !puedeEnviar.value) return
  enviando.value = true
  for (const k of Object.keys(errores)) delete errores[Number(k)]
  try {
    const res = await videoPlanningService.submitVideoReview(planning.value._id, {
      reviews: videos.value.map((i) => {
        const v = verdicts[i._id]
        return {
          itemId: i._id,
          estado: v.estado as 'APROBADO' | 'RECHAZADO',
          ...(v.estado === 'RECHAZADO'
            ? { cambios: v.cambios.map((c) => ({ segundo: c.segundo.trim(), texto: c.texto.trim() })) }
            : {}),
        }
      }),
    })
    enviada.value = true
    toast.success(res.message)
  } catch (err: any) {
    const mensaje = err?.data?.message || err?.message || 'No se pudo enviar tu revisión.'
    // Un cambio que no entra (vanidad, sin segundo) se marca en su video.
    if (err?.data?.numero) errores[err.data.numero] = mensaje
    toast.error(mensaje)
  } finally {
    enviando.value = false
  }
}

function irAlInicio() {
  router.replace({ name: 'BillingRoas', params: { workspaceId: workspaceId.value } })
}

onMounted(cargar)
</script>

<template>
  <div class="cvr">
    <div v-if="loading" class="cvr__state">
      <div class="cvr__spinner" />
      <p>Cargando tus videos…</p>
    </div>

    <div v-else-if="!planning || !videos.length" class="cvr__state">
      <div class="cvr__icon"><i class="fa-solid fa-circle-check" /></div>
      <h3>No hay videos por revisar</h3>
      <p>Cuando tu equipo termine de editar, te avisamos por Telegram, WhatsApp y correo.</p>
      <button class="cvr__btn" @click="irAlInicio">Ir a mi tablero</button>
    </div>

    <div v-else-if="enviada || locked" class="cvr__state">
      <div class="cvr__icon cvr__icon--ok"><i class="fa-solid fa-champagne-glasses" /></div>
      <h3>¡Revisión recibida!</h3>
      <p>
        Gracias por revisar tus videos. Con tu visto bueno seguimos con la
        publicación; si pediste cambios, el equipo ya los tiene.
      </p>
      <button class="cvr__btn" @click="irAlInicio">Ir a mi tablero</button>
    </div>

    <template v-else>
      <header class="cvr__header">
        <h1>Revisa tus videos</h1>
        <p>
          Tienes <strong>{{ videos.length }} {{ videos.length === 1 ? 'video terminado' : 'videos terminados' }}</strong>.
          Mira cada uno y apruébalo o dinos qué cambiar, con el segundo exacto. Tienes 2 rondas de cambios por video.
        </p>
      </header>

      <div class="cvr__list">
        <VideoReviewCard
          v-for="item in videos"
          :key="item._id"
          :item="item"
          :verdict="verdicts[item._id]"
          :locked="enviando"
          :error="errores[item.numero]"
          @set-estado="(e) => (verdicts[item._id].estado = e)"
          @set-cambios="(c) => (verdicts[item._id].cambios = c)"
        />
      </div>

      <footer class="cvr__footer">
        <div class="cvr__progress">
          <span>{{ revisados }} de {{ videos.length }} revisados</span>
          <div class="cvr__bar">
            <div
              class="cvr__bar-fill"
              :style="{ width: `${(revisados / videos.length) * 100}%` }"
            />
          </div>
        </div>

        <label class="cvr__confirm">
          <input v-model="confirmo" type="checkbox" :disabled="enviando" />
          <span>Revisé todos los videos y esta es mi respuesta final.</span>
        </label>

        <button
          class="cvr__btn cvr__btn--send"
          :disabled="!puedeEnviar || enviando"
          @click="enviar"
        >
          <i v-if="enviando" class="fa-solid fa-spinner fa-spin" />
          <i v-else class="fa-solid fa-paper-plane" />
          {{ enviando ? 'Enviando…' : 'Enviar mi revisión' }}
        </button>

        <p v-if="faltaMotivo" class="cvr__hint">
          A cada cambio le falta el segundo o qué cambiar: es lo que el editor necesita.
        </p>
      </footer>
    </template>
  </div>
</template>

<style scoped lang="scss">
.cvr {
  max-width: 640px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
    padding: 4rem 1rem;

    h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
    p  { margin: 0; font-size: 0.85rem; color: $text-secondary; line-height: 1.5; max-width: 380px; }
  }

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba($primary, 0.15);
    border-top-color: $primary;
    border-radius: 50%;
    animation: cvr-spin 0.8s linear infinite;
  }

  &__icon {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: rgba($primary, 0.07);
    border: 2px dashed rgba($primary, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    color: $primary;

    &--ok {
      background: rgba(#10b981, 0.08);
      border-color: rgba(#10b981, 0.3);
      color: #059669;
    }
  }

  &__header {
    h1 { margin: 0 0 0.4rem; font-size: 1.3rem; font-weight: 800; color: $primary-dark; }
    p  { margin: 0; font-size: 0.88rem; color: $text-secondary; line-height: 1.55; }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    background: #fff;
    border: 1px solid rgba($primary, 0.12);
    border-radius: 14px;
    padding: 1rem 1.1rem;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    span { font-size: 0.78rem; font-weight: 700; color: $text-secondary; }
  }

  &__bar {
    height: 6px;
    background: rgba($primary, 0.1);
    border-radius: 999px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary, #85529c);
    border-radius: 999px;
    transition: width 0.25s ease;
  }

  &__confirm {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    cursor: pointer;

    input { margin-top: 0.15rem; accent-color: $primary; }
    span  { font-size: 0.82rem; color: $primary-dark; line-height: 1.45; }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: $primary;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 0.75rem 1.25rem;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:hover:not(:disabled) { opacity: 0.88; }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  &__hint {
    margin: 0;
    font-size: 0.76rem;
    color: #dc2626;
    text-align: center;
  }
}

@keyframes cvr-spin {
  to { transform: rotate(360deg); }
}
</style>
