<script setup lang="ts">
import { ref, watch } from 'vue'
import type { VideoItem, CreateVideoItemPayload } from '@/types/videoPlanning'
import { EstadoIdea, EstadoProduccion, EstadoEdicion, EstadoPublicacion } from '@/types/videoPlanning'

const props = defineProps<{
  show: boolean
  item: VideoItem | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: CreateVideoItemPayload): void
}>()

const form = ref<CreateVideoItemPayload>({
  tema: '',
  descripcion: '',
  tipo: '',
  linkEjemplo: '',
  recursos: '',
  lugarGrabacion: '',
  guion: '',
  estadoIdea: EstadoIdea.POR_REVISAR,
  estadoProduccion: EstadoProduccion.POR_GRABAR,
  edicion: EstadoEdicion.POR_EDITAR,
  estadoPublicacion: EstadoPublicacion.POR_PUBLICAR,
  comentario: '',
})

watch(() => props.show, (isShown) => {
  if (!isShown) return
  if (props.item) {
    form.value = {
      tema: props.item.tema,
      descripcion: props.item.descripcion || '',
      tipo: props.item.tipo || '',
      linkEjemplo: props.item.linkEjemplo || '',
      recursos: props.item.recursos || '',
      lugarGrabacion: props.item.lugarGrabacion || '',
      guion: props.item.guion || '',
      estadoIdea: props.item.estadoIdea,
      estadoProduccion: props.item.estadoProduccion,
      edicion: props.item.edicion,
      estadoPublicacion: props.item.estadoPublicacion,
      comentario: props.item.comentario || '',
    }
  } else {
    form.value = {
      tema: '', descripcion: '', tipo: '', linkEjemplo: '',
      recursos: '', lugarGrabacion: '', guion: '', comentario: '',
      estadoIdea: EstadoIdea.POR_REVISAR,
      estadoProduccion: EstadoProduccion.POR_GRABAR,
      edicion: EstadoEdicion.POR_EDITAR,
      estadoPublicacion: EstadoPublicacion.POR_PUBLICAR,
    }
  }
}, { immediate: true })
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="vp-item-modal">
      <div class="vp-item-modal__overlay" @click="emit('close')" />
      <div class="vp-item-modal__container">
        <div class="vp-item-modal__header">
          <div class="vp-item-modal__header-title">
            <i class="fa-solid fa-film" />
            <h3>{{ item ? 'Editar video' : 'Nuevo video' }}</h3>
          </div>
          <button class="vp-item-modal__close" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <form @submit.prevent="emit('save', { ...form })" class="vp-item-modal__form">
          <div class="vp-item-modal__body">
            <div class="vp-item-modal__field">
              <label>Tema <span class="req">*</span></label>
              <input v-model="form.tema" type="text" placeholder="Ej: Receta de verano" required />
            </div>

            <div class="vp-item-modal__row">
              <div class="vp-item-modal__field">
                <label>Tipo</label>
                <input v-model="form.tipo" type="text" placeholder="Ej: Reel educativo" />
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
                <label>Link de ejemplo</label>
                <input v-model="form.linkEjemplo" type="url" placeholder="https://..." />
              </div>
              <div class="vp-item-modal__field">
                <label>Recursos</label>
                <input v-model="form.recursos" type="text" placeholder="Ej: Cámara, trípode" />
              </div>
            </div>

            <div class="vp-item-modal__field">
              <label>Guión</label>
              <textarea v-model="form.guion" placeholder="Escribe el guión aquí..." rows="5" />
            </div>

            <div class="vp-item-modal__field">
              <label>Comentario</label>
              <textarea v-model="form.comentario" placeholder="Notas internas..." rows="2" />
            </div>

            <div class="vp-item-modal__row">
              <div class="vp-item-modal__field">
                <label>Estado Idea</label>
                <select v-model="form.estadoIdea">
                  <option v-for="v in EstadoIdea" :key="v" :value="v">{{ v.replace(/_/g, ' ') }}</option>
                </select>
              </div>
              <div class="vp-item-modal__field">
                <label>Estado Producción</label>
                <select v-model="form.estadoProduccion">
                  <option v-for="v in EstadoProduccion" :key="v" :value="v">{{ v.replace(/_/g, ' ') }}</option>
                </select>
              </div>
              <div class="vp-item-modal__field">
                <label>Edición</label>
                <select v-model="form.edicion">
                  <option v-for="v in EstadoEdicion" :key="v" :value="v">{{ v.replace(/_/g, ' ') }}</option>
                </select>
              </div>
              <div class="vp-item-modal__field">
                <label>Publicación</label>
                <select v-model="form.estadoPublicacion">
                  <option v-for="v in EstadoPublicacion" :key="v" :value="v">{{ v.replace(/_/g, ' ') }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="vp-item-modal__footer">
            <button type="button" class="vp-item-modal__btn-ghost" @click="emit('close')">Cancelar</button>
            <button type="submit" class="vp-item-modal__btn-primary" :disabled="isSaving">
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
  z-index: 1100; padding: 1.5rem;

  &__overlay { position: absolute; inset: 0; background: rgba($primary-dark, 0.6); backdrop-filter: blur(8px); }

  &__container {
    position: relative; background: $white; width: 100%; max-width: 640px;
    border-radius: 22px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    max-height: 90dvh; display: flex; flex-direction: column;
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__header {
    padding: 1.25rem 1.75rem; border-bottom: 1px solid rgba($primary-dark, 0.06);
    display: flex; justify-content: space-between; align-items: center;
  }
  &__header-title {
    display: flex; align-items: center; gap: 0.75rem;
    i { font-size: 1.2rem; color: $primary; }
    h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: $primary-dark; }
  }
  &__close {
    width: 32px; height: 32px; border-radius: 50%; border: none;
    background: rgba($primary-dark, 0.05); color: $text-secondary; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    &:hover { background: #fee2e2; color: #dc2626; }
  }

  &__form { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

  &__body { padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1rem; }

  &__row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }

  &__field {
    display: flex; flex-direction: column; gap: 0.4rem;
    label { font-size: 0.75rem; font-weight: 800; color: $primary-dark; text-transform: uppercase; letter-spacing: 0.02em; opacity: 0.75; }
    .req { color: #dc2626; }

    input, textarea, select {
      padding: 0.65rem 0.9rem; border-radius: 10px; border: 1.5px solid rgba($primary-dark, 0.1);
      background: rgba($primary-dark, 0.015); font-family: inherit; font-size: 0.9rem; transition: all 0.2s;
      &:focus { outline: none; border-color: $primary; background: $white; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
    }
    textarea { resize: vertical; }
    select { cursor: pointer; }
  }

  &__footer {
    padding: 1rem 1.75rem 1.5rem; border-top: 1px solid rgba($primary-dark, 0.05);
    display: flex; justify-content: flex-end; gap: 0.75rem;
  }

  &__btn-ghost {
    background: transparent; border: none; color: $text-secondary; font-weight: 700;
    padding: 0.7rem 1.25rem; border-radius: 10px; cursor: pointer; transition: all 0.2s;
    &:hover { background: rgba($primary-dark, 0.05); }
  }

  &__btn-primary {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white; border: none; padding: 0.75rem 1.75rem; border-radius: 12px;
    font-weight: 700; cursor: pointer; box-shadow: 0 6px 16px rgba($primary, 0.25);
    display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
    &:disabled { background: #d1d5db; box-shadow: none; cursor: not-allowed; }
  }

  .spinner {
    width: 18px; height: 18px; border: 2px solid rgba($white, 0.3);
    border-top-color: $white; border-radius: 50%; animation: spin 0.8s linear infinite;
  }
}

@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
