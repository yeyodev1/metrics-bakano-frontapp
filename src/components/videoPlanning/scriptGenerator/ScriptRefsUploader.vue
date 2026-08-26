<template>
  <div class="srf">
    <p class="srf__label">
      <i class="fa-solid fa-paperclip" />
      Archivos de referencia <em>(imágenes o PDF — la IA los mira al escribir)</em>
    </p>

    <ul v-if="refs.length" class="srf__list">
      <li v-for="ref in refs" :key="ref._id" class="srf__item">
        <a :href="ref.url" target="_blank" rel="noopener" class="srf__thumb">
          <img v-if="ref.tipo === 'image'" :src="ref.url" :alt="ref.nombre" />
          <i v-else class="fa-solid fa-file-pdf" />
        </a>

        <div class="srf__meta">
          <span class="srf__name" :title="ref.nombre">{{ ref.nombre }}</span>
          <!-- Que no parezca que la IA lo lee cuando no llegó a Gemini. -->
          <span v-if="!ref.geminiFileUri" class="srf__warn">
            <i class="fa-solid fa-triangle-exclamation" /> la IA no puede leerlo
          </span>
        </div>

        <button
          type="button"
          class="srf__del"
          :disabled="deletingId === ref._id"
          title="Quitar referencia"
          @click="quitar(ref)"
        >
          <i :class="deletingId === ref._id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-xmark'" />
        </button>
      </li>
    </ul>

    <!-- Sin item guardado no hay dónde colgar el archivo; se dice, no se esconde. -->
    <p v-if="!itemId" class="srf__note">
      <i class="fa-solid fa-circle-info" />
      Guarda el video para poder adjuntar imágenes o documentos.
    </p>

    <template v-else>
      <label
        class="srf__drop"
        :class="{ 'is-over': dragging, 'is-busy': uploading }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          :disabled="uploading || lleno"
          @change="onPick"
        />
        <i :class="uploading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'" />
        <span v-if="uploading">Subiendo {{ subiendo }}…</span>
        <span v-else-if="lleno">Llegaste al máximo de {{ MAX_REFS }} referencias</span>
        <span v-else>Arrastra aquí o elige archivos · JPG, PNG, WEBP o PDF · hasta 10 MB</span>
      </label>

      <p v-if="error" class="srf__error">
        <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { planningService } from '@/services/planning.service'
import type { ScriptRef } from '@/types/videoPlanning'

/** Mismo tope que aplica el backend. */
const MAX_REFS = 6
const MAX_BYTES = 10 * 1024 * 1024
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const props = defineProps<{
  /** Sin item guardado no hay dónde colgar el archivo. */
  itemId?: string
}>()

const refs = defineModel<ScriptRef[]>({ required: true })

const uploading = ref(false)
const subiendo = ref('')
const deletingId = ref<string | null>(null)
const dragging = ref(false)
const error = ref<string | null>(null)

const lleno = computed(() => refs.value.length >= MAX_REFS)

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  subir(Array.from(input.files ?? []))
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  subir(Array.from(e.dataTransfer?.files ?? []))
}

/**
 * Uno por uno: cada archivo pasa por Cloudinary y por la Files API de Gemini, y
 * en paralelo el backend acabaría rechazando por tope los que se pisen.
 */
async function subir(files: File[]) {
  if (!props.itemId || !files.length) return
  error.value = null

  for (const file of files) {
    if (refs.value.length >= MAX_REFS) {
      error.value = `Solo caben ${MAX_REFS} referencias por video.`
      break
    }
    if (!TIPOS.includes(file.type)) {
      error.value = `"${file.name}" no es una imagen ni un PDF.`
      continue
    }
    if (file.size > MAX_BYTES) {
      error.value = `"${file.name}" pesa más de 10 MB.`
      continue
    }

    uploading.value = true
    subiendo.value = file.name
    try {
      const { ref: nueva, leePorIA } = await planningService.uploadScriptRef(props.itemId, file)
      refs.value = [...refs.value, nueva]
      if (!leePorIA) {
        error.value = `"${file.name}" se guardó, pero la IA no pudo leerlo. Prueba con otro formato.`
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? `No se pudo subir "${file.name}".`
    } finally {
      uploading.value = false
      subiendo.value = ''
    }
  }
}

async function quitar(ref: ScriptRef) {
  if (!props.itemId) return
  deletingId.value = ref._id
  error.value = null
  try {
    await planningService.deleteScriptRef(props.itemId, ref._id)
    refs.value = refs.value.filter((r) => r._id !== ref._id)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'No se pudo quitar la referencia.'
  } finally {
    deletingId.value = null
  }
}
</script>

<style lang="scss" scoped>
.srf {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;

  &__label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.03em;

    em {
      font-weight: 500;
      font-style: normal;
      text-transform: none;
      letter-spacing: 0;
      opacity: 0.8;
    }
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 100%;
    padding: 0.35rem 0.55rem 0.35rem 0.35rem;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
  }

  &__thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    overflow: hidden;
    background: rgba($primary-dark, 0.05);
    border-radius: 7px;
    color: #dc2626;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    max-width: 150px;
    overflow: hidden;
    font-size: 0.74rem;
    font-weight: 600;
    color: $primary-dark;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__warn {
    font-size: 0.65rem;
    color: #b45309;
  }

  &__del {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    color: $text-secondary;
    background: none;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.18s;

    &:hover:not(:disabled) { color: #dc2626; background: #fee2e2; }
    &:disabled { cursor: default; opacity: 0.6; }
  }

  &__drop {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    font-size: 0.75rem;
    color: $text-secondary;
    text-align: center;
    background: rgba($primary-dark, 0.02);
    border: 1px dashed rgba($primary-dark, 0.2);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.18s;

    input { display: none; }

    &:hover, &.is-over {
      color: $primary;
      background: rgba($primary, 0.05);
      border-color: $primary;
    }

    &.is-busy { cursor: progress; }
  }

  &__note,
  &__error {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    font-size: 0.72rem;
    color: $text-secondary;
  }

  &__error { color: #dc2626; }
}
</style>
