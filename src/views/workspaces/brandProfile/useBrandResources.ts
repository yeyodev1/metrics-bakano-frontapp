import { ref, computed } from 'vue'
import { resourceService } from '@/services/resource.service'
import type { Resource } from '@/types'

export type ResourceCategory = 'logo' | 'linea_grafica' | 'catalogo'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/avif']

/**
 * What each slot accepts.
 *
 * The catalogue used to be validated against the image-only list, so every PDF
 * was rejected — and the failure returned silently, which is why uploading a
 * catalogue looked like a dead button.
 */
const ACCEPTED: Record<ResourceCategory, string[]> = {
  logo: IMAGE_TYPES,
  linea_grafica: [...IMAGE_TYPES, 'application/pdf'],
  catalogo: [...IMAGE_TYPES, 'application/pdf'],
}

const LABELS: Record<ResourceCategory, string> = {
  logo: 'logo',
  linea_grafica: 'línea gráfica',
  catalogo: 'catálogo',
}

const MAX_MB = 25

export function useBrandResources(workspaceId: string) {
  const resources = ref<Resource[]>([])
  const loading = ref(true)
  const uploadingCategory = ref<ResourceCategory | null>(null)
  const error = ref('')

  const logos = computed(() => resources.value.filter((r) => r.categoria === 'logo'))
  const lineas = computed(() => resources.value.filter((r) => r.categoria === 'linea_grafica'))
  const catalogs = computed(() => resources.value.filter((r) => r.categoria === 'catalogo'))

  async function load() {
    loading.value = true
    try {
      resources.value = await resourceService.getResources(workspaceId)
    } catch {
      error.value = 'No se pudieron cargar los recursos de marca.'
    } finally {
      loading.value = false
    }
  }

  /** Accept attribute for the file input, so the picker matches the rules. */
  function acceptFor(categoria: ResourceCategory) {
    return ACCEPTED[categoria].join(',')
  }

  async function upload(file: File, categoria: ResourceCategory) {
    error.value = ''

    // Rejections used to `return` in silence; now each one says what happened.
    if (!ACCEPTED[categoria].includes(file.type)) {
      const allowed = categoria === 'logo' ? 'imágenes' : 'imágenes o PDF'
      error.value = `El ${LABELS[categoria]} debe ser ${allowed}. "${file.name}" es ${file.type || 'de tipo desconocido'}.`
      return false
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      const mb = (file.size / 1024 / 1024).toFixed(1)
      error.value = `"${file.name}" pesa ${mb} MB y el máximo es ${MAX_MB} MB.`
      return false
    }

    uploadingCategory.value = categoria
    try {
      const created = await resourceService.uploadResource(workspaceId, file, categoria)
      resources.value.push(created)
      return true
    } catch (err: any) {
      error.value = err?.message ?? `No se pudo subir el ${LABELS[categoria]}.`
      return false
    } finally {
      uploadingCategory.value = null
    }
  }

  async function handleInput(event: Event, categoria: ResourceCategory) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    // Cleared before awaiting so picking the same file twice still fires change.
    input.value = ''
    if (file) await upload(file, categoria)
  }

  async function remove(resource: Resource) {
    const previous = resources.value
    resources.value = resources.value.filter((r) => r._id !== resource._id)
    try {
      await resourceService.deleteResource(workspaceId, resource._id)
    } catch {
      resources.value = previous
      error.value = 'No se pudo eliminar el recurso.'
    }
  }

  return {
    resources,
    logos,
    lineas,
    catalogs,
    loading,
    uploadingCategory,
    error,
    load,
    upload,
    handleInput,
    remove,
    acceptFor,
    MAX_MB,
  }
}
