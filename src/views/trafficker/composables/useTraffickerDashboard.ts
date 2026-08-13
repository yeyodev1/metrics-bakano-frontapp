import { ref, computed, watch } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { billingService } from '@/services/billing.service'
import { salesSummaryService } from '@/services/salesSummary.service'
import { metaService } from '@/services/meta.service'
import { notificationService } from '@/services/notification.service'

export interface AdsActivity {
  conectado: boolean
  activos: number
  pausados: number
  impresiones: number
  clics: number
  gasto: number
  ctr: number | null
  cpc: number | null
  error?: string
}

export interface EstadoConexion {
  completa: boolean
  faltan: string[]
}

export interface Card {
  id: string
  name: string
  pageId?: string
  metaConnected: boolean
  roas: number
  revenue: number
  onlineRevenue: number
  spend: number
  logoUrl?: string | null
  conexion: EstadoConexion
  actividad?: AdsActivity
  ts?: number
  /** Sus cifras todavía vienen en camino; la fila ya se pinta con el nombre. */
  loading?: boolean
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

  /**
   * Cuántos entornos del lote ya tienen sus cifras. El panel tardaba lo mismo
   * antes, pero sin decirlo: diez esqueletos quietos no distinguen "cargando"
   * de "colgado".
   */
  const lote = ref({ activo: false, total: 0, listos: 0 })
  const loteFaltan = computed(() => Math.max(0, lote.value.total - lote.value.listos))
  const lotePorcentaje = computed(() =>
    lote.value.total ? Math.round((lote.value.listos / lote.value.total) * 100) : 0,
  )
  
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
      const card = cards.value.find(c => c.id === wsId)
      if (!card) return
      const roas = card.revenue > 0 ? card.revenue / spend : 0
      parchearCard(wsId, { spend, roas })
      const bKey = `${wsId}:${year}:${month}`
      const hit = billingCache.get(bKey)
      if (hit) billingCache.set(bKey, { ...hit, spend, roas })
    } catch { /* silent */ }
  }

  /** Tamaño de página. Antes se traían TODOS los entornos de una. */
  const POR_PAGINA = 10

  const pagina = ref(1)
  const totalEntornos = ref(0)
  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(totalEntornos.value / POR_PAGINA))
  )

  /**
   * Qué le falta a la conexión de Meta.
   *
   * "Conectado" no es binario: se puede tener la página pero no la cuenta
   * publicitaria, y entonces el gasto sale en cero sin que nadie sepa por qué.
   * Nombrar la pieza que falta evita ir a buscar el error.
   */
  function revisarConexion(ws: any): EstadoConexion {
    const m = ws?.metaAds ?? {}
    const faltan: string[] = []
    if (!m.pageId) faltan.push('página de Facebook')
    if (!m.adAccountId) faltan.push('cuenta publicitaria')
    if (!m.instagramAccountId) faltan.push('cuenta de Instagram')
    return { completa: faltan.length === 0, faltan }
  }

  async function fetchPaginaWorkspaces(search?: string) {
    const res = await workspaceService.listWorkspaces({
      limit: POR_PAGINA,
      page: pagina.value,
      search: search || undefined,
    })
    totalEntornos.value = res.metadata?.total ?? res.workspaces.length
    return res.workspaces
  }

  /** Reemplaza una tarjeta por su versión nueva sin tocar el resto de la lista. */
  function parchearCard(id: string, cambios: Partial<Card>) {
    const idx = cards.value.findIndex(c => c.id === id)
    if (idx === -1) return
    cards.value = [
      ...cards.value.slice(0, idx),
      { ...cards.value[idx], ...cambios },
      ...cards.value.slice(idx + 1),
    ]
  }

  /**
   * Identifica la carga en curso. Cambiar de mes o teclear en el buscador
   * dispara otra antes de que termine la anterior; sin esto, las respuestas
   * viejas siguen parcheando tarjetas que ya no están en pantalla y el
   * contador del lote avanza de más.
   */
  let cargaActual = 0

  const cardBase = (ws: any): Card => ({
    id: ws._id,
    name: ws.name,
    pageId: ws.metaAds?.pageId,
    metaConnected: !!(ws.metaAds?.pageId),
    logoUrl: ws.metaAds?.pictureUrl ?? null,
    conexion: revisarConexion(ws),
    roas: 0,
    revenue: 0,
    onlineRevenue: 0,
    spend: 0,
    loading: true,
  })

  async function load(search?: string) {
    const carga = ++cargaActual
    isLoading.value = true
    try {
      const workspaces = await fetchPaginaWorkspaces(search)
      if (carga !== cargaActual) return

      // Las filas se pintan en cuanto se sabe el nombre y cada una se completa
      // sola cuando llegan sus cifras, en vez de esperar a que estén todas.
      cards.value = workspaces.map(cardBase)
      isLoading.value = false
      lote.value = { activo: true, total: workspaces.length, listos: 0 }

      await Promise.all(
        workspaces.map(async (ws: any) => {
          try {
            const data = await getCachedBilling(ws._id, currentYear.value, currentMonth.value)
            if (carga === cargaActual) parchearCard(ws._id, { ...data, loading: false })
          } catch {
            if (carga === cargaActual) parchearCard(ws._id, { loading: false })
          } finally {
            if (carga === cargaActual) {
              lote.value = { ...lote.value, listos: lote.value.listos + 1 }
            }
          }
        }),
      )

      if (carga !== cargaActual) return
      lote.value = { ...lote.value, activo: false }

      workspaces.forEach((ws: any) => {
        if (ws.metaAds?.adAccountId) {
          loadMetaSpend(ws._id, ws.metaAds.adAccountId, currentYear.value, currentMonth.value)
        }
      })

      // Actividad publicitaria de los 10 visibles, en paralelo. Solo de los
      // que tienen Meta conectada: al resto no hay nada que preguntarle.
      cargarActividad(workspaces)
    } catch (e) {
      console.error('TraffickerDashboard load error', e)
      if (carga === cargaActual) lote.value = { ...lote.value, activo: false }
    } finally {
      if (carga === cargaActual) isLoading.value = false
    }
  }

  /**
   * Quién tiene campañas ACTIVAS ahora mismo. El gasto del mes no lo dice: un
   * cliente puede haber gastado y estar parado hoy, o estar activo y aún sin
   * gasto registrado.
   */
  async function cargarActividad(workspaces: any[]) {
    await Promise.all(
      workspaces
        .filter((ws: any) => ws.metaAds?.adAccountId)
        .map(async (ws: any) => {
          try {
            const actividad = await metaService.getAdsActivity(
              ws._id,
              currentYear.value,
              currentMonth.value,
            )
            parchearCard(ws._id, { actividad })
          } catch { /* una cuenta sin permisos no tumba la lista */ }
        }),
    )
  }

  async function irAPagina(n: number, search?: string) {
    const destino = Math.min(Math.max(1, n), totalPaginas.value)
    if (destino === pagina.value) return
    pagina.value = destino
    await load(search)
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
    pagina,
    totalPaginas,
    totalEntornos,
    irAPagina,
    isLoading,
    lote,
    loteFaltan,
    lotePorcentaje,
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
