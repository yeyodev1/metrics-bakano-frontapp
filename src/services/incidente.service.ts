import APIBase from './httpBase'

export type GravedadIncidente = 'molesto' | 'angustiado' | 'en_peligro'
export type EstadoIncidente = 'abierto' | 'tomado' | 'cerrado'

export interface Incidente {
  _id: string
  workspaceId: string
  workspaceName: string
  origen: 'telegram'
  gravedad: GravedadIncidente
  tema: string
  responsableNombre?: string
  responsableEmail?: string
  cliente?: { nombre?: string; email?: string; telegram?: string }
  frase: string
  motivo?: string
  recomendacion?: string
  mensajeCompleto?: string
  fueraDeHorario: boolean
  estado: EstadoIncidente
  tomadoPor?: { nombre: string; en: string }
  cerradoPor?: { nombre: string; en: string }
  nota?: string
  createdAt: string
}

class IncidenteService extends APIBase {
  async listar(filtros: { estado?: string; mios?: boolean } = {}): Promise<{ incidentes: Incidente[]; abiertos: number }> {
    const params = new URLSearchParams()
    if (filtros.estado) params.set('estado', filtros.estado)
    if (filtros.mios) params.set('mios', 'true')
    const res = await this.get<{ incidentes: Incidente[]; abiertos: number }>(`incidentes?${params.toString()}`)
    return res.data
  }

  async uno(id: string): Promise<Incidente> {
    const res = await this.get<{ incidente: Incidente }>(`incidentes/${id}`)
    return res.data.incidente
  }

  async tomar(id: string): Promise<Incidente> {
    const res = await this.patch<{ incidente: Incidente }>(`incidentes/${id}/tomar`, {})
    return res.data.incidente
  }

  async cerrar(id: string, nota?: string): Promise<Incidente> {
    const res = await this.patch<{ incidente: Incidente }>(`incidentes/${id}/cerrar`, { nota })
    return res.data.incidente
  }
}

export const incidenteService = new IncidenteService()
