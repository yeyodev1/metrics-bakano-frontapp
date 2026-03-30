import APIBase from './httpBase'

export type KpiRoleType = 'editor' | 'asistente_produccion' | 'content'

export interface TeamKpiRecord {
  _id: string
  userId: string
  pmUserId: string
  month: string
  roleType: KpiRoleType
  performanceScore: number // 0–100

  // Editor
  workingDays?: number
  targetVideos?: number
  deliveredVideos?: number
  returnedVideos?: number
  approvedFirstPass?: number
  urgencies?: number
  urgenciesOnTime?: number

  // Asistente Producción
  prodClients?: number
  targetVisits?: number
  completedVisits?: number
  targetVideosMade?: number
  videosMade?: number
  onTimeDeliveriesToEditor?: number

  // Content
  contentClients?: number
  targetPlans?: number
  deliveredPlans?: number
  completePlans20?: number
  plansOnTime?: number
  postsTarget?: number
  postsDelivered?: number
  publishRate?: number

  // Populated
  user?: { _id: string; name: string; email: string; internalRole: string }
}

export interface KpiUser {
  _id: string
  name: string
  email: string
  internalRole: string
}

export interface UpsertKpiPayload extends Partial<Omit<TeamKpiRecord, '_id' | 'performanceScore' | 'user'>> {
  userId: string
  month: string
  roleType: KpiRoleType
}

class TeamKpiService extends APIBase {
  async getTeamKpis(month: string): Promise<{ records: TeamKpiRecord[]; month: string }> {
    const res = await this.get<{ records: TeamKpiRecord[]; month: string }>('team-kpis', undefined, { params: { month } })
    return res.data
  }

  async getKpiEligibleUsers(): Promise<{ users: KpiUser[] }> {
    const res = await this.get<{ users: KpiUser[] }>('team-kpis/users')
    return res.data
  }

  async getMyKpi(month: string): Promise<{ record: TeamKpiRecord | null }> {
    const res = await this.get<{ record: TeamKpiRecord | null }>('team-kpis/me', undefined, { params: { month } })
    return res.data
  }

  async upsertTeamKpi(payload: UpsertKpiPayload): Promise<{ record: TeamKpiRecord }> {
    const res = await this.post<{ record: TeamKpiRecord }>('team-kpis', payload)
    return res.data
  }
}

export const teamKpiService = new TeamKpiService()
