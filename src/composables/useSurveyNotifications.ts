import { ref, computed } from 'vue'
import { planningService } from '@/services/planning.service'

const STORAGE_KEY = 'survey_notif_dismissed'

export interface SurveyNotification {
  id: string
  title: string
  workspaceId: string
  workspaceName: string
  date: Date
}

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveDismissed(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useSurveyNotifications() {
  const all = ref<SurveyNotification[]>([])
  const dismissed = ref<string[]>(getDismissed())
  const isLoading = ref(false)

  const visible = computed(() =>
    all.value.filter((n) => !dismissed.value.includes(n.id)),
  )

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const res = await planningService.listMyWeek({
        startDate: sevenDaysAgo.toISOString(),
        endDate: now.toISOString(),
      })

      all.value = (res.entries ?? [])
        .filter((e: any) => new Date(e.date) < now)
        .map((e: any) => ({
          id: e._id as string,
          title: e.title as string,
          workspaceId: (e.workspaceId as string),
          workspaceName: (e.workspaceName as string) || 'Entorno',
          date: new Date(e.date),
        }))
    } catch {
      // Silent — notifications are non-critical
    } finally {
      isLoading.value = false
    }
  }

  function dismiss(id: string): void {
    if (!dismissed.value.includes(id)) {
      dismissed.value = [...dismissed.value, id]
      saveDismissed(dismissed.value)
    }
  }

  function dismissAll(): void {
    dismissed.value = all.value.map((n) => n.id)
    saveDismissed(dismissed.value)
  }

  return { visible, isLoading, load, dismiss, dismissAll }
}
