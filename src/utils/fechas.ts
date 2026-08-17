/**
 * Formateo de fechas a prueba de formatos mixtos.
 *
 * `fechaPublicacion` llega a veces como `YYYY-MM-DD` (inputs de formulario) y a
 * veces como ISO completo con hora UTC (documentos que vienen del API).
 * Concatenar `'T12:00:00'` a un ISO completo producía "Invalid Date" en
 * pantalla. Aquí se detecta el formato, y si la fecha no se puede leer se
 * devuelve cadena vacía: el chip no se muestra, pero jamás se pinta texto roto.
 */
export function fechaLegible(
  valor: string | Date | null | undefined,
  opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
  locale = 'es-EC',
): string {
  if (!valor) return ''

  let fecha: Date
  if (valor instanceof Date) {
    fecha = valor
    opciones = { timeZone: 'America/Guayaquil', ...opciones }
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    // Fecha sin hora: anclada a mediodía local para que no se corra un día.
    fecha = new Date(`${valor}T12:00:00`)
  } else {
    fecha = new Date(valor)
    // ISO con hora UTC: se muestra en hora de Ecuador (sin horario de verano),
    // no en la del navegador de quien mire.
    opciones = { timeZone: 'America/Guayaquil', ...opciones }
  }

  return isNaN(fecha.getTime()) ? '' : fecha.toLocaleDateString(locale, opciones)
}
