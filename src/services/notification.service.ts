import APIBase from './httpBase'
import type {
  AppNotification,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types'

class NotificationService extends APIBase {
  async getMyNotifications(): Promise<AppNotification[]> {
    const res = await this.get<NotificationListResponse>('notifications')
    return res.data.notifications
  }

  async getUnreadCount(): Promise<number> {
    const res = await this.get<UnreadCountResponse>('notifications/unread-count')
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
