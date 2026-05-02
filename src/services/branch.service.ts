import APIBase from './httpBase'

export interface IBranch {
  _id: string
  workspaceId: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

class BranchService extends APIBase {
  async getBranches(workspaceId: string) {
    const res = await this.get<{ branches: IBranch[] }>(`workspaces/${workspaceId}/branches`)
    return res.data
  }

  async createBranch(workspaceId: string, payload: { name: string }) {
    const res = await this.post<{ branch: IBranch }>(`workspaces/${workspaceId}/branches`, payload)
    return res.data
  }

  async updateBranch(workspaceId: string, branchId: string, payload: { name: string; isActive?: boolean }) {
    const res = await this.put<{ branch: IBranch }>(`workspaces/${workspaceId}/branches/${branchId}`, payload)
    return res.data
  }

  async deleteBranch(workspaceId: string, branchId: string) {
    const res = await this.delete(`workspaces/${workspaceId}/branches/${branchId}`)
    return res.data
  }
}

export const branchService = new BranchService()
