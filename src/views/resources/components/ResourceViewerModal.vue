<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="resource" class="rvm__overlay" @click.self="$emit('close')">
        <div class="rvm">
          <header class="rvm__head">
            <i :class="fileIcon(resource)" />
            <div class="rvm__titles">
              <strong>{{ resource.nombre }}</strong>
              <small>{{ extensionOf(resource.nombre) }} · {{ formatDate(resource.createdAt) }}</small>
            </div>
            <a :href="resource.url" target="_blank" rel="noopener" class="rvm__open">
              <i class="fa-solid fa-arrow-up-right-from-square" /> Abrir
            </a>
            <button class="rvm__close" aria-label="Cerrar" @click="$emit('close')">
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

          <div class="rvm__body">
            <img v-if="isImage(resource)" :src="resource.url" :alt="resource.nombre" />

            <!-- Cloudinary sirve los PDF `raw` como application/octet-stream
                 (y los antiguos ni tienen extension): el iframe directo queda
                 en blanco. Se baja como blob y se re-etiqueta application/pdf
                 para que el visor del navegador si lo pinte. -->
            <template v-else-if="isPdf(resource)">
              <iframe
                v-if="pdfBlobUrl"
                :src="pdfBlobUrl"
                :title="resource.nombre"
                class="rvm__frame"
              />
              <p v-else-if="pdfError" class="rvm__unsupported">
                No se pudo cargar el PDF aquí. Usa «Abrir».
              </p>
              <p v-else class="rvm__unsupported">Cargando PDF…</p>
            </template>

            <pre v-else-if="isText(resource)" class="rvm__text">{{ textContent || 'Cargando…' }}</pre>

            <p v-else class="rvm__unsupported">
              Este tipo de archivo no se puede previsualizar aquí. Usa «Abrir».
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import {
  fileIcon,
  extensionOf,
  formatDate,
  isImage,
  isPdf,
  isText,
} from '@/utils/brandResources'
import type { Resource } from '@/types'

const props = defineProps<{ resource: Resource | null }>()

defineEmits<{ (e: 'close'): void }>()

const textContent = ref('')
const pdfBlobUrl = ref<string | null>(null)
const pdfError = ref(false)

function liberarPdf() {
  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value)
  pdfBlobUrl.value = null
  pdfError.value = false
}

// El catálogo escrito a mano se guarda como .txt; se trae para leerlo aquí
// en vez de obligar a descargar un archivo de dos líneas.
watch(
  () => props.resource,
  async (resource) => {
    textContent.value = ''
    liberarPdf()
    if (!resource) return

    if (isPdf(resource)) {
      try {
        const res = await fetch(resource.url)
        if (!res.ok) throw new Error(String(res.status))
        const raw = await res.blob()
        // Re-etiquetar: Cloudinary lo manda como octet-stream y asi el
        // visor de PDF del navegador no lo abre.
        const blob = new Blob([raw], { type: 'application/pdf' })
        pdfBlobUrl.value = URL.createObjectURL(blob)
      } catch {
        pdfError.value = true
      }
      return
    }

    if (!isText(resource)) return
    try {
      const res = await fetch(resource.url)
      textContent.value = await res.text()
    } catch {
      textContent.value = 'No se pudo cargar el contenido.'
    }
  },
  { immediate: true }
)

onBeforeUnmount(liberarPdf)
</script>

<style scoped lang="scss">
.rvm__overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba($primary-dark, 0.6);
  backdrop-filter: blur(3px);
}

.rvm {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 56rem;
  max-height: 90vh;
  overflow: hidden;
  background: $white;
  border-radius: 16px;
}

.rvm__head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba($primary-dark, 0.08);

  > i:first-child { font-size: 1.1rem; color: $secondary; }
}

.rvm__titles {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;

  strong {
    overflow: hidden;
    font-size: 0.9rem;
    color: $primary-dark;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small { font-size: 0.72rem; color: $text-secondary; }
}

.rvm__open {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: $secondary-dark;
  text-decoration: none;
  background: $overlay-purple;
  border-radius: 8px;

  &:hover { background: rgba($secondary, 0.18); }
}

.rvm__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: $text-secondary;
  background: rgba($primary-dark, 0.05);
  border: 0;
  border-radius: 50%;
  cursor: pointer;

  &:hover { color: $primary; background: rgba($primary, 0.1); }
}

.rvm__body {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 1rem;
  overflow: auto;
  background: $primary-light;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

.rvm__frame {
  width: 100%;
  min-height: 65vh;
  background: $white;
  border: 0;
  border-radius: 10px;
}

.rvm__text {
  width: 100%;
  margin: 0;
  padding: 1rem;
  font-family: inherit;
  font-size: 0.82rem;
  line-height: 1.6;
  color: $primary-dark;
  white-space: pre-wrap;
  background: $white;
  border-radius: 10px;
}

.rvm__unsupported {
  margin: 0;
  font-size: 0.85rem;
  color: $text-secondary;
}
</style>
