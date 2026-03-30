import APIBase from './httpBase'
import type { BrandProfile, BrandProfileFile } from '@/types'
import type { GuionIA } from '@/types/videoPlanning'

interface BrandProfileResponse {
  message: string
  brandProfile: BrandProfile
}

interface FileUploadResponse {
  message: string
  file: BrandProfileFile
}

interface ScriptGenerateResponse {
  message: string
  guionIA: GuionIA
  item: { _id: string; guionIA: GuionIA; tipoGuion?: string }
}

export interface LLMStatusResponse {
  available: boolean
  model: string
  error?: string
}

class BrandProfileService extends APIBase {
  async getProfile(workspaceId: string): Promise<BrandProfile | null> {
    try {
      const res = await this.get<BrandProfileResponse>(`workspaces/${workspaceId}/brand-profile`)
      return res.data.brandProfile
    } catch {
      return null
    }
  }

  async upsert(workspaceId: string, data: Partial<BrandProfile>): Promise<BrandProfile> {
    const res = await this.patch<BrandProfileResponse>(`workspaces/${workspaceId}/brand-profile`, data)
    return res.data.brandProfile
  }

  async uploadFile(workspaceId: string, file: File): Promise<BrandProfileFile> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await this.post<FileUploadResponse>(`workspaces/${workspaceId}/brand-profile/files`, fd)
    return res.data.file
  }

  async deleteFile(workspaceId: string, publicId: string): Promise<void> {
    await this.delete(`workspaces/${workspaceId}/brand-profile/files/${encodeURIComponent(publicId)}`)
  }

  async generateScript(
    videoItemId: string,
    contextoMes?: { productoMes?: string; ofertaEspecial?: string; referenciasAdicionales?: string },
  ): Promise<ScriptGenerateResponse> {
    const res = await this.post<ScriptGenerateResponse>(
      `video-planning/${videoItemId}/generate-script`,
      { contextoMes },
    )
    return res.data
  }

  async getLLMStatus(): Promise<LLMStatusResponse> {
    const res = await this.get<LLMStatusResponse>('video-planning/llm-status')
    return res.data
  }

  async generateScriptQuick(
    workspaceId: string,
    tema: string,
    tipo?: string,
    contextoMes?: { productoMes?: string; ofertaEspecial?: string; referenciasAdicionales?: string },
  ): Promise<ScriptGenerateResponse> {
    const res = await this.post<ScriptGenerateResponse>(
      'video-planning/generate-script-quick',
      { workspaceId, tema, tipo, contextoMes },
    )
    return res.data
  }
}

export const brandProfileService = new BrandProfileService()
