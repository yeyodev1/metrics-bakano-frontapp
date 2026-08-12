<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show && item" class="rlm__overlay" @click.self="emit('close')">
        <div class="rlm">
          <LinkModalHeader :numero="item.numero" @close="emit('close')" />

          <div class="rlm__body">
            <div class="rlm__context">
              <span class="rlm__badge">Guion {{ item.tipoGuion || 'TOFU' }}</span>
              <strong>{{ item.tema }}</strong>
            </div>

            <section class="rlm__section">
              <JourneyCaseSelector v-model="selectedCasoUsoRef" :cases="customerJourneyCases" />
            </section>

            <p class="rlm__sources-intro">
              Vincula <strong>al menos una</strong> de las dos. Si el video se publicó y
              además se pautó, vincula ambas y verás los números por separado.
            </p>

            <LinkSourceSection
              kind="reel"
              title="Publicación orgánica"
              hint="Reel del feed. Trae vistas, alcance, guardados y comentarios."
              :selected="!!selectedIgMediaId"
              selected-label="Reel elegido"
              :open="showReels"
              @toggle="showReels = !showReels"
            >
              <ReelPickerList
                v-model="selectedIgMediaId"
                :picker="picker"
                @picked="onReelPicked"
                @preview="previewReel = $event"
              />
            </LinkSourceSection>

            <LinkSourceSection
              kind="ad"
              title="Anuncio pautado"
              hint="Anuncio de Meta Ads. Trae gasto, alcance pagado y conversaciones."
              :selected="!!metaAdId"
              selected-label="Anuncio elegido"
              :open="showAds"
              @toggle="showAds = !showAds"
            >
              <MetaAdPicker
                v-model="metaAdId"
                :workspace-id="workspaceId"
                :active="showAds"
              />
            </LinkSourceSection>
          </div>

          <footer class="rlm__footer">
            <span class="rlm__summary">{{ summary }}</span>
            <button class="rlm__btn rlm__btn--cancel" :disabled="isSaving" @click="emit('close')">
              Cancelar
            </button>
            <button
              class="rlm__btn rlm__btn--primary"
              :disabled="!hasSelection || isSaving"
              @click="handleConfirmLink"
            >
              <i :class="isSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-link'" />
              {{ isSaving ? 'Guardando…' : confirmLabel }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>

    <ReelPreviewModal
      :show="!!previewReel"
      :reel="previewReel"
      @close="previewReel = null"
      @select="selectFromPreview"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, toRef, watch } from 'vue'
import { videoPlanningService } from '@/services/videoPlanning.service'
import { useToast } from '@/composables/useToast'
import MetaAdPicker from './MetaAdPicker.vue'
import ReelPreviewModal from './ReelPreviewModal.vue'
import JourneyCaseSelector from './reelLink/JourneyCaseSelector.vue'
import LinkModalHeader from './reelLink/LinkModalHeader.vue'
import LinkSourceSection from './reelLink/LinkSourceSection.vue'
import ReelPickerList from './reelLink/ReelPickerList.vue'
import { useReelPicker } from './reelLink/useReelPicker'
import type { VideoItem, VideoPlanning } from '@/types/videoPlanning'
import type { CustomerJourneyCase } from '@/types'

const props = defineProps<{
  show: boolean
  planningId: string
  workspaceId: string
  item: VideoItem | null
  customerJourneyCases?: CustomerJourneyCase[]
  /** Every item of the planning — used to flag reels already linked elsewhere. */
  allItems?: VideoItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'linked', planning: VideoPlanning): void
}>()

const toast = useToast()

const selectedIgMediaId = ref('')
const customIgPermalink = ref('')
const metaAdId = ref('')
const selectedCasoUsoRef = ref<number | null>(null)
const isSaving = ref(false)
const showReels = ref(true)
// Cerrado de entrada: el picker consulta Meta y la mayoría de videos son orgánicos.
// Se abre solo si el guion ya tiene un anuncio vinculado (ver watch de `show`).
const showAds = ref(false)
const previewReel = ref<any | null>(null)

const hasSelection = computed(() => !!selectedIgMediaId.value || !!metaAdId.value)

/** El botón dice exactamente qué va a pasar, no un genérico "Vincular Reel". */
const confirmLabel = computed(() => {
  if (selectedIgMediaId.value && metaAdId.value) return 'Vincular reel y anuncio'
  if (metaAdId.value) return 'Vincular anuncio'
  return 'Vincular reel'
})

const summary = computed(() => {
  if (selectedIgMediaId.value && metaAdId.value) {
    return 'Se traerán métricas orgánicas y de pauta.'
  }
  if (selectedIgMediaId.value) return 'Se traerán vistas, alcance e interacciones.'
  if (metaAdId.value) return 'Se traerán gasto, alcance pagado y conversaciones.'
  return 'Elige un reel, un anuncio, o ambos.'
})

const picker = useReelPicker({
  workspaceId: toRef(props, 'workspaceId'),
  item: toRef(props, 'item'),
  allItems: toRef(props, 'allItems'),
})

watch(
  () => props.show,
  (open) => {
    if (!open || !props.item) return

    selectedIgMediaId.value = props.item.igMediaId || ''
    customIgPermalink.value = props.item.igPermalink || ''
    metaAdId.value = props.item.metaAdId || ''
    selectedCasoUsoRef.value = props.item.casoUsoRef || null
    // Se abre la sección que ya tiene algo vinculado. Un guion pautado sin reel
    // abre en anuncios, que es donde está su dato.
    showAds.value = !!props.item.metaAdId
    showReels.value = !props.item.metaAdId || !!props.item.igMediaId
    picker.fetch()
  },
  { immediate: true }
)

/** The permalink travels with the reel, so it is captured on selection. */
function onReelPicked(reel: any) {
  if (reel?.permalink) customIgPermalink.value = reel.permalink
}

/** Picking from the preview both selects the reel and closes the preview. */
function selectFromPreview() {
  if (previewReel.value) {
    selectedIgMediaId.value = previewReel.value.id
    onReelPicked(previewReel.value)
  }
  previewReel.value = null
}

async function handleConfirmLink() {
  if (!props.planningId || !props.item || !hasSelection.value) return

  isSaving.value = true
  try {
    // Ambos campos se mandan siempre, incluso vacíos: así el backend puede
    // desvincular una fuente que se quitó. Omitirlos dejaba el valor anterior.
    const updatedPlanning = await videoPlanningService.linkReelMedia(
      props.planningId,
      props.item._id,
      {
        igMediaId: selectedIgMediaId.value,
        igPermalink: selectedIgMediaId.value ? customIgPermalink.value.trim() : '',
        metaAdId: metaAdId.value.trim(),
        casoUsoRef: selectedCasoUsoRef.value || undefined,
      }
    )
    toast.success(`${confirmLabel.value.replace('Vincular', 'Vinculado:')} listo.`)
    emit('linked', updatedPlanning)
    emit('close')
  } catch {
    toast.error('No fue posible vincular el Reel.')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped lang="scss">
.rlm__overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba($primary-dark, 0.6);
}

.rlm {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 640px;
  // dvh evita que la barra del navegador (móvil) recorte el footer.
  max-height: 92vh;
  max-height: 92dvh;
  min-height: 0;
  overflow: hidden;
  background: $white;
  border-radius: 16px;
}

.rlm__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 1.25rem;
  // min-height: 0 es lo que permite que este bloque encoja dentro del flex
  // column y sea él quien scrollee, en vez de desbordar y empujar el footer.
  min-height: 0;
  padding: 1.25rem;
  overflow-y: auto;
  overscroll-behavior: contain;

  // Sin esto los hijos se encogen para caber en la altura visible en vez de
  // desbordar, y la sección (que tiene overflow:hidden por las esquinas)
  // recortaba la lista de reels sin dejar scrollear.
  > * { flex-shrink: 0; }
}

.rlm__context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.85rem;
  background: rgba(#e1306c, 0.05);
  border: 1px solid rgba(#e1306c, 0.15);
  border-radius: 10px;

  strong { font-size: 0.92rem; color: $primary-dark; }
}

.rlm__badge {
  padding: 0.2rem 0.6rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: $white;
  background: #e1306c;
  border-radius: 20px;
}

.rlm__section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rlm__sources-intro {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: $text-secondary;

  strong { color: $primary-dark; }
}

// Empuja los botones a la derecha y explica qué traerá el vínculo.
.rlm__summary {
  flex: 1 1 12rem;
  min-width: 0;
  font-size: 0.74rem;
  color: $text-secondary;
}


.rlm__footer {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.9rem 1.25rem;
  border-top: 1px solid rgba($text-secondary, 0.15);
}

.rlm__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  border: none;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;

  &:disabled { opacity: 0.55; cursor: not-allowed; }

  &--cancel {
    color: $text-secondary;
    background: rgba($primary-dark, 0.05);

    &:hover:not(:disabled) { color: $primary-dark; }
  }

  &--primary {
    color: $white;
    background: #e1306c;

    &:hover:not(:disabled) { filter: brightness(1.08); }
  }
}

/*
 * Pantallas bajas: portátiles Windows a 125%/150% de escala dejan ~600px de
 * alto útil. Ahí el modal se pega a los bordes y se compacta para que quepan
 * las dos secciones sin que el usuario pelee con scrolls anidados diminutos.
 */
@media (max-height: 780px) {
  .rlm__overlay { padding: 0.5rem; }

  .rlm {
    max-height: 96vh;
    max-height: 96dvh;
  }

  .rlm__body {
    gap: 0.85rem;
    padding: 0.9rem 1rem;
  }

  .rlm__context { padding: 0.5rem 0.7rem; }

  // El párrafo explica algo que las dos secciones ya dicen con su hint; en
  // pantalla baja vale más ese alto para las tarjetas de reel.
  .rlm__sources-intro { display: none; }

  .rlm__footer { padding: 0.7rem 1rem; }
}

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
</style>
