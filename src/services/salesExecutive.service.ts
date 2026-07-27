import APIBase from './httpBase'

export interface SalesExecutiveMeeting {
  id: string
  startsAt: string
  endsAt?: string
  status: string
  client: { name: string; email: string }
  workspace: { id: string; name: string }
  diagnostic: {
    salesApproach: string
    commonObjection: string
    otherObjection?: string
    evidence: Array<{ name: string; url: string; mimeType: string; description?: string }>
  } | null
}

export interface SalesBookingForm {
  id: string
  submittedAt: string
  client: { name: string; email: string }
  workspace: { id: string; name: string }
  diagnostic: SalesExecutiveMeeting['diagnostic']
  billing: {
    cutoffDate: string
    totalRevenue: number
    totalMetaSpend: number
    roas: number
    registeredDays: number
    entries: Array<{ date: string; amount: number; metaSpend: number; roas: number }>
    monthlyComparison: {
      currentMonthStart: string
      previousMonthStart: string
      currentMonthRevenue: number
      previousMonthRevenue: number
      changePercent: number | null
    }
  }
}

class SalesExecutiveService extends APIBase {
  async getUpcomingMeetings() {
    const response = await this.get<{ meetings: SalesExecutiveMeeting[] }>('sales-executive/upcoming-meetings')
    return response.data
  }

  async getBookingForms() {
    const response = await this.get<{ forms: SalesBookingForm[] }>('sales-executive/booking-forms')
    return response.data
  }

  async getBookingFormById(formId: string) {
    const response = await this.get<{ form: SalesBookingForm }>(`sales-executive/booking-forms/${formId}`)
    return response.data.form
  }
}

export const salesExecutiveService = new SalesExecutiveService()
