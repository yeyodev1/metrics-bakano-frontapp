import APIBase from './httpBase'

export interface IDailyBillingEntry {
  _id: string
  workspaceId: string
  userId: string
  userName: string
  userEmail: string
  date: string
  amount: number
  onlineRevenue?: number
  metaSpend: number
  roas: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IDaySummary {
  date: string
  totalAmount: number
  totalOnlineRevenue: number
  totalMetaSpend: number
  avgROAS: number
  entries: IDailyBillingEntry[]
  entryCount: number
}

export interface IMonthData {
  days: IDaySummary[]
  totalAmount: number
  totalOnlineRevenue: number
  totalMetaSpend: number
  avgROAS: number
}

class BillingService extends APIBase {
  async createEntry(workspaceId: string, data: { amount: number; notes?: string; date?: string; onlineRevenue?: number }) {
    const res = await this.post<{ entry: IDailyBillingEntry; daySummary: IDaySummary }>(
      `billing/${workspaceId}`,
      data
    )
    return res.data
  }

  async getMonthData(workspaceId: string, year: number, month: number) {
    const res = await this.get<IMonthData>(
      `billing/${workspaceId}/month?year=${year}&month=${month}`
    )
    return res.data
  }

  async getDaySummary(workspaceId: string, date: string) {
    const res = await this.get<IDaySummary>(`billing/${workspaceId}/day?date=${date}`)
    return res.data
  }

  async getMyEntryToday(workspaceId: string) {
    const res = await this.get<{ entry: IDailyBillingEntry | null }>(
      `billing/${workspaceId}/my-entry-today`
    )
    return res.data
  }

  async updateEntry(
    workspaceId: string,
    entryId: string,
    data: { amount: number; notes?: string; onlineRevenue?: number }
  ) {
    const res = await this.put<{ entry: IDailyBillingEntry; daySummary: IDaySummary }>(
      `billing/${workspaceId}/entry/${entryId}`,
      data
    )
    return res.data
  }
}

export const billingService = new BillingService()
