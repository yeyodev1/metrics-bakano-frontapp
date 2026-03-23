import APIBase from './httpBase'
import type {
  ClientMeeting,
  MeetingListResponse,
  MeetingResponse,
  CreateMeetingPayload,
  UpdateMeetingPayload,
} from '@/types'

class MeetingService extends APIBase {
  async createOrUpdate(payload: CreateMeetingPayload): Promise<ClientMeeting> {
    const res = await this.post<MeetingResponse>('meetings', payload)
    return res.data.meeting
  }

  async getMyMeetings(): Promise<ClientMeeting[]> {
    const res = await this.get<MeetingListResponse>('meetings/my')
    return res.data.meetings
  }

  async getByWorkspace(workspaceId: string): Promise<ClientMeeting | null> {
    const res = await this.get<{ meeting: ClientMeeting | null }>(`meetings/workspace/${workspaceId}`)
    return res.data.meeting
  }

  async updateMeeting(id: string, payload: UpdateMeetingPayload): Promise<ClientMeeting> {
    const res = await this.patch<MeetingResponse>(`meetings/${id}`, payload)
    return res.data.meeting
  }

  async completeMeeting(id: string, opts: { notes?: string; recordingLink?: string } = {}): Promise<ClientMeeting> {
    const res = await this.patch<MeetingResponse>(`meetings/${id}/complete`, opts)
    return res.data.meeting
  }
}

export const meetingService = new MeetingService()
