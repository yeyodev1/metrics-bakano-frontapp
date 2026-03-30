import APIBase from './httpBase'

export interface VisitLogUser {
  _id: string
  name: string
  internalRole: string
}

export interface VisitLogWorkspace {
  _id: string
  name: string
}

export interface VisitLog {
  _id: string
  producerId: string | VisitLogUser
  workspaceId: string | VisitLogWorkspace
  visitDate: string
  attendees: (string | VisitLogUser)[]
  month: string
  notes?: string
  createdAt: string
}

export interface CreateVisitLogPayload {
  workspaceId: string
  visitDate: string   // ISO string
  attendees: string[] // userIds
  notes?: string
}

class VisitLogService extends APIBase {
  async getVisitLogs(month: string, producerId?: string): Promise<{ logs: VisitLog[] }> {
    const params: Record<string, string> = { month }
    if (producerId) params['producerId'] = producerId
    const res = await this.get<{ logs: VisitLog[] }>('visit-logs', undefined, { params })
    return res.data
  }

  async createVisitLog(payload: CreateVisitLogPayload): Promise<{ log: VisitLog }> {
    const res = await this.post<{ log: VisitLog }>('visit-logs', payload)
    return res.data
  }

  async deleteVisitLog(id: string): Promise<void> {
    await this.delete(`visit-logs/${id}`)
  }
}

export const visitLogService = new VisitLogService()
