import APIBase from './httpBase'
import type {
  PlanningEntryResponse,
  PlanningEntryListResponse,
  CreatePlanningEntryPayload,
  UpdatePlanningEntryPayload,
} from '@/types'

class PlanningService extends APIBase {
  async listEntries(
    workspaceId: string,
    params: { startDate?: string; endDate?: string } = {},
  ): Promise<PlanningEntryListResponse> {
    const res = await this.get<PlanningEntryListResponse>(`planning/${workspaceId}`, undefined, {
      params,
    })
    return res.data
  }

  async createEntry(
    workspaceId: string,
    payload: CreatePlanningEntryPayload,
  ): Promise<PlanningEntryResponse> {
    const res = await this.post<PlanningEntryResponse>(`planning/${workspaceId}`, payload)
    return res.data
  }

  async updateEntry(
    entryId: string,
    payload: UpdatePlanningEntryPayload,
  ): Promise<PlanningEntryResponse> {
    const res = await this.put<PlanningEntryResponse>(`planning/${entryId}`, payload)
    return res.data
  }

  async deleteEntry(entryId: string): Promise<void> {
    await this.delete(`planning/${entryId}`)
  }
}

export const planningService = new PlanningService()
