import { ref, computed, watch, type Ref } from 'vue'
import { resourceService } from '@/services/resource.service'
import { useToast } from '@/composables/useToast'
import { rejectionReason, isCatalog, type ResourceCategory } from '@/utils/brandResources'
import type { Resource } from '@/types'

/** Todo el estado y las acciones de la pantalla de recursos de marca. */
export function useResources(workspaceId: Ref<string>) {
  const toast = useToast()

  const resources = ref<Resource[]>([])
  const loading = ref(true)
  /**
   * Distingue "nunca cargó" de "recargando con datos en pantalla": AppLayout
   * remonta las vistas en cada navegación y basar el skeleton en `loading`
   * a secas lo deja encendido para siempre.
   */
  const hasLoaded = ref(false)
  const uploading = ref<ResourceCategory | null>(null)
  const savingText = ref(false)

  const logos = computed(() => resources.value.filter((r) => r.categoria === 'logo'))
  const lineas = computed(() => resources.value.filter((r) => r.categoria === 'linea_grafica'))
  const catalogs = computed(() => resources.value.filter(isCatalog))

  const total = computed(() => logos.value.length + lineas.value.length + catalogs.value.length)

  /** Qué le falta a la marca; alimenta el aviso de progreso del encabezado. */
  const missing = computed(() => {
    const gaps: string[] = []
    if (!logos.value.length) gaps.push('logo')
    if (!lineas.value.length) gaps.push('línea gráfica')
    if (!catalogs.value.length) gaps.push('catálogo')
    return gaps
  })

  async function load() {
    if (!workspaceId.value) {
      loading.value = false
      hasLoaded.value = true
      return
    }
    loading.value = true
    try {
      resources.value = await resourceService.getResources(workspaceId.value)
    } catch {
      toast.error('No se pudieron cargar los recursos de marca.')
    } finally {
      loading.value = false
      hasLoaded.value = true
    }
  }

  watch(workspaceId, load, { immediate: true })

  async function upload(file: File, categoria: ResourceCategory) {
    // El rechazo se explica siempre. Antes varias validaciones hacían `return`
    // en silencio y el botón parecía simplemente no funcionar.
    const reason = rejectionReason(file, categoria)
    if (reason) {
      toast.error(reason)
      return false
    }

    uploading.value = categoria
    try {
      const created = await resourceService.uploadResource(workspaceId.value, file, categoria)
      resources.value.push(created)
      toast.success('Archivo subido correctamente.')
      return true
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo subir el archivo.')
      return false
    } finally {
      uploading.value = null
    }
  }

  /** Guarda el catálogo escrito a mano como un .txt, igual que un archivo. */
  async function saveCatalogText(text: string) {
    const clean = text.trim()
    if (!clean) return false

    savingText.value = true
    try {
      const blob = new Blob([clean], { type: 'text/plain' })
      const file = new File([blob], `catalogo-${new Date().toISOString().slice(0, 10)}.txt`, {
        type: 'text/plain',
      })
      const created = await resourceService.uploadResource(workspaceId.value, file, 'catalogo')
      resources.value.push(created)
      toast.success('Catálogo guardado.')
      return true
    } catch {
      toast.error('No se pudo guardar el catálogo.')
      return false
    } finally {
      savingText.value = false
    }
  }

  /** Optimista con reversa: la lista nunca muestra algo que no se borró. */
  async function remove(resource: Resource) {
    const previous = resources.value
    resources.value = resources.value.filter((r) => r._id !== resource._id)
    try {
      await resourceService.deleteResource(workspaceId.value, resource._id)
      toast.success('Recurso eliminado.')
    } catch {
      resources.value = previous
      toast.error('No se pudo eliminar el recurso.')
    }
  }

  return {
    resources,
    logos,
    lineas,
    catalogs,
    total,
    missing,
    loading,
    hasLoaded,
    uploading,
    savingText,
    load,
    upload,
    saveCatalogText,
    remove,
  }
}
