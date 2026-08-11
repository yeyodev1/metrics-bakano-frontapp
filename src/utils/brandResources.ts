import type { Resource } from '@/types'

/**
 * Reglas de los recursos de marca, en un solo lugar.
 *
 * Antes vivían duplicadas en ResourcesView y en useBrandResources con valores
 * distintos (10 MB vs 25 MB, PDF aceptado en una y no en la otra), así que el
 * mismo archivo pasaba o fallaba según desde qué pantalla se subiera.
 */
export type ResourceCategory = 'logo' | 'linea_grafica' | 'catalogo'

export const IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]

export const ACCEPTED: Record<ResourceCategory, string[]> = {
  logo: IMAGE_TYPES,
  linea_grafica: [...IMAGE_TYPES, 'application/pdf'],
  catalogo: [...IMAGE_TYPES, 'application/pdf', 'text/plain'],
}

export const LABELS: Record<ResourceCategory, string> = {
  logo: 'logo',
  linea_grafica: 'línea gráfica',
  catalogo: 'catálogo',
}

export const MAX_MB = 25

/** Atributo `accept` del input, derivado de la misma lista que valida. */
export function acceptFor(categoria: ResourceCategory): string {
  return ACCEPTED[categoria].join(',')
}

/**
 * Motivo por el que un archivo no se puede subir, o null si sí se puede.
 * Devolver el motivo (y no un booleano) obliga a mostrárselo a la persona.
 */
export function rejectionReason(file: File, categoria: ResourceCategory): string | null {
  if (!ACCEPTED[categoria].includes(file.type)) {
    const allowed = categoria === 'logo' ? 'una imagen' : 'una imagen o un PDF'
    const tipo = file.type || 'de tipo desconocido'
    return `El ${LABELS[categoria]} debe ser ${allowed}. "${file.name}" es ${tipo}.`
  }

  if (file.size > MAX_MB * 1024 * 1024) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `"${file.name}" pesa ${mb} MB y el máximo es ${MAX_MB} MB.`
  }

  return null
}

/**
 * Los catálogos históricos se guardaron como 'otro' desde la vista de recursos,
 * mientras el perfil de marca escribía 'catalogo'. Eran dos pantallas sobre el
 * mismo workspace que no se veían entre sí. Se escribe 'catalogo' de aquí en
 * adelante y se leen las dos, para no perder lo ya subido.
 */
export function isCatalog(resource: Resource): boolean {
  return resource.categoria === 'catalogo' || resource.categoria === 'otro'
}

export function isImage(resource: Resource): boolean {
  return resource.tipo.startsWith('image/')
}

export function isPdf(resource: Resource): boolean {
  return resource.tipo === 'application/pdf'
}

export function isText(resource: Resource): boolean {
  return resource.tipo.startsWith('text/')
}

export function fileIcon(resource: Resource): string {
  if (isPdf(resource)) return 'fa-solid fa-file-pdf'
  if (isText(resource)) return 'fa-solid fa-file-lines'
  if (isImage(resource)) return 'fa-solid fa-image'
  return 'fa-solid fa-file'
}

export function extensionOf(nombre: string): string {
  const parts = nombre.split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'ARCHIVO'
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}
