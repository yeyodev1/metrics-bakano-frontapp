<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { meetingService } from '@/services/meeting.service'
import { workspaceService } from '@/services/workspace.service'
import type { ClientMeeting, Workspace, CreateMeetingPayload } from '@/types'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

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
const modalSaving = ref(false)
const modalError = ref<string | null>(null)

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
    const res = await workspaceService.listWorkspaces()
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
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
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
  return new Date(dateStr).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
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
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  modalDate.value = d.toISOString().split('T')[0]
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
    const mDay = new Date(m.nextMeetingDate)
    return (
      mDay.getFullYear() === day.getFullYear() &&
      mDay.getMonth() === day.getMonth() &&
      mDay.getDate() === day.getDate()
    )
  })
}

function isToday(day: Date): boolean {
  const today = new Date()
  return (
    day.getDate() === today.getDate() &&
    day.getMonth() === today.getMonth() &&
    day.getFullYear() === today.getFullYear()
  )
}

// ── Complete meeting ──────────────────────────────────────────
const completingId = ref<string | null>(null)

async function completeMeeting(m: ClientMeeting) {
  completingId.value = m._id
  try {
    const updated = await meetingService.completeMeeting(m._id)
    const idx = meetings.value.findIndex(x => x._id === m._id)
    if (idx !== -1) meetings.value[idx] = updated
  } catch {
    // silent
  } finally {
    completingId.value = null
  }
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(existing?: ClientMeeting, workspaceId?: string) {
  modalError.value = null
  if (existing) {
    editingMeeting.value = existing
    modalWorkspaceId.value = existing.workspaceId
    modalDate.value = existing.nextMeetingDate.split('T')[0]
    modalAgenda.value = existing.agenda || ''
  } else {
    editingMeeting.value = null
    modalWorkspaceId.value = workspaceId || ''
    modalDate.value = ''
    modalAgenda.value = ''
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingMeeting.value = null
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
      })
      const idx = meetings.value.findIndex(m => m._id === editingMeeting.value!._id)
      if (idx !== -1) meetings.value[idx] = updated
    } else {
      const payload: CreateMeetingPayload = {
        workspaceId: modalWorkspaceId.value,
        nextMeetingDate: modalDate.value,
        agenda: modalAgenda.value,
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

const isInternal = computed(() => userStore.isInternal)
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

            <div v-if="m.lastMeetingDate" class="meeting-card__last">
              <i class="fa-solid fa-clock-rotate-left" />
              Última: {{ formatDate(m.lastMeetingDate) }}
            </div>

            <div v-if="m.agenda" class="meeting-card__agenda">
              <i class="fa-solid fa-notes" />
              {{ m.agenda }}
            </div>
          </div>

          <div class="meeting-card__actions">
            <button class="meeting-card__btn meeting-card__btn--edit" @click="openModal(m)">
              <i class="fa-solid fa-pen" />
            </button>
            <button
              class="meeting-card__btn meeting-card__btn--complete"
              :disabled="completingId === m._id"
              @click="completeMeeting(m)"
              title="Marcar como realizada"
            >
              <i
                :class="completingId === m._id ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-circle-check'"
              />
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
            <!-- Client selector (only for new meetings) -->
            <div v-if="!editingMeeting" class="meeting-modal__field">
              <label class="meeting-modal__label">Cliente</label>
              <select v-model="modalWorkspaceId" class="meeting-modal__select">
                <option value="">Selecciona un cliente…</option>
                <option
                  v-for="ws in unscheduledWorkspaces"
                  :key="ws._id"
                  :value="ws._id"
                >
                  {{ ws.name }}
                </option>
              </select>
            </div>
            <div v-else class="meeting-modal__field">
              <label class="meeting-modal__label">Cliente</label>
              <div class="meeting-modal__client-name">
                {{ editingMeeting.workspace?.name || workspaceName(editingMeeting) }}
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
                  :class="[`meeting-modal__chip--${chip.urgency}`, { 'meeting-modal__chip--selected': modalDate === new Date(new Date().setDate(new Date().getDate() + chip.offset)).toISOString().split('T')[0] }]"
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

            <!-- Agenda -->
            <div class="meeting-modal__field">
              <label class="meeting-modal__label">Agenda <span class="meeting-modal__optional">(opcional)</span></label>
              <textarea
                v-model="modalAgenda"
                class="meeting-modal__textarea"
                placeholder="Temas a tratar: performance de campaña, revisión de métricas…"
                rows="3"
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
    padding: 0.65rem 0.85rem;
    background: rgba($primary-dark, 0.04);
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: $primary-dark;
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
