import APIBase from './httpBase'
import type {
  PlanningEntryResponse,
  PlanningEntryListResponse,
  CreatePlanningEntryPayload,
  UpdatePlanningEntryPayload,
  GlobalPlanningWeekResponse,
} from '@/types'

class PlanningService extends APIBase {
  /**
   * Planificaciones del mes de TODOS los entornos del usuario en una sola
   * peticion. El calendario del editor hacia una por cliente.
   */
  async listMine(params: { startDate: string; endDate: string }): Promise<PlanningEntryListResponse> {
    const res = await this.get<PlanningEntryListResponse>('planning/mine', undefined, { params })
    return res.data
  }

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
  async listMyWeek(
    params: { startDate: string; endDate: string },
  ): Promise<GlobalPlanningWeekResponse> {
    const res = await this.get<GlobalPlanningWeekResponse>('planning/my-week', undefined, { params })
    return res.data
  }

  async listGlobal(
    params: { startDate: string; endDate: string },
  ): Promise<GlobalPlanningWeekResponse> {
    const res = await this.get<GlobalPlanningWeekResponse>('planning/my-week', undefined, { params })
    return res.data
  }

  async uploadItemMedia(itemId: string, file: File): Promise<{ url: string; mediaType: 'video' | 'image' }> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await this.post<{ url: string; mediaType: 'video' | 'image' }>(
      `video-planning/items/${itemId}/upload-media`,
      fd,
    )
    return res.data
  }
}

export const planningService = new PlanningService()
