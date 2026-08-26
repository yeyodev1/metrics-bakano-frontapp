import { nombreMes } from './format'

export interface OpcionMes {
  valor: string
  etiqueta: string
}

/**
 * El mes corriente en Ecuador. En la madrugada UTC el navegador del equipo ya
 * estaría en el mes siguiente y el selector abriría en el mes equivocado.
 */
export function mesActualEc(): { year: number; month: number } {
  const ahora = new Date(Date.now() - 5 * 60 * 60 * 1000)
  return { year: ahora.getUTCFullYear(), month: ahora.getUTCMonth() + 1 }
}

export function claveMes(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseClaveMes(clave: string): { year: number; month: number } {
  const [year, month] = clave.split('-').map(Number)
  return { year, month }
}

/**
 * Meses que se pueden elegir al definir una meta.
 *
 * Hacia atrás para cerrar un mes que quedó sin meta, y hacia adelante para
 * dejar la meta puesta antes de que empiece el mes.
 */
export function opcionesMes(atras = 6, adelante = 12): OpcionMes[] {
  const { year, month } = mesActualEc()
  const opciones: OpcionMes[] = []

  for (let offset = -atras; offset <= adelante; offset++) {
    // Date normaliza el desborde de mes, así que diciembre + 1 cae en enero.
    const d = new Date(Date.UTC(year, month - 1 + offset, 1))
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1

    let etiqueta = `${nombreMes(m)} ${y}`
    if (offset === 0) etiqueta += ' · este mes'
    else if (offset === 1) etiqueta += ' · el próximo'

    opciones.push({ valor: claveMes(y, m), etiqueta })
  }

  return opciones
}
