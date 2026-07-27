import APIBase from './httpBase'

export interface SalesBookingEligibility {
  eligible: boolean
  hasSalesInformation: boolean
  isBillingUpToDate: boolean
  missingBillingDates: string[]
  salesAppointment: { startsAt: string; endsAt?: string; status: string } | null
}

export interface SalesEvidenceUpload {
  file: File
  description: string
}

export interface UpcomingSalesAppointment {
  salesAppointment: SalesBookingEligibility['salesAppointment']
}

class BookingService extends APIBase {
  async getSalesEligibility(workspaceId: string) {
    const res = await this.get<SalesBookingEligibility>(`booking/${workspaceId}/sales-eligibility`)
    return res.data
  }

  async getUpcomingSalesAppointment(workspaceId: string) {
    const res = await this.get<UpcomingSalesAppointment>(`booking/${workspaceId}/upcoming-sales-appointment`)
    return res.data
  }

  async submitSalesRequest(workspaceId: string, data: Record<string, string | number>, evidence: SalesEvidenceUpload[]) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => formData.append(key, String(value)))
    evidence.forEach(({ file }) => formData.append('evidence', file))
    formData.append('evidenceMetadata', JSON.stringify(evidence.map(({ description }) => ({ description }))))
    const res = await this.post<SalesBookingEligibility>(`booking/${workspaceId}/sales-request`, formData)
    return res.data
  }
}

export const bookingService = new BookingService()
