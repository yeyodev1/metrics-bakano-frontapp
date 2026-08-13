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

class WorkspaceService extends APIBase {
  // ── Workspaces ──────────────────────────────────────────

  async createWorkspace(name: string): Promise<WorkspaceResponse> {
    const res = await this.post<WorkspaceResponse>('workspaces', { name })
    return res.data
  }

  async listWorkspaces(params: { search?: string; page?: number; limit?: number } = {}): Promise<WorkspaceListResponse> {
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
  async listAllCollaborators(search?: string, workspaceId?: string): Promise<UserListResponse> {
    const res = await this.get<UserListResponse>('workspaces/all-users', undefined, { params: { search, workspaceId } })
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

  async toggleWorkspaceActive(workspaceId: string, isActive: boolean): Promise<WorkspaceResponse> {
    const res = await this.patch<WorkspaceResponse>(`workspaces/${workspaceId}/toggle-active`, { isActive })
    return res.data
  }
}

export const workspaceService = new WorkspaceService()
