import type { WorkspaceVideoItem } from '@/types/videoPlanning'

/**
 * Cómo llegó este guion al mundo real.
 *
 * Un video puede existir solo como publicación orgánica, solo como anuncio
 * pautado, o como las dos cosas (un reel que además se impulsó). Tratar
 * "vinculado" como sinónimo de `igMediaId` dejaba a los guiones pautados
 * contados como pendientes para siempre, aunque ya tuvieran métricas de Ads.
 */
export type LinkKind = 'reel' | 'ad' | 'both' | null

export interface LinkableItem {
  igMediaId?: string | null
  metaAdId?: string | null
}

export function linkKind(item: LinkableItem): LinkKind {
  const reel = !!item.igMediaId
  const ad = !!item.metaAdId
  if (reel && ad) return 'both'
  if (reel) return 'reel'
  if (ad) return 'ad'
  return null
}

export function isLinked(item: LinkableItem): boolean {
  return linkKind(item) !== null
}

interface KindStyle {
  label: string
  short: string
  icon: string
  /** Clave de color; el CSS de cada componente la mapea a su paleta. */
  tone: 'reel' | 'ad' | 'both'
}

const STYLES: Record<'reel' | 'ad' | 'both', KindStyle> = {
  reel: {
    label: 'Reel orgánico',
    short: 'Orgánico',
    icon: 'fa-brands fa-instagram',
    tone: 'reel',
  },
  ad: {
    label: 'Anuncio pautado',
    short: 'Pautado',
    icon: 'fa-solid fa-bullhorn',
    tone: 'ad',
  },
  both: {
    label: 'Orgánico + pautado',
    short: 'Ambos',
    icon: 'fa-solid fa-layer-group',
    tone: 'both',
  },
}

export function linkStyle(item: LinkableItem): KindStyle | null {
  const kind = linkKind(item)
  return kind ? STYLES[kind] : null
}

/** Contadores para las barras de progreso de la matriz. */
export function countByKind(items: LinkableItem[]) {
  let reel = 0
  let ad = 0
  let both = 0

  for (const item of items) {
    const kind = linkKind(item)
    if (kind === 'reel') reel++
    else if (kind === 'ad') ad++
    else if (kind === 'both') both++
  }

  return { reel, ad, both, linked: reel + ad + both, pending: items.length - reel - ad - both }
}

/** Solo el reel orgánico tiene permalink público en Instagram. */
export function hasPublicPermalink(item: WorkspaceVideoItem): boolean {
  return !!item.igPermalink
}
