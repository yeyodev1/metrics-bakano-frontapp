import { ref, computed, watch, onMounted, type Ref } from 'vue'
import { brandProfileService } from '@/services/brandProfile.service'
import type { VideoItem, GuionIA, TipoGuion, ObjetivoGuion } from '@/types/videoPlanning'
import { FIELD_KEYS } from './constants'

/** Delay between each generated field appearing, in ms. */
const REVEAL_STEP_MS = 220

export interface UseScriptGenerationOptions {
  item: Ref<VideoItem | null>
  workspaceId: Ref<string>
  tema: Ref<string | undefined>
  tipo: Ref<string | undefined>
  hasBrandProfile: Ref<boolean>
  tipoGuion: Ref<TipoGuion>
  objetivo: Ref<ObjetivoGuion>
}

/**
 * Owns everything about producing a script: LLM availability, the monthly
 * context, the request itself, and the staggered reveal of the result.
 */
export function useScriptGeneration(options: UseScriptGenerationOptions) {
  const generating = ref(false)
  const error = ref<string | null>(null)

  const llmStatus = ref<{ available: boolean; model: string; error?: string } | null>(null)
  const llmChecking = ref(true)

  onMounted(async () => {
    try {
      llmStatus.value = await brandProfileService.getLLMStatus()
    } catch {
      llmStatus.value = {
        available: false,
        model: '',
        error: 'No se pudo verificar disponibilidad de IA',
      }
    } finally {
      llmChecking.value = false
    }
  })

  const contextoMes = ref({
    productoMes: '',
    ofertaEspecial: '',
    referenciasAdicionales: '',
  })

  const localGuionIA = ref<GuionIA | null>(options.item.value?.guionIA ?? null)

  // Fields appear one by one so the result reads as it is written.
  const visibleFieldCount = ref(options.item.value?.guionIA?.gancho ? FIELD_KEYS.length : 0)
  let revealTimer: ReturnType<typeof setTimeout> | null = null

  watch(localGuionIA, (val) => {
    if (revealTimer) clearTimeout(revealTimer)
    if (!val?.gancho) return

    visibleFieldCount.value = 0
    let i = 0
    const reveal = () => {
      if (i >= FIELD_KEYS.length) return
      visibleFieldCount.value = i + 1
      i++
      revealTimer = setTimeout(reveal, REVEAL_STEP_MS)
    }
    revealTimer = setTimeout(reveal, 100)
  })

  // Switching to another item must not keep showing the previous script.
  watch(options.item, (item) => {
    localGuionIA.value = item?.guionIA ?? null
    visibleFieldCount.value = item?.guionIA?.gancho ? FIELD_KEYS.length : 0
  })

  const hasExistingScript = computed(() => !!localGuionIA.value?.gancho)
  const canGenerate = computed(
    () => options.hasBrandProfile.value && !!llmStatus.value?.available && !llmChecking.value
  )

  function isFieldVisible(index: number) {
    return visibleFieldCount.value > index
  }

  /** Options awaiting a human pick. Nothing is saved while these are open. */
  const variants = ref<Array<GuionIA & { angulo?: string }>>([])
  const variantContext = ref<any | null>(null)

  function discardVariants() {
    variants.value = []
    variantContext.value = null
  }

  /**
   * Ask for several takes on the same brief and let the writer choose.
   * Only available in edit mode, where there is an item to save onto.
   */
  async function generateVariants(count = 3): Promise<boolean> {
    if (!canGenerate.value || !options.item.value?._id) return false

    generating.value = true
    error.value = null
    try {
      const res = await brandProfileService.generateScript(
        options.item.value._id,
        {
          productoMes: contextoMes.value.productoMes || undefined,
          ofertaEspecial: contextoMes.value.ofertaEspecial || undefined,
          referenciasAdicionales: contextoMes.value.referenciasAdicionales || undefined,
        },
        options.tipoGuion.value,
        options.objetivo.value,
        count
      )
      variants.value = res.opciones ?? []
      variantContext.value = res.contexto ?? null
      return variants.value.length > 0
    } catch (err: any) {
      error.value = err?.message || 'No fue posible generar las versiones.'
      return false
    } finally {
      generating.value = false
    }
  }

  async function generate(): Promise<GuionIA | null> {
    if (!canGenerate.value) return null

    generating.value = true
    error.value = null
    try {
      const ctx = {
        productoMes: contextoMes.value.productoMes || undefined,
        ofertaEspecial: contextoMes.value.ofertaEspecial || undefined,
        referenciasAdicionales: contextoMes.value.referenciasAdicionales || undefined,
      }

      let res
      if (options.item.value?._id) {
        // Edit mode: the backend saves the result onto the existing item.
        res = await brandProfileService.generateScript(
          options.item.value._id,
          ctx,
          options.tipoGuion.value,
          options.objetivo.value
        )
      } else {
        const temaTopic = options.tema.value ?? ''
        if (!temaTopic.trim()) {
          error.value = 'Escribe el tema del video antes de generar el guión.'
          return null
        }
        res = await brandProfileService.generateScriptQuick(
          options.workspaceId.value,
          temaTopic,
          options.tipo.value,
          ctx,
          options.tipoGuion.value,
          options.objetivo.value
        )
      }

      localGuionIA.value = res.guionIA
      return res.guionIA
    } catch (err: unknown) {
      // APIBase rethrows a flat { status, message, data } object.
      const e = err as { message?: string }
      error.value = e?.message || 'Error al generar el guión. Intenta de nuevo.'
      return null
    } finally {
      generating.value = false
    }
  }

  return {
    generating,
    error,
    llmStatus,
    llmChecking,
    contextoMes,
    localGuionIA,
    hasExistingScript,
    canGenerate,
    isFieldVisible,
    generate,
    variants,
    variantContext,
    generateVariants,
    discardVariants,
    /** Adopt an edited variant as the item's script. */
    applyVariant(guion: GuionIA) {
      localGuionIA.value = { ...guion }
      discardVariants()
    },
  }
}
