import APIBase from './httpBase'
import type { BrandProfile, BrandProfileFile } from '@/types'
import type { GuionIA, TipoGuion, ObjetivoGuion } from '@/types/videoPlanning'

interface BrandProfileResponse {
  message: string
  brandProfile: BrandProfile
}

interface FileUploadResponse {
  message: string
  file: BrandProfileFile
}

export interface ScriptContextInfo {
  cliente: string | null
  vertical: string | null
  tipoNegocio: string | null
  tema: string
  etapaEmbudo: string
  casoJourney: { numero: number; nombre: string; dolor: string } | null
  usoAprendizajes: boolean
  datosDisponibles: {
    propuestaValor: boolean
    segmentos: number
    canales: number
    casosJourney: number
    archivosDeMarca: number
  }
}

interface ScriptGenerateResponse {
  message: string
  /** Present when a single script was generated and saved. */
  guionIA?: GuionIA
  item?: { _id: string; guionIA: GuionIA; tipoGuion?: string }
  /** Present when several variants were requested; nothing is saved yet. */
  opciones?: Array<GuionIA & { angulo?: string }>
  contexto?: ScriptContextInfo
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
    tipoGuion?: TipoGuion,
    objetivo?: ObjetivoGuion,
    /** >1 returns options to choose from instead of saving directly. */
    variantes?: number,
    /** Saca el Hook 2 a su propio campo en vez de esconderlo en el cuerpo. */
    dobleHook?: boolean,
  ): Promise<ScriptGenerateResponse> {
    const res = await this.post<ScriptGenerateResponse>(
      `video-planning/${videoItemId}/generate-script`,
      { contextoMes, tipoGuion, objetivo, variantes, dobleHook },
      undefined,
      { timeout: 60000 },
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
    tipoGuion?: TipoGuion,
    objetivo?: ObjetivoGuion,
    dobleHook?: boolean,
  ): Promise<ScriptGenerateResponse> {
    const res = await this.post<ScriptGenerateResponse>(
      'video-planning/generate-script-quick',
      { workspaceId, tema, tipo, contextoMes, tipoGuion, objetivo, dobleHook },
      undefined,
      { timeout: 60000 },
    )
    return res.data
  }
}

export const brandProfileService = new BrandProfileService()
