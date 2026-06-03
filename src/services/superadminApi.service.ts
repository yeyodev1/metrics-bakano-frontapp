import APIBase from './httpBase'

class SuperadminApiService extends APIBase {
  async getApiKey() {
    const res = await this.get<{ apiKey: string | null; apiKeyCreatedAt: string | null }>(
      'admin/apikey',
    )
    return res.data
  }

  async generateApiKey() {
    const res = await this.post<{ apiKey: string; apiKeyCreatedAt: string; message: string }>(
      'admin/apikey',
      {},
    )
    return res.data
  }

  async revokeApiKey() {
    const res = await this.delete<{ message: string }>('admin/apikey')
    return res.data
  }

  async getPublicMetrics(
    apiKey: string,
    params: { page?: number; limit?: number; workspaceId?: string; date?: string } = {},
  ) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))
    if (params.workspaceId) query.set('workspaceId', params.workspaceId)
    if (params.date) query.set('date', params.date)
    const endpoint = `public/metrics${query.toString() ? `?${query.toString()}` : ''}`
    const res = await this.get<any>(endpoint, { 'x-api-key': apiKey })
    return res.data
  }

  async getBillingAlerts(apiKey: string) {
    const res = await this.get<any>('public/billing-alerts', { 'x-api-key': apiKey })
    return res.data
  }
}

export const superadminApiService = new SuperadminApiService()
