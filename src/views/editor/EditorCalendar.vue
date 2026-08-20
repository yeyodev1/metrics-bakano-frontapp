<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { planningService } from '@/services/planning.service'
import { swr } from '@/composables/useSwrCache'
import type { Workspace } from '@/types'
import type { PlanningEntry } from '@/types'

const router = useRouter()

// ── State ─────────────────────────────────────────────────
const workspaces = ref<Workspace[]>([])
const loadingWs = ref(true)
const selectedWsId = ref<string | null>(null)
const entries = ref<(PlanningEntry & { workspaceName?: string })[]>([])
const loadingEntries = ref(false)
const searchQuery = ref('')

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

// ── Computed ──────────────────────────────────────────────

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value, 1)
    .toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
)

const filteredEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return entries.value
  return entries.value.filter(e =>
    e.title.toLowerCase().includes(q) ||
    (e.workspaceName ?? '').toLowerCase().includes(q)
  )
})

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const days: { date: Date | null; entries: typeof entries.value }[] = []

  for (let i = 0; i < startDow; i++) days.push({ date: null, entries: [] })

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayEntries = filteredEntries.value.filter(e => e.date?.substring(0, 10) === dateStr)
    days.push({ date, entries: dayEntries })
  }

  while (days.length % 7 !== 0) days.push({ date: null, entries: [] })
  return days
})

const isToday = (date: Date | null) => {
  if (!date) return false
  const t = new Date()
  return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear()
}

const totalThisMonth = computed(() => filteredEntries.value.length)

// ── Colors & logos per workspace ──────────────────────────
const WS_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

const wsColorMap = computed(() => {
  const map: Record<string, string> = {}
  workspaces.value.forEach((ws, i) => { map[ws._id] = WS_COLORS[i % WS_COLORS.length] })
  return map
})

const wsLogoMap = computed(() => {
  const map: Record<string, { photo: string | null; initials: string; color: string }> = {}
  workspaces.value.forEach((ws, i) => {
    map[ws._id] = {
      photo: ws.metaAds?.pageId
        ? `https://graph.facebook.com/${ws.metaAds.pageId}/picture?type=square&width=64`
        : null,
      initials: ws.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
      color: WS_COLORS[i % WS_COLORS.length],
    }
  })
  return map
})

function entryColor(entry: PlanningEntry & { workspaceName?: string }) {
  return wsColorMap.value[entry.workspaceId] ?? '#6366f1'
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Data loading ──────────────────────────────────────────
// Todo pasa por la caché SWR: al volver al calendario se pinta lo último
// visto al instante y se refresca por detrás.
async function loadWorkspaces() {
  loadingWs.value = true
  try {
    const { cached, fresh } = swr('editor:workspaces', () => workspaceService.listWorkspaces({ limit: 200 }), {
      ttlMs: 5 * 60_000,
      onFresh: (res) => { workspaces.value = res.workspaces.filter(w => w.isActive) },
    })
    if (cached) workspaces.value = cached.workspaces.filter(w => w.isActive)
    else await fresh
  } finally {
    loadingWs.value = false
  }
}

async function loadEntries() {
  const year = currentYear.value
  const month = currentMonth.value
  const startDate = new Date(year, month, 1).toISOString()
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
  const clave = `editor:planning:${year}-${month}`

  // Una sola petición para todos los entornos; antes era una por cliente
  // (100+) y el calendario se quedaba en "Cargando planificaciones…".
  const aplicar = (lista: PlanningEntry[]) => {
    const filtradas = selectedWsId.value ? lista.filter(e => e.workspaceId === selectedWsId.value) : lista
    entries.value = filtradas.map(e => ({
      ...e,
      workspaceName: e.workspaceName ?? workspaces.value.find(w => w._id === e.workspaceId)?.name ?? '',
    }))
  }

  const { cached, fresh } = swr(clave, () => planningService.listMine({ startDate, endDate }), {
    ttlMs: 2 * 60_000,
    onFresh: (res) => aplicar(res.entries),
  })
  if (cached) { aplicar(cached.entries); return }

  loadingEntries.value = true
  entries.value = []
  try {
    aplicar((await fresh).entries)
  } catch { /* silent */ } finally {
    loadingEntries.value = false
  }
}

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}

function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

function openEntry(entry: PlanningEntry & { workspaceName?: string }) {
  router.push({
    name: 'EditorVideoPlanning',
    params: { workspaceId: entry.workspaceId, entryId: entry._id },
    query: { title: entry.title },
  })
}

// ── Watchers ──────────────────────────────────────────────
watch([selectedWsId, currentMonth, currentYear], loadEntries)

// Las planificaciones ya no dependen de la lista de entornos: van en paralelo.
onMounted(() => { loadWorkspaces(); loadEntries() })
</script>

<template>
  <div class="edc">

    <!-- Top bar -->
    <div class="edc__topbar">
      <div class="edc__month-nav">
        <button class="edc__nav-btn" @click="prevMonth"><i class="fa-solid fa-chevron-left" /></button>
        <span class="edc__month-label">{{ monthLabel }}</span>
        <button class="edc__nav-btn" @click="nextMonth"><i class="fa-solid fa-chevron-right" /></button>
      </div>

      <!-- Client pills -->
      <div class="edc__ws-pills">
        <button
          class="edc__ws-pill"
          :class="{ 'edc__ws-pill--active': selectedWsId === null }"
          @click="selectedWsId = null"
        >
          <i class="fa-solid fa-layer-group" />
          <span>Todos</span>
          <span v-if="selectedWsId === null && totalThisMonth > 0" class="edc__ws-pill-count">{{ totalThisMonth }}</span>
        </button>

        <button
          v-for="ws in workspaces"
          :key="ws._id"
          class="edc__ws-pill"
          :class="{ 'edc__ws-pill--active': selectedWsId === ws._id }"
          :style="selectedWsId === ws._id ? { borderColor: wsColorMap[ws._id], background: wsColorMap[ws._id] + '18', color: wsColorMap[ws._id] } : {}"
          @click="selectedWsId = ws._id"
        >
          <div class="edc__ws-pill-photo" :style="{ background: wsColorMap[ws._id] + '30', borderColor: wsColorMap[ws._id] + '60' }">
            <img v-if="wsLogoMap[ws._id]?.photo" :src="wsLogoMap[ws._id].photo!" :alt="ws.name" />
            <span v-else>{{ initials(ws.name) }}</span>
          </div>
          <span>{{ ws.name }}</span>
        </button>
      </div>

      <!-- Search -->
      <div class="edc__search">
        <i class="fa-solid fa-magnifying-glass edc__search-icon" />
        <input
          v-model="searchQuery"
          class="edc__search-input"
          type="text"
          placeholder="Buscar producción..."
        />
        <button v-if="searchQuery" class="edc__search-clear" @click="searchQuery = ''">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
    </div>

    <!-- Calendar body -->
    <div class="edc__body">
      <div v-if="loadingWs || loadingEntries" class="edc__loading">
        <i class="fa-solid fa-spinner fa-spin" />
        <span>{{ loadingWs ? 'Cargando clientes...' : 'Cargando planificaciones...' }}</span>
      </div>

      <div v-else class="edc__calendar">
        <div class="edc__cal-header">
          <span v-for="d in ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']" :key="d">{{ d }}</span>
        </div>

        <div class="edc__cal-grid">
          <div
            v-for="(cell, idx) in calendarDays"
            :key="idx"
            class="edc__cal-cell"
            :class="{
              'edc__cal-cell--empty': !cell.date,
              'edc__cal-cell--today': isToday(cell.date),
              'edc__cal-cell--has-entries': cell.entries.length > 0,
            }"
          >
            <span v-if="cell.date" class="edc__cal-day">{{ cell.date.getDate() }}</span>

            <div v-if="cell.entries.length > 0" class="edc__cal-entries">
              <button
                v-for="entry in cell.entries.slice(0, 3)"
                :key="entry._id"
                class="edc__cal-entry"
                :style="{ background: entryColor(entry) + '18', borderLeftColor: entryColor(entry) }"
                @click.stop="openEntry(entry)"
                :title="entry.title + (entry.workspaceName ? ' — ' + entry.workspaceName : '')"
              >
                <!-- Workspace logo inside chip -->
                <div
                  class="edc__cal-entry-logo"
                  :style="{ background: wsLogoMap[entry.workspaceId]?.photo ? 'transparent' : entryColor(entry) + '30' }"
                >
                  <img
                    v-if="wsLogoMap[entry.workspaceId]?.photo"
                    :src="wsLogoMap[entry.workspaceId].photo!"
                    :alt="entry.workspaceName"
                  />
                  <span v-else :style="{ color: entryColor(entry) }">
                    {{ wsLogoMap[entry.workspaceId]?.initials || '?' }}
                  </span>
                </div>
                <div class="edc__cal-entry-text">
                  <span class="edc__cal-entry-title" :style="{ color: entryColor(entry) }">{{ entry.title }}</span>
                  <span v-if="selectedWsId === null && entry.workspaceName" class="edc__cal-entry-ws">{{ entry.workspaceName }}</span>
                </div>
              </button>

              <span v-if="cell.entries.length > 3" class="edc__cal-more">
                +{{ cell.entries.length - 3 }} más
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- No results from search -->
      <div v-if="!loadingWs && !loadingEntries && searchQuery && filteredEntries.length === 0" class="edc__no-results">
        <i class="fa-solid fa-magnifying-glass" />
        <span>Sin resultados para "{{ searchQuery }}"</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.edc {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  // ── TOP BAR ──────────────────────────────────────────────
  &__topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid #e8ecf0;
    background: white;
    flex-shrink: 0;
  }

  &__month-nav {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  &__nav-btn {
    width: 30px;
    height: 30px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #475569;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    transition: all 0.15s;

    &:hover { border-color: #6366f1; color: #6366f1; background: #ede9fe; }
  }

  &__month-label {
    font-size: 0.85rem;
    font-weight: 800;
    color: #0f172a;
    min-width: 130px;
    text-align: center;
    text-transform: capitalize;
  }

  // ── CLIENT PILLS ──────────────────────────────────────────
  &__ws-pills {
    display: flex;
    gap: 0.35rem;
    overflow-x: auto;
    flex: 1;
    scrollbar-width: none;
    padding-bottom: 2px;
    &::-webkit-scrollbar { display: none; }
  }

  &__ws-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.3rem 0.7rem 0.3rem 0.45rem;
    border-radius: 99px;
    border: 1.5px solid #e2e8f0;
    background: white;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    flex-shrink: 0;

    &:hover { border-color: #a5b4fc; color: #4f46e5; background: #eef2ff; }

    &--active { border-color: #6366f1; background: #ede9fe; color: #4f46e5; }

    i { font-size: 0.72rem; }

    &-count {
      background: #6366f1;
      color: white;
      border-radius: 99px;
      font-size: 0.6rem;
      font-weight: 800;
      padding: 0.1rem 0.4rem;
      min-width: 18px;
      text-align: center;
    }

    &-photo {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      overflow: hidden;
      border: 1.5px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      font-weight: 800;
      color: #475569;
      flex-shrink: 0;

      img { width: 100%; height: 100%; object-fit: cover; }
    }
  }

  // ── SEARCH ────────────────────────────────────────────────
  &__search {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: #f1f5f9;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.3rem 0.6rem;
    flex-shrink: 0;
    width: 190px;
    transition: border-color 0.15s;

    &:focus-within {
      border-color: #6366f1;
      background: white;
    }
  }

  &__search-icon {
    font-size: 0.72rem;
    color: #94a3b8;
    flex-shrink: 0;
  }

  &__search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.78rem;
    color: #0f172a;
    outline: none;
    min-width: 0;

    &::placeholder { color: #94a3b8; }
  }

  &__search-clear {
    border: none;
    background: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0;
    font-size: 0.7rem;
    display: flex;
    align-items: center;

    &:hover { color: #475569; }
  }

  // ── BODY ──────────────────────────────────────────────────
  &__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  &__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: #64748b;
    font-size: 0.85rem;

    i { font-size: 1.25rem; color: #6366f1; }
  }

  &__no-results {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.6rem 1rem;
    font-size: 0.78rem;
    color: #64748b;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }

  // ── CALENDAR ──────────────────────────────────────────────
  &__calendar {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__cal-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid #f1f5f9;
    background: #f8fafc;
    flex-shrink: 0;

    span {
      padding: 0.45rem 0;
      text-align: center;
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
    }
  }

  &__cal-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: 1fr;
    border-left: 1px solid #f1f5f9;
    overflow-y: auto;
  }

  &__cal-cell {
    border-right: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
    padding: 0.4rem 0.4rem 0.35rem;
    min-height: 90px;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;

    &--empty { background: #fafafa; }

    &--today {
      background: #faf5ff;

      .edc__cal-day {
        background: #6366f1;
        color: white;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
      }
    }

    &--has-entries:not(&--empty) {
      background: #fdfcff;
      &:hover { background: #f5f3ff; }
    }
  }

  &__cal-day {
    font-size: 0.72rem;
    font-weight: 700;
    color: #334155;
    margin-bottom: 0.1rem;
    display: inline-block;
    line-height: 22px;
    width: 22px;
    text-align: center;
  }

  &__cal-entries {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    flex: 1;
  }

  &__cal-entry {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    width: 100%;
    text-align: left;
    padding: 0.22rem 0.4rem 0.22rem 0.3rem;
    border-radius: 5px;
    border: none;
    border-left: 2.5px solid;
    cursor: pointer;
    transition: all 0.12s;

    &:hover {
      filter: brightness(0.96);
      transform: translateX(1px);
    }
  }

  &__cal-entry-logo {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.45rem;
    font-weight: 800;
    flex-shrink: 0;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__cal-entry-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }

  &__cal-entry-title {
    display: block;
    font-size: 0.64rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__cal-entry-ws {
    display: block;
    font-size: 0.57rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__cal-more {
    font-size: 0.6rem;
    color: #94a3b8;
    padding: 0 0.2rem;
    font-weight: 600;
  }
}
</style>
