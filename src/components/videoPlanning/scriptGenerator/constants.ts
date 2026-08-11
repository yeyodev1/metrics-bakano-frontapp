import type { TipoGuion, ObjetivoGuion, GuionIA } from '@/types/videoPlanning'

export interface TipoGuionInfo {
  label: string
  color: string
  icon: string
  desc: string
}

export const TIPO_GUION_INFO: Record<TipoGuion, TipoGuionInfo> = {
  TOFU: {
    label: 'Educativo',
    color: '#3b82f6',
    icon: 'fa-solid fa-lightbulb',
    desc: 'Top of Funnel — alcance y viralidad. Ganchos agresivos, derribo de mitos, educación rápida. Objetivo: que te conozcan.',
  },
  MOFU: {
    label: 'Creación de Valor',
    color: '#8b5cf6',
    icon: 'fa-solid fa-heart-pulse',
    desc: 'Middle of Funnel — confianza. Ayuda al usuario a identificar que tiene un problema y que tú eres el experto que sabe resolverlo.',
  },
  BOFU: {
    label: 'Venta',
    color: '#ef4444',
    icon: 'fa-solid fa-fire',
    desc: 'Bottom of Funnel — venta directa. CTA claros hacia WhatsApp o agenda. Basado en la oferta especial del mes.',
  },
}

export const TIPO_GUION_VALUES: readonly TipoGuion[] = ['TOFU', 'MOFU', 'BOFU'] as const

export interface ObjetivoOption {
  value: ObjetivoGuion
  label: string
  icon: string
  desc: string
}

/**
 * Where the script will run. Independent from the funnel stage — the backend
 * builds a different prompt for each.
 */
export const OBJETIVO_OPTIONS: ObjetivoOption[] = [
  {
    value: 'feed',
    label: 'Feed',
    icon: 'fa-solid fa-house',
    desc: 'Orgánico. Ya te conocen: construye relación, CTA suave.',
  },
  {
    value: 'anuncio',
    label: 'Anuncio',
    icon: 'fa-solid fa-bullhorn',
    desc: 'Pauta. No te conocen: gancho en 2 seg, CTA directo.',
  },
]

export const TONE_PRESETS = [
  'Profesional',
  'Cercano',
  'Divertido',
  'Aspiracional',
  'Educativo',
  'Inspirador',
] as const

/** Order in which generated fields are revealed. */
export const FIELD_KEYS: (keyof GuionIA)[] = [
  'conceptoVisual',
  'gancho',
  'textoPantalla',
  'cuerpo',
  'cta',
  'broll',
]

export function inferTipoGuion(numero: number): TipoGuion {
  const mod = ((numero - 1) % 3) + 1
  if (mod === 1) return 'TOFU'
  if (mod === 2) return 'MOFU'
  return 'BOFU'
}
