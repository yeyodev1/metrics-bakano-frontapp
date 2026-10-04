import APIBase from './httpBase'

/**
 * Integraciones del workspace: hoy solo el CRM (GoHighLevel). Con el token de
 * integración privada Bakano revisa cada día conversaciones y oportunidades.
 * El token nunca vuelve completo: el backend solo devuelve sus últimos dígitos.
 */

export type CrmEstado = 'conectado' | 'error'
export type CrmWhatsapp = 'conectado' | 'no_detectado' | 'desconocido'
/** `agencia`: se conectó con la cuenta de agencia de Bakano, sin token propio. */
export type CrmModo = 'token_propio' | 'agencia'

export interface CrmPermisos {
  conversaciones: boolean
  mensajes: boolean
  oportunidades: boolean
  contactos: boolean
  /** users.readonly: opcional, para ver los nombres de los asesores. */
  usuarios?: boolean
}

export interface CrmConectadoPor {
  nombre: string
  esEquipo: boolean
  en: string
}

/** Cómo revisa Bakano el CRM cada día. Solo el equipo la cambia. */
export interface CrmRevisionConfig {
  activa: boolean
  diasConversaciones: number
  diasOportunidades: number
  diasEstancada: number
}

export interface CrmVista {
  estado: CrmEstado
  modo: CrmModo
  locationId: string
  /** Vacío en modo agencia. */
  tokenFinal: string
  whatsapp: CrmWhatsapp
  permisos: CrmPermisos
  conectadoPor: CrmConectadoPor | null
  ultimaRevision: string | null
  ultimoError: string | null
  revision: CrmRevisionConfig
  /** Permisos opcionales que faltan (no impiden la conexión). */
  advertencias?: string[]
}

export interface IntegracionesVista {
  crm: CrmVista | null
  bakanologyUrl: string
  /** Si es true, basta el Location ID: se conecta con la cuenta de agencia. */
  agenciaDisponible: boolean
}

export interface CrmCredenciales {
  locationId: string
  token?: string
}

/** Límites de la configuración de revisión; el backend valida lo mismo. */
export const REVISION_LIMITES = {
  diasConversaciones: { min: 1, max: 30 },
  diasOportunidades: { min: 1, max: 30 },
  diasEstancada: { min: 2, max: 60 },
} as const

export type CrmHallazgoTipo = 'cierre_casi_solo' | 'lead_sin_respuesta' | 'oportunidad_estancada'

export interface CrmHallazgoVista {
  tipo: CrmHallazgoTipo
  contacto: { nombre: string; telefono: string; email: string }
  resumen: string
  porQueEsCierre: string
  queHacer: string
  mensajeSugerido: string
  monto: number | null
}

export interface CrmRevisionPedido {
  desde: string
  hasta: string
  avisarCliente?: boolean
}

export interface CrmRevisionResultado {
  conversaciones: number
  oportunidades: number
  hallazgos: CrmHallazgoVista[]
  truncado?: boolean
}

export type CrmMetricaEstado = 'pendiente' | 'en_curso' | 'terminada' | 'fallida'

export interface CrmMetricasDia {
  dia: string
  /** null: ese día todavía no se calcula. */
  estado: CrmMetricaEstado | null
  conversaciones: number
  nuevas: number
  contactosQueEscribieron: number
  mensajesEntrantes: number
  mensajesSalientes: number
  mensajesAutomaticos: number
  sinRespuesta: number
  medianaRespuestaSeg: number | null
  asesoresActivos: number
}

export interface CrmMetricasAsesor {
  userId: string
  nombre: string
  mensajes: number
  conversaciones: number
  respuestas: number
  medianaRespuestaSeg: number | null
  promedioRespuestaSeg: number | null
  sinRespuesta: number
  diasActivo: number
}

export interface CrmCanales {
  whatsapp: number
  instagram: number
  facebook: number
  sms: number
  otro: number
}

/** Dashboard del CRM: días cerrados hasta ayer, en hora de Ecuador. */
export interface CrmMetricasVista {
  conectado: boolean
  estadoCrm: CrmEstado | null
  problema: string | null
  advertencias: string[]
  desde: string
  hasta: string
  dias: CrmMetricasDia[]
  totales: {
    conversaciones: number
    nuevas: number
    contactosQueEscribieron: number
    mensajesEntrantes: number
    mensajesSalientes: number
    mensajesAutomaticos: number
    sinRespuesta: number
    asesoresActivos: number
    medianaRespuestaSeg: number | null
    promedioRespuestaSeg: number | null
  }
  porCanal: CrmCanales
  asesores: CrmMetricasAsesor[]
  pendientes: number
  truncado: boolean
}

export interface CrmRecalculoResultado {
  dias: number
  calculados: number
  pendientes: number
  errores: string[]
}

class IntegracionesService extends APIBase {
  async getIntegraciones(workspaceId: string) {
    const res = await this.get<IntegracionesVista>(`workspaces/${workspaceId}/integraciones`)
    return res.data
  }

  /** Validar el token contra GoHighLevel tarda: se da más margen que los 15s. */
  async conectarCrm(workspaceId: string, credenciales: CrmCredenciales) {
    const res = await this.put<CrmVista>(
      `workspaces/${workspaceId}/integraciones/crm`,
      credenciales,
      undefined,
      { timeout: 45000 }
    )
    return res.data
  }

  async probarCrm(workspaceId: string) {
    const res = await this.post<CrmVista>(
      `workspaces/${workspaceId}/integraciones/crm/probar`,
      {},
      undefined,
      { timeout: 45000 }
    )
    return res.data
  }

  /** Solo equipo de Bakano (403 para el cliente). */
  async actualizarRevision(workspaceId: string, cambios: Partial<CrmRevisionConfig>) {
    const res = await this.patch<CrmVista>(`workspaces/${workspaceId}/integraciones/crm/revision`, cambios)
    return res.data
  }

  /** Lee conversaciones y oportunidades con IA: puede tardar ~60s. Solo equipo. */
  async revisarCrm(workspaceId: string, pedido: CrmRevisionPedido) {
    const res = await this.post<CrmRevisionResultado>(
      `workspaces/${workspaceId}/integraciones/crm/revisar`,
      pedido,
      undefined,
      { timeout: 90000 }
    )
    return res.data
  }

  async metricasCrm(workspaceId: string, dias: number) {
    const res = await this.get<CrmMetricasVista>(`workspaces/${workspaceId}/integraciones/crm/metricas?dias=${dias}`)
    return res.data
  }

  /** Lee todas las conversaciones de cada día: puede tardar ~60s. Solo equipo. */
  async recalcularMetricasCrm(workspaceId: string, desde: string, hasta: string) {
    const res = await this.post<CrmRecalculoResultado>(
      `workspaces/${workspaceId}/integraciones/crm/metricas/recalcular`,
      { desde, hasta },
      undefined,
      { timeout: 90000 }
    )
    return res.data
  }

  async desconectarCrm(workspaceId: string) {
    await this.delete<void>(`workspaces/${workspaceId}/integraciones/crm`)
  }
}

export default new IntegracionesService()
