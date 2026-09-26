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
