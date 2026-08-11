<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show && item" class="rlm__overlay" @click.self="emit('close')">
        <div class="rlm">
          <header class="rlm__header">
            <div class="rlm__header-title">
              <i class="fa-solid fa-link rlm__header-icon" />
              <div>
                <h3>Vincular publicación al Guion #{{ item.numero }}</h3>
                <p>Conecta el reel orgánico, el anuncio pautado, o los dos.</p>
              </div>
            </div>
            <button class="rlm__close" aria-label="Cerrar" @click="emit('close')">
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

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
  max-height: 92vh;
  overflow: hidden;
  background: $white;
  border-radius: 16px;
}

.rlm__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: linear-gradient(135deg, rgba(#e1306c, 0.06), rgba($secondary, 0.04));
  border-bottom: 1px solid rgba($text-secondary, 0.15);

  h3 { margin: 0 0 0.2rem; font-size: 1rem; color: $primary-dark; }
  p { margin: 0; font-size: 0.8rem; line-height: 1.4; color: $text-secondary; }
}

.rlm__header-title {
  display: flex;
  gap: 0.75rem;
  min-width: 0;
}

.rlm__header-icon {
  flex-shrink: 0;
  margin-top: 0.15rem;
  font-size: 1.4rem;
  color: #e1306c;
}

.rlm__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: $text-secondary;
  background: rgba($text-secondary, 0.1);
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover { background: rgba($text-secondary, 0.2); }
}

.rlm__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
  overflow-y: auto;
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

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
</style>
