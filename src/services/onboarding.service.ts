import APIBase from './httpBase'
import type { OnboardingStatusResponse } from '@/types'

export interface EstadoCorreoContrato {
  correo: string | null
  enviadoEn: string | null
  estado: 'sin_enviar' | 'enviando' | 'entregado' | 'abierto' | 'demorado' | 'rebotado' | 'desconocido'
}

export interface EnvioContrato {
  ok: boolean
  correo?: string
  motivo?: string
}

class OnboardingService extends APIBase {
  async getStatus(workspaceId: string): Promise<OnboardingStatusResponse> {
    const res = await this.get<OnboardingStatusResponse>(`onboarding/${workspaceId}`)
    return res.data
  }

  async acceptVideo(workspaceId: string): Promise<void> {
    await this.post(`onboarding/${workspaceId}/step1`, {})
  }

  /** Firma y devuelve cómo salió el correo con el contrato firmado. */
  async submitContract(workspaceId: string, data: any): Promise<{ correo: EnvioContrato }> {
    const res = await this.post<{ correo: EnvioContrato }>(`onboarding/${workspaceId}/step2`, data)
    return res.data
  }

  async estadoCorreoContrato(workspaceId: string): Promise<EstadoCorreoContrato> {
    const res = await this.get<EstadoCorreoContrato>(`onboarding/${workspaceId}/contract-email`)
    return res.data
  }

  async reenviarContrato(workspaceId: string, correo?: string): Promise<EnvioContrato> {
    const res = await this.post<EnvioContrato>(`onboarding/${workspaceId}/contract-email`, correo ? { correo } : {})
    return res.data
  }

  async markMeetingScheduled(workspaceId: string): Promise<void> {
    await this.post(`onboarding/${workspaceId}/step3`, {})
  }
}

export const onboardingService = new OnboardingService()
