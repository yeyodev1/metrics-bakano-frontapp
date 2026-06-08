import { ref, computed, watch } from 'vue'
import { billingService, type IMonthData, type IDaySummary } from '@/services/billing.service'
import { workspaceService } from '@/services/workspace.service'
import { useUserStore } from '@/stores/user'

export function useBillingAnalytics(workspaceIdRef: { value: string }) {
  const userStore = useUserStore()
  
  const workspaceName = ref(localStorage.getItem('user_workspaceName') || '')
  
  const now = new Date()
  const currentYear = ref(now.getFullYear())
  const currentMonth = ref(now.getMonth() + 1)
  
  const loading = ref(false)
  const errorMsg = ref('')
  const monthData = ref<IMonthData | null>(null)
  const todayDaySummary = ref<IDaySummary | null>(null)
  const myEntryToday = ref<{ _id: string; amount: number } | null>(null)
  
  const filterOnlyWithData = ref(false)
  const filterMyEntries = ref(false)
  
  const todayStr = computed(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  
  const isCurrentMonth = computed(() => {
    const n = new Date()
    return currentYear.value === n.getFullYear() && currentMonth.value === n.getMonth() + 1
  })
  
  const monthLabel = computed(() => {
    const d = new Date(currentYear.value, currentMonth.value - 1, 1)
    return d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
  })
  
  const hasAnyData = computed(() => (monthData.value?.days?.length ?? 0) > 0)
  
  function dateStr(date: string): string { return date.substring(0, 10) }
  function isMyEntry(entry: any): boolean {
    return (!!userStore.id && entry.userId === userStore.id) ||
           (!!userStore.email && entry.userEmail === userStore.email)
  }
  
  const calendarEntryMap = computed(() => {
    const map: Record<string, { hasMyEntry: boolean; total: number; entryCount: number }> = {}
    for (const day of (monthData.value?.days ?? [])) {
      const key = dateStr(day.date)
      const hasMyEntry = day.entries?.some((e: any) => isMyEntry(e)) ?? false
      map[key] = { hasMyEntry, total: day.totalAmount, entryCount: day.entryCount }
    }
    return map
  })
  
  const isBoloncity = computed(() => workspaceIdRef.value === '69bdadc67386136fc3682734')
  const canEnterBilling = computed(() => userStore.role === 'superadmin' || !userStore.isInternal)
  const todayHasMyEntry = computed(() => !!myEntryToday.value)
  
  function canRegisterOnDay(day: { date: string; entries?: any[] }): boolean {
    if (!canEnterBilling.value) return false
    const dayTime = new Date(dateStr(day.date) + 'T12:00:00').getTime()
    const todayTime = new Date(todayStr.value + 'T12:00:00').getTime()
    if (dayTime > todayTime) return false
    if (day.entries?.some((e: any) => isMyEntry(e))) return false
    return true
  }
  
  const daysToShow = computed(() => {
    if (!monthData.value) return []
    const existingMap = new Map<string, any>()
    for (const d of (monthData.value.days ?? [])) {
      existingMap.set(dateStr(d.date), d)
    }
    
    const year = currentYear.value
    const month = currentMonth.value
    const daysInMonth = new Date(year, month, 0).getDate()
    const lastDay = isCurrentMonth.value ? new Date().getDate() : daysInMonth
    
    const all = []
    for (let d = 1; d <= lastDay; d++) {
      const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      all.push(existingMap.get(key) ?? { date: key, totalAmount: 0, totalMetaSpend: 0, avgROAS: 0, entries: [], entryCount: 0 })
    }
    
    return all
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(d => {
        if (filterOnlyWithData.value && d.entryCount === 0) return false
        if (filterMyEntries.value && !d.entries?.some((e: any) => isMyEntry(e))) return false
        return true
      })
  })
  
  const pendingDays = computed(() => {
    if (!canEnterBilling.value) return []
    return daysToShow.value.filter(d => canRegisterOnDay(d))
  })
  
  const monthTotals = computed(() => {
    const days = monthData.value?.days ?? []
    const totalAmount = days.reduce((sum, d) => sum + d.totalAmount, 0)
    const totalOnlineRevenue = days.reduce((sum, d) => sum + (d.totalOnlineRevenue ?? 0), 0)
    const totalMetaSpend = days.reduce((sum, d) => sum + d.totalMetaSpend, 0)
    const avgROAS = totalMetaSpend > 0 ? totalAmount / totalMetaSpend : 0
    return { totalAmount, totalOnlineRevenue, totalMetaSpend, avgROAS }
  })
  
  const BRANCH_COLORS = ['#3b82f6', '#059669', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316']
  const branchMonthSummary = computed(() => {
    const map = new Map<string, { name: string; total: number }>()
    for (const day of (monthData.value?.days ?? [])) {
      for (const entry of (day.entries ?? [])) {
        for (const b of (entry.branches ?? [])) {
          const existing = map.get(b.branchId)
          if (existing) {
            existing.total += b.amount
          } else {
            map.set(b.branchId, { name: b.name, total: b.amount })
          }
        }
      }
    }
    return Array.from(map.entries())
      .map(([id, data], i) => ({ branchId: id, name: data.name, total: data.total, color: BRANCH_COLORS[i % BRANCH_COLORS.length] }))
      .sort((a, b) => b.total - a.total)
  })
  
  async function fetchMonth() {
    if (!workspaceIdRef.value) return
    loading.value = true
    errorMsg.value = ''
    try {
      monthData.value = await billingService.getMonthData(workspaceIdRef.value, currentYear.value, currentMonth.value)
    } catch (e: any) {
      errorMsg.value = e?.message || 'Error al cargar los datos'
      setTimeout(() => (errorMsg.value = ''), 4000)
    } finally {
      loading.value = false
    }
  }
  
  async function fetchTodayStatus() {
    if (!workspaceIdRef.value) return
    try {
      const { workspace } = await workspaceService.getWorkspace(workspaceIdRef.value)
      workspaceName.value = workspace.name || 'Workspace'
      localStorage.setItem('user_workspaceName', workspaceName.value)
    } catch {
      // silent, leave fallback
    }

    try {
      const [summaryRes, myEntryRes] = await Promise.all([
        billingService.getDaySummary(workspaceIdRef.value, todayStr.value),
        billingService.getMyEntryToday(workspaceIdRef.value),
      ])
      todayDaySummary.value = summaryRes
      myEntryToday.value = myEntryRes.entry ? { _id: myEntryRes.entry._id, amount: myEntryRes.entry.amount } : null
    } catch { /* silent */ }
  }
  
  function prevMonth() {
    if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
    else { currentMonth.value-- }
  }
  
  function nextMonth() {
    if (isCurrentMonth.value) return
    if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
    else { currentMonth.value++ }
  }
  
  watch([currentYear, currentMonth], fetchMonth)
  
  return {
    workspaceName,
    currentYear,
    currentMonth,
    loading,
    errorMsg,
    monthData,
    todayDaySummary,
    myEntryToday,
    filterOnlyWithData,
    filterMyEntries,
    todayStr,
    isCurrentMonth,
    monthLabel,
    hasAnyData,
    calendarEntryMap,
    isBoloncity,
    canEnterBilling,
    todayHasMyEntry,
    daysToShow,
    pendingDays,
    monthTotals,
    branchMonthSummary,
    fetchMonth,
    fetchTodayStatus,
    prevMonth,
    nextMonth,
    canRegisterOnDay,
    isMyEntry,
    dateStr
  }
}
