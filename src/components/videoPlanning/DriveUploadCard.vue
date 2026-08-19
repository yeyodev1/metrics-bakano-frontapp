<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VideoItem } from '@/types/videoPlanning'
import { useDriveUploads } from '@/composables/useDriveUploads'

/**
 * Archivo maestro en Google Drive. La subida vive en la cola global
 * (useDriveUploads): esta tarjeta solo encola y pinta el estado de SU item,
 * asi que lanzar varias subidas a la vez no bloquea nada — corren de a dos
 * y el resto espera turno en el panel flotante.
 */

const props = defineProps<{ item: VideoItem }>()

const emit = defineEmits<{
  (e: 'uploaded', payload: { driveLink: string; driveMonthFolderLink?: string }): void
}>()

const { encolar, subidaDe, reintentar } = useDriveUploads()

const fileInputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const error = ref<string | null>(null)

const subida = computed(() => subidaDe(props.item._id))
const uploading = computed(
  () => subida.value?.estado === 'subiendo' || subida.value?.estado === 'pendiente',
)
const progress = computed(() => subida.value?.pct ?? 0)
const enCola = computed(() => subida.value?.estado === 'pendiente')
const falloCola = computed(() => (subida.value?.estado === 'error' ? subida.value : null))
const driveLink = computed(
  () => (subida.value?.estado === 'listo' && subida.value.driveLink) || props.item.driveLink || null,
)
const uploadedName = computed(() =>
  subida.value?.estado === 'listo' ? subida.value.fileName : null,
)

const hasFile = computed(() => !!driveLink.value)

function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return
  const file = files[0]

  if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
    error.value = 'Solo se permiten videos e imágenes.'
    return
  }

  error.value = null
  encolar(props.item, file)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  handleFiles(e.dataTransfer?.files || null)
}

// Avisar al padre cuando SU subida termina (la cola es asincrona).
watch(
  () => subida.value?.estado,
  (estado) => {
    if (estado === 'listo' && subida.value?.driveLink) {
      emit('uploaded', {
        driveLink: subida.value.driveLink,
        driveMonthFolderLink: subida.value.driveMonthFolderLink,
      })
    }
  },
)
</script>

<template>
  <div class="duc">
    <label class="duc__label">
      <i class="fa-brands fa-google-drive" /> Archivo maestro (Drive)
    </label>

    <div v-if="hasFile && !uploading" class="duc__done">
      <div class="duc__done-icon"><i class="fa-solid fa-circle-check" /></div>
      <div class="duc__done-info">
        <span class="duc__done-name">{{ uploadedName || 'Video maestro en Drive' }}</span>
        <a :href="driveLink!" target="_blank" rel="noopener" class="duc__done-link">
          <i class="fa-solid fa-arrow-up-right-from-square" /> Ver en Drive
        </a>
      </div>
      <button class="duc__replace" type="button" @click="fileInputRef?.click()">
        <i class="fa-solid fa-rotate" /> Re-subir
      </button>
    </div>

    <div v-else-if="uploading" class="duc__progress">
      <div class="duc__bar">
        <div class="duc__fill" :style="{ width: progress + '%' }" />
      </div>
      <span v-if="enCola">En cola — sube cuando termine otra (máx. 2 a la vez)</span>
      <span v-else>Subiendo a Drive... {{ progress }}%</span>
    </div>

    <div v-else-if="falloCola" class="duc__error" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem">
      <span><i class="fa-solid fa-triangle-exclamation" /> {{ falloCola.error }}</span>
      <button class="duc__replace" type="button" @click="reintentar(falloCola.id)">
        <i class="fa-solid fa-rotate" /> Reintentar
      </button>
    </div>

    <div
      v-else
      class="duc__dropzone"
      :class="{ 'is-dragging': dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
      @click="fileInputRef?.click()"
    >
      <i class="fa-brands fa-google-drive duc__dropzone-icon" />
      <p class="duc__dropzone-text">Sube el archivo maestro a Drive</p>
      <span class="duc__dropzone-hint">
        Va a la carpeta del cliente/mes · el cliente lo ve con su enlace · sin límite de 200MB
      </span>
    </div>

    <div v-if="error" class="duc__error">
      <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="video/*,image/*"
      style="display: none"
      @change="handleFiles(($event.target as HTMLInputElement).files)"
    />
  </div>
</template>

<style lang="scss" scoped>
.duc {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__label {
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $primary-dark;
    opacity: 0.8;
    display: flex;
    align-items: center;
    gap: 0.45rem;

    i {
      color: #1ea362;
    }
  }

  &__dropzone {
    border: 2px dashed rgba(#1ea362, 0.35);
    border-radius: 14px;
    padding: 1.5rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(#1ea362, 0.03);

    &:hover,
    &.is-dragging {
      border-color: #1ea362;
      background: rgba(#1ea362, 0.07);
    }
  }

  &__dropzone-icon {
    font-size: 1.7rem;
    color: #1ea362;
    margin-bottom: 0.4rem;
  }

  &__dropzone-text {
    font-size: 0.88rem;
    font-weight: 700;
    color: $primary-dark;
    margin: 0 0 0.2rem;
  }

  &__dropzone-hint {
    font-size: 0.7rem;
    color: $text-secondary;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(#1ea362, 0.05);
    border-radius: 10px;
    font-size: 0.8rem;
    color: $text-secondary;
  }

  &__bar {
    height: 6px;
    background: rgba($primary-dark, 0.1);
    border-radius: 99px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, #1ea362, #34d399);
    border-radius: 99px;
    transition: width 0.2s;
  }

  &__done {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: rgba(#1ea362, 0.07);
    border: 1.5px solid rgba(#1ea362, 0.25);
    border-radius: 12px;
  }

  &__done-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(#1ea362, 0.15);
    color: #1ea362;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  &__done-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__done-name {
    font-size: 0.8rem;
    font-weight: 700;
    color: $primary-dark;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__done-link {
    font-size: 0.72rem;
    color: #1ea362;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__replace {
    font-size: 0.72rem;
    font-weight: 600;
    color: $text-secondary;
    background: transparent;
    border: 1px solid rgba($primary-dark, 0.15);
    border-radius: 8px;
    padding: 0.3rem 0.65rem;
    cursor: pointer;

    &:hover {
      border-color: #1ea362;
      color: #1ea362;
    }
  }

  &__error {
    font-size: 0.78rem;
    color: #dc2626;
    background: rgba(#dc2626, 0.07);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
}
</style>
