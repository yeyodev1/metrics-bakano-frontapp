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

export interface PendingMetaAccount {
  id: string
  accountId?: string
  name: string
  username?: string
  currency?: string
  profilePictureUrl?: string
  businessName?: string
  pageName?: string
  type: 'ad_account' | 'instagram'
}

export interface LinkedMetaAccount extends PendingMetaAccount {
  workspaceId: string
  workspaceName: string
}

export interface MetaLinkedResponse {
  linked: LinkedMetaAccount[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
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

  async runGlobalAutoMatch() {
    const response = await this.post<any>('meta/global/auto-match', {})
    return response.data
  }

  async getGlobalConnectionStatus() {
    const response = await this.get<{ connected: boolean; name?: string; expiresAt?: string; expired?: boolean }>('meta/global/status')
    return response.data
  }

  async getGlobalOAuthUrl() {
    const response = await this.get<{ authUrl: string }>('meta/global/oauth-url')
    return response.data.authUrl
  }

  async getGlobalPending(page = 1, limitOrSearch?: number | string, search?: string): Promise<MetaPendingResponse> {
    let limit = 10
    let searchStr: string | undefined = undefined

    if (typeof limitOrSearch === 'number') {
      limit = limitOrSearch
      searchStr = search
    } else if (typeof limitOrSearch === 'string') {
      searchStr = limitOrSearch
    }

    const params: Record<string, any> = { page, limit }
    if (typeof searchStr === 'string' && searchStr.trim()) {
      params.search = searchStr.trim()
    }
    const response = await this.get<MetaPendingResponse>('meta/global/pending', undefined, { params })
    return response.data
  }

  async getGlobalLinked(page = 1, limitOrSearch?: number | string, search?: string): Promise<MetaLinkedResponse> {
    let limit = 10
    let searchStr: string | undefined = undefined

    if (typeof limitOrSearch === 'number') {
      limit = limitOrSearch
      searchStr = search
    } else if (typeof limitOrSearch === 'string') {
      searchStr = limitOrSearch
    }

    const params: Record<string, any> = { page, limit }
    if (typeof searchStr === 'string' && searchStr.trim()) {
      params.search = searchStr.trim()
    }
    const response = await this.get<MetaLinkedResponse>('meta/global/linked', undefined, { params })
    return response.data
  }

  async getAllGlobalAccounts(): Promise<{ adAccounts: (PendingMetaAccount & { linkedWorkspace?: { id: string; name: string } | null })[]; instagramAccounts: (PendingMetaAccount & { linkedWorkspace?: { id: string; name: string } | null })[] }> {
    const response = await this.get<any>('meta/global/all-accounts')
    return response.data
  }

  async manuallyLinkGlobalAccount(data: { workspaceId: string; adAccountId?: string; instagramAccountId?: string }) {
    const response = await this.post<any>('meta/global/manual-link', data)
    return response.data
  }

  async unlinkGlobalAccount(data: { workspaceId: string; type: 'ad_account' | 'instagram' }) {
    const response = await this.post<any>('meta/global/unlink', data)
    return response.data
  }

  async refreshGlobalTokens() {
    const response = await this.post<{ message: string; refreshedWorkspaces: number }>('meta/global/refresh-tokens', {})
    return response.data
  }

  async getUnifiedDashboard(workspaceId: string, datePreset = 'this_month') {
    const response = await this.get<any>(`meta/${workspaceId}/unified-dashboard`, undefined, { params: { datePreset } })
    return response.data
  }
}

export const metaService = new MetaService()
