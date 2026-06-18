import APIBase from './httpBase'

export interface GhlMeeting {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  calendarId?: string;
  attendees: any[];
  contact?: any;
  meetingLocation?: string;
  isGhlMeeting: boolean;
}

export interface GhlMeetingsResponse {
  message: string;
  meetings: GhlMeeting[];
}

class GhlService extends APIBase {
  /**
   * Fetches the GHL meetings (appointments) for a specific workspace
   * filtered by its users' emails.
   */
  async getWorkspaceMeetings(
    workspaceId: string,
    params: { startDate: string; endDate: string }
  ): Promise<GhlMeetingsResponse> {
    const res = await this.get<GhlMeetingsResponse>(
      `workspaces/${workspaceId}/meetings`,
      undefined,
      { params }
    )
    return res.data
  }
}

export const ghlService = new GhlService()
