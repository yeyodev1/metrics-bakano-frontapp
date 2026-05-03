import APIBase from './httpBase'
import type { IBranch, BranchResponse, BranchListResponse } from '@/types'

class BranchService extends APIBase {
  async getBranches(workspaceId: string): Promise<IBranch[]> {
    const res = await this.get<BranchListResponse>(`workspaces/${workspaceId}/branches`)
    return res.data.branches
  }

  async createBranch(workspaceId: string, payload: { name: string }): Promise<IBranch> {
    const res = await this.post<BranchResponse>(`workspaces/${workspaceId}/branches`, payload)
    return res.data.branch
  }

  async updateBranch(
    workspaceId: string,
    branchId: string,
    payload: { name: string; isActive?: boolean }
  ): Promise<IBranch> {
    const res = await this.put<BranchResponse>(`workspaces/${workspaceId}/branches/${branchId}`, payload)
    return res.data.branch
  }

  async deleteBranch(workspaceId: string, branchId: string): Promise<void> {
    await this.delete(`workspaces/${workspaceId}/branches/${branchId}`)
  }
}

export const branchService = new BranchService()
