import { ref, computed, watch } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { billingService } from '@/services/billing.service'
import { salesSummaryService } from '@/services/salesSummary.service'
import { metaService } from '@/services/meta.service'
import { notificationService } from '@/services/notification.service'

export interface Card {
  id: string
  name: string
  pageId?: string
  metaConnected: boolean
  roas: number
  revenue: number
  onlineRevenue: number
  spend: number
  ts?: number
}

export type FilterMode = 'all' | 'con_pauta' | 'sin_pauta'

export interface GroupDef {
  id: string
  label: string
  desc: string
  icon: string
  color: string
  needsReminder: boolean
  cards: Card[]
}

const BOLONCITY_WS_ID = '69bdadc67386136fc3682734'
const CACHE_TTL = 5 * 60 * 1000

interface CachedBilling {
  revenue: number
  onlineRevenue: number
  spend: number
  roas: number
  ts: number
}

export function useTraffickerDashboard() {
  const isLoading = ref(false)
  const cards = ref<Card[]>([])
  
  const currentYear = ref(new Date().getFullYear())
  const currentMonth = ref(new Date().getMonth() + 1)
  const isCurrentMonth = computed(() => {
    const n = new Date()
    return currentYear.value === n.getFullYear() && currentMonth.value === n.getMonth() + 1
  })

  // Filtering
  const filterMode = ref<FilterMode>('all')
  const searchQuery = ref('')
  const filteredCards = computed(() => {
    const src = cards.value
    if (filterMode.value === 'con_pauta') return src.filter(c => c.spend > 0)
    if (filterMode.value === 'sin_pauta') return src.filter(c => c.spend === 0)
    return src
  })

  // Cache
  const billingCache = new Map<string, CachedBilling>()
  const metaSpendCache = new Map<string, number>()

  // Reminders State
  const remindingSet = ref(new Set<string>())
  const remindedSet = ref(new Set<string>())
  const remindAll = ref({ active: false, done: 0, total: 0, errors: 0 })
  const remindAllDone = ref(false)

  // Metrics
  const totalRevenue = computed(() => cards.value.reduce((s, c) => s + c.revenue, 0))
  const totalSpend = computed(() => cards.value.reduce((s, c) => s + c.spend, 0))
  const avgRoas = computed(() => {
    const w = cards.value.filter(c => c.roas > 0)
    return w.length ? w.reduce((s, c) => s + c.roas, 0) / w.length : 0
  })
  const onTargetCount = computed(() => cards.value.filter(c => c.roas >= 4).length)
  const cardsWithoutBilling = computed(() => filteredCards.value.filter(c => c.revenue === 0))

  // Grouping
  const byName = (a: Card, b: Card) => a.name.localeCompare(b.name)
  const byRoasAsc = (a: Card, b: Card) => {
    if (!a.roas && !b.roas) return byName(a, b)
    if (!a.roas) return 1
    if (!b.roas) return -1
    return a.roas - b.roas
  }

  const groups = computed<GroupDef[]>(() => {
    const src = filteredCards.value
    return [
      {
        id: 'pauta_sin_factura',
        label: 'Pauta activa · Sin facturación',
        desc: 'Ads corriendo pero sin datos de facturación — ROAS incalculable',
        icon: 'fa-solid fa-circle-xmark',
        color: 'red',
        needsReminder: true,
        cards: src.filter(c => c.spend > 0 && c.revenue === 0).sort(byName),
      },
      {
        id: 'sin_factura',
        label: 'Sin facturación',
        desc: 'Pendiente de registrar datos del mes',
        icon: 'fa-solid fa-triangle-exclamation',
        color: 'orange',
        needsReminder: true,
        cards: src.filter(c => c.spend === 0 && c.revenue === 0).sort(byName),
      },
      {
        id: 'critico',
        label: 'Crítico · ROAS < 1x',
        desc: 'Facturación registrada — ROAS por debajo del gasto en ads',
        icon: 'fa-solid fa-fire',
        color: 'red',
        needsReminder: false,
        cards: src.filter(c => c.revenue > 0 && c.roas > 0 && c.roas < 1).sort(byRoasAsc),
      },
      {
        id: 'peligro',
        label: 'En peligro · ROAS 1x – 3.99x',
        desc: 'Por debajo del objetivo de 4x — necesita atención',
        icon: 'fa-solid fa-triangle-exclamation',
        color: 'amber',
        needsReminder: false,
        cards: src.filter(c => c.roas >= 1 && c.roas < 4).sort(byRoasAsc),
      },
      {
        id: 'optimo',
        label: 'Óptimo · ROAS ≥ 4x',
        desc: 'En objetivo — seguir optimizando',
        icon: 'fa-solid fa-circle-check',
        color: 'green',
        needsReminder: false,
        cards: src.filter(c => c.roas >= 4).sort(byRoasAsc),
      },
      {
        id: 'factura_sin_pauta',
        label: 'Facturando · Sin pauta activa',
        desc: 'Facturación al día · Sin gasto Meta este mes',
        icon: 'fa-solid fa-building-columns',
        color: 'blue',
        needsReminder: false,
        cards: src.filter(c => c.revenue > 0 && c.spend === 0).sort(byName),
      },
    ].filter(g => g.cards.length > 0)
  })

  async function getCachedBilling(wsId: string, year: number, month: number) {
    const key = `${wsId}:${year}:${month}`
    const hit = billingCache.get(key)
    if (hit && Date.now() - hit.ts < CACHE_TTL) return hit

    let revenue = 0, onlineRevenue = 0, spend = 0, roas = 0
    try {
      if (wsId === BOLONCITY_WS_ID) {
        const [salesData, billingData] = await Promise.all([
          salesSummaryService.getMonthData(wsId, year, month),
          billingService.getMonthData(wsId, year, month),
        ])
        revenue = salesData.totalBilled ?? 0
        spend = (billingData.days ?? []).reduce((s: number, d: any) => s + (d.totalMetaSpend ?? 0), 0)
        onlineRevenue = (billingData.days ?? []).reduce((s: number, d: any) => s + (d.totalOnlineRevenue ?? 0), 0)
        roas = spend > 0 ? revenue / spend : 0
      } else {
        const data = await billingService.getMonthData(wsId, year, month)
        const days = data.days ?? []
        revenue = days.reduce((s: number, d: any) => s + (d.totalAmount ?? 0), 0)
        onlineRevenue = days.reduce((s: number, d: any) => s + (d.totalOnlineRevenue ?? 0), 0)
        spend = days.reduce((s: number, d: any) => s + (d.totalMetaSpend ?? 0), 0)
        roas = spend > 0 ? revenue / spend : 0
      }
    } catch {}

    const entry: CachedBilling = { revenue, onlineRevenue, spend, roas, ts: Date.now() }
    billingCache.set(key, entry)
    return entry
  }

  async function loadMetaSpend(wsId: string, adAccountId: string, year: number, month: number) {
    const key = `meta:${wsId}:${year}:${month}`
    if (metaSpendCache.has(key)) return
    try {
      const spend = await metaService.getMonthSpend(wsId, year, month)
      if (spend <= 0) return
      metaSpendCache.set(key, spend)
      const idx = cards.value.findIndex(c => c.id === wsId)
      if (idx === -1) return
      const card = cards.value[idx]
      const roas = card.revenue > 0 ? card.revenue / spend : 0
      cards.value = [...cards.value.slice(0, idx), { ...card, spend, roas }, ...cards.value.slice(idx + 1)]
      const bKey = `${wsId}:${year}:${month}`
      const hit = billingCache.get(bKey)
      if (hit) billingCache.set(bKey, { ...hit, spend, roas })
    } catch { /* silent */ }
  }

  async function fetchAllWorkspaces(search?: string) {
    const all: any[] = []
    let page = 1
    let hasMore = true
    while (hasMore) {
      const res = await workspaceService.listWorkspaces({ limit: 50, page, search: search || undefined })
      all.push(...res.workspaces)
      hasMore = res.metadata?.hasMore ?? false
      page++
    }
    return all
  }

  async function load(search?: string) {
    isLoading.value = true
    try {
      const workspaces = await fetchAllWorkspaces(search)

      const fromCache = workspaces.map((ws: any) => {
        const key = `${ws._id}:${currentYear.value}:${currentMonth.value}`
        const hit = billingCache.get(key)
        if (hit && Date.now() - hit.ts < CACHE_TTL) {
          return { id: ws._id, name: ws.name, pageId: ws.metaAds?.pageId, metaConnected: !!(ws.metaAds?.pageId), ...hit } as Card
        }
        return null
      }).filter(Boolean) as Card[]

      if (fromCache.length === workspaces.length) {
        cards.value = fromCache
        isLoading.value = false
      }

      const fresh = await Promise.all(
        workspaces.map(async (ws: any) => {
          try {
            const data = await getCachedBilling(ws._id, currentYear.value, currentMonth.value)
            return { id: ws._id, name: ws.name, pageId: ws.metaAds?.pageId, metaConnected: !!(ws.metaAds?.pageId), ...data } as Card
          } catch {
            return { id: ws._id, name: ws.name, pageId: ws.metaAds?.pageId, metaConnected: !!(ws.metaAds?.pageId), roas: 0, revenue: 0, onlineRevenue: 0, spend: 0, ts: 0 } as Card
          }
        })
      )
      cards.value = fresh

      workspaces.forEach((ws: any) => {
        if (ws.metaAds?.adAccountId) {
          loadMetaSpend(ws._id, ws.metaAds.adAccountId, currentYear.value, currentMonth.value)
        }
      })
    } catch (e) {
      console.error('TraffickerDashboard load error', e)
    } finally {
      isLoading.value = false
    }
  }

  // Reminders
  async function sendReminder(id: string) {
    if (remindingSet.value.has(id) || remindedSet.value.has(id)) return
    remindingSet.value = new Set(remindingSet.value).add(id)
    try {
      await notificationService.sendBillingReminder(id)
      remindingSet.value.delete(id)
      remindingSet.value = new Set(remindingSet.value)
      remindedSet.value = new Set(remindedSet.value).add(id)
      setTimeout(() => {
        remindedSet.value.delete(id)
        remindedSet.value = new Set(remindedSet.value)
      }, 3000)
    } catch {
      remindingSet.value.delete(id)
      remindingSet.value = new Set(remindingSet.value)
    }
  }

  async function sendReminderToAll() {
    const targets = cardsWithoutBilling.value
    if (!targets.length || remindAll.value.active) return
    remindAll.value = { active: true, done: 0, total: targets.length, errors: 0 }
    remindAllDone.value = false
    for (const card of targets) {
      if (remindingSet.value.has(card.id) || remindedSet.value.has(card.id)) {
        remindAll.value.done++
        continue
      }
      try {
        await notificationService.sendBillingReminder(card.id)
        remindedSet.value = new Set(remindedSet.value).add(card.id)
      } catch {
        remindAll.value.errors++
      }
      remindAll.value = { ...remindAll.value, done: remindAll.value.done + 1 }
    }
    remindAll.value.active = false
    remindAllDone.value = true
    setTimeout(() => { remindAllDone.value = false }, 5000)
  }

  // Initialization Search Debounce
  let _searchTimer: ReturnType<typeof setTimeout> | null = null
  watch(searchQuery, (q) => {
    if (_searchTimer) clearTimeout(_searchTimer)
    _searchTimer = setTimeout(() => load(q.trim() || undefined), 300)
  })

  function changeMonth(year: number, month: number) {
    currentYear.value = year
    currentMonth.value = month
    load()
  }

  return {
    isLoading,
    cards,
    filteredCards,
    groups,
    
    // Summary Metrics
    totalRevenue,
    totalSpend,
    avgRoas,
    onTargetCount,
    cardsWithoutBilling,
    
    // Search & Filters
    searchQuery,
    filterMode,
    
    // Time
    currentYear,
    currentMonth,
    isCurrentMonth,
    changeMonth,
    
    // Reminders
    remindingSet,
    remindedSet,
    remindAll,
    remindAllDone,
    sendReminder,
    sendReminderToAll,
    
    // Actions
    load
  }
}
