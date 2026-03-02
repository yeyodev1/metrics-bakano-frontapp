import APIBase from './httpBase'

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
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
    pageAccessToken: string;
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
  async getAdsInsights(workspaceId: string, adAccountId?: string) {
    const query = adAccountId ? `?adAccountId=${adAccountId}` : ''
    const response = await this.get<any>(`meta/${workspaceId}/ads-insights${query}`)
    return response.data
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
