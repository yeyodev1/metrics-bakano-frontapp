import APIBase from './httpBase'
import type {
  VideoPlanning,
  VideoPlanningResponse,
  CreateVideoItemPayload,
  UpdateVideoItemPayload,
  ClientApprovalPayload,
  VideoItem,
} from '@/types/videoPlanning'

class VideoPlanningService extends APIBase {
  async getByEntry(entryId: string): Promise<VideoPlanning | null> {
    try {
      const res = await this.get<VideoPlanningResponse>(
        `planning-entries/${entryId}/video-planning`,
      )
      return res.data.planning
    } catch {
      return null
    }
  }

  async create(entryId: string, workspaceId: string, items: CreateVideoItemPayload[]): Promise<VideoPlanning> {
    const res = await this.post<VideoPlanningResponse>(
      `planning-entries/${entryId}/video-planning`,
      { workspaceId, items },
    )
    return res.data.planning
  }

  async updateItems(entryId: string, workspaceId: string, items: Partial<VideoItem>[]): Promise<VideoPlanning> {
    const res = await this.put<VideoPlanningResponse>(
      `planning-entries/${entryId}/video-planning`,
      { workspaceId, items },
    )
    return res.data.planning
  }

  async updateItem(
    planningId: string,
    itemId: string,
    fields: UpdateVideoItemPayload,
  ): Promise<VideoPlanning> {
    const res = await this.patch<VideoPlanningResponse>(
      `video-planning/${planningId}/items/${itemId}`,
      fields,
    )
    return res.data.planning
  }

  async reopen(planningId: string): Promise<VideoPlanning> {
    const res = await this.post<VideoPlanningResponse>(
      `video-planning/${planningId}/reopen`,
      {},
    )
    return res.data.planning
  }

  async submitClientApproval(
    planningId: string,
    payload: ClientApprovalPayload,
  ): Promise<VideoPlanning> {
    const res = await this.post<VideoPlanningResponse>(
      `video-planning/${planningId}/client-approval`,
      payload,
    )
    return res.data.planning
  }
}

export const videoPlanningService = new VideoPlanningService()
