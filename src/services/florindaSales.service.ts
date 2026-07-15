import APIBase from './httpBase'

export interface IFlorindaBreakdown {
  name: string
  invoiceCount: number
  totalSales: number
}

export interface IFlorindaSalesDay {
  _id: string
  date: string
  invoiceCount: number
  lineItemCount: number
  netSales: number
  tax: number
  discount: number
  totalSales: number
  byChannel: IFlorindaBreakdown[]
  bySeller: IFlorindaBreakdown[]
  syncedAt: string
}

export interface IFlorindaSalesMonth {
  days: IFlorindaSalesDay[]
  invoiceCount: number
  lineItemCount: number
  netSales: number
  tax: number
  discount: number
  totalSales: number
}

class FlorindaSalesService extends APIBase {
  async getMonth(workspaceId: string, year: number, month: number) {
    const response = await this.get<IFlorindaSalesMonth>(
      `florinda-sales/${workspaceId}/month?year=${year}&month=${month}`,
    )
    return response.data
  }
}

export const florindaSalesService = new FlorindaSalesService()
