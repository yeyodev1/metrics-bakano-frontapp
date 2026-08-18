import APIBase from './httpBase'

export type FlagColor = 'verde' | 'amarillo' | 'rojo'
export type EtapaRevision = 'contenido' | 'edicion'

export interface StageStats {
  aprobados: number
  rechazados: number
  total: number
  pct: number | null
  flag: FlagColor | null
}

export interface ClientFlags {
  workspaceId: string
  nombre: string
  isActive: boolean
  contenido: StageStats
  edicion: StageStats
}

export interface CollaboratorFlags extends StageStats {
  userId: string | null
  nombre: string
  rol: 'content' | 'editor'
  etapa: EtapaRevision
}

export interface CollaboratorDetail extends StageStats {
  colaborador: { userId: string; nombre: string; internalRole?: string }
  porCliente: Array<{ workspaceId: string; nombre: string; rechazados: number }>
  motivos: Array<{ categoria: string; count: number; ejemplos: string[] }>
  eventosRecientes: Array<{
    videoTema?: string
    etapa: EtapaRevision
    resultado: 'aprobado' | 'rechazado'
    fuente: 'interno' | 'cliente'
    motivo?: string
    motivoCategoria?: string
    cliente: string
    fecha: string
  }>
}

export const MOTIVO_LABELS: Record<string, string> = {
  ortografia: 'Faltas de ortografía',
  tono_incorrecto: 'Tono incorrecto',
  gancho_debil: 'Gancho débil',
  estructura: 'No sigue la estructura',
  informacion_incorrecta: 'Información incorrecta',
  calidad_video: 'Calidad de video',
  ritmo_edicion: 'Ritmo de edición',
  audio_musica: 'Audio / música',
  subtitulos: 'Subtítulos',
  otro: 'Otro',
}

interface Period {
  from?: string
  to?: string
}

function periodParams(period: Period): Record<string, string> {
  const params: Record<string, string> = {}
  if (period.from) params['from'] = period.from
  if (period.to) params['to'] = period.to
  return params
}

class FlagsService extends APIBase {
  async getClientFlags(period: Period = {}): Promise<ClientFlags[]> {
    const res = await this.get<{ clientes: ClientFlags[] }>('flags/clients', undefined, {
      params: periodParams(period),
    })
    return res.data.clientes
  }

  async getCollaboratorFlags(period: Period = {}): Promise<CollaboratorFlags[]> {
    const res = await this.get<{ colaboradores: CollaboratorFlags[] }>(
      'flags/collaborators',
      undefined,
      { params: periodParams(period) },
    )
    return res.data.colaboradores
  }

  async getCollaboratorDetail(
    userId: string,
    options: Period & { etapa?: EtapaRevision } = {},
  ): Promise<CollaboratorDetail> {
    const params = periodParams(options)
    if (options.etapa) params['etapa'] = options.etapa
    const res = await this.get<CollaboratorDetail>(`flags/collaborators/${userId}`, undefined, {
      params,
    })
    return res.data
  }
}

export const flagsService = new FlagsService()
