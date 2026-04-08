import APIBase from './httpBase'

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: { data: { url: string } };
}

export interface MetaAuthResponse {
  message: string;
  longToken: string;
  pages: MetaPage[];
}

class MetaService extends APIBase {
  /**
   * Sends short token to backend to get long token and user pages
   */
  async authenticate(shortToken: string) {
    const response = await this.post<MetaAuthResponse>('meta/authenticate', { shortToken })
    return response.data
  }

  /**
   * Saves the final integration (picked page) to workspace
   */
  async saveIntegration(data: {
    workspaceId: string;
    pageId: string;
    pageName: string;
    accessToken: string;
    pageAccessToken?: string;
    adAccountId?: string;
    adAccountName?: string;
  }) {
    const response = await this.post<any>('meta/save-integration', data)
    return response.data
  }

  /**
   * Obtiene la lista de cuentas publicitarias vinculadas al usuario
   */
  async listAdAccounts(workspaceId: string) {
    const response = await this.get<any>(`meta/${workspaceId}/adaccounts`)
    return response.data
  }

  /**
   * Obtiene las métricas en modo solo lectura de todas las campañas
   */
  async getAdsInsights(workspaceId: string, adAccountId?: string, datePreset: string = 'this_month', since?: string, until?: string) {
    const params = new URLSearchParams({ datePreset })
    if (adAccountId) params.set('adAccountId', adAccountId)
    if (since && until) { params.set('since', since); params.set('until', until) }
    const response = await this.get<any>(`meta/${workspaceId}/ads-insights?${params}`)
    return response.data
  }

  /** Convenience: fetch total Meta spend for a specific year/month */
  async getMonthSpend(workspaceId: string, year: number, month: number): Promise<number> {
    const since = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const until = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const data = await this.getAdsInsights(workspaceId, undefined, 'this_month', since, until)
    const platforms: Array<{ spend: string }> = data.spendByPlatform ?? []
    return platforms.reduce((sum, p) => sum + parseFloat(p.spend || '0'), 0)
  }

  /**
   * Obtiene métricas orgánicas y los últimos posts de la página
   */
  async getOrganicInsights(workspaceId: string) {
    const response = await this.get<any>(`meta/${workspaceId}/organic-insights`)
    return response.data
  }
}

export const metaService = new MetaService()
