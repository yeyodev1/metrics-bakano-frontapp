import APIBase from './httpBase'
import type { ISurvey, ISurveyAssignment, ISurveyResponse, IQuestion } from '@/types/survey'

class SurveyService extends APIBase {
  // ── Internal / Superadmin ────────────────────────────────

  async createSurvey(data: {
    title: string
    description?: string
    questions: IQuestion[]
  }): Promise<{ message: string; survey: ISurvey }> {
    const res = await this.post<{ message: string; survey: ISurvey }>('surveys', data)
    return res.data
  }

  async listSurveys(): Promise<{ message: string; surveys: ISurvey[] }> {
    const res = await this.get<{ message: string; surveys: ISurvey[] }>('surveys')
    return res.data
  }

  async getSurvey(id: string): Promise<{ message: string; survey: ISurvey }> {
    const res = await this.get<{ message: string; survey: ISurvey }>(`surveys/${id}`)
    return res.data
  }

  async updateSurvey(
    id: string,
    data: Partial<ISurvey>,
  ): Promise<{ message: string; survey: ISurvey }> {
    const res = await this.patch<{ message: string; survey: ISurvey }>(`surveys/${id}`, data)
    return res.data
  }

  async updateSurveyStatus(
    id: string,
    status: 'draft' | 'active' | 'closed',
  ): Promise<{ message: string; survey: ISurvey }> {
    const res = await this.patch<{ message: string; survey: ISurvey }>(`surveys/${id}/status`, {
      status,
    })
    return res.data
  }

  async deleteSurvey(id: string): Promise<{ message: string }> {
    const res = await this.delete<{ message: string }>(`surveys/${id}`)
    return res.data
  }

  async sendSurvey(
    id: string,
    data: { workspaceId: string; userIds: string[]; message?: string },
  ): Promise<{ message: string; sent: number; skipped: number }> {
    const res = await this.post<{ message: string; sent: number; skipped: number }>(
      `surveys/${id}/send`,
      data,
    )
    return res.data
  }

  async getSurveyResults(id: string): Promise<{
    message: string
    survey: ISurvey
    assignments: ISurveyAssignment[]
    responses: ISurveyResponse[]
  }> {
    const res = await this.get<{
      message: string
      survey: ISurvey
      assignments: ISurveyAssignment[]
      responses: ISurveyResponse[]
    }>(`surveys/${id}/results`)
    return res.data
  }

  async assignInternalSenders(
    id: string,
    userIds: string[],
  ): Promise<{ message: string; survey: ISurvey }> {
    const res = await this.post<{ message: string; survey: ISurvey }>(
      `surveys/${id}/assign-senders`,
      { userIds },
    )
    return res.data
  }

  async listInternalUsers(): Promise<{ message: string; users: { _id: string; name: string; email: string }[] }> {
    const res = await this.get<{ message: string; users: { _id: string; name: string; email: string }[] }>('surveys/internal-users')
    return res.data
  }

  async sendSurveyToInternals(
    id: string,
    data: { userIds: string[]; message?: string },
  ): Promise<{ message: string; sent: number; skipped: number }> {
    const res = await this.post<{ message: string; sent: number; skipped: number }>(
      `surveys/${id}/send-internal`,
      data,
    )
    return res.data
  }

  // ── Fill survey (any authenticated user) ────────────────

  async getSurveyForFill(token: string): Promise<{
    message: string
    survey: ISurvey
    assignment: ISurveyAssignment
  }> {
    const res = await this.get<{
      message: string
      survey: ISurvey
      assignment: ISurveyAssignment
    }>(`surveys/fill/${token}`)
    return res.data
  }

  async submitSurveyResponse(
    token: string,
    answers: { questionId: string; value: any }[],
  ): Promise<{ message: string }> {
    const res = await this.post<{ message: string }>(`surveys/fill/${token}/submit`, { answers })
    return res.data
  }

  // ── Client: my surveys ───────────────────────────────────

  async getMySurveys(): Promise<{
    message: string
    pending: ISurveyAssignment[]
    completed: ISurveyAssignment[]
  }> {
    const res = await this.get<{
      message: string
      pending: ISurveyAssignment[]
      completed: ISurveyAssignment[]
    }>('surveys/me/surveys')
    return res.data
  }
}

export const surveyService = new SurveyService()
