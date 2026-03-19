<script setup lang="ts">
import { ref } from 'vue'
import { surveyService } from '@/services/survey.service'

const props = defineProps<{
  modelValue: string | undefined
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', url: string | undefined): void
}>()

const isUploading = ref(false)
const uploadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await uploadFile(file)
}

async function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  await uploadFile(file)
}

async function uploadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Solo se permiten imágenes.'
    return
  }
  isUploading.value = true
  uploadError.value = ''
  try {
    const res = await surveyService.uploadImage(file)
    emit('update:modelValue', res.url)
  } catch (err: any) {
    uploadError.value = err?.message || 'Error al subir la imagen.'
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function removeImage() {
  emit('update:modelValue', undefined)
}

function triggerFileInput() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="image-uploader">
    <!-- Current image preview -->
    <div v-if="modelValue" class="image-uploader__preview">
      <img :src="modelValue" alt="Imagen subida" class="image-uploader__img" />
      <button
        v-if="!disabled"
        type="button"
        class="image-uploader__remove"
        @click="removeImage"
        title="Eliminar imagen"
      >
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <!-- Drop zone (shown when no image or uploading) -->
    <div
      v-else
      class="image-uploader__dropzone"
      :class="{ 'image-uploader__dropzone--disabled': disabled || isUploading }"
      @click="!disabled && !isUploading && triggerFileInput()"
      @dragover.prevent
      @drop.prevent="!disabled && !isUploading && onDrop($event)"
    >
      <template v-if="isUploading">
        <i class="fa-solid fa-spinner fa-spin image-uploader__icon" />
        <span>Subiendo imagen...</span>
      </template>
      <template v-else>
        <i class="fa-solid fa-cloud-arrow-up image-uploader__icon" />
        <span>Haz clic o arrastra una imagen aquí</span>
        <span class="image-uploader__hint">JPG, PNG, WEBP · Máx. 5 MB</span>
      </template>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="image-uploader__input"
      @change="onFileChange"
    />

    <p v-if="uploadError" class="image-uploader__error">
      <i class="fa-solid fa-circle-exclamation" /> {{ uploadError }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__input {
    display: none;
  }

  &__preview {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    max-width: 320px;
  }

  &__img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
    border-radius: 12px;
    border: 1.5px solid rgba($primary-dark, 0.1);
  }

  &__remove {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 2rem;
    height: 2rem;
    border: none;
    background: rgba(0, 0, 0, 0.55);
    color: $white;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
      background: $alert-error;
    }
  }

  &__dropzone {
    border: 2px dashed rgba($primary, 0.3);
    border-radius: 12px;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    transition: all 0.2s ease;
    color: $text-secondary;
    font-size: 0.85rem;
    text-align: center;
    background: rgba($primary-light, 0.2);

    &:hover:not(&--disabled) {
      border-color: $primary;
      background: rgba($primary, 0.04);
      color: $primary;
    }

    &--disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__icon {
    font-size: 1.8rem;
    color: $primary;
    opacity: 0.7;
  }

  &__hint {
    font-size: 0.75rem;
    opacity: 0.6;
  }

  &__error {
    font-size: 0.82rem;
    color: $alert-error;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
}
</style>
