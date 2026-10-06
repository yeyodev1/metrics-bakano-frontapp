import APIBase from './httpBase'
import type {
  WorkspaceListResponse,
  WorkspaceResponse,
  CreateUserPayload,
  UpdateUserPayload,
  CreateGlobalUserPayload,
  UpdateGlobalUserPayload,
  UserResponse,
  UserListResponse,
} from '@/types'

export interface FacturacionPrivada {
  activa: boolean
  puedoVer: boolean
  puedoEditar: boolean
  visiblePara?: string[]
  usuarios?: { id: string; nombre: string; email: string; rol: 'admin' | 'colaborador' }[]
}

class WorkspaceService extends APIBase {
  // ── Workspaces ──────────────────────────────────────────

  async createWorkspace(name: string): Promise<WorkspaceResponse> {
    const res = await this.post<WorkspaceResponse>('workspaces', { name })
    return res.data
  }

  async listWorkspaces(params: { search?: string; page?: number; limit?: number; minimal?: boolean; filter?: string } = {}): Promise<WorkspaceListResponse> {
    const res = await this.get<WorkspaceListResponse>('workspaces', undefined, { params })
    return res.data
  }

  /** Conteos del panel de superadmin. Un solo agregado en el servidor. */
  async getWorkspacesSummary(): Promise<{
    summary: {
      total: number
      activos: number
      inactivos: number
      sinPerfilMarca: number
      sinMetaVinculada: number
      traffickers: number
    }
  }> {
    const res = await this.get<any>('workspaces/summary')
    return res.data
  }

  async getWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
    const res = await this.get<WorkspaceResponse>(`workspaces/${workspaceId}`)
    return res.data
  }

  async updateWorkspace(workspaceId: string, name: string): Promise<WorkspaceResponse> {
    const res = await this.put<WorkspaceResponse>(`workspaces/${workspaceId}`, { name })
    return res.data
  }

  /** Quién ve las ventas del entorno (facturación privada). */
  async getFacturacionPrivada(workspaceId: string): Promise<FacturacionPrivada> {
    const res = await this.get<FacturacionPrivada>(`workspaces/${workspaceId}/facturacion-privada`)
    return res.data
  }

  async putFacturacionPrivada(workspaceId: string, body: { activa: boolean; visiblePara: string[] }): Promise<void> {
    await this.put(`workspaces/${workspaceId}/facturacion-privada`, body)
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await this.delete(`workspaces/${workspaceId}`)
  }

  // ── Users within a workspace ─────────────────────────────

  async listUsers(workspaceId: string): Promise<UserListResponse> {
    const res = await this.get<UserListResponse>(`workspaces/${workspaceId}/users`)
    return res.data
  }

  async getTeam(workspaceId: string): Promise<any> {
    const res = await this.get<any>(`workspaces/${workspaceId}/team`)
    return res.data
  }

  async createUser(workspaceId: string, payload: CreateUserPayload): Promise<UserResponse> {
    const res = await this.post<UserResponse>(`workspaces/${workspaceId}/users`, payload)
    return res.data
  }

  async updateUser(
    workspaceId: string,
    userId: string,
    payload: UpdateUserPayload,
  ): Promise<UserResponse> {
    const res = await this.put<UserResponse>(`workspaces/${workspaceId}/users/${userId}`, payload)
    return res.data
  }

  async deleteUser(workspaceId: string, userId: string): Promise<void> {
    await this.delete(`workspaces/${workspaceId}/users/${userId}`)
  }

  // ── Global Superadmin Management ─────────────────────────────

  async listSuperadmins(): Promise<{ admins: any[] }> {
    const res = await this.get<{ admins: any[] }>('admin/superadmins')
    return res.data
  }

  async createSuperadmin(payload: { name?: string; email: string; password: string }): Promise<{ user: any }> {
    const res = await this.post<{ user: any }>('admin/superadmins', payload)
    return res.data
  }

  async deleteSuperadmin(userId: string): Promise<void> {
    await this.delete(`admin/superadmins/${userId}`)
  }

  // ── Equipo interno de Bakano ─────────────────────────────────

  async listInternalUsers(): Promise<{ users: any[] }> {
    const res = await this.get<{ users: any[] }>('admin/internal-users')
    return res.data
  }

  async updateInternalUser(
    userId: string,
    payload: { internalRole?: string; name?: string; isActive?: boolean },
  ): Promise<{ user: any }> {
    const res = await this.patch<{ user: any }>(`admin/internal-users/${userId}`, payload)
    return res.data
  }

  /** Manda (o vuelve a mandar) la invitacion al bot de Telegram. */
  async enviarInvitacionBot(userId: string): Promise<{ message: string }> {
    const res = await this.post<{ message: string }>(`admin/users/${userId}/invitacion-bot`, {})
    return res.data
  }

  /** Borra a cualquier persona desde "Admins de cuenta" (equipo o cliente). */
  async deleteGlobalUser(userId: string): Promise<void> {
    await this.delete(`admin/users/${userId}`)
  }


  async deleteInternalUser(userId: string): Promise<void> {
    await this.delete(`admin/internal-users/${userId}`)
  }
  /** `onlyAccountAdmins` deja solo a los administradores de cuenta de clientes. */
  async listAllCollaborators(
    search?: string,
    workspaceId?: string,
    onlyAccountAdmins?: boolean,
  ): Promise<UserListResponse> {
    const res = await this.get<UserListResponse>('workspaces/all-users', undefined, {
      params: { search, workspaceId, onlyAccountAdmins: onlyAccountAdmins || undefined },
    })
    return res.data
  }

  async createGlobalUser(payload: CreateGlobalUserPayload): Promise<UserResponse> {
    const res = await this.post<UserResponse>('workspaces/global-users', payload)
    return res.data
  }

  async updateGlobalUser(userId: string, payload: UpdateGlobalUserPayload): Promise<UserResponse> {
    const res = await this.put<UserResponse>(`workspaces/global-users/${userId}`, payload)
    return res.data
  }

  async resendInvite(userId: string, password: string): Promise<void> {
    await this.post(`workspaces/global-users/${userId}/resend-invite`, { password })
  }

  async sendBrandProfileInvite(workspaceId: string): Promise<{ sentTo: string[] }> {
    const res = await this.post<{ sentTo: string[] }>(`workspaces/${workspaceId}/send-brand-profile-invite`, {})
    return res.data
  }

  /** Al desactivar, el backend exige un motivo. */
  async toggleWorkspaceActive(
    workspaceId: string,
    isActive: boolean,
    desactivacion?: { motivo: string; nota?: string },
  ): Promise<WorkspaceResponse> {
    const res = await this.patch<WorkspaceResponse>(`workspaces/${workspaceId}/toggle-active`, {
      isActive,
      ...desactivacion,
    })
    return res.data
  }

  /** Lo que hay en Metrics del entorno, en vivo (la misma foto que ve el bot de Telegram). */
  async getEstadoMetrics(workspaceId: string): Promise<EstadoEnMetrics> {
    const res = await this.get<EstadoEnMetrics>(`workspaces/${workspaceId}/estado-metrics`, undefined, { timeout: 30000 })
    return res.data
  }

  async getCrmSubcuenta(workspaceId: string): Promise<CrmSubcuenta> {
    const res = await this.get<CrmSubcuenta>(`workspaces/${workspaceId}/crm-subcuenta`)
    return res.data
  }

  /** Probar el CRM con la cuenta de agencia puede tardar: más margen. */
  async setCrmSubcuenta(workspaceId: string, locationId: string): Promise<CrmSubcuenta & { nota?: string }> {
    const res = await this.put<CrmSubcuenta & { nota?: string }>(
      `workspaces/${workspaceId}/crm-subcuenta`,
      { locationId },
      undefined,
      { timeout: 45000 },
    )
    return res.data
  }
}

export const workspaceService = new WorkspaceService()

export interface CrmSubcuenta {
  locationId: string | null
  vinculadoEn: string | null
  vinculadoPorNombre: string | null
  crmConectado: boolean
  crmModo: string | null
  crmError: string | null
  agenciaDisponible: boolean
}

export interface ArchivoEnMetrics {
  cantidad: number
  ultimo?: { nombre: string; url: string; subidoEn: string | null }
}

export interface EstadoEnMetrics {
  entorno: { id: string; nombre: string; activo: boolean }
  generadoEn: string
  contrato: { firmado: boolean; firmadoEn: string | null; verContrato: string | null }
  archivos: {
    logo: ArchivoEnMetrics
    lineaGrafica: ArchivoEnMetrics
    catalogo: ArchivoEnMetrics
    otros: number
    dondeSubir: string
  }
  datosMarca: { completos: number; total: number; faltan: string[]; dondeVer: string }
  facturacion: { diasRegistrados: number; ultimoDia: string | null; dondeCargar: string }
  meta: { conectado: boolean }
  crm: { conectado: boolean; locationId: string | null; estado: string | null; whatsapp: string | null }
  onboarding: {
    sesiones: { sesion: string; etiqueta: string; con: string; estado: string; fecha: string | null }[]
    siguiente: string | null
    completo: boolean
  }
  citas: { cita: string; cuando: string; con: string; linkMeet: string | null; lugar: string | null }[]
  guiones: {
    total: number
    aprobados: number
    porRevisar: number
    conCorrecciones: number
    porProduccion: { produccion: string; total: number; aprobados: number; porRevisar: number }[]
    dondeVer: string
  }
  videos: { editados: number; aprobadosPorCliente: number; porRevisar: number; publicados: number; dondeVer: string }
  pagos: { alDia: boolean; deuda: string | null }
  yaEsta: string[]
  falta: string[]
}
