/** Fechas de la vista de integraciones, en hora de Ecuador y en español. */

export function fechaHoraEs(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Guayaquil',
  }).format(new Date(value))
}

/** Hoy en Ecuador como `YYYY-MM-DD` (en-CA ya formatea así). */
export function hoyEcuador() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date())
}

/** Suma días a una fecha `YYYY-MM-DD` sin que la zona horaria la mueva. */
export function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Días entre dos fechas `YYYY-MM-DD`, contando ambas puntas. */
export function diasEntre(desde: string, hasta: string) {
  const ms = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)
  return Math.round(ms / 86400000) + 1
}

/** Monto en dólares, sin decimales si es redondo. */
export function montoUsd(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)
}
