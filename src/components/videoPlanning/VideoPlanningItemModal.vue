<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { BrandProfile } from '@/types'
import type { BrandProfile as BrandProfileType } from '@/types'
import type { VideoItem, CreateVideoItemPayload, GuionIA, TipoGuion } from '@/types/videoPlanning'
import { EstadoIdea, EstadoProduccion, EstadoEdicion, EstadoPublicacion, ClienteAprobacion, TipoReel } from '@/types/videoPlanning'
import ScriptGeneratorPanel from './ScriptGeneratorPanel.vue'
import ScriptDistributionWidget from './ScriptDistributionWidget.vue'

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

const form = ref<CreateVideoItemPayload>({
  tema: '',
  descripcion: '',
  tipo: '',
  tipoGuion: undefined,
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

const getIdeaColor = (status: string) => {
  const map: Record<string, string> = {
    [EstadoIdea.APROBADO]: 'is-success',
    [EstadoIdea.POR_REVISAR]: 'is-warning',
    [EstadoIdea.RECHAZADO]: 'is-danger'
  }
  return map[status] || 'is-gray'
}

const getProdColor = (status: string) => {
  const map: Record<string, string> = {
    [EstadoProduccion.GRABADO]: 'is-success',
    [EstadoProduccion.POR_GRABAR]: 'is-warning',
    [EstadoProduccion.RECHAZADO]: 'is-danger'
  }
  return map[status] || 'is-gray'
}

const getEditColor = (status: string) => {
  const map: Record<string, string> = {
    [EstadoEdicion.EDITADO]: 'is-success',
    [EstadoEdicion.POR_EDITAR]: 'is-warning',
    [EstadoEdicion.RECHAZADO]: 'is-danger'
  }
  return map[status] || 'is-gray'
}

const getPubColor = (status: string) => {
  const map: Record<string, string> = {
    [EstadoPublicacion.PUBLICADO]: 'is-success',
    [EstadoPublicacion.PROGRAMADO]: 'is-info',
    [EstadoPublicacion.POR_PUBLICAR]: 'is-warning'
  }
  return map[status] || 'is-gray'
}

watch(() => props.show, (isShown) => {
  if (!isShown) return
  if (props.item) {
    form.value = {
      tema: props.item.tema,
      descripcion: props.item.descripcion || '',
      tipo: props.item.tipo || '',
      tipoGuion: props.item.tipoGuion,
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
      tema: '', descripcion: '', tipo: '', tipoGuion: undefined, linkEjemplo: '',
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
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="vp-item-modal">
      <div class="vp-item-modal__overlay" @click="emit('close')" />
      <div class="vp-item-modal__container" :class="{ 'is-view': isReadOnly }">
        <div class="vp-item-modal__header">
          <div class="vp-item-modal__header-title">
            <i class="fa-solid fa-clapperboard" />
            <h3>{{ isReadOnly ? form.tema : (item ? 'Editar video' : 'Nuevo video') }}</h3>
          </div>
          <button class="vp-item-modal__close" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <form @submit.prevent="emit('save', { ...form })" class="vp-item-modal__form">
          <div class="vp-item-modal__body">
            <!-- Rejection Alert -->
            <div v-if="isRejected" class="vp-item-modal__rejection">
              <div class="rejection-header">
                <i class="fa-solid fa-circle-exclamation" />
                <span>MOTIVO DE RECHAZO</span>
              </div>
              <p>{{ ideaRejection || 'Sin comentario de rechazo' }}</p>
            </div>

            <!-- Information View (Client) -->
            <template v-if="isReadOnly">
              <div class="vp-item-view">
                <!-- Basic Info Grid -->
                <div class="vp-item-view__info-grid">
                  <div class="vp-item-view__info-item">
                    <span class="label">TIPO</span>
                    <span class="value">{{ form.tipo || '-' }}</span>
                  </div>
                  <div class="vp-item-view__info-item">
                    <span class="label">LUGAR</span>
                    <span class="value">{{ form.lugarGrabacion || '-' }}</span>
                  </div>
                  <div class="vp-item-view__info-item">
                    <span class="label">RECURSOS</span>
                    <span class="value">{{ form.recursos || '-' }}</span>
                  </div>
                </div>

                <!-- Description & Script -->
                <div class="vp-item-view__section">
                  <div class="vp-item-view__section-header">
                    <i class="fa-solid fa-align-left" />
                    <span>DESCRIPCIÓN</span>
                  </div>
                  <div class="vp-item-view__text-box">{{ form.descripcion || 'Sin descripción' }}</div>
                </div>

                <div class="vp-item-view__section">
                  <div class="vp-item-view__section-header">
                    <i class="fa-solid fa-scroll" />
                    <span>GUIÓN</span>
                  </div>
                  <div class="vp-item-view__text-box is-script">{{ form.guion || 'Sin guión' }}</div>
                </div>

                <!-- Status Grid (Colorized) -->
                <div class="vp-item-view__status-grid">
                  <div class="vp-item-view__status-item">
                    <span class="label">IDEA</span>
                    <span class="badge" :class="getIdeaColor(form.estadoIdea!)">{{ form.estadoIdea?.replace(/_/g, ' ') }}</span>
                  </div>
                  <div class="vp-item-view__status-item">
                    <span class="label">PRODUCCIÓN</span>
                    <span class="badge" :class="getProdColor(form.estadoProduccion!)">{{ form.estadoProduccion?.replace(/_/g, ' ') }}</span>
                  </div>
                  <div class="vp-item-view__status-item">
                    <span class="label">EDICIÓN</span>
                    <span class="badge" :class="getEditColor(form.edicion!)">{{ form.edicion?.replace(/_/g, ' ') }}</span>
                  </div>
                  <div class="vp-item-view__status-item">
                    <span class="label">PUBLICACIÓN</span>
                    <span class="badge" :class="getPubColor(form.estadoPublicacion!)">{{ form.estadoPublicacion?.replace(/_/g, ' ') }}</span>
                  </div>
                </div>

                <!-- Links & Publish Date -->
                <div class="vp-item-view__links">
                  <div v-if="form.linkEjemplo" class="vp-item-view__link-item">
                    <span class="label">LINK DE VIDEO</span>
                    <a :href="form.linkEjemplo" target="_blank" class="link-btn">
                      <i class="fa-solid fa-link" />
                      Abrir archivo
                    </a>
                  </div>
                  <div v-if="form.linkVideo" class="vp-item-view__link-item">
                    <span class="label">LINK DE PUBLICACIÓN</span>
                    <a :href="form.linkVideo" target="_blank" class="link-btn is-final">
                      <i class="fa-brands fa-instagram" />
                      Ver publicación
                    </a>
                  </div>
                  <div v-if="form.fechaPublicacion" class="vp-item-view__link-item">
                    <span class="label">PUBLICACIÓN</span>
                    <div class="date-chip">
                      <i class="fa-solid fa-calendar-day" />
                      {{ new Date(form.fechaPublicacion + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) }}
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Form View (Internal) -->
            <template v-else>

              <div class="vp-item-modal__field">
                <label>Tema <span class="req">*</span></label>
                <input v-model="form.tema" type="text" placeholder="Ej: Receta de verano" required />
              </div>

              <div class="vp-item-modal__row">
                <div class="vp-item-modal__field">
                  <label>Tipo de Reel</label>
                  <select v-model="form.tipo">
                    <option value="">— Sin tipo —</option>
                    <option v-for="t in TipoReel" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div class="vp-item-modal__field">
                  <label>Lugar de grabación</label>
                  <input v-model="form.lugarGrabacion" type="text" placeholder="Ej: Estudio A" />
                </div>
              </div>

              <div class="vp-item-modal__field">
                <label>Descripción</label>
                <textarea v-model="form.descripcion" placeholder="Descripción general del video..." rows="2" />
              </div>

              <div class="vp-item-modal__row">
                <div class="vp-item-modal__field">
                  <label>Link del video (Drive/Dropbox)</label>
                  <input v-model="form.linkEjemplo" type="url" placeholder="https://..." />
                </div>
                <div class="vp-item-modal__field">
                  <label>Recursos</label>
                  <input v-model="form.recursos" type="text" placeholder="Ej: Cámara, trípode" />
                </div>
              </div>

              <!-- AI Script Generator — context + generate + result in one section -->
              <ScriptGeneratorPanel
                v-if="workspaceId"
                :item="item"
                :workspace-id="workspaceId"
                :tema="form.tema"
                :tipo="form.tipo"
                :tipo-guion="form.tipoGuion"
                :has-brand-profile="hasBrandProfile ?? false"
                :brand-profile="brandProfile ?? null"
                :all-items="allItems"
                @script-generated="(g: GuionIA) => { form.guion = g.gancho + '\n\n' + g.cuerpo + '\n\n' + g.cta }"
                @brand-profile-updated="(p: BrandProfileType) => emit('brand-profile-updated', p)"
                @update:tipoGuion="(t: TipoGuion) => { form.tipoGuion = t; form.tipo = GUION_TO_TIPO_REEL[t] }"
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

              <div class="vp-item-modal__row">
                <div class="vp-item-modal__field">
                  <label>Link de publicación final</label>
                  <input v-model="form.linkVideo" type="url" placeholder="https://..." />
                </div>
                <div class="vp-item-modal__field">
                  <label>Fecha de publicación</label>
                  <input v-model="form.fechaPublicacion" type="date" />
                </div>
              </div>

              <div class="vp-item-modal__row is-statuses">
                <div class="vp-item-modal__field">
                  <label>Idea</label>
                  <select v-model="form.estadoIdea" :class="getIdeaColor(form.estadoIdea!)">
                    <option v-for="v in EstadoIdea" :key="v" :value="v">{{ v.replace(/_/g, ' ') }}</option>
                  </select>
                </div>
                <div class="vp-item-modal__field">
                  <label>Producción</label>
                  <select v-model="form.estadoProduccion" :class="getProdColor(form.estadoProduccion!)">
                    <option v-for="v in EstadoProduccion" :key="v" :value="v">{{ v.replace(/_/g, ' ') }}</option>
                  </select>
                </div>
                <div class="vp-item-modal__field">
                  <label>Edición</label>
                  <select v-model="form.edicion" :class="getEditColor(form.edicion!)">
                    <option v-for="v in EstadoEdicion" :key="v" :value="v">{{ v.replace(/_/g, ' ') }}</option>
                  </select>
                </div>
                <div class="vp-item-modal__field">
                  <label>Publicación</label>
                  <select v-model="form.estadoPublicacion" :class="getPubColor(form.estadoPublicacion!)">
                    <option v-for="v in EstadoPublicacion" :key="v" :value="v">{{ v.replace(/_/g, ' ') }}</option>
                  </select>
                </div>
              </div>
            </template>
          </div>

          <div class="vp-item-modal__footer">
            <button type="button" class="vp-item-modal__btn-ghost" @click="emit('close')">{{ isReadOnly ? 'Cerrar' : 'Cancelar' }}</button>
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

  &__rejection {
    background: #fef2f2; border: 1.5px solid #ef4444; border-radius: 16px;
    padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem;
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    .rejection-header {
      display: flex; align-items: center; gap: 0.6rem; color: #b91c1c;
      i { font-size: 1.1rem; }
      span { font-size: 0.75rem; font-weight: 900; letter-spacing: 0.1em; }
    }
    p { margin: 0; font-size: 0.95rem; font-weight: 600; color: #991b1b; line-height: 1.5; }
  }

  &__row { 
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; 
    &.is-statuses { 
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); 
      gap: 0.75rem;
    }
    @media (max-width: 500px) { grid-template-columns: 1fr; }
  }

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
.vp-item-view {
  display: flex; flex-direction: column; gap: 1.75rem;

  &__info-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
    background: white; padding: 1.25rem; border-radius: 18px; border: 1px solid rgba($primary-dark, 0.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  }

  &__info-item {
    display: flex; flex-direction: column; gap: 0.35rem;
    .label { font-size: 0.65rem; font-weight: 800; color: $text-secondary; letter-spacing: 0.1em; }
    .value { font-size: 0.95rem; font-weight: 700; color: $primary-dark; }
  }

  &__section {
    display: flex; flex-direction: column; gap: 0.75rem;
  }

  &__section-header {
    display: flex; align-items: center; gap: 0.6rem;
    i { color: $primary; font-size: 0.9rem; }
    span { font-size: 0.8rem; font-weight: 900; color: $primary-dark; letter-spacing: 0.05em; }
  }

  &__text-box {
    background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 16px;
    padding: 1rem 1.25rem; font-size: 0.95rem; line-height: 1.6; color: $primary-dark;
    white-space: pre-wrap;
    &.is-script { background: #fafafa; border-left: 4px solid $primary; font-size: 0.9rem; }
  }

  &__status-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;
  }

  &__status-item {
    display: flex; flex-direction: column; gap: 0.6rem; align-items: center;
    .label { font-size: 0.6rem; font-weight: 900; color: $text-secondary; letter-spacing: 0.05em; text-align: center; }
    
    .badge {
      width: 100%; display: flex; align-items: center; justify-content: center;
      padding: 0.5rem 0.4rem; border-radius: 10px; font-size: 0.72rem; font-weight: 800;
      text-transform: uppercase; text-align: center; line-height: 1;

      &.is-success { background: #dcfce7; color: #166534; }
      &.is-warning { background: #fef3c7; color: #92400e; }
      &.is-danger { background: #fee2e2; color: #991b1b; }
      &.is-info { background: #e0f2fe; color: #075985; }
      &.is-gray { background: #f3f4f6; color: #374151; }
    }
  }

  &__links {
    display: flex; flex-wrap: wrap; gap: 1.5rem;
    padding-top: 1rem; border-top: 1px solid rgba($primary-dark, 0.05);
  }

  &__link-item {
    display: flex; flex-direction: column; gap: 0.6rem;
    .label { font-size: 0.65rem; font-weight: 900; color: $text-secondary; letter-spacing: 0.1em; }
  }

  .link-btn {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.6rem 1.25rem; border-radius: 12px; background: rgba($primary, 0.08);
    color: $primary; font-size: 0.85rem; font-weight: 700; transition: all 0.2s;
    text-decoration: none;
    i { font-size: 1rem; }
    &:hover { background: $primary; color: $white; transform: translateY(-2px); box-shadow: 0 4px 12px rgba($primary, 0.2); }
    &.is-final { background: #f0fdf4; color: #16a34a; &:hover { background: #16a34a; color: white; } }
  }

  .date-chip {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.6rem 1rem; border-radius: 12px; background: #f8fafc;
    color: $primary-dark; font-size: 0.85rem; font-weight: 800;
    i { color: $primary; }
  }
}

@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
