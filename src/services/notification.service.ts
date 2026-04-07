import APIBase from './httpBase'
import type { AppNotification, UnreadCountResponse } from '@/types'

export interface PaginatedNotificationsResponse {
  notifications: AppNotification[]
  total: number
  page: number
  totalPages: number
}

class NotificationService extends APIBase {
  async getMyNotifications(
    page = 1,
    limit = 10,
    workspaceId?: string
  ): Promise<PaginatedNotificationsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    if (workspaceId) params.set('workspaceId', workspaceId)
    const res = await this.get<PaginatedNotificationsResponse>(`notifications?${params}`)
    return res.data
  }

  async getUnreadCount(workspaceId?: string): Promise<number> {
    const qs = workspaceId ? `?workspaceId=${workspaceId}` : ''
    const res = await this.get<UnreadCountResponse>(`notifications/unread-count${qs}`)
    return res.data.count
  }

  async markRead(id: string): Promise<AppNotification> {
    const res = await this.patch<{ notification: AppNotification }>(`notifications/${id}/read`, {})
    return res.data.notification
  }

  async markAllRead(): Promise<void> {
    await this.patch('notifications/read-all', {})
  }

  async deleteOne(id: string): Promise<void> {
    await this.delete(`notifications/${id}`)
  }
}

export const notificationService = new NotificationService()
