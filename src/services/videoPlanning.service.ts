import APIBase from './httpBase'
import type {
  VideoPlanning,
  VideoPlanningResponse,
  CreateVideoItemPayload,
  UpdateVideoItemPayload,
  ClientApprovalPayload,
  VideoItem,
  VideoCalendarItem,
  VideoCalendarResponse,
  WorkspaceVideoItem,
  MetaAdOption,
  DestinatariosAviso,
  UsuarioAviso,
  HistorialAvisos,
  ResultadoNotificacion,
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

  /**
   * Every script of a workspace, across all of its monthly plannings.
   *
   * The Content Builder works at workspace level. Each item carries the
   * `planningId` of the document that holds it, which is what updates need.
   */
  async getWorkspaceItems(workspaceId: string): Promise<WorkspaceVideoItem[]> {
    const res = await this.get<{ items: WorkspaceVideoItem[] }>(
      `video-planning/workspace/${workspaceId}/items`,
    )
    return res.data.items
  }

  /** One page of ads from the workspace's ad account, with lifetime insights. */
  async getWorkspaceAds(
    workspaceId: string,
    options: { limit?: number; after?: string } = {},
  ): Promise<{ ads: MetaAdOption[]; nextCursor: string | null }> {
    const params: Record<string, string> = { limit: String(options.limit ?? 10) }
    if (options.after) params['after'] = options.after

    const res = await this.get<{ ads: MetaAdOption[]; nextCursor: string | null }>(
      `video-planning/workspace/${workspaceId}/ads`,
      undefined,
      { params },
    )
    return { ads: res.data.ads || [], nextCursor: res.data.nextCursor ?? null }
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

  async getCalendarItems(
    workspaceId: string,
    startDate: string,
    endDate: string,
  ): Promise<VideoCalendarItem[]> {
    const res = await this.get<VideoCalendarResponse>(
      `video-planning/calendar?workspaceId=${workspaceId}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
    )
    return res.data.items
  }

  async getEditorCompletedItems(editorId: string): Promise<any[]> {
    const res = await this.get<{ items: any[] }>(`video-planning/editor/${editorId}/edited-items`)
    return res.data.items
  }

  /**
   * One page of published reels, newest first.
   *
   * Pass the previous `nextCursor` to continue. Loading the whole feed took
   * ~9s on large accounts; a page opens instantly.
   */
  async getPublishedReelsForWorkspace(
    workspaceId: string,
    options: { limit?: number; after?: string } = {},
  ): Promise<{ reels: any[]; nextCursor: string | null }> {
    const params: Record<string, string> = { limit: String(options.limit ?? 10) }
    if (options.after) params['after'] = options.after

    const res = await this.get<{ reels: any[]; nextCursor: string | null }>(
      `video-planning/workspace/${workspaceId}/published-reels`,
      undefined,
      { params },
    )
    return { reels: res.data.reels || [], nextCursor: res.data.nextCursor ?? null }
  }

  async linkReelMedia(
    planningId: string,
    itemId: string,
    // Basta con una de las dos fuentes: un video pautado puede no tener reel
    // orgánico. Una cadena vacía desvincula esa fuente en el backend.
    payload: { igMediaId?: string; igPermalink?: string; metaAdId?: string; casoUsoRef?: number },
  ): Promise<VideoPlanning> {
    const res = await this.post<VideoPlanningResponse>(
      `video-planning/${planningId}/items/${itemId}/link-reel`,
      payload,
    )
    return res.data.planning
  }

  async syncVideoItemMetrics(planningId: string, itemId: string): Promise<VideoPlanning> {
    const res = await this.post<VideoPlanningResponse>(
      `video-planning/${planningId}/items/${itemId}/sync-metrics`,
      {},
    )
    return res.data.planning
  }

  // ── Avisos al cliente ─────────────────────────────────────────────────────

  /** Quién recibe qué, para poder revisarlo antes de disparar. */
  async getDestinatarios(planningId: string): Promise<DestinatariosAviso> {
    const res = await this.get<DestinatariosAviso>(`video-planning/${planningId}/recipients`)
    return res.data
  }

  /**
   * Carga el teléfono en la ficha del usuario, no en la planificación: sirve
   * para el próximo aviso y para el mes que viene.
   */
  async guardarTelefonoDestinatario(
    planningId: string,
    userId: string,
    payload: { phoneNumber: string; phoneExtension: string },
  ): Promise<UsuarioAviso> {
    const res = await this.patch<{ usuario: UsuarioAviso }>(
      `video-planning/${planningId}/recipients/${userId}/phone`,
      payload,
    )
    return res.data.usuario
  }

  /** Dispara WhatsApp y correo. Manda mensajes reales. */
  async notificar(planningId: string): Promise<ResultadoNotificacion> {
    const res = await this.post<{ resultado: ResultadoNotificacion }>(
      `video-planning/${planningId}/notify`,
      {},
    )
    return res.data.resultado
  }

  /** Auditoría: cuántos avisos salieron, cuántos se abrieron y cuántos se clicaron. */
  async getHistorialAvisos(planningId: string): Promise<HistorialAvisos> {
    const res = await this.get<HistorialAvisos>(`video-planning/${planningId}/notifications`)
    return res.data
  }
}

export const videoPlanningService = new VideoPlanningService()
