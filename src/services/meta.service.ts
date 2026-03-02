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
    adAccountId?: string;
    adAccountName?: string;
  }) {
    const response = await this.post<any>('meta/save-integration', data)
    return response.data
  }
}

export const metaService = new MetaService()
