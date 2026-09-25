/**
 * El mes que se ve en pantalla, no el mes del almanaque.
 *
 * Una semana no se parte porque cambie el mes: la del 28 de septiembre al 4 de
 * octubre es una sola semana de trabajo y las producciones de los dos meses
 * tienen que verse juntas. Antes esos días salían en blanco y una grabación
 * del 30 de septiembre desaparecía de la vista de octubre.
 */

/** Lunes de la semana en la que cae esa fecha. */
export function lunesDeLaSemana(fecha: Date): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const dia = d.getDay()
  const alLunes = dia === 0 ? 6 : dia - 1
  d.setDate(d.getDate() - alLunes)
  return d
}

/**
 * Desde el lunes de la primera semana del mes hasta el domingo de la última:
 * exactamente lo que ocupa la grilla.
 */
export function rangoVisibleDelMes(mes: Date): { inicio: Date; fin: Date } {
  const primero = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const ultimo = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)

  const inicio = lunesDeLaSemana(primero)
  const fin = lunesDeLaSemana(ultimo)
  fin.setDate(fin.getDate() + 6)
  fin.setHours(23, 59, 59, 999)
  return { inicio, fin }
}

/** Todos los días de la grilla, incluidos los del mes anterior y el siguiente. */
export function diasDeLaGrilla(mes: Date): Date[] {
  const { inicio, fin } = rangoVisibleDelMes(mes)
  const dias: Date[] = []
  const cursor = new Date(inicio)
  while (cursor <= fin) {
    dias.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dias
}
