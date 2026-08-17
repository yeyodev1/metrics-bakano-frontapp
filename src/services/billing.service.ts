import APIBase from './httpBase'
import { prefetchCache } from './prefetchCache'

export interface IBillingBranchEntry {
  branchId: string
  name: string
  amount: number
}

export interface IDailyBillingEntry {
  _id: string
  workspaceId: string
  userId: string
  userName: string
  userEmail: string
  date: string
  amount: number
  onlineRevenue?: number
  branches?: IBillingBranchEntry[]
  metaSpend: number
  roas: number
  notes?: string
  isBulkDistribution?: boolean
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
  /** Clave de la caché de prefetch. Compartida con `useRoutePrefetch`. */
  claveMes(workspaceId: string, year: number, month: number): string {
    return `billing:${workspaceId}:${year}-${month}`
  }

  async createEntry(workspaceId: string, data: { amount: number; notes?: string; date?: string; onlineRevenue?: number; branches?: { branchId: string; amount: number }[] }) {
    const res = await this.post<{ entry: IDailyBillingEntry; daySummary: IDaySummary }>(
      `billing/${workspaceId}`,
      data
    )
    prefetchCache.invalidar(`billing:${workspaceId}`)
    return res.data
  }

  /**
   * Si el mes ya se pidió por adelantado (hover en el sidebar), se reusa esa
   * misma petición en vez de abrir otra. La caché dura 30s y se tira entera al
   * escribir, asi que no puede devolver cifras posteriores a un guardado.
   */
  async getMonthData(workspaceId: string, year: number, month: number) {
    const cacheada = prefetchCache.leer<IMonthData>(this.claveMes(workspaceId, year, month))
    if (cacheada) return cacheada

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

  async getMissingCurrentMonthDates(workspaceId: string, year: number, month: number) {
    const res = await this.get<{ dates: string[]; count: number }>(`billing/${workspaceId}/missing-current-month?year=${year}&month=${month}`)
    return res.data
  }

  async distributeCurrentMonth(
    workspaceId: string,
    data: { total: number; allocations: { date: string; amount: number }[]; year: number; month: number; notes?: string }
  ) {
    const res = await this.post<{ entries: IDailyBillingEntry[] }>(`billing/${workspaceId}/distribute`, data)
    prefetchCache.invalidar(`billing:${workspaceId}`)
    return res.data
  }

  async updateEntry(
    workspaceId: string,
    entryId: string,
    data: { amount: number; notes?: string; onlineRevenue?: number; branches?: { branchId: string; amount: number }[] }
  ) {
    const res = await this.put<{ entry: IDailyBillingEntry; daySummary: IDaySummary }>(
      `billing/${workspaceId}/entry/${entryId}`,
      data
    )
    prefetchCache.invalidar(`billing:${workspaceId}`)
    return res.data
  }
}

export const billingService = new BillingService()
