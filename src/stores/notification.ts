import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationService } from '@/services/notification.service'
import { useUserStore } from '@/stores/user'
import type { AppNotification } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const notifications = ref<AppNotification[]>([])

  function getWorkspaceFilter(): string | undefined {
    const userStore = useUserStore()
    // Internal users and superadmins see all workspaces; clients are scoped to their workspace
    if (userStore.isInternal || userStore.role === 'superadmin') return undefined
    return userStore.workspaceId ?? undefined
  }

  async function fetchUnreadCount() {
    try {
      unreadCount.value = await notificationService.getUnreadCount(getWorkspaceFilter())
    } catch {
      // silent — don't break layout if endpoint fails
    }
  }

  async function fetchAll() {
    try {
      notifications.value = await notificationService.getMyNotifications(getWorkspaceFilter())
      unreadCount.value = notifications.value.filter(n => !n.isRead).length
    } catch {
      // silent
    }
  }

  async function markRead(id: string) {
    try {
      const updated = await notificationService.markRead(id)
      const idx = notifications.value.findIndex(n => n._id === id)
      if (idx !== -1) notifications.value[idx] = updated
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await notificationService.markAllRead()
      notifications.value = notifications.value.map(n => ({ ...n, isRead: true }))
      unreadCount.value = 0
    } catch {
      // silent
    }
  }

  async function deleteOne(id: string) {
    try {
      await notificationService.deleteOne(id)
      const n = notifications.value.find(n => n._id === id)
      if (n && !n.isRead) unreadCount.value = Math.max(0, unreadCount.value - 1)
      notifications.value = notifications.value.filter(n => n._id !== id)
    } catch {
      // silent
    }
  }

  return {
    unreadCount,
    notifications,
    fetchUnreadCount,
    fetchAll,
    markRead,
    markAllRead,
    deleteOne,
  }
})
