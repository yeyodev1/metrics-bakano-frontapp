<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { resourceService } from '@/services/resource.service'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { Resource } from '@/types'

const route = useRoute()
const userStore = useUserStore()
const toast = useToast()

const workspaceId = computed(() => route.params.workspaceId as string)
const resources = ref<Resource[]>([])
const isLoading = ref(true)
const isUploading = ref<'logo' | 'linea_grafica' | 'catalogo' | null>(null)
const dragOver = ref<'logo' | 'linea_grafica' | null>(null)
const catalogoText = ref('')
const isUploadingCatalogoText = ref(false)

const logoResources = computed(() => resources.value.filter(r => r.categoria === 'logo'))
const lineaGraficaResources = computed(() => resources.value.filter(r => r.categoria === 'linea_grafica'))
const catalogoResources = computed(() => resources.value.filter(r => r.categoria === 'otro'))

onMounted(async () => {
  await fetchResources()
})

async function fetchResources() {
  isLoading.value = true
  try {
    resources.value = await resourceService.getResources(workspaceId.value)
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function onDragOver(e: DragEvent, categoria: 'logo' | 'linea_grafica') {
  e.preventDefault()
  dragOver.value = categoria
}

function onDragLeave() {
  dragOver.value = null
}

function onDrop(e: DragEvent, categoria: 'logo' | 'linea_grafica') {
  e.preventDefault()
  dragOver.value = null
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadFile(file, categoria)
}

function handleFileSelected(event: Event, categoria: 'logo' | 'linea_grafica') {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  uploadFile(input.files[0], categoria)
  input.value = ''
}

async function uploadFile(file: File, categoria: 'logo' | 'linea_grafica') {
  const acceptedLogo = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/avif']
  const acceptedLinea = [...acceptedLogo, 'application/pdf']
  const allowed = categoria === 'logo' ? acceptedLogo : acceptedLinea

  if (!allowed.includes(file.type)) {
    toast.error(categoria === 'logo'
      ? 'Formato no soportado. Usa PNG, JPG, WebP, SVG o AVIF.'
      : 'Formato no soportado. Usa PNG, JPG, WebP, SVG, AVIF o PDF.')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('El archivo no puede superar los 10 MB.')
    return
  }

  isUploading.value = categoria
  try {
    const resource = await resourceService.uploadResource(workspaceId.value, file, categoria)
    resources.value.push(resource)
    toast.success(categoria === 'logo' ? 'Logo subido correctamente' : 'Línea gráfica subida correctamente')
  } catch (error) {
    toast.error('Error al subir el archivo. Intenta de nuevo.')
    console.error(error)
  } finally {
    isUploading.value = false
  }
}

async function uploadCatalogoText() {
  const text = catalogoText.value.trim()
  if (!text) {
    toast.error('Escribe el contenido del catálogo antes de guardar.')
    return
  }
  isUploadingCatalogoText.value = true
  try {
    const blob = new Blob([text], { type: 'text/plain' })
    const file = new File([blob], `catalogo-${Date.now()}.txt`, { type: 'text/plain' })
    const resource = await resourceService.uploadResource(workspaceId.value, file, 'otro')
    resources.value.push(resource)
    catalogoText.value = ''
    toast.success('Catálogo guardado correctamente')
  } catch {
    toast.error('Error al guardar el catálogo.')
  } finally {
    isUploadingCatalogoText.value = false
  }
}

function handleCatalogoFile(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  if (file.type !== 'application/pdf') {
    toast.error('Solo se aceptan archivos PDF.')
    input.value = ''
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error('El archivo no puede superar los 10 MB.')
    input.value = ''
    return
  }
  isUploading.value = 'catalogo'
  resourceService.uploadResource(workspaceId.value, file, 'otro')
    .then(resource => {
      resources.value.push(resource)
      toast.success('Catálogo subido correctamente')
    })
    .catch(() => toast.error('Error al subir el catálogo.'))
    .finally(() => { isUploading.value = null; input.value = '' })
}

async function deleteResource(resource: Resource) {
  try {
    await resourceService.deleteResource(workspaceId.value, resource._id)
    resources.value = resources.value.filter(r => r._id !== resource._id)
    toast.success('Recurso eliminado')
  } catch (error) {
    toast.error('Error al eliminar el recurso')
    console.error(error)
  }
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || ''
}
</script>

<template>
  <div class="rv">
    <!-- ── HEADER ── -->
    <div class="rv-header">
      <div class="rv-header__content">
        <div class="rv-header__icon">
          <i class="fa-solid fa-folder-open"></i>
        </div>
        <div>
          <h1 class="rv-header__title">Recursos de Marca</h1>
          <p class="rv-header__desc">
            Sube aquí los archivos visuales de tu marca para que nuestro equipo de contenido y edición los utilice en tus materiales promocionales.
          </p>
        </div>
      </div>
      <div class="rv-header__stats">
        <div class="rv-stat">
          <span class="rv-stat__num">{{ logoResources.length }}</span>
          <span class="rv-stat__label">Logos</span>
        </div>
        <div class="rv-stat">
          <span class="rv-stat__num">{{ lineaGraficaResources.length }}</span>
          <span class="rv-stat__label">Líneas gráficas</span>
        </div>
      </div>
    </div>

    <!-- ── LOADING ── -->
    <div v-if="isLoading" class="rv-loading">
      <div class="rv-skeleton">
        <div class="rv-skeleton__block" v-for="i in 3" :key="i">
          <div class="rv-skeleton__thumb"></div>
          <div class="rv-skeleton__line"></div>
        </div>
      </div>
    </div>

    <!-- ── CONTENT ── -->
    <div v-else class="rv-body">

      <div class="rv-cols">
        <!-- ─── LOGO ─── -->
        <section class="rv-section">
          <div class="rv-section__head">
            <div class="rv-section__title">
              <i class="fa-solid fa-image"></i>
              <h2>Logo</h2>
              <span v-if="logoResources.length" class="rv-section__count">{{ logoResources.length }}</span>
            </div>
            <label class="rv-upload-btn" :class="{ 'is-uploading': isUploading === 'logo' }">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>{{ isUploading === 'logo' ? 'Subiendo...' : 'Subir' }}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif" hidden @change="handleFileSelected($event, 'logo')" :disabled="!!isUploading">
            </label>
          </div>

          <div
            class="rv-dropzone"
            :class="{ 'is-drag': dragOver === 'logo', 'has-files': logoResources.length > 0 }"
            @dragover="onDragOver($event, 'logo')"
            @dragleave="onDragLeave"
            @drop="onDrop($event, 'logo')"
          >
            <div v-if="logoResources.length === 0" class="rv-dropzone__empty">
              <div class="rv-dropzone__icon">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <p class="rv-dropzone__text">Arrastra tu logo aquí</p>
              <p class="rv-dropzone__hint">PNG, JPG, WebP, SVG o AVIF — Máx 10 MB</p>
            </div>

            <div v-else class="rv-grid">
              <div v-for="resource in logoResources" :key="resource._id" class="rv-card">
                <div class="rv-card__preview">
                  <img :src="resource.url" :alt="resource.nombre" loading="lazy">
                  <div class="rv-card__overlay">
                    <a :href="resource.url" target="_blank" class="rv-card__action" title="Descargar">
                      <i class="fa-solid fa-download"></i>
                    </a>
                    <button class="rv-card__action rv-card__action--del" @click="deleteResource(resource)" title="Eliminar">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
                <div class="rv-card__info">
                  <span class="rv-card__name">{{ resource.nombre }}</span>
                  <span class="rv-card__meta">{{ getFileExtension(resource.nombre) }} · {{ formatDate(resource.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ─── LÍNEA GRÁFICA ─── -->
        <section class="rv-section">
          <div class="rv-section__head">
            <div class="rv-section__title">
              <i class="fa-solid fa-pen-ruler"></i>
              <h2>Línea Gráfica</h2>
              <span v-if="lineaGraficaResources.length" class="rv-section__count">{{ lineaGraficaResources.length }}</span>
            </div>
            <label class="rv-upload-btn" :class="{ 'is-uploading': isUploading === 'linea_grafica' }">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>{{ isUploading === 'linea_grafica' ? 'Subiendo...' : 'Subir' }}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif,application/pdf" hidden @change="handleFileSelected($event, 'linea_grafica')" :disabled="!!isUploading">
            </label>
          </div>

          <div
            class="rv-dropzone"
            :class="{ 'is-drag': dragOver === 'linea_grafica', 'has-files': lineaGraficaResources.length > 0 }"
            @dragover="onDragOver($event, 'linea_grafica')"
            @dragleave="onDragLeave"
            @drop="onDrop($event, 'linea_grafica')"
          >
            <div v-if="lineaGraficaResources.length === 0" class="rv-dropzone__empty">
              <div class="rv-dropzone__icon">
                <i class="fa-solid fa-file-pen"></i>
              </div>
              <p class="rv-dropzone__text">Sube tu línea gráfica</p>
              <p class="rv-dropzone__hint">PDF, PNG, JPG, WebP, SVG o AVIF — Máx 10 MB</p>
            </div>

            <div v-else class="rv-grid">
              <div v-for="resource in lineaGraficaResources" :key="resource._id" class="rv-card">
                <div class="rv-card__preview">
                  <img v-if="isImage(resource.tipo)" :src="resource.url" :alt="resource.nombre" loading="lazy">
                  <div v-else class="rv-card__pdf-preview">
                    <i class="fa-solid fa-file-pdf"></i>
                    <span class="rv-card__pdf-label">PDF</span>
                  </div>
                  <div class="rv-card__overlay">
                    <a :href="resource.url" target="_blank" class="rv-card__action" title="Descargar">
                      <i class="fa-solid fa-download"></i>
                    </a>
                    <button class="rv-card__action rv-card__action--del" @click="deleteResource(resource)" title="Eliminar">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
                <div class="rv-card__info">
                  <span class="rv-card__name">{{ resource.nombre }}</span>
                  <span class="rv-card__meta">{{ getFileExtension(resource.nombre) }} · {{ formatDate(resource.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ─── CATÁLOGO ─── -->
      <section class="rv-section rv-section--full">
        <div class="rv-section__head">
          <div class="rv-section__title">
            <i class="fa-solid fa-book"></i>
            <h2>Catálogo Completo</h2>
            <span v-if="catalogoResources.length" class="rv-section__count">{{ catalogoResources.length }}</span>
          </div>
        </div>

        <div class="rv-catalogo">
          <div class="rv-catalogo__input-group">
            <label class="rv-catalogo__label">Escribe o pega aquí tu catálogo de productos/servicios</label>
            <textarea
              v-model="catalogoText"
              class="rv-catalogo__textarea"
              rows="5"
              placeholder="Ej: Plan mensual $120/mes · Bowl de quinoa $8.50 · Catering desde $500&#10;Incluye: diseño de historias, copywriting, pauta en Meta Ads..."
              :disabled="isUploadingCatalogoText"
            ></textarea>
            <button
              class="rv-upload-btn"
              :class="{ 'is-uploading': isUploadingCatalogoText }"
              :disabled="isUploadingCatalogoText || !catalogoText.trim()"
              @click="uploadCatalogoText"
            >
              <i :class="isUploadingCatalogoText ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'"></i>
              <span>{{ isUploadingCatalogoText ? 'Guardando...' : 'Guardar catálogo' }}</span>
            </button>
          </div>

          <div class="rv-catalogo__divider">
            <span>o</span>
          </div>

          <div class="rv-catalogo__upload-group">
            <label class="rv-catalogo__label">Sube tu catálogo en PDF</label>
            <label class="rv-upload-btn rv-upload-btn--outline" :class="{ 'is-uploading': isUploading === 'catalogo' }">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>{{ isUploading === 'catalogo' ? 'Subiendo...' : 'Subir PDF' }}</span>
              <input type="file" accept=".pdf,application/pdf" hidden @change="handleCatalogoFile" :disabled="!!isUploading">
            </label>
          </div>
        </div>

        <div v-if="catalogoResources.length" class="rv-catalogo-list">
          <div v-for="resource in catalogoResources" :key="resource._id" class="rv-catalogo-item">
            <div class="rv-catalogo-item__icon">
              <i :class="resource.tipo === 'text/plain' ? 'fa-solid fa-file-lines' : 'fa-solid fa-file-pdf'"></i>
            </div>
            <div class="rv-catalogo-item__info">
              <span class="rv-catalogo-item__name">{{ resource.nombre }}</span>
              <span class="rv-catalogo-item__meta">{{ formatDate(resource.createdAt) }}</span>
            </div>
            <div class="rv-catalogo-item__actions">
              <a :href="resource.url" target="_blank" class="rv-catalogo-item__action" title="Ver">
                <i class="fa-solid fa-eye"></i>
              </a>
              <button class="rv-catalogo-item__action rv-catalogo-item__action--del" @click="deleteResource(resource)" title="Eliminar">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
        <p v-else class="rv-catalogo__empty">Aún no has subido ningún catálogo.</p>
      </section>

    </div>
  </div>
</template>

<style lang="scss" scoped>
$danger: $alert-error;

.rv {
  padding: 1.25rem 1.25rem 1.5rem;
  max-width: 1320px;

  @media (min-width: 1200px) {
    padding: 1.5rem 2rem 2rem;
  }
}

// ── Header ────────────────────────────────────────────────
.rv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  &__content {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex: 1;
    min-width: 200px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.15rem;
    color: $white;
    box-shadow: 0 4px 10px rgba($primary, 0.25);
  }

  &__title {
    font-size: 1.3rem;
    font-weight: 700;
    color: $primary-dark;
    margin-bottom: 0.1rem;
  }

  &__desc {
    color: $text-secondary;
    font-size: 0.82rem;
    line-height: 1.5;
    max-width: 400px;
    margin: 0;
  }

  &__stats {
    display: flex;
    gap: 0.6rem;
    flex-shrink: 0;
  }
}

.rv-stat {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 9px;
  padding: 0.5rem 0.85rem;
  text-align: center;
  min-width: 60px;

  &__num {
    display: block;
    font-size: 1.1rem;
    font-weight: 800;
    color: $primary;
    line-height: 1.2;
  }

  &__label {
    font-size: 0.62rem;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-weight: 600;
  }
}

// ── Loading skeleton ──────────────────────────────────────
.rv-loading {
  padding: 1rem 0;
}

.rv-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;

  &__block {
    background: $white;
    border-radius: 12px;
    overflow: hidden;
  }

  &__thumb {
    height: 140px;
    background: linear-gradient(90deg, $primary-light 25%, darken($primary-light, 3%) 50%, $primary-light 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }

  &__line {
    height: 14px;
    margin: 0.75rem;
    border-radius: 4px;
    background: linear-gradient(90deg, $primary-light 25%, darken($primary-light, 3%) 50%, $primary-light 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ── Two-column layout ─────────────────────────────────────
.rv-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
}

// ── Full-width section (catálogo) ─────────────────────────
.rv-section--full {
  margin-top: 1.5rem;
}

.rv-catalogo {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;

  @media (max-width: 640px) {
    flex-direction: column;
  }

  &__input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  &__upload-group {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
    min-width: 180px;
  }

  &__label {
    font-size: 0.78rem;
    font-weight: 600;
    color: $primary-dark;
  }

  &__textarea {
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    font-family: inherit;
    font-size: 0.85rem;
    color: $primary-dark;
    resize: vertical;
    min-height: 100px;
    transition: border-color 0.2s;
    outline: none;

    &:focus {
      border-color: $primary;
    }

    &::placeholder {
      color: $text-secondary;
    }
  }

  &__divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
    padding: 0.75rem 0;
    align-self: stretch;

    span {
      font-size: 0.75rem;
      font-weight: 700;
      color: $text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    @media (max-width: 640px) {
      flex-direction: row;
      width: 100%;
      padding: 0.25rem 0;

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba($primary-dark, 0.1);
      }
    }
  }
}

.rv-upload-btn--outline {
  background: $white;
  color: $primary;
  border: 1.5px solid rgba($primary, 0.3);

  &:hover {
    background: rgba($primary, 0.04);
    border-color: $primary;
  }
}

.rv-catalogo-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.rv-catalogo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 10px;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: $primary-light;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 0.95rem;
      color: $primary;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: 0.68rem;
    color: $text-secondary;
  }

  &__actions {
    display: flex;
    gap: 0.3rem;
    flex-shrink: 0;
  }

  &__action {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: $text-secondary;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    text-decoration: none;
    font-size: 0.78rem;
    transition: all 0.15s;

    &:hover {
      background: rgba($primary-dark, 0.05);
      color: $primary-dark;
    }

    &--del:hover {
      background: rgba($alert-error, 0.08);
      color: $alert-error;
    }
  }
}

.rv-catalogo__empty {
  font-size: 0.82rem;
  color: $text-secondary;
  margin-top: 0.75rem;
}

// ── Section ───────────────────────────────────────────────
.rv-section {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 0.55rem;

    i {
      font-size: 1.1rem;
      color: $primary;
    }

    h2 {
      font-size: 1rem;
      font-weight: 700;
      color: $primary-dark;
    }
  }

  &__count {
    background: $primary-light;
    color: $primary;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 100px;
  }
}

.rv-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  background: $primary;
  color: $white;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  white-space: nowrap;

  &:hover {
    background: $primary-dark;
    transform: translateY(-1px);
  }

  &.is-uploading {
    opacity: 0.6;
    pointer-events: none;
  }

  input[type="file"] {
    display: none;
  }
}

// ── Drop zone ─────────────────────────────────────────────
.rv-dropzone {
  border: 2px dashed rgba($primary-dark, 0.1);
  border-radius: 12px;
  padding: 1rem;
  transition: border-color 0.2s, background 0.2s;

  &.is-drag {
    border-color: $primary;
    background: rgba($primary, 0.04);
  }

  &.has-files {
    border-style: solid;
    border-color: rgba($primary-dark, 0.07);
    padding: 0.75rem;
  }

  &__empty {
    text-align: center;
    padding: 1.5rem 1rem;
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: $primary-light;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.65rem;

    i {
      font-size: 1.3rem;
      color: $primary;
    }
  }

  &__text {
    font-size: 0.85rem;
    color: $primary-dark;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  &__hint {
    font-size: 0.75rem;
    color: $text-secondary;
  }
}

// ── Card grid ─────────────────────────────────────────────
.rv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.7rem;
}

.rv-card {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.18s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    transform: translateY(-2px);

    .rv-card__overlay {
      opacity: 1;
    }
  }

  &__preview {
    position: relative;
    height: 120px;
    background: $primary-light;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s;
    }

    &:hover img {
      transform: scale(1.06);
    }
  }

  &__pdf-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    color: $alert-error;

    i {
      font-size: 2rem;
    }
  }

  &__pdf-label {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &__action {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $primary-dark;
    cursor: pointer;
    text-decoration: none;
    font-size: 0.78rem;
    transition: all 0.15s;

    &:hover {
      transform: scale(1.1);
    }

    &--del:hover {
      background: $alert-error;
      color: $white;
    }
  }

  &__info {
    padding: 0.5rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  &__name {
    font-size: 0.75rem;
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: 0.62rem;
    color: $text-secondary;
  }
}
</style>
