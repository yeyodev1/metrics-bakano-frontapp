import APIBase from './httpBase'

export type GravedadIncidente = 'molesto' | 'angustiado' | 'en_peligro'
export type EstadoIncidente = 'abierto' | 'tomado' | 'cerrado'

export interface EventoIncidente {
  accion: 'abierto' | 'asignado' | 'tomado' | 'cerrado' | 'reabierto' | 'recordatorio' | 'nota'
  porNombre: string
  detalle?: string
  en: string
}

export interface PersonaEquipo {
  _id: string
  name?: string
  email: string
  internalRole?: string
}

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
  asignadoA?: { nombre: string; email: string; en: string; porNombre: string }
  historial?: EventoIncidente[]
  tomadoPor?: { nombre: string; en: string }
  cerradoPor?: { nombre: string; en: string }
  nota?: string
  createdAt: string
}

class IncidenteService extends APIBase {
  async listar(
    filtros: { estado?: string; mios?: boolean; buscar?: string; pagina?: number; limite?: number } = {},
  ): Promise<{ incidentes: Incidente[]; abiertos: number; total: number; pagina: number; paginas: number }> {
    const params = new URLSearchParams()
    if (filtros.estado) params.set('estado', filtros.estado)
    if (filtros.mios) params.set('mios', 'true')
    if (filtros.buscar) params.set('buscar', filtros.buscar)
    if (filtros.pagina) params.set('pagina', String(filtros.pagina))
    if (filtros.limite) params.set('limite', String(filtros.limite))
    const res = await this.get<{
      incidentes: Incidente[]
      abiertos: number
      total: number
      pagina: number
      paginas: number
    }>(`incidentes?${params.toString()}`)
    return res.data
  }

  async equipo(): Promise<PersonaEquipo[]> {
    const res = await this.get<{ equipo: PersonaEquipo[] }>('incidentes/equipo')
    return res.data.equipo
  }

  async asignar(id: string, userId: string, nota?: string): Promise<Incidente> {
    const res = await this.patch<{ incidente: Incidente }>(`incidentes/${id}/asignar`, { userId, nota })
    return res.data.incidente
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
