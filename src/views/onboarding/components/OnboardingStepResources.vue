<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { resourceService } from '@/services/resource.service'
import type { Resource } from '@/types'

const props = defineProps<{
  workspaceId: string
}>()

const emit = defineEmits<{
  (e: 'continue'): void
}>()

const resources = ref<Resource[]>([])
const isUploading = ref(false)
const isLoading = ref(true)

const logoResources = computed(() => resources.value.filter(r => r.categoria === 'logo'))
const hasLogo = computed(() => logoResources.value.length > 0)

onMounted(async () => {
  await fetchResources()
})

async function fetchResources() {
  isLoading.value = true
  try {
    resources.value = await resourceService.getResources(props.workspaceId)
  } catch {
    resources.value = []
  } finally {
    isLoading.value = false
  }
}

function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  uploadFile(input.files[0], 'logo')
  input.value = ''
}

function handleLineaGraficaUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  uploadFile(input.files[0], 'linea_grafica')
  input.value = ''
}

async function uploadFile(file: File, categoria: 'logo' | 'linea_grafica') {
  isUploading.value = true
  try {
    const resource = await resourceService.uploadResource(props.workspaceId, file, categoria)
    resources.value.push(resource)
  } catch (error) {
    console.error(error)
  } finally {
    isUploading.value = false
  }
}

async function removeResource(resource: Resource) {
  try {
    await resourceService.deleteResource(props.workspaceId, resource._id)
    resources.value = resources.value.filter(r => r._id !== resource._id)
  } catch (error) {
    console.error(error)
  }
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function handleContinue() {
  emit('continue')
}
</script>

<template>
  <div class="step-content">
    <div class="step-badge">Paso 3</div>
    <h2>Sube tus recursos de marca</h2>
    <p class="step-description">
      Para que nuestro equipo de contenido y edición pueda trabajar con la identidad de tu marca,
      necesitamos que subas al menos tu <strong>logo</strong>. También puedes subir tu línea gráfica
      (manual de marca, paleta de colores, tipografías).
    </p>

    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i> Cargando...
    </div>

    <div v-else class="upload-sections">
      <!-- Logo -->
      <div class="upload-section" :class="{ 'section-done': hasLogo }">
        <div class="upload-section-header">
          <div class="upload-section-title">
            <i class="fa-solid fa-image"></i>
            <h3>Logo</h3>
            <span v-if="hasLogo" class="badge-done"><i class="fa-solid fa-check"></i> Subido</span>
          </div>
          <label class="btn-upload" :class="{ 'btn-disabled': isUploading }">
            <i class="fa-solid fa-upload"></i> Subir
            <input type="file" accept="image/*" hidden @change="handleLogoUpload" :disabled="isUploading">
          </label>
        </div>

        <div v-if="!hasLogo" class="upload-hint">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>Obligatorio: sube al menos un logo para continuar</span>
        </div>

        <div v-if="logoResources.length" class="uploaded-files">
          <div v-for="r in logoResources" :key="r._id" class="uploaded-file">
            <img v-if="isImage(r.tipo)" :src="r.url" class="file-preview-img">
            <span class="file-name">{{ r.nombre }}</span>
            <button class="btn-remove" @click="removeResource(r)" title="Eliminar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Línea Gráfica -->
      <div class="upload-section">
        <div class="upload-section-header">
          <div class="upload-section-title">
            <i class="fa-solid fa-pen-ruler"></i>
            <h3>Línea Gráfica</h3>
            <span v-if="lineaGraficaResources.length" class="badge-done"><i class="fa-solid fa-check"></i> {{ lineaGraficaResources.length }} archivo(s)</span>
          </div>
          <label class="btn-upload" :class="{ 'btn-disabled': isUploading }">
            <i class="fa-solid fa-upload"></i> Subir
            <input type="file" accept="image/*,application/pdf" hidden @change="handleLineaGraficaUpload" :disabled="isUploading">
          </label>
        </div>

        <div class="upload-hint">
          <i class="fa-solid fa-info-circle"></i>
          <span>Recomendado: manual de marca, guía de estilos, colores, tipografías (PDF o imágenes)</span>
        </div>

        <div v-if="lineaGraficaResources.length" class="uploaded-files">
          <div v-for="r in lineaGraficaResources" :key="r._id" class="uploaded-file">
            <img v-if="isImage(r.tipo)" :src="r.url" class="file-preview-img">
            <i v-else class="fa-solid fa-file-pdf file-icon-pdf"></i>
            <span class="file-name">{{ r.nombre }}</span>
            <button class="btn-remove" @click="removeResource(r)" title="Eliminar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="step-actions">
      <button
        class="btn-continue"
        :disabled="!hasLogo"
        @click="handleContinue"
      >
        Continuar
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$border-color: rgba($primary-dark, 0.08);
$danger: $alert-error;
$success: $alert-success;
$warning: $alert-warning;

.step-content {
  --step-max-width: 100%;
}

.step-badge {
  display: inline-block;
  background: rgba($primary, 0.1);
  color: $primary;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: $primary-dark;
  margin-bottom: 0.75rem;
}

.step-description {
  color: $text-secondary;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: $primary;
}

.upload-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.upload-section {
  background: $primary-light;
  border: 2px solid $border-color;
  border-radius: 12px;
  padding: 1.25rem;
  transition: border-color 0.2s;

  &.section-done {
    border-color: $success;
  }
}

.upload-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.upload-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: $primary;
    font-size: 1.1rem;
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: $primary-dark;
  }
}

.badge-done {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: $success;
  font-weight: 600;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  background: $primary;
  color: $white;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: $primary-dark;
  }

  input[type="file"] {
    display: none;
  }
}

.btn-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: $text-secondary;
  margin-bottom: 0.75rem;

  i {
    font-size: 0.9rem;
  }

  .fa-circle-exclamation {
    color: $warning;
  }

  .fa-info-circle {
    color: $primary;
  }
}

.uploaded-files {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: $white;
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
}

.file-preview-img {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}

.file-icon-pdf {
  font-size: 1.5rem;
  color: $danger;
}

.file-name {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: $primary-dark;
}

.btn-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba($danger, 0.1);
  color: $danger;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.75rem;

  &:hover {
    background: $danger;
    color: $white;
  }
}

.step-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-continue {
  padding: 0.75rem 2rem;
  background: $primary;
  color: $white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: $primary-dark;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
