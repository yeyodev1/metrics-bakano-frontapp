<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { meetingService } from '@/services/meeting.service'
import { workspaceService } from '@/services/workspace.service'
import type { ClientMeeting, Workspace, WorkspaceUser, CreateMeetingPayload } from '@/types'
// ── State ─────────────────────────────────────────────────────
const view = ref<'calendar' | 'agenda'>('agenda')
const meetings = ref<ClientMeeting[]>([])
const myWorkspaces = ref<Workspace[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// ── Modal state ───────────────────────────────────────────────
const showModal = ref(false)
const editingMeeting = ref<ClientMeeting | null>(null)
const modalWorkspaceId = ref('')
const modalDate = ref('')
const modalAgenda = ref('')
const modalLink = ref('')
const modalNotes = ref('')
const modalSaving = ref(false)
const modalError = ref<string | null>(null)

// ── Workspace picker (modal) ───────────────────────────────────
const WS_PER_PAGE = 3
const modalWsSearch = ref('')
const modalWsPage = ref(0)

watch(modalWsSearch, () => { modalWsPage.value = 0 })

const filteredModalWs = computed(() => {
  const q = modalWsSearch.value.toLowerCase().trim()
  const pool = editingMeeting.value ? myWorkspaces.value : unscheduledWorkspaces.value
  return q ? pool.filter(w => w.name.toLowerCase().includes(q)) : pool
})

const modalWsPages = computed(() => Math.ceil(filteredModalWs.value.length / WS_PER_PAGE))

const modalWsVisible = computed(() =>
  filteredModalWs.value.slice(
    modalWsPage.value * WS_PER_PAGE,
    (modalWsPage.value + 1) * WS_PER_PAGE,
  )
)

const selectedWs = computed(() =>
  myWorkspaces.value.find(w => w._id === modalWorkspaceId.value) || null
)

// ── Contact picker (modal) ─────────────────────────────────────
const modalContactId = ref('')
const modalContactName = ref('')
const modalContactEmail = ref('')
const modalContacts = ref<WorkspaceUser[]>([])
const loadingContacts = ref(false)

async function loadContacts(wsId: string) {
  if (!wsId) { modalContacts.value = []; return }
  loadingContacts.value = true
  try {
    const res = await workspaceService.listUsers(wsId)
    modalContacts.value = res.users.filter(u => !u.isInternal)
  } catch {
    modalContacts.value = []
  } finally {
    loadingContacts.value = false
  }
}

async function selectWorkspace(ws: Workspace) {
  modalWorkspaceId.value = ws._id
  modalContactId.value = ''
  modalContactName.value = ''
  modalContactEmail.value = ''
  await loadContacts(ws._id)
}

function selectContact(user: WorkspaceUser) {
  modalContactId.value = user._id
  modalContactName.value = user.name || user.email
  modalContactEmail.value = user.email
}

function clearWorkspaceSelection() {
  modalWorkspaceId.value = ''
  modalContactId.value = ''
  modalContactName.value = ''
  modalContactEmail.value = ''
  modalContacts.value = []
}

// ── Complete modal state ───────────────────────────────────────
const showCompleteModal = ref(false)
const completingMeeting = ref<ClientMeeting | null>(null)
const completeNotes = ref('')
const completeRecordingLink = ref('')
const completeSaving = ref(false)

// ── Calendar state ────────────────────────────────────────────
const calendarDate = ref(new Date())

onMounted(async () => {
  await Promise.all([fetchMeetings(), fetchMyWorkspaces()])
})

async function fetchMeetings() {
  loading.value = true
  error.value = null
  try {
    meetings.value = await meetingService.getMyMeetings()
  } catch {
    error.value = 'No se pudieron cargar las reuniones.'
  } finally {
    loading.value = false
  }
}

async function fetchMyWorkspaces() {
  try {
    const res = await workspaceService.listWorkspaces({ limit: 500 })
    myWorkspaces.value = res.workspaces
  } catch {
    // silent
  }
}

// ── Meeting map keyed by workspaceId ──────────────────────────
const meetingByWorkspace = computed(() => {
  const map = new Map<string, ClientMeeting>()
  for (const m of meetings.value) {
    map.set(m.workspaceId, m)
  }
  return map
})

// ── Days until date ───────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' })
  const ecuadorTodayStr = formatter.format(new Date())
  const nowEc = new Date(`${ecuadorTodayStr}T00:00:00.000Z`)
  
  const mDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const mDate = new Date(`${mDateStr}T00:00:00.000Z`)
  
  return Math.round((mDate.getTime() - nowEc.getTime()) / 86400000)
}

function daysLabel(dateStr: string): string {
  const d = daysUntil(dateStr)
  if (d === 0) return 'Hoy'
  if (d === 1) return 'Mañana'
  if (d < 0) return `Hace ${Math.abs(d)} día${Math.abs(d) !== 1 ? 's' : ''}`
  return `En ${d} día${d !== 1 ? 's' : ''}`
}

function isOverdue(dateStr: string): boolean {
  return daysUntil(dateStr) < 0
}

function formatDate(dateStr: string): string {
  const isoDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const d = new Date(`${isoDate}T12:00:00.000Z`)
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

function workspaceName(m: ClientMeeting): string {
  return m.workspace?.name || myWorkspaces.value.find(w => w._id === m.workspaceId)?.name || '—'
}

function workspaceInitials(m: ClientMeeting): string {
  return workspaceName(m).substring(0, 2).toUpperCase()
}

function workspacePageId(m: ClientMeeting): string | null {
  const ws = myWorkspaces.value.find(w => w._id === m.workspaceId)
  return ws?.metaAds?.pageId || null
}

// ── Urgency system ────────────────────────────────────────────
type Urgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'ok'

function urgency(dateStr: string): Urgency {
  const d = daysUntil(dateStr)
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  if (d <= 4) return 'soon'
  return 'ok'
}

const URGENCY_ICON: Record<Urgency, string> = {
  overdue:  'fa-solid fa-fire',
  today:    'fa-solid fa-bell',
  tomorrow: 'fa-solid fa-hourglass-half',
  soon:     'fa-solid fa-clock',
  ok:       'fa-solid fa-calendar-check',
}

function daysIcon(dateStr: string): string {
  return URGENCY_ICON[urgency(dateStr)]
}

// ── Modal quick-pick chips ─────────────────────────────────────
function pickDate(offsetDays: number) {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' })
  const ecuadorTodayStr = formatter.format(new Date())
  const d = new Date(`${ecuadorTodayStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  modalDate.value = d.toISOString().split('T')[0] || ''
}

function isChipSelected(offsetDays: number): boolean {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' })
  const ecuadorTodayStr = formatter.format(new Date())
  const d = new Date(`${ecuadorTodayStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return modalDate.value === d.toISOString().split('T')[0]
}

type QuickChip = { label: string; offset: number; icon: string; urgency: Urgency }
const quickChips: QuickChip[] = [
  { label: 'Hoy',      offset: 0,  icon: 'fa-solid fa-bell',          urgency: 'today'    },
  { label: 'Mañana',   offset: 1,  icon: 'fa-solid fa-hourglass-half', urgency: 'tomorrow' },
  { label: 'Pasado',   offset: 2,  icon: 'fa-solid fa-clock',          urgency: 'soon'     },
  { label: '+7 días',  offset: 7,  icon: 'fa-solid fa-calendar',       urgency: 'ok'       },
  { label: '+25 días', offset: 25, icon: 'fa-solid fa-calendar-check', urgency: 'ok'       },
]

// ── Calendar grid ─────────────────────────────────────────────
const calendarDays = computed(() => {
  const year = calendarDate.value.getFullYear()
  const month = calendarDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const grid: (Date | null)[] = []
  // Pad start (Mon-based: shift so Mon=0)
  const startPad = (firstDay + 6) % 7
  for (let i = 0; i < startPad; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(new Date(year, month, d))
  }
  return grid
})

const calendarMonthLabel = computed(() => {
  return calendarDate.value.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
})

function prevMonth() {
  const d = new Date(calendarDate.value)
  d.setMonth(d.getMonth() - 1)
  calendarDate.value = d
}

function nextMonth() {
  const d = new Date(calendarDate.value)
  d.setMonth(d.getMonth() + 1)
  calendarDate.value = d
}

function meetingsOnDay(day: Date): ClientMeeting[] {
  return meetings.value.filter(m => {
    const meetStr = m.nextMeetingDate.includes('T') ? m.nextMeetingDate.split('T')[0] : m.nextMeetingDate
    const localDayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    return meetStr === localDayStr
  })
}

function isToday(day: Date): boolean {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' })
  const ecuadorTodayStr = formatter.format(new Date())
  const localDayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  return ecuadorTodayStr === localDayStr
}

// ── Complete meeting ──────────────────────────────────────────
function openCompleteModal(m: ClientMeeting) {
  completingMeeting.value = m
  completeNotes.value = m.notes || ''
  completeRecordingLink.value = m.recordingLink || ''
  showCompleteModal.value = true
}

function closeCompleteModal() {
  showCompleteModal.value = false
  completingMeeting.value = null
  completeNotes.value = ''
  completeRecordingLink.value = ''
}

async function confirmComplete() {
  if (!completingMeeting.value) return
  completeSaving.value = true
  try {
    const updated = await meetingService.completeMeeting(
      completingMeeting.value._id,
      {
        notes: completeNotes.value.trim() || undefined,
        recordingLink: completeRecordingLink.value.trim() || undefined,
      }
    )
    const idx = meetings.value.findIndex(x => x._id === completingMeeting.value!._id)
    if (idx !== -1) meetings.value[idx] = updated
    closeCompleteModal()
  } catch {
    // silent — keep modal open
  } finally {
    completeSaving.value = false
  }
}

function canComplete(m: ClientMeeting): boolean {
  return daysUntil(m.nextMeetingDate) <= 0
}

// ── Modal ─────────────────────────────────────────────────────
async function openModal(existing?: ClientMeeting, workspaceId?: string) {
  modalError.value = null
  modalWsSearch.value = ''
  modalWsPage.value = 0
  if (existing) {
    editingMeeting.value = existing
    modalWorkspaceId.value = existing.workspaceId
    modalDate.value = existing.nextMeetingDate.split('T')[0] || ''
    modalAgenda.value = existing.agenda || ''
    modalLink.value = existing.meetingLink || ''
    modalNotes.value = existing.notes || ''
    modalContactId.value = existing.contactUserId || ''
    modalContactName.value = existing.contactName || ''
    modalContactEmail.value = existing.contactEmail || ''
    // Load contacts for editing
    loadContacts(existing.workspaceId)
  } else {
    editingMeeting.value = null
    modalWorkspaceId.value = workspaceId || ''
    modalDate.value = ''
    modalAgenda.value = ''
    modalLink.value = ''
    modalNotes.value = ''
    modalContactId.value = ''
    modalContactName.value = ''
    modalContactEmail.value = ''
    modalContacts.value = []
    if (workspaceId) loadContacts(workspaceId)
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingMeeting.value = null
  modalContacts.value = []
  modalContactId.value = ''
  modalContactName.value = ''
  modalContactEmail.value = ''
  modalWsSearch.value = ''
  modalWsPage.value = 0
}

async function saveModal() {
  if (!modalWorkspaceId.value || !modalDate.value) {
    modalError.value = 'Completa cliente y fecha.'
    return
  }
  modalSaving.value = true
  modalError.value = null
  try {
    if (editingMeeting.value) {
      const updated = await meetingService.updateMeeting(editingMeeting.value._id, {
        nextMeetingDate: modalDate.value,
        agenda: modalAgenda.value,
        meetingLink: modalLink.value.trim() || undefined,
        notes: modalNotes.value.trim() || undefined,
        contactUserId: modalContactId.value || undefined,
        contactName: modalContactName.value || undefined,
        contactEmail: modalContactEmail.value || undefined,
      })
      const idx = meetings.value.findIndex(m => m._id === editingMeeting.value!._id)
      if (idx !== -1) meetings.value[idx] = updated
    } else {
      const payload: CreateMeetingPayload = {
        workspaceId: modalWorkspaceId.value,
        nextMeetingDate: modalDate.value,
        agenda: modalAgenda.value || undefined,
        meetingLink: modalLink.value.trim() || undefined,
        contactUserId: modalContactId.value || undefined,
        contactName: modalContactName.value || undefined,
        contactEmail: modalContactEmail.value || undefined,
      }
      const created = await meetingService.createOrUpdate(payload)
      // Replace or add
      const idx = meetings.value.findIndex(m => m.workspaceId === created.workspaceId)
      if (idx !== -1) {
        meetings.value[idx] = created
      } else {
        meetings.value.push(created)
        meetings.value.sort((a, b) => new Date(a.nextMeetingDate).getTime() - new Date(b.nextMeetingDate).getTime())
      }
    }
    closeModal()
  } catch {
    modalError.value = 'Error al guardar. Intenta de nuevo.'
  } finally {
    modalSaving.value = false
  }
}

// Unscheduled workspaces (for modal dropdown — only show ones without a meeting)
const unscheduledWorkspaces = computed(() => {
  if (editingMeeting.value) return myWorkspaces.value // editing: show all
  return myWorkspaces.value.filter(w => !meetingByWorkspace.value.has(w._id))
})
</script>

<template>
  <div class="meetings-view">
    <!-- Header -->
    <div class="meetings-view__header">
      <div>
        <h1 class="meetings-view__title">Calendario de Reuniones</h1>
        <p class="meetings-view__subtitle">Reuniones de performance con tus clientes · cada 25 días</p>
      </div>
      <div class="meetings-view__actions">
        <!-- Toggle -->
        <div class="meetings-view__toggle">
          <button
            class="meetings-view__toggle-btn"
            :class="{ 'meetings-view__toggle-btn--active': view === 'agenda' }"
            @click="view = 'agenda'"
          >
            <i class="fa-solid fa-list" />
            Agenda
          </button>
          <button
            class="meetings-view__toggle-btn"
            :class="{ 'meetings-view__toggle-btn--active': view === 'calendar' }"
            @click="view = 'calendar'"
          >
            <i class="fa-solid fa-calendar" />
            Calendario
          </button>
        </div>
        <!-- New meeting -->
        <button
          v-if="unscheduledWorkspaces.length > 0"
          class="meetings-view__new-btn"
          @click="openModal()"
        >
          <i class="fa-solid fa-plus" />
          Programar reunión
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="meetings-view__state">
      <i class="fa-solid fa-circle-notch fa-spin" />
      Cargando reuniones…
    </div>

    <div v-else-if="error" class="meetings-view__state meetings-view__state--error">
      <i class="fa-solid fa-triangle-exclamation" />
      {{ error }}
    </div>

    <!-- ── AGENDA VIEW ──────────────────────────────────────────── -->
    <template v-else-if="view === 'agenda'">
      <div v-if="meetings.length === 0" class="meetings-view__empty">
        <i class="fa-solid fa-handshake-slash" />
        <p>Ninguna reunión programada aún.</p>
        <button class="meetings-view__new-btn" @click="openModal()">
          <i class="fa-solid fa-plus" /> Programar primera reunión
        </button>
      </div>

      <div v-else class="meetings-view__agenda">
        <div
          v-for="m in meetings"
          :key="m._id"
          class="meeting-card"
          :class="{ 'meeting-card--overdue': isOverdue(m.nextMeetingDate) }"
        >
          <div class="meeting-card__avatar">
            <img
              v-if="workspacePageId(m)"
              :src="`https://graph.facebook.com/${workspacePageId(m)}/picture?type=normal`"
              :alt="workspaceName(m)"
              class="meeting-card__avatar-img"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <span v-else>{{ workspaceInitials(m) }}</span>
          </div>

          <div class="meeting-card__body">
            <div class="meeting-card__top">
              <span class="meeting-card__ws-name">{{ workspaceName(m) }}</span>
              <span
                class="meeting-card__days-badge"
                :class="`meeting-card__days-badge--${urgency(m.nextMeetingDate)}`"
              >
                <i :class="daysIcon(m.nextMeetingDate)" />
                {{ daysLabel(m.nextMeetingDate) }}
              </span>
            </div>

            <div class="meeting-card__date">
              <i class="fa-solid fa-calendar-day" />
              Próxima: {{ formatDate(m.nextMeetingDate) }}
            </div>

            <div v-if="m.contactName" class="meeting-card__contact">
              <i class="fa-solid fa-user-tie" />
              Con: <strong>{{ m.contactName }}</strong>
              <span v-if="m.contactEmail" class="meeting-card__contact-email">· {{ m.contactEmail }}</span>
            </div>

            <div v-if="m.lastMeetingDate" class="meeting-card__last">
              <i class="fa-solid fa-clock-rotate-left" />
              Última: {{ formatDate(m.lastMeetingDate) }}
            </div>

            <a
              v-if="m.meetingLink"
              :href="m.meetingLink"
              target="_blank"
              rel="noopener noreferrer"
              class="meeting-card__link"
              @click.stop
            >
              <i class="fa-solid fa-video" />
              Enlace de reunión
            </a>

            <a
              v-if="m.recordingLink"
              :href="m.recordingLink"
              target="_blank"
              rel="noopener noreferrer"
              class="meeting-card__link meeting-card__link--recording"
              @click.stop
            >
              <i class="fa-solid fa-circle-play" />
              Ver grabación
            </a>

            <div v-if="m.agenda" class="meeting-card__agenda">
              <i class="fa-solid fa-list-check" />
              {{ m.agenda }}
            </div>

            <div v-if="m.notes" class="meeting-card__notes">
              <i class="fa-solid fa-file-lines" />
              {{ m.notes }}
            </div>
          </div>

          <div class="meeting-card__actions">
            <button
              class="meeting-card__btn meeting-card__btn--edit"
              @click="openModal(m)"
              title="Editar reunión"
            >
              <i class="fa-solid fa-pen" />
            </button>
            <button
              class="meeting-card__btn meeting-card__btn--complete"
              :class="{ 'meeting-card__btn--complete-ready': canComplete(m) }"
              :disabled="!canComplete(m)"
              :title="canComplete(m) ? 'Marcar como realizada' : 'Disponible el día de la reunión'"
              @click="openCompleteModal(m)"
            >
              <i class="fa-solid fa-circle-check" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── CALENDAR VIEW ───────────────────────────────────────── -->
    <template v-else>
      <div class="meetings-calendar">
        <!-- Month nav -->
        <div class="meetings-calendar__nav">
          <button class="meetings-calendar__nav-btn" @click="prevMonth">
            <i class="fa-solid fa-chevron-left" />
          </button>
          <span class="meetings-calendar__month">{{ calendarMonthLabel }}</span>
          <button class="meetings-calendar__nav-btn" @click="nextMonth">
            <i class="fa-solid fa-chevron-right" />
          </button>
        </div>

        <!-- Weekday headers (Mon–Dom) -->
        <div class="meetings-calendar__grid meetings-calendar__grid--headers">
          <span v-for="d in ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']" :key="d" class="meetings-calendar__day-header">{{ d }}</span>
        </div>

        <!-- Day grid -->
        <div class="meetings-calendar__grid">
          <div
            v-for="(day, i) in calendarDays"
            :key="i"
            class="meetings-calendar__day"
            :class="{
              'meetings-calendar__day--empty': !day,
              'meetings-calendar__day--today': day && isToday(day),
              'meetings-calendar__day--has-meeting': day && meetingsOnDay(day).length > 0,
            }"
          >
            <template v-if="day">
              <span class="meetings-calendar__day-num">{{ day.getDate() }}</span>
              <div v-if="meetingsOnDay(day).length > 0" class="meetings-calendar__day-meetings">
                <div
                  v-for="m in meetingsOnDay(day)"
                  :key="m._id"
                  class="meetings-calendar__event"
                  :title="workspaceName(m)"
                  @click="openModal(m)"
                >
                  {{ workspaceName(m).substring(0, 10) }}{{ workspaceName(m).length > 10 ? '…' : '' }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- ── MODAL ──────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="showModal" class="meeting-modal-backdrop" @click.self="closeModal">
        <div class="meeting-modal">
          <div class="meeting-modal__header">
            <h2 class="meeting-modal__title">
              {{ editingMeeting ? 'Editar reunión' : 'Programar reunión' }}
            </h2>
            <button class="meeting-modal__close" @click="closeModal">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>

          <div class="meeting-modal__body">
            <!-- Client selector -->
            <div class="meeting-modal__field">
              <label class="meeting-modal__label">Cliente</label>

              <!-- Editing: locked name -->
              <div v-if="editingMeeting" class="meeting-modal__client-name">
                <div class="meeting-modal__client-name-avatar">
                  <img
                    v-if="(editingMeeting.workspace as any)?.metaAds?.pageId"
                    :src="`https://graph.facebook.com/${(editingMeeting.workspace as any).metaAds.pageId}/picture?type=normal`"
                    :alt="workspaceName(editingMeeting)"
                    style="width:100%;height:100%;object-fit:cover;border-radius:6px;"
                    @error="($event.target as HTMLImageElement).style.display='none'"
                  />
                  <span v-else>{{ workspaceName(editingMeeting).substring(0,2).toUpperCase() }}</span>
                </div>
                {{ editingMeeting.workspace?.name || workspaceName(editingMeeting) }}
              </div>

              <!-- New: workspace picker -->
              <template v-else>
                <!-- Selected state -->
                <div v-if="selectedWs" class="meeting-modal__ws-selected">
                  <div class="meeting-modal__ws-selected-avatar">
                    <img
                      v-if="(selectedWs as any).metaAds?.pageId"
                      :src="`https://graph.facebook.com/${(selectedWs as any).metaAds.pageId}/picture?type=normal`"
                      :alt="selectedWs.name"
                      style="width:100%;height:100%;object-fit:cover;border-radius:6px;"
                      @error="($event.target as HTMLImageElement).style.display='none'"
                    />
                    <span v-else>{{ selectedWs.name.substring(0,2).toUpperCase() }}</span>
                  </div>
                  <span class="meeting-modal__ws-selected-name">{{ selectedWs.name }}</span>
                  <button class="meeting-modal__ws-clear" @click="clearWorkspaceSelection" title="Cambiar cliente">
                    <i class="fa-solid fa-xmark" />
                  </button>
                </div>

                <!-- Picker grid -->
                <div v-else class="meeting-modal__ws-picker">
                  <div class="meeting-modal__ws-search-wrap">
                    <i class="fa-solid fa-magnifying-glass meeting-modal__ws-search-icon" />
                    <input
                      v-model="modalWsSearch"
                      type="text"
                      class="meeting-modal__ws-search"
                      placeholder="Buscar cliente…"
                    />
                  </div>

                  <div v-if="filteredModalWs.length === 0" class="meeting-modal__ws-empty">
                    Sin resultados para "{{ modalWsSearch }}"
                  </div>

                  <div v-else class="meeting-modal__ws-grid">
                    <button
                      v-for="ws in modalWsVisible"
                      :key="ws._id"
                      type="button"
                      class="meeting-modal__ws-card"
                      @click="selectWorkspace(ws)"
                    >
                      <div class="meeting-modal__ws-card-avatar">
                        <img
                          v-if="(ws as any).metaAds?.pageId"
                          :src="`https://graph.facebook.com/${(ws as any).metaAds.pageId}/picture?type=normal`"
                          :alt="ws.name"
                          style="width:100%;height:100%;object-fit:cover;border-radius:8px;"
                          @error="($event.target as HTMLImageElement).style.display='none'"
                        />
                        <span v-else>{{ ws.name.substring(0,2).toUpperCase() }}</span>
                      </div>
                      <span class="meeting-modal__ws-card-name">{{ ws.name }}</span>
                    </button>
                  </div>

                  <!-- Pagination -->
                  <div v-if="modalWsPages > 1" class="meeting-modal__ws-pagination">
                    <button
                      class="meeting-modal__ws-page-btn"
                      :disabled="modalWsPage === 0"
                      @click="modalWsPage--"
                    >
                      <i class="fa-solid fa-chevron-left" />
                    </button>
                    <span class="meeting-modal__ws-page-label">{{ modalWsPage + 1 }} / {{ modalWsPages }}</span>
                    <button
                      class="meeting-modal__ws-page-btn"
                      :disabled="modalWsPage >= modalWsPages - 1"
                      @click="modalWsPage++"
                    >
                      <i class="fa-solid fa-chevron-right" />
                    </button>
                  </div>
                </div>
              </template>
            </div>

            <!-- Contact person picker -->
            <div v-if="modalWorkspaceId" class="meeting-modal__field">
              <label class="meeting-modal__label">Reunirme con <span class="meeting-modal__optional">(opcional)</span></label>

              <div v-if="loadingContacts" class="meeting-modal__contacts-loading">
                <i class="fa-solid fa-circle-notch fa-spin" /> Cargando usuarios…
              </div>
              <div v-else-if="modalContacts.length === 0" class="meeting-modal__contacts-empty">
                <i class="fa-solid fa-users-slash" /> Sin usuarios del entorno registrados.
              </div>
              <div v-else class="meeting-modal__contacts-grid">
                <button
                  v-for="u in modalContacts"
                  :key="u._id"
                  type="button"
                  class="meeting-modal__contact-card"
                  :class="{ 'meeting-modal__contact-card--selected': modalContactId === u._id }"
                  @click="selectContact(u)"
                >
                  <div class="meeting-modal__contact-avatar">
                    {{ (u.name || u.email).substring(0,2).toUpperCase() }}
                  </div>
                  <div class="meeting-modal__contact-info">
                    <span class="meeting-modal__contact-name">{{ u.name || u.email }}</span>
                    <span class="meeting-modal__contact-email">{{ u.email }}</span>
                  </div>
                  <i v-if="modalContactId === u._id" class="fa-solid fa-circle-check meeting-modal__contact-check" />
                </button>
              </div>
            </div>

            <!-- Date picker -->
            <div class="meeting-modal__field">
              <label class="meeting-modal__label">Fecha de reunión</label>
              <!-- Quick-pick chips -->
              <div class="meeting-modal__quick-chips">
                <button
                  v-for="chip in quickChips"
                  :key="chip.offset"
                  type="button"
                  class="meeting-modal__chip"
                  :class="[`meeting-modal__chip--${chip.urgency}`, { 'meeting-modal__chip--selected': isChipSelected(chip.offset) }]"
                  @click="pickDate(chip.offset)"
                >
                  <i :class="chip.icon" />
                  {{ chip.label }}
                </button>
              </div>
              <input
                v-model="modalDate"
                type="date"
                class="meeting-modal__input"
              />
            </div>

            <!-- Meeting link -->
            <div class="meeting-modal__field">
              <label class="meeting-modal__label">Enlace de reunión <span class="meeting-modal__optional">(Zoom, Meet…)</span></label>
              <div class="meeting-modal__link-wrapper">
                <i class="fa-solid fa-video meeting-modal__link-icon" />
                <input
                  v-model="modalLink"
                  type="url"
                  class="meeting-modal__input meeting-modal__input--with-icon"
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
              </div>
            </div>

            <!-- Agenda -->
            <div class="meeting-modal__field">
              <label class="meeting-modal__label">Agenda <span class="meeting-modal__optional">(temas previos)</span></label>
              <textarea
                v-model="modalAgenda"
                class="meeting-modal__textarea"
                placeholder="Temas a tratar: performance de campaña, revisión de métricas…"
                rows="2"
              />
            </div>

            <!-- Notes (only for existing meetings) -->
            <div v-if="editingMeeting" class="meeting-modal__field">
              <label class="meeting-modal__label">Notas post-reunión <span class="meeting-modal__optional">(opcional)</span></label>
              <textarea
                v-model="modalNotes"
                class="meeting-modal__textarea"
                placeholder="Resumen, acuerdos, próximos pasos…"
                rows="2"
              />
            </div>

            <p v-if="modalError" class="meeting-modal__error">
              <i class="fa-solid fa-circle-exclamation" />
              {{ modalError }}
            </p>
          </div>

          <div class="meeting-modal__footer">
            <button class="meeting-modal__cancel" @click="closeModal">Cancelar</button>
            <button
              class="meeting-modal__save"
              :disabled="modalSaving"
              @click="saveModal"
            >
              <i :class="modalSaving ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-check'" />
              {{ modalSaving ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── COMPLETE MODAL ─────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="showCompleteModal" class="meeting-modal-backdrop" @click.self="closeCompleteModal">
        <div class="meeting-modal meeting-modal--complete">
          <div class="meeting-modal__header">
            <div class="meeting-modal__complete-icon">
              <i class="fa-solid fa-circle-check" />
            </div>
            <div>
              <h2 class="meeting-modal__title">Reunión realizada</h2>
              <p class="meeting-modal__complete-subtitle">{{ completingMeeting ? workspaceName(completingMeeting) : '' }}</p>
            </div>
            <button class="meeting-modal__close" @click="closeCompleteModal">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>

          <div class="meeting-modal__body">
            <div class="meeting-modal__complete-info">
              <i class="fa-solid fa-info-circle" />
              La próxima reunión se programará automáticamente en {{ completingMeeting?.intervalDays ?? 25 }} días.
            </div>

            <!-- Recording link -->
            <div class="meeting-modal__field">
              <label class="meeting-modal__label">Link de la grabación <span class="meeting-modal__optional">(opcional)</span></label>
              <div class="meeting-modal__link-wrapper">
                <i class="fa-solid fa-circle-play meeting-modal__link-icon" style="color:#7c3aed;" />
                <input
                  v-model="completeRecordingLink"
                  type="url"
                  class="meeting-modal__input meeting-modal__input--with-icon"
                  placeholder="https://drive.google.com/… o Loom, etc."
                />
              </div>
            </div>

            <!-- Notes -->
            <div class="meeting-modal__field">
              <label class="meeting-modal__label">Notas de la reunión <span class="meeting-modal__optional">(opcional)</span></label>
              <textarea
                v-model="completeNotes"
                class="meeting-modal__textarea"
                placeholder="Resumen de lo tratado, acuerdos, próximos pasos…"
                rows="3"
              />
            </div>
          </div>

          <div class="meeting-modal__footer">
            <button class="meeting-modal__cancel" @click="closeCompleteModal">Cancelar</button>
            <button
              class="meeting-modal__save meeting-modal__save--complete"
              :disabled="completeSaving"
              @click="confirmComplete"
            >
              <i :class="completeSaving ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-circle-check'" />
              {{ completeSaving ? 'Guardando…' : 'Confirmar reunión' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.meetings-view {
  padding: 2rem;
  max-width: 900px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  &__title {
    font-size: 1.6rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0 0 0.2rem;
  }

  &__subtitle {
    font-size: 0.85rem;
    color: rgba($primary-dark, 0.45);
    margin: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  &__toggle {
    display: flex;
    background: rgba($primary-dark, 0.06);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
  }

  &__toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.85rem;
    border: none;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    color: rgba($primary-dark, 0.55);
    transition: background 0.15s, color 0.15s;

    &--active {
      background: $white;
      color: $primary-dark;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
  }

  &__new-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.1rem;
    background: $primary;
    color: $white;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;

    &:hover { opacity: 0.88; }
  }

  &__state {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: rgba($primary-dark, 0.45);
    font-size: 0.95rem;
    padding: 2rem;
    justify-content: center;

    &--error { color: $alert-error; }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 2rem;
    text-align: center;
    color: rgba($primary-dark, 0.4);
    font-size: 1rem;

    i { font-size: 2.5rem; opacity: 0.4; }
    p { margin: 0; }
  }

  // ── Agenda ──
  &__agenda {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}

// ── Meeting card ──────────────────────────────────────────────
.meeting-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  transition: box-shadow 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);

  &--overdue {
    border-color: rgba(#ef4444, 0.3);
    background: rgba(#ef4444, 0.025);
    border-left: 3px solid #ef4444;
  }

  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }

  &__avatar {
    width: 48px;
    height: 48px;
    background: $primary;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: $white;
    flex-shrink: 0;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  &__top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  &__ws-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__days-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.22rem 0.65rem;
    border-radius: 100px;
    white-space: nowrap;

    i { font-size: 0.68rem; }

    &--overdue {
      background: rgba(#ef4444, 0.12);
      color: #dc2626;
      border: 1px solid rgba(#ef4444, 0.3);
    }

    &--today {
      background: rgba(#ef4444, 0.1);
      color: #dc2626;
      border: 1px solid rgba(#ef4444, 0.25);
      animation: pulse-red 1.8s ease-in-out infinite;
    }

    &--tomorrow {
      background: rgba(#f59e0b, 0.12);
      color: #b45309;
      border: 1px solid rgba(#f59e0b, 0.3);
    }

    &--soon {
      background: rgba(#eab308, 0.1);
      color: #a16207;
      border: 1px solid rgba(#eab308, 0.28);
    }

    &--ok {
      background: rgba($alert-success, 0.1);
      color: darken($alert-success, 10%);
      border: 1px solid rgba($alert-success, 0.25);
    }
  }

  @keyframes pulse-red {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.65; }
  }

  &__date,
  &__last,
  &__agenda {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: rgba($primary-dark, 0.6);

    i {
      font-size: 0.78rem;
      color: rgba($primary-dark, 0.35);
      margin-top: 0.1rem;
      flex-shrink: 0;
    }
  }

  &__agenda {
    font-style: italic;
    color: rgba($primary-dark, 0.45);
  }

  &__contact {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.8rem;
    color: rgba($primary-dark, 0.65);

    i { font-size: 0.75rem; color: rgba($primary-dark, 0.35); flex-shrink: 0; }
    strong { color: $primary-dark; }
  }

  &__contact-email {
    font-size: 0.75rem;
    color: rgba($primary-dark, 0.4);
  }

  &__notes {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: rgba($primary-dark, 0.55);
    background: rgba($primary-dark, 0.03);
    border-radius: 6px;
    padding: 0.4rem 0.6rem;

    i {
      font-size: 0.78rem;
      color: rgba($primary-dark, 0.35);
      margin-top: 0.1rem;
      flex-shrink: 0;
    }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: #2563eb;
    text-decoration: none;
    padding: 0.22rem 0.65rem;
    background: rgba(#2563eb, 0.07);
    border: 1px solid rgba(#2563eb, 0.18);
    border-radius: 100px;
    width: fit-content;
    transition: background 0.15s;

    i { font-size: 0.7rem; }
    &:hover { background: rgba(#2563eb, 0.13); }

    &--recording {
      color: #7c3aed;
      background: rgba(#7c3aed, 0.07);
      border-color: rgba(#7c3aed, 0.18);

      &:hover { background: rgba(#7c3aed, 0.13); }
    }
  }

  &__btn--complete-ready {
    background: rgba($alert-success, 0.15) !important;
    color: darken($alert-success, 8%) !important;
    box-shadow: 0 0 0 2px rgba($alert-success, 0.2);

    &:hover { background: rgba($alert-success, 0.25) !important; }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  &__btn {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    transition: background 0.15s, color 0.15s;

    &--edit {
      background: rgba($primary-dark, 0.07);
      color: rgba($primary-dark, 0.5);

      &:hover {
        background: rgba($primary, 0.12);
        color: $primary;
      }
    }

    &--complete {
      background: rgba($alert-success, 0.1);
      color: $alert-success;

      &:hover { background: rgba($alert-success, 0.2); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  }
}

// ── Calendar ──────────────────────────────────────────────────
.meetings-calendar {
  background: $white;
  border-radius: 14px;
  border: 1px solid rgba($primary-dark, 0.08);
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);

  &__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.07);
  }

  &__month {
    font-weight: 700;
    font-size: 1rem;
    color: $primary-dark;
    text-transform: capitalize;
  }

  &__nav-btn {
    width: 34px;
    height: 34px;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    color: rgba($primary-dark, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    transition: background 0.15s;

    &:hover { background: rgba($primary-dark, 0.05); }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: rgba($primary-dark, 0.07);
    padding: 0 1px 1px;

    &--headers {
      background: transparent;
      padding: 0.5rem 1rem;
      gap: 0;
    }
  }

  &__day-header {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba($primary-dark, 0.4);
    text-align: center;
    padding: 0.25rem 0;
  }

  &__day {
    min-height: 90px;
    background: $white;
    padding: 0.5rem;
    position: relative;
    cursor: default;

    &--empty {
      background: rgba($primary-dark, 0.015);
    }

    &--today &-num {
      background: $primary;
      color: $white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &--has-meeting {
      background: rgba($alert-success, 0.03);
    }
  }

  &__day-num {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba($primary-dark, 0.7);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-bottom: 0.25rem;
  }

  &__day-meetings {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__event {
    font-size: 0.68rem;
    font-weight: 600;
    background: $primary;
    color: $white;
    border-radius: 4px;
    padding: 0.15rem 0.35rem;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity 0.15s;

    &:hover { opacity: 0.85; }
  }
}

// ── Modal ──────────────────────────────────────────────────────
.meeting-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.meeting-modal {
  background: $white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1.25rem;
    border-bottom: 1px solid rgba($primary-dark, 0.07);
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0;
  }

  &__close {
    width: 32px;
    height: 32px;
    background: rgba($primary-dark, 0.06);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba($primary-dark, 0.5);
    transition: background 0.15s;

    &:hover { background: rgba($alert-error, 0.1); color: $alert-error; }
  }

  &__body {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__label {
    font-size: 0.78rem;
    font-weight: 700;
    color: rgba($primary-dark, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__optional {
    font-weight: 400;
    text-transform: none;
    color: rgba($primary-dark, 0.35);
  }

  // ── Quick-pick chips ──────────────────────────────────────
  &__quick-chips {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-bottom: 0.25rem;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.7rem;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: all 0.15s;

    i { font-size: 0.7rem; }

    &--overdue,
    &--today {
      background: rgba(#ef4444, 0.08);
      color: #dc2626;
      border-color: rgba(#ef4444, 0.22);
      &:hover, &.meeting-modal__chip--selected {
        background: #ef4444;
        color: #fff;
        border-color: #ef4444;
      }
    }

    &--tomorrow {
      background: rgba(#f59e0b, 0.1);
      color: #b45309;
      border-color: rgba(#f59e0b, 0.25);
      &:hover, &.meeting-modal__chip--selected {
        background: #f59e0b;
        color: #fff;
        border-color: #f59e0b;
      }
    }

    &--soon {
      background: rgba(#eab308, 0.1);
      color: #a16207;
      border-color: rgba(#eab308, 0.25);
      &:hover, &.meeting-modal__chip--selected {
        background: #eab308;
        color: #fff;
        border-color: #eab308;
      }
    }

    &--ok {
      background: rgba($alert-success, 0.08);
      color: darken($alert-success, 10%);
      border-color: rgba($alert-success, 0.22);
      &:hover, &.meeting-modal__chip--selected {
        background: $alert-success;
        color: #fff;
        border-color: $alert-success;
      }
    }
  }

  &__select,
  &__input {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 8px;
    font-size: 0.9rem;
    color: $primary-dark;
    background: $white;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;

    &:focus { border-color: $primary; }
  }

  &__textarea {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 8px;
    font-size: 0.88rem;
    color: $primary-dark;
    font-family: inherit;
    resize: vertical;
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;

    &:focus { border-color: $primary; }
    &::placeholder { color: rgba($primary-dark, 0.3); }
  }

  &__client-name {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.5rem 0.85rem;
    background: rgba($primary-dark, 0.04);
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    color: $primary-dark;
  }

  &__client-name-avatar {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: $primary;
    color: $white;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  // ── Workspace picker ──────────────────────────────────────
  &__ws-selected {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.5rem 0.85rem;
    background: rgba($primary, 0.06);
    border: 1.5px solid rgba($primary, 0.2);
    border-radius: 10px;
  }

  &__ws-selected-avatar {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: $primary;
    color: $white;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  &__ws-selected-name {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__ws-clear {
    width: 26px;
    height: 26px;
    background: rgba($primary-dark, 0.07);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba($primary-dark, 0.45);
    font-size: 0.75rem;
    transition: background 0.15s, color 0.15s;

    &:hover { background: rgba($alert-error, 0.1); color: $alert-error; }
  }

  &__ws-picker {
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 10px;
    overflow: hidden;
  }

  &__ws-search-wrap {
    position: relative;
    border-bottom: 1px solid rgba($primary-dark, 0.08);
  }

  &__ws-search-icon {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.78rem;
    color: rgba($primary-dark, 0.35);
    pointer-events: none;
  }

  &__ws-search {
    width: 100%;
    padding: 0.65rem 0.85rem 0.65rem 2.2rem;
    border: none;
    outline: none;
    font-size: 0.88rem;
    font-family: inherit;
    color: $primary-dark;
    background: transparent;
    box-sizing: border-box;

    &::placeholder { color: rgba($primary-dark, 0.3); }
  }

  &__ws-empty {
    padding: 1rem;
    text-align: center;
    font-size: 0.82rem;
    color: rgba($primary-dark, 0.4);
  }

  &__ws-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
  }

  &__ws-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0.85rem 0.5rem;
    border: none;
    border-right: 1px solid rgba($primary-dark, 0.06);
    background: transparent;
    cursor: pointer;
    transition: background 0.15s;

    &:last-child { border-right: none; }
    &:hover { background: rgba($primary, 0.05); }
  }

  &__ws-card-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: $primary;
    color: $white;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  &__ws-card-name {
    font-size: 0.74rem;
    font-weight: 600;
    color: $primary-dark;
    text-align: center;
    line-height: 1.3;
    word-break: break-word;
    max-width: 90px;
  }

  &__ws-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.6rem;
  }

  &__ws-page-btn {
    width: 28px;
    height: 28px;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    color: rgba($primary-dark, 0.5);
    transition: all 0.15s;

    &:hover:not(:disabled) { border-color: $primary; color: $primary; }
    &:disabled { opacity: 0.35; cursor: default; }
  }

  &__ws-page-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: rgba($primary-dark, 0.5);
    min-width: 40px;
    text-align: center;
  }

  // ── Contact picker ────────────────────────────────────────
  &__contacts-loading,
  &__contacts-empty {
    font-size: 0.82rem;
    color: rgba($primary-dark, 0.4);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }

  &__contacts-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__contact-card {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.75rem;
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;

    &:hover { border-color: $primary; background: rgba($primary, 0.04); }

    &--selected {
      border-color: $alert-success;
      background: rgba($alert-success, 0.06);
    }
  }

  &__contact-avatar {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba($primary-dark, 0.12);
    color: $primary-dark;
    font-size: 0.78rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__contact-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  &__contact-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__contact-email {
    font-size: 0.75rem;
    color: rgba($primary-dark, 0.45);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__contact-check {
    color: $alert-success;
    font-size: 0.95rem;
    flex-shrink: 0;
  }

  // ── Link field ────────────────────────────────────────────
  &__link-wrapper {
    position: relative;
  }

  &__link-icon {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8rem;
    color: #2563eb;
    pointer-events: none;
  }

  &__input--with-icon {
    padding-left: 2.2rem !important;
  }

  // ── Complete modal ────────────────────────────────────────
  &--complete {
    max-width: 440px;
  }

  &__complete-icon {
    width: 36px;
    height: 36px;
    background: rgba($alert-success, 0.12);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $alert-success;
    font-size: 1rem;
    flex-shrink: 0;
  }

  &__complete-subtitle {
    font-size: 0.8rem;
    color: rgba($primary-dark, 0.45);
    margin: 0.1rem 0 0;
    font-weight: 500;
  }

  &__complete-info {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    background: rgba(#2563eb, 0.06);
    border: 1px solid rgba(#2563eb, 0.15);
    border-radius: 8px;
    padding: 0.75rem 0.9rem;
    font-size: 0.82rem;
    color: #1d4ed8;

    i { flex-shrink: 0; margin-top: 0.1rem; }
  }

  &__save--complete {
    background: $alert-success !important;
    &:hover { opacity: 0.88; }
  }

  &__error {
    font-size: 0.82rem;
    color: $alert-error;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid rgba($primary-dark, 0.06);
  }

  &__cancel {
    padding: 0.6rem 1.2rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 8px;
    background: transparent;
    color: rgba($primary-dark, 0.6);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: rgba($primary-dark, 0.04); }
  }

  &__save {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.4rem;
    background: $primary;
    color: $white;
    border: none;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;

    &:hover { opacity: 0.88; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
  .meeting-modal { transition: transform 0.2s ease, opacity 0.2s ease; }
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  .meeting-modal { transform: scale(0.95); opacity: 0; }
}
</style>
