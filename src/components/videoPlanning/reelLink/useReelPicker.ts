import { ref, computed, type Ref } from 'vue'
import { videoPlanningService } from '@/services/videoPlanning.service'
import { useToast } from '@/composables/useToast'
import type { VideoItem } from '@/types/videoPlanning'

/** Reels arrive a page at a time; the whole feed took ~9s on large accounts. */
export const PAGE_SIZE = 10

/** A reel is "likely" when it was published within this many days of the plan. */
const MATCH_WINDOW_DAYS = 2

export function reelDate(reel: any): Date | null {
  if (!reel?.timestamp) return null
  const date = new Date(reel.timestamp)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatReelDate(reel: any): string {
  const date = reelDate(reel)
  if (!date) return 'Sin fecha'
  return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: '2-digit' })
}

export const formatCount = (n: number) => new Intl.NumberFormat('es-EC').format(n ?? 0)

/**
 * Loading, filtering and ranking of the published reels offered for linking.
 */
export function useReelPicker(options: {
  workspaceId: Ref<string>
  item: Ref<VideoItem | null>
  allItems: Ref<VideoItem[] | undefined>
}) {
  const toast = useToast()

  const reels = ref<any[]>([])
  const nextCursor = ref<string | null>(null)
  const loading = ref(false)
  const loadingMore = ref(false)

  const search = ref('')
  const onlyUnlinked = ref(true)

  async function fetch(append = false) {
    if (!options.workspaceId.value) return

    if (append) loadingMore.value = true
    else {
      loading.value = true
      reels.value = []
      nextCursor.value = null
    }

    try {
      const page = await videoPlanningService.getPublishedReelsForWorkspace(
        options.workspaceId.value,
        { limit: PAGE_SIZE, after: append ? nextCursor.value ?? undefined : undefined }
      )
      reels.value = append ? [...reels.value, ...page.reels] : page.reels
      nextCursor.value = page.nextCursor
    } catch {
      toast.error('No se pudieron cargar los Reels de Instagram.')
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  /** igMediaId → the script number that already claims it. */
  const linkedElsewhere = computed(() => {
    const map = new Map<string, number>()
    for (const other of options.allItems.value ?? []) {
      if (!other.igMediaId) continue
      if (options.item.value && other._id === options.item.value._id) continue
      map.set(other.igMediaId, other.numero)
    }
    return map
  })

  /**
   * The team schedules a script, then publishes it, so the reel closest to the
   * planned date is almost always the right one. A hint only — never an
   * automatic link.
   */
  function isLikelyMatch(reel: any): boolean {
    const planned = options.item.value?.fechaPublicacion
    const date = reelDate(reel)
    if (!planned || !date) return false

    const days = Math.round(
      Math.abs(date.getTime() - new Date(planned).getTime()) / 86_400_000
    )
    return days <= MATCH_WINDOW_DAYS && !linkedElsewhere.value.has(reel.id)
  }

  const visibleReels = computed(() => {
    const term = search.value.trim().toLowerCase()

    const filtered = reels.value.filter((r) => {
      if (onlyUnlinked.value && linkedElsewhere.value.has(r.id)) return false
      if (!term) return true
      return (r.caption || '').toLowerCase().includes(term) || String(r.id).includes(term)
    })

    // Likely matches first, then newest — what they want is in the first few.
    return filtered.sort((a, b) => {
      const matchDiff = Number(isLikelyMatch(b)) - Number(isLikelyMatch(a))
      if (matchDiff !== 0) return matchDiff
      return (reelDate(b)?.getTime() ?? 0) - (reelDate(a)?.getTime() ?? 0)
    })
  })

  const hiddenCount = computed(() => reels.value.length - visibleReels.value.length)

  /** How many loaded reels are already claimed by another script. */
  const linkedInPageCount = computed(
    () => reels.value.filter((r) => linkedElsewhere.value.has(r.id)).length
  )

  return {
    reels,
    nextCursor,
    loading,
    loadingMore,
    search,
    onlyUnlinked,
    linkedElsewhere,
    visibleReels,
    hiddenCount,
    linkedInPageCount,
    isLikelyMatch,
    fetch,
  }
}
