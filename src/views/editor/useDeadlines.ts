import { computed, type Ref } from 'vue'
import type { VideoItem } from '@/types/videoPlanning'

const DIA = 86_400_000

export interface Deadline {
  texto: string
  urgente: boolean
  estimado: boolean
}

/**
 * Fecha limite por video. Con fechaPublicacion manda esa fecha (el video se
 * edita ANTES de publicarse). Sin fecha se estima: los pendientes se
 * reparten parejo entre hoy y fin de mes, en su orden — mejor un "mas o
 * menos" visible que ninguna presion de tiempo.
 */
export function useDeadlines(paraEditar: Ref<VideoItem[]>) {
  return computed(() => {
    const map = new Map<string, Deadline>()
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    const diasRestantes = Math.max(1, Math.round((finMes.getTime() - hoy.getTime()) / DIA))

    const sinFecha = paraEditar.value.filter(i => !i.fechaPublicacion)
    const paso = diasRestantes / Math.max(1, sinFecha.length)

    const etiqueta = (fecha: Date, estimado: boolean): Deadline => {
      const dia = new Date(fecha)
      dia.setHours(0, 0, 0, 0)
      const diff = Math.round((dia.getTime() - hoy.getTime()) / DIA)
      const corta = fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
      if (diff < 0) return { texto: `Venció hace ${-diff} d`, urgente: true, estimado }
      if (diff === 0) return { texto: 'Listo HOY', urgente: true, estimado }
      if (diff <= 2) return { texto: `Listo en ${diff} d`, urgente: true, estimado }
      return { texto: `Listo para el ${corta}`, urgente: false, estimado }
    }

    for (const item of paraEditar.value) {
      if (item.fechaPublicacion) {
        // Un dia antes de publicar: el cliente necesita margen para revisarlo.
        const limite = new Date(new Date(item.fechaPublicacion).getTime() - DIA)
        map.set(item._id, etiqueta(limite, false))
      }
    }
    sinFecha.forEach((item, i) => {
      const limite = new Date(hoy.getTime() + Math.ceil((i + 1) * paso) * DIA)
      map.set(item._id, etiqueta(limite, true))
    })
    return map
  })
}
