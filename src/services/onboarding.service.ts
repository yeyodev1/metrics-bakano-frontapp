import APIBase from './httpBase'
import type { OnboardingStatusResponse } from '@/types'

class OnboardingService extends APIBase {
  async getStatus(workspaceId: string): Promise<OnboardingStatusResponse> {
    const res = await this.get<OnboardingStatusResponse>(`onboarding/${workspaceId}`)
    return res.data
  }

  async acceptVideo(workspaceId: string): Promise<void> {
    await this.post(`onboarding/${workspaceId}/step1`, {})
  }

  async submitContract(workspaceId: string, data: any): Promise<void> {
    await this.post(`onboarding/${workspaceId}/step2`, data)
  }

  async markMeetingScheduled(workspaceId: string): Promise<void> {
    await this.post(`onboarding/${workspaceId}/step3`, {})
  }
}

export const onboardingService = new OnboardingService()
