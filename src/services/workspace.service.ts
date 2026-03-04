import APIBase from './httpBase'
import type {
  WorkspaceListResponse,
  WorkspaceResponse,
  CreateUserPayload,
  UpdateUserPayload,
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

  async getWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
    const res = await this.get<WorkspaceResponse>(`workspaces/${workspaceId}`)
    return res.data
  }

  async updateWorkspace(workspaceId: string, name: string): Promise<WorkspaceResponse> {
    const res = await this.put<WorkspaceResponse>(`workspaces/${workspaceId}`, { name })
    return res.data
  }

  // ── Users within a workspace ─────────────────────────────

  async listUsers(workspaceId: string): Promise<UserListResponse> {
    const res = await this.get<UserListResponse>(`workspaces/${workspaceId}/users`)
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
}

export const workspaceService = new WorkspaceService()
