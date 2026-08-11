import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { brandProfileService } from '@/services/brandProfile.service'
import type { BrandProfile, BrandProfileFile } from '@/types'

/** Fields that count toward the completion score, in the order they are asked. */
const SCORED_FIELDS: Array<keyof BrandProfile> = [
  'descripcion',
  'tipoNegocio',
  'publicoObjetivo',
  'propuestaValor',
  'tono',
  'productosServicios',
  'problemaResuelto',
  'trafficDirection',
  'trafficLink',
]

/** Everything the profile form persists. Strategy fields ride along untouched. */
const PERSISTED: Array<keyof BrandProfile> = [
  ...SCORED_FIELDS,
  'vertical',
  'segmentosMercado',
  'canalesDetail',
  'actividadesClave',
  'customerJourneyCases',
]

function emptyProfile(): BrandProfile {
  return {
    descripcion: '',
    tipoNegocio: undefined,
    vertical: '',
    publicoObjetivo: '',
    propuestaValor: '',
    tono: '',
    productosServicios: '',
    problemaResuelto: '',
    trafficDirection: undefined,
    trafficLink: '',
    archivos: [],
  } as BrandProfile
}

function snapshot(p: BrandProfile): BrandProfile {
  return { ...p, archivos: [...(p.archivos ?? [])] }
}

export function useBrandProfile(workspaceId: string) {
  const router = useRouter()
  const userStore = useUserStore()

  const profile = ref<BrandProfile>(emptyProfile())
  const original = ref<BrandProfile | null>(null)

  const loading = ref(true)
  const saving = ref(false)
  const uploading = ref(false)
  const saveSuccess = ref(false)
  const error = ref<string | null>(null)
  const isEditing = ref(false)

  const isClientView = computed(
    () => !userStore.isInternal && userStore.role !== 'superadmin'
  )

  const completionScore = computed(() => {
    const filled = SCORED_FIELDS.filter((k) => {
      const v = profile.value[k]
      return typeof v === 'string' ? v.trim() : !!v
    }).length
    return Math.round((filled / SCORED_FIELDS.length) * 100)
  })

  const hasBrandProfile = computed(
    () => !!(profile.value.descripcion?.trim() || (profile.value.archivos?.length ?? 0) > 0)
  )

  const showSummary = computed(
    () => completionScore.value === 100 && hasBrandProfile.value && !isEditing.value
  )

  async function load() {
    loading.value = true
    try {
      const data = await brandProfileService.getProfile(workspaceId)
      if (data) {
        profile.value = { ...emptyProfile(), ...data, archivos: data.archivos ?? [] }
        original.value = snapshot(profile.value)
      }
    } catch {
      error.value = 'No se pudo cargar el perfil de marca.'
    } finally {
      loading.value = false
      // Clients land straight in edit mode: for them this page is the form.
      if (isClientView.value) isEditing.value = true
    }
  }

  function payload() {
    return Object.fromEntries(
      PERSISTED.map((k) => [k, profile.value[k]])
    ) as Partial<BrandProfile>
  }

  async function save() {
    saving.value = true
    error.value = null
    try {
      await brandProfileService.upsert(workspaceId, payload())
      saveSuccess.value = true
      isEditing.value = false
      original.value = snapshot(profile.value)
      setTimeout(() => { saveSuccess.value = false }, 2500)
      return true
    } catch {
      error.value = 'Error al guardar. Intenta de nuevo.'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Saves and advances the wizard. Without `nextStep` it means "finished":
   * clients get marked complete and sent on, internal users just see the toast.
   */
  async function saveStep(nextStep?: number, onAdvance?: (step: number) => void) {
    saving.value = true
    error.value = null
    try {
      await brandProfileService.upsert(workspaceId, payload())
      original.value = snapshot(profile.value)

      if (nextStep) {
        onAdvance?.(nextStep)
        return true
      }

      saveSuccess.value = true
      if (isClientView.value) {
        userStore.setBrandProfileCompleted(true)
        setTimeout(() => {
          router.push({ name: 'BillingRoas', params: { workspaceId } })
        }, 2000)
      } else {
        setTimeout(() => { saveSuccess.value = false }, 3000)
      }
      return true
    } catch {
      error.value = 'Error al guardar. Intenta de nuevo.'
      return false
    } finally {
      saving.value = false
    }
  }

  function cancelEdit() {
    if (original.value) profile.value = snapshot(original.value)
    isEditing.value = false
    error.value = null
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return
    uploading.value = true
    error.value = null
    try {
      for (const file of Array.from(files)) {
        const uploaded = await brandProfileService.uploadFile(workspaceId, file)
        profile.value.archivos = [...(profile.value.archivos ?? []), uploaded]
      }
    } catch {
      error.value = 'Error al subir el archivo. Intenta de nuevo.'
    } finally {
      uploading.value = false
    }
  }

  async function deleteFile(file: BrandProfileFile) {
    const previous = profile.value.archivos ?? []
    profile.value.archivos = previous.filter((f) => f.publicId !== file.publicId)
    try {
      await brandProfileService.deleteFile(workspaceId, file.publicId)
    } catch {
      profile.value.archivos = previous
      error.value = 'No se pudo eliminar el archivo.'
    }
  }

  return {
    profile,
    loading,
    saving,
    uploading,
    saveSuccess,
    error,
    isEditing,
    isClientView,
    completionScore,
    hasBrandProfile,
    showSummary,
    load,
    save,
    saveStep,
    cancelEdit,
    uploadFiles,
    deleteFile,
  }
}
