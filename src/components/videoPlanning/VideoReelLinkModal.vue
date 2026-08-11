<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show && item" class="rlm__overlay" @click.self="emit('close')">
        <div class="rlm">
          <header class="rlm__header">
            <div class="rlm__header-title">
              <i class="fa-brands fa-instagram rlm__header-icon" />
              <div>
                <h3>Vincular Reel Publicado a Guion #{{ item.numero }}</h3>
                <p>Conecta el video de Instagram para traer vistas, alcance e interacciones.</p>
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

            <section class="rlm__section">
              <ReelPickerList
                v-model="selectedIgMediaId"
                :picker="picker"
                @picked="onReelPicked"
                @preview="previewReel = $event"
              />
            </section>

            <section class="rlm__section">
              <button
                type="button"
                class="rlm__ads-header"
                :aria-expanded="showAds"
                @click="showAds = !showAds"
              >
                <span class="rlm__label">
                  <i class="fa-solid fa-bullhorn" /> Anuncio de Meta Ads (Opcional)
                </span>
                <span v-if="metaAdId" class="rlm__ads-picked">
                  <i class="fa-solid fa-circle-check" /> 1 seleccionado
                </span>
                <i :class="showAds ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" />
              </button>

              <small class="rlm__hint">
                Si este video se pautó, vincula el anuncio para traer gasto, alcance y
                conversaciones generadas.
              </small>

              <MetaAdPicker
                v-show="showAds"
                v-model="metaAdId"
                :workspace-id="workspaceId"
                :active="showAds"
              />
            </section>
          </div>

          <footer class="rlm__footer">
            <button class="rlm__btn rlm__btn--cancel" :disabled="isSaving" @click="emit('close')">
              Cancelar
            </button>
            <button
              class="rlm__btn rlm__btn--primary"
              :disabled="!selectedIgMediaId || isSaving"
              @click="handleConfirmLink"
            >
              <i :class="isSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-link'" />
              {{ isSaving ? 'Guardando…' : 'Vincular Reel' }}
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
import { ref, toRef, watch } from 'vue'
import { videoPlanningService } from '@/services/videoPlanning.service'
import { useToast } from '@/composables/useToast'
import MetaAdPicker from './MetaAdPicker.vue'
import ReelPreviewModal from './ReelPreviewModal.vue'
import JourneyCaseSelector from './reelLink/JourneyCaseSelector.vue'
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
// Collapsed by default: the ad picker hits Meta, and most videos are organic.
const showAds = ref(false)
const previewReel = ref<any | null>(null)

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
    // Open the ads section when this video already has one linked.
    showAds.value = !!props.item.metaAdId
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
  if (!props.planningId || !props.item || !selectedIgMediaId.value) return

  isSaving.value = true
  try {
    const updatedPlanning = await videoPlanningService.linkReelMedia(
      props.planningId,
      props.item._id,
      {
        igMediaId: selectedIgMediaId.value,
        igPermalink: customIgPermalink.value.trim() || undefined,
        metaAdId: metaAdId.value.trim() || undefined,
        casoUsoRef: selectedCasoUsoRef.value || undefined,
      }
    )
    toast.success('Reel y métricas vinculados exitosamente al guion.')
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

.rlm__label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: $primary-dark;

  i { color: $secondary; }
}

.rlm__ads-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0;
  font-family: inherit;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;

  > .rlm__label { flex: 1; }
  > i { font-size: 0.8rem; color: $text-secondary; }
}

.rlm__ads-picked {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: $secondary-dark;
  background: $overlay-purple;
  border-radius: 20px;
}

.rlm__hint {
  font-size: 0.75rem;
  line-height: 1.45;
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
