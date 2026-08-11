import { computed, type Ref } from 'vue'
import type { WorkspaceVideoItem } from '@/types/videoPlanning'

export interface ScriptGroup {
  key: string
  label: string
  items: WorkspaceVideoItem[]
  linked: number
  /** True when the group's date came from the planning, not a real publish date. */
  approximate: boolean
}

/** Publish date when there is one, otherwise the planning's own date. */
export function itemDate(item: WorkspaceVideoItem): Date | null {
  const raw = item.fechaPublicacion ?? item.planningCreatedAt
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Group scripts by month, newest first.
 *
 * A flat grid of 98 equal cards gives no sense of when anything happened;
 * months turn the same list into a timeline the team already thinks in.
 */
export function useScriptGroups(items: Ref<WorkspaceVideoItem[]>) {
  return computed<ScriptGroup[]>(() => {
    const buckets = new Map<string, WorkspaceVideoItem[]>()

    for (const item of items.value) {
      const date = itemDate(item)
      const key = date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : 'sin-fecha'

      const list = buckets.get(key) ?? []
      list.push(item)
      buckets.set(key, list)
    }

    const groups: ScriptGroup[] = []
    for (const [key, groupItems] of buckets) {
      let label = 'Sin fecha'
      if (key !== 'sin-fecha') {
        const [year, month] = key.split('-').map(Number)
        const raw = new Date(year, month - 1, 1).toLocaleDateString('es-EC', {
          month: 'long',
          year: 'numeric',
        })
        label = raw.charAt(0).toUpperCase() + raw.slice(1)
      }

      groups.push({
        key,
        label,
        items: groupItems,
        linked: groupItems.filter((i) => !!i.igMediaId).length,
        // Only flagged when no item in the month has a real publish date.
        approximate: groupItems.every((i) => !i.fechaPublicacion),
      })
    }

    // Undated scripts sink to the bottom; everything else newest first.
    return groups.sort((a, b) => {
      if (a.key === 'sin-fecha') return 1
      if (b.key === 'sin-fecha') return -1
      return b.key.localeCompare(a.key)
    })
  })
}
