import { ref, computed } from 'vue'
import { resourceService } from '@/services/resource.service'
import {
  acceptFor,
  isCatalog,
  rejectionReason,
  LABELS,
  MAX_MB,
  type ResourceCategory,
} from '@/utils/brandResources'
import type { Resource } from '@/types'

export type { ResourceCategory }

export function useBrandResources(workspaceId: string) {
  const resources = ref<Resource[]>([])
  const loading = ref(true)
  const uploadingCategory = ref<ResourceCategory | null>(null)
  const error = ref('')

  const logos = computed(() => resources.value.filter((r) => r.categoria === 'logo'))
  const lineas = computed(() => resources.value.filter((r) => r.categoria === 'linea_grafica'))
  // Incluye los catálogos históricos guardados como 'otro' desde la pantalla
  // de recursos, que hasta ahora esta vista no mostraba.
  const catalogs = computed(() => resources.value.filter(isCatalog))

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

  async function upload(file: File, categoria: ResourceCategory) {
    error.value = ''

    // Los rechazos hacían `return` en silencio; ahora cada uno dice qué pasó.
    // Las reglas viven en utils/brandResources para que esta pantalla y la de
    // recursos acepten exactamente lo mismo.
    const reason = rejectionReason(file, categoria)
    if (reason) {
      error.value = reason
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
