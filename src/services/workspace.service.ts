import APIBase from './httpBase'
import type {
  WorkspaceListResponse,
  WorkspaceResponse,
  CreateAdminPayload,
  AdminResponse,
  AdminListResponse,
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

  // ── Admins ──────────────────────────────────────────────

  async createAdmin(workspaceId: string, payload: CreateAdminPayload): Promise<AdminResponse> {
    const res = await this.post<AdminResponse>(`workspaces/${workspaceId}/admins`, payload)
    return res.data
  }

  async listAdmins(workspaceId: string): Promise<AdminListResponse> {
    const res = await this.get<AdminListResponse>(`workspaces/${workspaceId}/admins`)
    return res.data
  }
}

export const workspaceService = new WorkspaceService()
