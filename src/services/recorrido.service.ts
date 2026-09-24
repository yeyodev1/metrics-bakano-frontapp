import APIBase from './httpBase'

/**
 * El recorrido del cliente: las 12 etapas que van de la bienvenida a la
 * salida a ventas. Solo las manuales se pueden marcar; las demás las mueve
 * el propio sistema con los datos.
 */
export type EstadoEtapa = 'pendiente' | 'en_curso' | 'listo' | 'no_aplica'

export interface EtapaCliente {
  etapa: string
  orden: number
  etiqueta: string
  emoji: string
  que: string
  deQuien: 'cliente' | 'equipo'
  responsable?: string
  responsableEmail?: string
  seMarca: 'automatico' | 'manual'
  estado: EstadoEtapa
  detalle?: string
  porNombre?: string
  en?: string
  nota?: string
}

export interface Recorrido {
  etapas: EtapaCliente[]
  actual?: string
  listas: number
}

class RecorridoService extends APIBase {
  async ver(workspaceId: string): Promise<Recorrido> {
    const res = await this.get<Recorrido>(`recorrido/${workspaceId}`)
    return res.data
  }

  async marcar(workspaceId: string, etapa: string, body: { estado: EstadoEtapa; nota?: string }): Promise<Recorrido> {
    const res = await this.patch<Recorrido>(`recorrido/${workspaceId}/${etapa}`, body)
    return res.data
  }
}

export const recorridoService = new RecorridoService()
