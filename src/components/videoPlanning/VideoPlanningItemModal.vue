<script setup lang="ts">
import { ref, watch, computed, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUnsavedCloseGuard } from '@/composables/useUnsavedCloseGuard'
import type { BrandProfile } from '@/types'
import type { BrandProfile as BrandProfileType } from '@/types'
import type { VideoItem, CreateVideoItemPayload, GuionIA, TipoGuion, ObjetivoGuion } from '@/types/videoPlanning'
import { EstadoIdea, EstadoProduccion, EstadoEdicion, EstadoPublicacion, ClienteAprobacion, TipoReel } from '@/types/videoPlanning'
import ScriptGeneratorPanel from './ScriptGeneratorPanel.vue'
import ScriptDistributionWidget from './ScriptDistributionWidget.vue'
import ItemModalOnboarding from './itemModal/ItemModalOnboarding.vue'
import ItemRejectionAlert from './itemModal/ItemRejectionAlert.vue'
import ItemClientView from './itemModal/ItemClientView.vue'
import ItemBasicFields from './itemModal/ItemBasicFields.vue'
import ItemPublishFields from './itemModal/ItemPublishFields.vue'

const userStore = useUserStore()
const isReadOnly = computed(() => !userStore.isInternal)

const props = defineProps<{
  show: boolean
  item: VideoItem | null
  isSaving: boolean
  locked?: boolean
  workspaceId?: string
  hasBrandProfile?: boolean
  brandProfile?: BrandProfile | null
  allItems?: VideoItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: CreateVideoItemPayload): void
  (e: 'brand-profile-updated', profile: BrandProfileType): void
}>()

/**
 * A human picking feed vs anuncio outranks the AI classifier, so the choice is
 * stamped as `humano` — the classifier skips items marked that way.
 */
const journeyCases = computed(() => props.brandProfile?.customerJourneyCases ?? [])

const router = useRouter()

/**
 * Send the user to the screen that actually fills the gap.
 *
 * The modal is closed first: it renders above everything, so navigating with it
 * still open landed the user on the right page behind an opaque overlay — which
 * read as "the button does nothing".
 *
 * Navigating to the route we are already on is a duplicated-navigation error in
 * vue-router; it is swallowed because the user is, by then, already there.
 */
async function goToBuilder(target: 'brand-profile' | 'journey' = 'journey') {
  if (!props.workspaceId) return

  // Irse a definir la marca también descarta el formulario, así que pasa por
  // la misma confirmación. Si dicen que no, se quedan donde estaban.
  if (!(await requestClose())) return

  const to =
    target === 'brand-profile'
      ? { name: 'WorkspaceBrandProfile', params: { workspaceId: props.workspaceId } }
      : {
          name: 'WorkspaceContentBuilder',
          params: { workspaceId: props.workspaceId },
          query: { tab: 'journey' },
        }

  router.push(to).catch(() => {})
}

const goDefineJourney = () => goToBuilder('journey')

/**
 * El guión que queda en el textarea. El Hook 2 solo aparece si se generó
 * aparte; si no, ya viene dentro del cuerpo y meterlo otra vez lo duplicaría.
 */
function composeGuion(g: GuionIA): string {
  return [g.gancho, g.hook2, g.cuerpo, g.cta].filter((p) => p && p.trim()).join('\n\n')
}

function setObjetivo(objetivo: ObjetivoGuion) {
  form.value.scriptMeta = {
    ...(form.value.scriptMeta ?? {}),
    objetivo,
    clasificadoPor: 'humano',
  }
}

const form = ref<CreateVideoItemPayload>({
  tema: '',
  descripcion: '',
  tipo: '',
  tipoGuion: undefined,
  scriptMeta: undefined,
  linkEjemplo: '',
  recursos: '',
  lugarGrabacion: '',
  guion: '',
  estadoIdea: EstadoIdea.POR_REVISAR,
  estadoProduccion: EstadoProduccion.POR_GRABAR,
  edicion: EstadoEdicion.POR_EDITAR,
  estadoPublicacion: EstadoPublicacion.POR_PUBLICAR,
  comentario: '',
  linkVideo: '',
  fechaPublicacion: '',
})

// Helpers for status colors
const isRejected = computed(() => {
  return props.item?.estadoIdea === EstadoIdea.RECHAZADO || 
         props.item?.estadoProduccion === EstadoProduccion.RECHAZADO ||
         props.item?.clienteAprobacion === ClienteAprobacion.RECHAZADO;
});

const ideaRejection = computed(() => props.item?.motivoRechazo || props.item?.comentario || '');





watch(() => props.show, (isShown) => {
  if (!isShown) return
  if (props.item) {
    form.value = {
      tema: props.item.tema,
      descripcion: props.item.descripcion || '',
      tipo: props.item.tipo || '',
      tipoGuion: props.item.tipoGuion,
      scriptMeta: props.item.scriptMeta,
      casoUsoRef: props.item.casoUsoRef,
      linkEjemplo: props.item.linkEjemplo || '',
      recursos: props.item.recursos || '',
      lugarGrabacion: props.item.lugarGrabacion || '',
      guion: props.item.guion || '',
      estadoIdea: props.item.estadoIdea,
      estadoProduccion: props.item.estadoProduccion,
      edicion: props.item.edicion,
      estadoPublicacion: props.item.estadoPublicacion,
      comentario: props.item.comentario || '',
      linkVideo: props.item.linkVideo || '',
      fechaPublicacion: props.item.fechaPublicacion
        ? props.item.fechaPublicacion.split('T')[0]
        : '',
    }
  } else {
    form.value = {
      tema: '', descripcion: '', tipo: '', tipoGuion: undefined, casoUsoRef: undefined, linkEjemplo: '',
      recursos: '', lugarGrabacion: '', guion: '', comentario: '',
      linkVideo: '',
      fechaPublicacion: '',
      estadoIdea: EstadoIdea.POR_REVISAR,
      estadoProduccion: EstadoProduccion.POR_GRABAR,
      edicion: EstadoEdicion.POR_EDITAR,
      estadoPublicacion: EstadoPublicacion.POR_PUBLICAR,
    }
  }
}, { immediate: true })

// ── Bidirectional sync: Tipo de Reel ↔ tipoGuion ────────────────────
const TIPO_REEL_TO_GUION: Record<string, TipoGuion> = {
  'Educativo': 'TOFU',
  'Creación de valor': 'MOFU',
  'Venta': 'BOFU',
}
const GUION_TO_TIPO_REEL: Record<TipoGuion, string> = {
  TOFU: 'Educativo',
  MOFU: 'Creación de valor',
  BOFU: 'Venta',
}

// Dropdown → selector
watch(() => form.value.tipo, (tipo) => {
  if (tipo && TIPO_REEL_TO_GUION[tipo]) {
    form.value.tipoGuion = TIPO_REEL_TO_GUION[tipo]
  }
})

// El modal no guarda hasta "Agregar video": cerrarlo sin querer borraba todo.
const { isDirty, requestClose } = useUnsavedCloseGuard({
  show: toRef(props, 'show'),
  state: () => form.value,
  isBusy: toRef(props, 'isSaving'),
  onClose: () => emit('close'),
  title: '¿Cerrar sin guardar el video?',
  message:
    'Lo que escribiste en este video todavía no se ha guardado. Si cierras ahora se pierde y hay que llenarlo de nuevo.',
})
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="vp-item-modal">
      <div class="vp-item-modal__overlay" @click="requestClose" />
      <div class="vp-item-modal__container" :class="{ 'is-view': isReadOnly }">
        <div class="vp-item-modal__header">
          <div class="vp-item-modal__header-title">
            <i class="fa-solid fa-clapperboard" />
            <h3>{{ isReadOnly ? form.tema : (item ? 'Editar video' : 'Nuevo video') }}</h3>
          </div>
          <button
            class="vp-item-modal__close"
            :title="isDirty ? 'Cerrar (te pedirá confirmación)' : 'Cerrar'"
            aria-label="Cerrar"
            @click="requestClose"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <form @submit.prevent="emit('save', { ...form })" class="vp-item-modal__form">
          <div class="vp-item-modal__body">
            <!-- What the brand still needs before a script can be any good -->
            <ItemModalOnboarding
              v-if="!isReadOnly"
              :brand-profile="brandProfile"
              @go="goToBuilder"
            />

            <!-- Rejection Alert -->
            <ItemRejectionAlert v-if="isRejected" :motivo="ideaRejection" />

            <!-- Information View (Client) -->
            <ItemClientView v-if="isReadOnly" :form="form" />

            <!-- Form View (Internal) -->
            <template v-else>

              <ItemBasicFields
                v-model="form"
                :journey-cases="journeyCases"
                @define-journey="goDefineJourney"
              />

              <!-- AI Script Generator — context + generate + result in one section -->
              <ScriptGeneratorPanel
                v-if="workspaceId"
                :item="item"
                :workspace-id="workspaceId"
                :tema="form.tema"
                :tipo="form.tipo"
                :tipo-guion="form.tipoGuion"
                :objetivo="form.scriptMeta?.objetivo"
                :has-brand-profile="hasBrandProfile ?? false"
                :brand-profile="brandProfile ?? null"
                :all-items="allItems"
                @script-generated="(g: GuionIA) => { form.guion = composeGuion(g) }"
                @brand-profile-updated="(p: BrandProfileType) => emit('brand-profile-updated', p)"
                @update:tipoGuion="(t: TipoGuion) => { form.tipoGuion = t; form.tipo = GUION_TO_TIPO_REEL[t] }"
                @update:objetivo="setObjetivo"
              />

              <div class="vp-item-modal__field">
                <label>
                  Guión
                  <span v-if="form.guion" class="vp-item-modal__field-hint">auto-completado por IA — editable</span>
                </label>
                <textarea v-model="form.guion" placeholder="Se completará automáticamente al generar con IA, o escribe aquí manualmente..." rows="5" />
              </div>

              <div class="vp-item-modal__field">
                <label>Comentario</label>
                <textarea v-model="form.comentario" placeholder="Notas internas..." rows="2" />
              </div>

              <ItemPublishFields v-model="form" />

            </template>
          </div>

          <div class="vp-item-modal__footer">
            <!-- Que se vea que nada se ha guardado, antes de intentar cerrar. -->
            <span v-if="isDirty && !isReadOnly" class="vp-item-modal__unsaved">
              <i class="fa-solid fa-circle" /> Sin guardar
            </span>
            <button type="button" class="vp-item-modal__btn-ghost" @click="requestClose">{{ isReadOnly ? 'Cerrar' : 'Cancelar' }}</button>
            <button v-if="!isReadOnly" type="submit" class="vp-item-modal__btn-primary" :disabled="isSaving">
              <span v-if="isSaving" class="spinner" />
              <span v-else>{{ item ? 'Guardar cambios' : 'Agregar video' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.vp-item-modal {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  z-index: 1100; padding: 1rem;

  &__overlay { position: absolute; inset: 0; background: rgba($primary-dark, 0.6); backdrop-filter: blur(8px); }

  &__container {
    position: relative; background: $white; width: 100%; max-width: 680px;
    border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    max-height: 92dvh; display: flex; flex-direction: column;
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    &.is-view { background: #fdfdfd; }
  }

  &__header {
    padding: 1.5rem 2rem; border-bottom: 1px solid rgba($primary-dark, 0.06);
    display: flex; justify-content: space-between; align-items: center;
  }
  &__header-title {
    display: flex; align-items: center; gap: 0.85rem;
    i { font-size: 1.4rem; color: $primary; }
    h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: $primary-dark; }
  }
  &__close {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: rgba($primary-dark, 0.05); color: $text-secondary; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    &:hover { background: #fee2e2; color: #dc2626; transform: rotate(90deg); }
  }

  &__form { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  &__body { 
    padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.25rem; 
    @media (max-width: 600px) { padding: 1rem; gap: 1rem; }
  }

  &__row {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; 
    &.is-statuses { 
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); 
      gap: 0.75rem;
    }
    @media (max-width: 500px) { grid-template-columns: 1fr; }
  }





  // Actionable instead of a dead-end hint: the fix is one click away.

  &__field {
    display: flex; flex-direction: column; gap: 0.5rem;
    label { font-size: 0.72rem; font-weight: 800; color: $primary-dark; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; display: flex; align-items: center; gap: 0.5rem; }
    .req { color: #dc2626; }
    &-hint { font-size: 0.68rem; font-weight: 500; color: #7c3aed; background: rgba(#7c3aed, 0.08); padding: 0.15rem 0.5rem; border-radius: 20px; text-transform: none; letter-spacing: 0; opacity: 1; }

    input, textarea, select {
      padding: 0.75rem 1rem; border-radius: 12px; border: 1.5px solid rgba($primary-dark, 0.1);
      background: $white; font-family: inherit; font-size: 0.95rem; transition: all 0.2s;
      &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 4px rgba($primary, 0.1); }
      &:disabled { background: #f3f4f6; color: $text-secondary; }
      
      &.is-success { border-color: #16a34a; background: #f0fdf4; color: #166534; }
      &.is-warning { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
      &.is-danger { border-color: #dc2626; background: #fef2f2; color: #991b1b; }
      &.is-info { border-color: #3b82f6; background: #eff6ff; color: #1e40af; }
    }
    textarea { resize: vertical; }
  }

  &__footer {
    padding: 1.25rem 2rem 1.75rem; border-top: 1px solid rgba($primary-dark, 0.05);
    display: flex; justify-content: flex-end; gap: 1rem;
    @media (max-width: 600px) { padding: 1rem; }
  }

  &__unsaved {
    display: inline-flex; align-items: center; gap: 0.35rem; margin-right: auto;
    font-size: 0.72rem; font-weight: 800; color: #d97706;
    i { font-size: 0.4rem; }
  }

  &__btn-ghost {
    background: transparent; border: none; color: $text-secondary; font-weight: 700;
    padding: 0.75rem 1.5rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;
    &:hover { background: rgba($primary-dark, 0.05); color: $primary-dark; }
  }

  &__btn-primary {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white; border: none; padding: 0.85rem 2rem; border-radius: 14px;
    font-weight: 700; cursor: pointer; box-shadow: 0 8px 18px rgba($primary, 0.25);
    display: flex; align-items: center; gap: 0.6rem; transition: all 0.2s;
    &:hover { transform: translateY(-2px); box-shadow: 0 12px 22px rgba($primary, 0.35); }
    &:disabled { background: #d1d5db; box-shadow: none; cursor: not-allowed; transform: none; }
  }
}

// Client View Styles

@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
