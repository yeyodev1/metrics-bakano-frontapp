import APIBase from './httpBase'

export interface SalesBookingEligibility {
  eligible: boolean
  hasSalesInformation: boolean
  isBillingUpToDate: boolean
  missingBillingDates: string[]
}

class BookingService extends APIBase {
  async getSalesEligibility(workspaceId: string) {
    const res = await this.get<SalesBookingEligibility>(`booking/${workspaceId}/sales-eligibility`)
    return res.data
  }

  async submitSalesRequest(workspaceId: string, data: Record<string, string | number>, evidence: File[]) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => formData.append(key, String(value)))
    evidence.forEach((file) => formData.append('evidence', file))
    const res = await this.post<SalesBookingEligibility>(`booking/${workspaceId}/sales-request`, formData)
    return res.data
  }
}

export const bookingService = new BookingService()
