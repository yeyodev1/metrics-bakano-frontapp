import APIBase from './httpBase'

export type PasoOnboarding = 'meta' | 'crm' | 'estrategia' | 'produccion'
export type EstadoPaso = 'pendiente' | 'agendada' | 'cumplida' | 'bloqueada' | 'no_aplica'

export interface PasoProgreso {
  paso: PasoOnboarding
  etiqueta: string
  responsable: string
  estado: EstadoPaso
  fecha?: string
  motivo?: string
  nota?: string
  pendienteDelCliente?: string
  actualizadoPorNombre?: string
  actualizadoEn?: string
}

export interface ProgresoEntorno {
  workspaceId: string
  entorno: string
  pasos: PasoProgreso[]
  porcentaje: number
  siguiente?: PasoOnboarding
  bloqueado: boolean
  motivoBloqueo?: string
  diasSinMover?: number
  tieneTelegram: boolean
}

export interface EventoOnboarding {
  _id: string
  paso: PasoOnboarding
  estado: EstadoPaso
  motivo?: string
  nota?: string
  pendienteDelCliente?: string
  origen: 'equipo' | 'sistema'
  porNombre?: string
  createdAt: string
}

export interface ResumenProgreso {
  total: number
  bloqueados: number
  progresos: ProgresoEntorno[]
}

export interface MarcarPasoBody {
  estado: EstadoPaso
  motivo?: string
  nota?: string
  pendienteDelCliente?: string
}

class OnboardingProgresoService extends APIBase {
  async getResumen(filtros: { bloqueados?: boolean; pendientes?: boolean } = {}): Promise<ResumenProgreso> {
    const params = new URLSearchParams()
    if (filtros.bloqueados) params.set('bloqueados', '1')
    if (filtros.pendientes) params.set('pendientes', '1')
    const query = params.toString()
    const res = await this.get<ResumenProgreso>(`onboarding-progreso${query ? `?${query}` : ''}`)
    return res.data
  }

  async getDetalle(workspaceId: string): Promise<{ progreso: ProgresoEntorno; bitacora: EventoOnboarding[] }> {
    const res = await this.get<{ progreso: ProgresoEntorno; bitacora: EventoOnboarding[] }>(
      `onboarding-progreso/${workspaceId}`
    )
    return res.data
  }

  async marcarPaso(workspaceId: string, paso: PasoOnboarding, body: MarcarPasoBody): Promise<ProgresoEntorno> {
    const res = await this.patch<{ progreso: ProgresoEntorno }>(`onboarding-progreso/${workspaceId}/${paso}`, body)
    return res.data.progreso
  }

  async recordar(workspaceId: string, paso: PasoOnboarding, texto?: string): Promise<{ enviado: boolean; message: string }> {
    const res = await this.post<{ enviado: boolean; message: string }>(
      `onboarding-progreso/${workspaceId}/${paso}/recordar`,
      { texto }
    )
    return res.data
  }
}

export const onboardingProgresoService = new OnboardingProgresoService()
