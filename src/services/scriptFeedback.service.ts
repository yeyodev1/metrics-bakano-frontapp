import APIBase from './httpBase'

export interface ScriptFeedback {
  _id: string
  workspaceId: string
  videoItemId?: string
  planningId?: string
  videoTema?: string
  tipo: 'video' | 'guion' | 'general'
  texto: string
  authorId: string
  authorName: string
  createdAt: string
}

export interface CreateFeedbackPayload {
  texto: string
  tipo?: ScriptFeedback['tipo']
  videoItemId?: string
  planningId?: string
  videoTema?: string
}

class ScriptFeedbackService extends APIBase {
  async list(
    workspaceId: string,
    options: { videoItemId?: string; limit?: number } = {},
  ): Promise<ScriptFeedback[]> {
    const params: Record<string, string> = {}
    if (options.videoItemId) params['videoItemId'] = options.videoItemId
    if (options.limit) params['limit'] = String(options.limit)

    const res = await this.get<{ feedback: ScriptFeedback[] }>(
      `script-feedback/${workspaceId}`,
      undefined,
      { params },
    )
    return res.data.feedback
  }

  async create(workspaceId: string, payload: CreateFeedbackPayload): Promise<ScriptFeedback> {
    const res = await this.post<{ feedback: ScriptFeedback }>(
      `script-feedback/${workspaceId}`,
      payload,
    )
    return res.data.feedback
  }

  async remove(workspaceId: string, feedbackId: string): Promise<void> {
    await this.delete(`script-feedback/${workspaceId}/${feedbackId}`)
  }
}

export const scriptFeedbackService = new ScriptFeedbackService()
