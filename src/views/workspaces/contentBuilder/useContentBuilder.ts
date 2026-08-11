import { ref, computed, watch, type Ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { workspaceService } from '@/services/workspace.service'
import { brandProfileService } from '@/services/brandProfile.service'
import { videoPlanningService } from '@/services/videoPlanning.service'
import type { Workspace, BrandProfile, CustomerJourneyCase, SegmentoMercado } from '@/types'
import type { WorkspaceVideoItem, CreateVideoItemPayload } from '@/types/videoPlanning'

export interface WizardPayload {
  propuestaValor: string
  segmentosMercado: SegmentoMercado[]
  canalesDetail: string[]
  actividadesClave: string[]
  customerJourneyCases: CustomerJourneyCase[]
}

function emptyProfile(): BrandProfile {
  return {
    descripcion: '',
    propuestaValor: '',
    publicoObjetivo: '',
    tono: '',
    productosServicios: '',
    customerJourneyCases: [],
  } as BrandProfile
}

/** All the state and actions behind the Content Builder screen. */
export function useContentBuilder(workspaceId: Ref<string>) {
  const toast = useToast()
  const { confirm } = useConfirm()

  const loading = ref(true)
  /**
   * True once the first load finished, successfully or not.
   *
   * `AppLayout` remounts views on every navigation, so gating the skeleton on
   * bare `loading` risks an infinite skeleton; this separates "never loaded"
   * from "refreshing with data already on screen".
   */
  const hasLoaded = ref(false)
  const workspace = ref<Workspace | null>(null)
  const profile = ref<BrandProfile>(emptyProfile())
  const items = ref<WorkspaceVideoItem[]>([])

  const isSavingItem = ref(false)
  const isSavingProfile = ref(false)
  const savingCase = ref(false)

  // ── Load ────────────────────────────────────────────────────────────────
  async function load() {
    // Bailing out without clearing the flag left the view stuck on "loading"
    // forever whenever the route param resolved a tick late.
    if (!workspaceId.value) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const [wsRes, profRes] = await Promise.all([
        workspaceService.getWorkspace(workspaceId.value),
        brandProfileService.getProfile(workspaceId.value),
      ])
      workspace.value = wsRes.workspace
      if (profRes) profile.value = { ...profRes }

      // Every script of the workspace, across all its monthly plannings.
      // This used to call getByEntry(workspaceId), but that endpoint keys on
      // planningEntryId — so it never matched and the matrix was always empty.
      items.value = await videoPlanningService
        .getWorkspaceItems(workspaceId.value)
        .catch(() => [])
    } catch {
      toast.error('Error al cargar datos del Builder Studio.')
    } finally {
      loading.value = false
      hasLoaded.value = true
    }
  }

  watch(workspaceId, load, { immediate: true })

  // ── KPIs ────────────────────────────────────────────────────────────────
  const totalScripts = computed(() => items.value.length)
  const totalLinkedReels = computed(() => items.value.filter((i) => !!i.igMediaId).length)
  const totalViews = computed(() => items.value.reduce((s, i) => s + (i.metrics?.views || 0), 0))
  const totalAdSpend = computed(() => items.value.reduce((s, i) => s + (i.metrics?.adSpend || 0), 0))

  // ── Customer Journey cases ──────────────────────────────────────────────
  const journeyCases = computed(() => profile.value.customerJourneyCases ?? [])

  const nextCaseNumber = computed(
    () => Math.max(0, ...journeyCases.value.map((c) => c.casoNumero)) + 1
  )

  /** Optimistic write that rolls back, so the screen never shows unsaved data. */
  async function persistCases(cases: CustomerJourneyCase[], successMessage: string) {
    savingCase.value = true
    const previous = profile.value.customerJourneyCases
    profile.value.customerJourneyCases = cases
    try {
      await brandProfileService.upsert(workspaceId.value, profile.value)
      toast.success(successMessage)
      return true
    } catch {
      profile.value.customerJourneyCases = previous
      toast.error('No se pudo guardar el caso. Intenta de nuevo.')
      return false
    } finally {
      savingCase.value = false
    }
  }

  async function saveCase(caso: CustomerJourneyCase) {
    const exists = journeyCases.value.some((c) => c.casoNumero === caso.casoNumero)
    const cases = exists
      ? journeyCases.value.map((c) => (c.casoNumero === caso.casoNumero ? caso : c))
      : [...journeyCases.value, caso]

    return persistCases(cases, exists ? 'Caso actualizado.' : 'Caso agregado.')
  }

  async function deleteCase(casoNumero: number) {
    const confirmed = await confirm({
      title: 'Eliminar caso',
      message:
        'Los videos que ya estaban asignados a este caso quedarán sin clasificar. ¿Continuar?',
      confirmText: 'Eliminar',
    })
    if (!confirmed) return false

    return persistCases(
      journeyCases.value.filter((c) => c.casoNumero !== casoNumero),
      'Caso eliminado.'
    )
  }

  // ── Brand strategy wizard ───────────────────────────────────────────────
  async function saveWizard(data: WizardPayload) {
    Object.assign(profile.value, data)

    isSavingProfile.value = true
    try {
      await brandProfileService.upsert(workspaceId.value, profile.value)
      toast.success('¡Estrategia de marca guardada con éxito!')
      return true
    } catch {
      toast.error('Error al guardar la estrategia de marca.')
      return false
    } finally {
      isSavingProfile.value = false
    }
  }

  // ── Video items ─────────────────────────────────────────────────────────
  /** Each item knows which planning holds it, so updates target the right doc. */
  async function saveItem(item: WorkspaceVideoItem, payload: CreateVideoItemPayload) {
    if (!item.planningId) return false
    isSavingItem.value = true
    try {
      await videoPlanningService.updateItem(item.planningId, item._id, payload)
      await refreshItems()
      toast.success('Guion actualizado.')
      return true
    } catch {
      toast.error('Error al guardar guion.')
      return false
    } finally {
      isSavingItem.value = false
    }
  }

  async function refreshItems() {
    items.value = await videoPlanningService.getWorkspaceItems(workspaceId.value).catch(() => items.value)
  }

  /** A linked reel changes one planning; reload so every tab agrees. */
  function applyLinkedReel() {
    refreshItems()
  }

  return {
    loading,
    hasLoaded,
    workspace,
    profile,
    items,
    isSavingItem,
    isSavingProfile,
    savingCase,
    totalScripts,
    totalLinkedReels,
    totalViews,
    totalAdSpend,
    journeyCases,
    nextCaseNumber,
    load,
    saveCase,
    deleteCase,
    saveWizard,
    saveItem,
    applyLinkedReel,
  }
}
