import APIBase from './httpBase'

/** Facturación de Bakano (viene del backend de finanzas vía proxy). */

export interface IFinanceInvoice {
  _id: string
  period: string
  splitLabel?: string | null
  amount: number
  currency: string
  paidAmount: number
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'waived' | 'cancelled'
  dueDate: string
  paidAt?: string | null
  isAdvance?: boolean
}

export interface IFinancePayment {
  _id: string
  amount: number
  currency: string
  paidAt: string
  method: string
  reference?: string
  receiptUrl?: string
  grossAmount?: number
  feeAmount?: number
  source?: string
  period: string
}

export interface IFinanceSubmission {
  _id: string
  grossAmount: number
  feeAmount: number
  netAmount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected'
  reviewDueAt: string
  reviewNote?: string
  receiptUrl: string
  createdAt: string
}

export interface IFinanceBilling {
  client: { id: string; name: string }
  summary: {
    pendingBalance: number
    totalPaid: number
    openInvoices: number
    stripeEnabled: boolean
  }
  invoices: IFinanceInvoice[]
  payments: IFinancePayment[]
  submissions: IFinanceSubmission[]
}

class FinanceBillingService extends APIBase {
  async getBilling(workspaceId: string) {
    const res = await this.get<IFinanceBilling>(`workspaces/${workspaceId}/finance-billing`)
    return res.data
  }

  async createCheckout(workspaceId: string, invoiceId: string) {
    const res = await this.post<{ url: string; sessionId: string }>(
      `workspaces/${workspaceId}/finance-billing/checkout`,
      { invoiceId }
    )
    return res.data
  }

  async submitReceipt(workspaceId: string, form: FormData) {
    const res = await this.post<{ submission: IFinanceSubmission }>(
      `workspaces/${workspaceId}/finance-billing/submissions`,
      form
    )
    return res.data
  }
}

export default new FinanceBillingService()
