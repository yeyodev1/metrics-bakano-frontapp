import { computed, type Ref } from 'vue'
import { isLinked } from '@/utils/videoLink'
import type { WorkspaceVideoItem } from '@/types/videoPlanning'

export const SIN_FECHA = 'sin-fecha'

export interface ScriptGroup {
  key: string
  label: string
  items: WorkspaceVideoItem[]
  linked: number
  /** El apartado de los que todavía no tienen fecha de publicación. */
  sinFecha: boolean
}

/**
 * La fecha de publicación y ninguna otra.
 *
 * Antes, si faltaba, se usaba la fecha de creación de la planificación: el
 * guion aparecía bajo un mes como si estuviera agendado, cuando en realidad
 * nadie había decidido cuándo sale. Ese mes prestado escondía justo el trabajo
 * pendiente.
 */
export function itemDate(item: WorkspaceVideoItem): Date | null {
  const raw = item.fechaPublicacion
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
        : SIN_FECHA

      const list = buckets.get(key) ?? []
      list.push(item)
      buckets.set(key, list)
    }

    const groups: ScriptGroup[] = []
    for (const [key, groupItems] of buckets) {
      let label = 'Todavía sin fecha definida'
      if (key !== SIN_FECHA) {
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
        linked: groupItems.filter(isLinked).length,
        sinFecha: key === SIN_FECHA,
      })
    }

    // Los que no tienen fecha van primero: son los que bloquean el aviso al
    // cliente, así que enterrarlos al final era esconder lo único accionable.
    return groups.sort((a, b) => {
      if (a.key === SIN_FECHA) return -1
      if (b.key === SIN_FECHA) return 1
      return b.key.localeCompare(a.key)
    })
  })
}
