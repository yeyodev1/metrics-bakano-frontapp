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

  async listWorkspaces(): Promise<WorkspaceListResponse> {
    const res = await this.get<WorkspaceListResponse>('workspaces')
    return res.data
  }

  async getWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
    const res = await this.get<WorkspaceResponse>(`workspaces/${workspaceId}`)
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
}

export const workspaceService = new WorkspaceService()
