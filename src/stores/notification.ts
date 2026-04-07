import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationService } from '@/services/notification.service'
import { useUserStore } from '@/stores/user'
import type { AppNotification } from '@/types'

const PAGE_SIZE = 10

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const notifications = ref<AppNotification[]>([])
  const currentPage = ref(1)
  const totalPages = ref(1)
  const total = ref(0)
  const isLoading = ref(false)

  function getWorkspaceFilter(): string | undefined {
    const userStore = useUserStore()
    if (userStore.isInternal || userStore.role === 'superadmin') return undefined
    return userStore.workspaceId ?? undefined
  }

  async function fetchUnreadCount() {
    try {
      unreadCount.value = await notificationService.getUnreadCount(getWorkspaceFilter())
    } catch {
      // silent
    }
  }

  async function fetchPage(page = 1) {
    isLoading.value = true
    try {
      const result = await notificationService.getMyNotifications(
        page,
        PAGE_SIZE,
        getWorkspaceFilter()
      )
      notifications.value = result.notifications
      currentPage.value = result.page
      totalPages.value = result.totalPages
      total.value = result.total
      // Sync unread count from current page + keep fetching real count
      fetchUnreadCount()
    } catch {
      // silent
    } finally {
      isLoading.value = false
    }
  }

  // Alias used by AppLayout badge polling
  async function fetchAll() {
    return fetchPage(1)
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
      total.value = Math.max(0, total.value - 1)
      totalPages.value = Math.max(1, Math.ceil(total.value / PAGE_SIZE))
      // If current page is now empty and not page 1, go back
      if (notifications.value.length === 0 && currentPage.value > 1) {
        await fetchPage(currentPage.value - 1)
      }
    } catch {
      // silent
    }
  }

  return {
    unreadCount,
    notifications,
    currentPage,
    totalPages,
    total,
    isLoading,
    fetchUnreadCount,
    fetchAll,
    fetchPage,
    markRead,
    markAllRead,
    deleteOne,
  }
})
