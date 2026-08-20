/** Formato compartido del portal de suscripción (vista + subcomponentes). */

export function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(value || 0)
}

export function dateEs(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value)
  )
}

export function periodEs(period: string) {
  const [year, month] = period.split('-').map(Number)
  const label = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(
    new Date(year, (month || 1) - 1, 1)
  )
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Cloudinary sirve los PDF bajo /raw/ o con extensión; el resto son imagen. */
export function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url) || /\/image\/upload\//i.test(url)
}
