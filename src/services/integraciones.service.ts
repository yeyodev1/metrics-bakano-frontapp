import APIBase from './httpBase'

/**
 * Integraciones del workspace: hoy solo el CRM (GoHighLevel). Con el token de
 * integración privada Bakano revisa cada día conversaciones y oportunidades.
 * El token nunca vuelve completo: el backend solo devuelve sus últimos dígitos.
 */

export type CrmEstado = 'conectado' | 'error'
export type CrmWhatsapp = 'conectado' | 'no_detectado' | 'desconocido'

export interface CrmPermisos {
  conversaciones: boolean
  mensajes: boolean
  oportunidades: boolean
  contactos: boolean
}

export interface CrmConectadoPor {
  nombre: string
  esEquipo: boolean
  en: string
}

export interface CrmVista {
  estado: CrmEstado
  locationId: string
  tokenFinal: string
  whatsapp: CrmWhatsapp
  permisos: CrmPermisos
  conectadoPor: CrmConectadoPor | null
  ultimaRevision: string | null
  ultimoError: string | null
}

export interface IntegracionesVista {
  crm: CrmVista | null
  bakanologyUrl: string
}

export interface CrmCredenciales {
  locationId: string
  token: string
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

  async desconectarCrm(workspaceId: string) {
    await this.delete<void>(`workspaces/${workspaceId}/integraciones/crm`)
  }
}

export default new IntegracionesService()
