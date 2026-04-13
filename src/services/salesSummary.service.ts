import APIBase from './httpBase'

export interface IStoreSummary {
  storeName: string
  sessions: number
  orders: number
  revenue: number
  deliveryCost: number
}

export interface ISalesDaySummary {
  _id?: string
  workspaceId: string
  date: string // YYYY-MM-DD
  totalSessions: number
  totalOrders: number
  conversionRate: number
  totalRevenue: number
  totalDelivery: number
  totalBilled: number
  byStore: IStoreSummary[]
  syncedAt: string
}

export interface ISalesMonthData {
  days: ISalesDaySummary[]
  totalSessions: number
  totalOrders: number
  totalRevenue: number
  totalBilled: number
  monthConversionRate: number
}

export interface ISyncResult {
  date: string
  totalSessions: number
  totalOrders: number
  conversionRate: number
  totalRevenue: number
  totalBilled: number
  byStore: IStoreSummary[]
  syncedAt: string
  apiCallsUsedToday: number
  apiCallsRemainingToday: number
}

export interface IApiUsage {
  date: string
  callsUsedToday: number
  callsRemainingToday: number
  dailyLimit: number
  tokenExpiresAt: string
}

class SalesSummaryService extends APIBase {
  async getMonthData(workspaceId: string, year: number, month: number): Promise<ISalesMonthData> {
    const res = await this.get<ISalesMonthData>(
      `sales-summary/${workspaceId}/month?year=${year}&month=${month}`
    )
    return res.data
  }

  async triggerSync(workspaceId: string, date?: string): Promise<{ message: string; result: ISyncResult }> {
    const url = date
      ? `sales-summary/${workspaceId}/sync?date=${date}`
      : `sales-summary/${workspaceId}/sync`
    const res = await this.post<{ message: string; result: ISyncResult }>(url, {})
    return res.data
  }

  async getApiUsage(workspaceId: string): Promise<IApiUsage> {
    const res = await this.get<IApiUsage>(`sales-summary/${workspaceId}/api-usage`)
    return res.data
  }

  async syncRange(workspaceId: string, from: string, to: string): Promise<{ message: string; results: Array<{ date: string; synced: boolean; error?: string }> }> {
    const res = await this.post(`sales-summary/${workspaceId}/sync-range?from=${from}&to=${to}`, {})
    return res.data
  }
}

export const salesSummaryService = new SalesSummaryService()
