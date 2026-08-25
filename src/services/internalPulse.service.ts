import APIBase from './httpBase'

export type PaceStatus = 'sin_meta' | 'adelante' | 'en_linea' | 'atrasado' | 'cumplida'

export interface PulseAlert {
  level: 'critico' | 'atencion' | 'info'
  code: string
  message: string
}

export interface PulseTeamMember {
  userId: string
  name: string
  email: string
  internalRole?: string
  photoUrl?: string
  isInternal: boolean
  entryCount: number
  amount: number
  lastEntryDate: string | null
}

export interface PulseDay {
  dateStr: string
  amount: number
  metaSpend: number
  roas: number
  entryCount: number
  targetDaily: number
}

export interface MonthlyTarget {
  _id: string
  targetAmount: number
  stretchAmount: number | null
  notes: string | null
  source: 'manual' | 'carryover'
  setBy: { name: string; email: string } | null
  updatedAt: string
}

export interface WorkspacePulse {
  workspace: { _id: string; name: string; isActive: boolean; adAccountName: string | null }
  period: { year: number; month: number; daysInMonth: number; elapsedDays: number; remainingDays: number }
  target: MonthlyTarget | null
  suggestedTarget: { targetAmount: number; fromLabel: string } | null
  totals: {
    billed: number
    online: number
    metaSpend: number
    roas: number
    avgDaily: number
    bestDay: { dateStr: string; amount: number } | null
  }
  progress: {
    hasTarget: boolean
    progressPct: number
    expectedPct: number
    expectedAmount: number
    paceDiff: number
    paceStatus: PaceStatus
    gap: number
    projection: number
    projectedPct: number
    dailyNeeded: number
    stretchPct: number | null
  }
  discipline: {
    missingDays: string[]
    missingCount: number
    lastEntryDate: string | null
    daysSinceLastEntry: number | null
    streak: number
    registeredDays: number
  }
  team: PulseTeamMember[]
  alerts: PulseAlert[]
  days: PulseDay[]
}

export interface PulseOverviewRow {
  workspaceId: string
  name: string
  hasTarget: boolean
  targetAmount: number
  billed: number
  progressPct: number
  expectedPct: number
  gap: number
  projection: number
  missingCount: number
  paceStatus: PaceStatus
}

export interface PulseOverview {
  period: { year: number; month: number; daysInMonth: number; elapsedDays: number; expectedPct: number }
  totals: {
    clients: number
    withTarget: number
    withoutTarget: number
    targetAmount: number
    billed: number
    behind: number
  }
  rows: PulseOverviewRow[]
}

export interface TargetHistoryRow {
  year: number
  month: number
  label: string
  targetAmount: number
  billedAmount: number
  progressPct: number
  hasTarget: boolean
}

/**
 * Segmento interno: meta mensual del cliente, ritmo contra la facturación real
 * y estado del equipo asignado. Todos los endpoints exigen ser interno o
 * superadmin — el cliente nunca ve esta capa.
 */
class InternalPulseService extends APIBase {
  async getWorkspacePulse(workspaceId: string, year: number, month: number) {
    const res = await this.get<WorkspacePulse>(`internal-pulse/${workspaceId}?year=${year}&month=${month}`)
    return res.data
  }

  async getOverview(year: number, month: number) {
    const res = await this.get<PulseOverview>(`internal-pulse/overview?year=${year}&month=${month}`)
    return res.data
  }

  async getHistory(workspaceId: string, months = 6) {
    const res = await this.get<{ history: TargetHistoryRow[] }>(
      `internal-pulse/${workspaceId}/history?months=${months}`,
    )
    return res.data.history
  }

  /** Estado corto para el menú: sirve para marcar "sin meta" sin cargar todo. */
  async getStatus(workspaceId: string, year: number, month: number) {
    const res = await this.get<{
      hasTarget: boolean
      targetAmount: number
      billed: number
      progressPct: number
      expectedPct: number
      paceStatus: PaceStatus
    }>(`internal-pulse/${workspaceId}/status?year=${year}&month=${month}`)
    return res.data
  }

  /** Cuántos clientes activos siguen sin meta este mes. */
  async getMissingCount(year: number, month: number) {
    const res = await this.get<{ total: number; withTarget: number; missing: number }>(
      `internal-pulse/missing-count?year=${year}&month=${month}`,
    )
    return res.data
  }

  async setTarget(
    workspaceId: string,
    payload: {
      year: number
      month: number
      targetAmount: number
      stretchAmount?: number
      notes?: string
      source?: 'manual' | 'carryover'
    },
  ) {
    const res = await this.put<{ message: string; target: MonthlyTarget }>(
      `internal-pulse/${workspaceId}/target`,
      payload,
    )
    return res.data
  }

  async remindTeam(workspaceId: string, sendEmail = true) {
    const res = await this.post<{ message: string }>(`internal-pulse/${workspaceId}/remind`, { sendEmail })
    return res.data
  }
}

export const internalPulseService = new InternalPulseService()
