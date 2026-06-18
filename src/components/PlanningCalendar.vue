<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useUserStore } from '@/stores/user'
import { planningService } from '@/services/planning.service'
import { workspaceService } from '@/services/workspace.service'
import { videoPlanningService } from '@/services/videoPlanning.service'
import type {
  PlanningEntry,
  GlobalPlanningEntry,
  WorkspaceUser,
  Workspace
} from '@/types'
import type { VideoCalendarItem, VideoItem } from '@/types/videoPlanning'
import { ghlService, type GhlMeeting } from '@/services/ghl.service'

// Sub-components
import PlanningHeader from './planning/PlanningHeader.vue'
import PlanningMonthView from './planning/PlanningMonthView.vue'
import PlanningWeekView from './planning/PlanningWeekView.vue'
import GhlMeetingDetailModal from './planning/GhlMeetingDetailModal.vue'
import PlanningEventModal from './planning/PlanningEventModal.vue'
import ClientPlanningEventModal from './planning/ClientPlanningEventModal.vue'
import PlanningTypeFilters from './planning/PlanningTypeFilters.vue'
import VideoPlanningItemModal from './videoPlanning/VideoPlanningItemModal.vue'
import VideoInstagramPreviewModal from './videoPlanning/VideoInstagramPreviewModal.vue'

const props = defineProps({
  workspaceId: {
    type: String,
    required: true,
  },
  defaultView: {
    type: String as () => 'month' | 'week' | 'global-week' | 'global-month',
    default: 'month',
  },
  allowGlobal: {
    type: Boolean,
    default: false,
  },
})

// Stores & Composables
const userStore = useUserStore()
const toast = useToast()
const confirm = useConfirm()

// State: View & Navigation
const viewMode = ref(
  !props.allowGlobal && props.defaultView.includes('global')
    ? (props.defaultView.replace('global-', '') as 'month' | 'week')
    : props.defaultView
)
const currentMonth = ref(new Date())
const currentWeekStart = ref(getThisMonday(new Date()))

// State: Data
const entries = ref<PlanningEntry[]>([])
const weekEntries = ref<PlanningEntry[]>([])
const globalEntries = ref<GlobalPlanningEntry[]>([])
const globalMonthEntries = ref<GlobalPlanningEntry[]>([])
const workspaceUsers = ref<WorkspaceUser[]>([])
const workspaceMeta = ref<Workspace | null>(null)
const videoCalendarItems = ref<VideoCalendarItem[]>([])
const ghlMeetings = ref<GhlMeeting[]>([])

// State: UI
const isLoading = ref(false)
const isWeekLoading = ref(false)
const isSaving = ref(false)
const showModal = ref(false)
const selectedEntry = ref<PlanningEntry | null>(null)
const defaultModalDate = ref<Date | null>(null)
const calendarFilter = ref<'all' | 'production' | 'publication'>('all')

const showVideoItemModal = ref(false)
const selectedVideoItem = ref<VideoItem | null>(null)

// Meeting Modal State
const showMeetingModal = ref(false)
const selectedMeeting = ref<any>(null)

const showInstagramPreviewModal = ref(false)
const selectedVideoCalendarItem = ref<VideoCalendarItem | null>(null)

// Permissions & Filters
const showMineOnly = ref(userStore.role !== 'superadmin' && !userStore.isInternal)
const canManage = computed(() => {
  // Clients (non-internal, non-superadmin) can never manage planning entries
  if (!userStore.isInternal && userStore.role !== 'superadmin') return false

  const isProductor = userStore.isInternal && userStore.internalRole === 'productor'
  if (isProductor) return false // Productor can only view

  return userStore.role === 'superadmin' || userStore.isInternal
})

const canCreate = computed(() =>
  userStore.role === 'superadmin' ||
  (userStore.isInternal && (
    userStore.internalRole === 'community_manager' ||
    userStore.internalRole === 'content_manager' ||
    userStore.internalRole === 'project_manager'
  ))
)

const currentUserId = computed(() => userStore.id)
function isMyEntry(entry: PlanningEntry): boolean {
  if (!showMineOnly.value) return true
  if (!entry.assignedTo || entry.assignedTo.length === 0) return true
  return entry.assignedTo.some(u => u._id === currentUserId.value)
}

const filteredEntries = computed(() => entries.value.filter(isMyEntry))
const filteredWeekEntries = computed(() => weekEntries.value.filter(isMyEntry))
const filteredGlobalEntries = computed(() => globalEntries.value.filter(isMyEntry))
const filteredGlobalMonthEntries = computed(() => globalMonthEntries.value.filter(isMyEntry))

const activeViewEntries = computed(() => {
  if (calendarFilter.value === 'publication') return []
  
  if (viewMode.value === 'global-month') return filteredGlobalMonthEntries.value
  if (viewMode.value === 'global-week') return filteredGlobalEntries.value
  if (viewMode.value === 'week') return filteredWeekEntries.value
  return filteredEntries.value
})

const activeVideoItems = computed(() => {
  if (calendarFilter.value === 'production') return []
  return videoCalendarItems.value
})

// ── Data Fetching ───────────────────────────────────────────

async function fetchEntries() {
  isLoading.value = true
  const start = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1).toISOString()
  const end = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0, 23, 59, 59).toISOString()
  
  try {
    const [res] = await Promise.all([
      planningService.listEntries(props.workspaceId, { startDate: start, endDate: end }),
      fetchVideoCalendarItems(start, end),
      fetchGhlMeetings(start, end)
    ])
    entries.value = res.entries
  } catch {
    toast.error('Error al cargar planificación')
  } finally { isLoading.value = false }
}

async function fetchWeekEntries() {
  isWeekLoading.value = true
  const start = new Date(currentWeekStart.value)
  const end = new Date(currentWeekStart.value)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  try {
    const [res] = await Promise.all([
      planningService.listEntries(props.workspaceId, { startDate: start.toISOString(), endDate: end.toISOString() }),
      fetchVideoCalendarItems(start.toISOString(), end.toISOString()),
      fetchGhlMeetings(start.toISOString(), end.toISOString())
    ])
    weekEntries.value = res.entries
  } catch {
    toast.error('Error al cargar semana')
  } finally { isWeekLoading.value = false }
}

async function fetchGlobalWeek() {
  isWeekLoading.value = true
  try {
    const start = new Date(currentWeekStart.value)
    const end = new Date(currentWeekStart.value)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    const res = await planningService.listMyWeek({ startDate: start.toISOString(), endDate: end.toISOString() })
    globalEntries.value = res.entries
  } catch {
    toast.error('Error al cargar agenda global')
  } finally { isWeekLoading.value = false }
}

async function fetchGlobalMonth() {
  isLoading.value = true
  try {
    const start = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1).toISOString()
    const end = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0).toISOString()
    const res = await planningService.listMyWeek({ startDate: start, endDate: end })
    globalMonthEntries.value = res.entries
  } catch {
    toast.error('Error al cargar mes global')
  } finally { isLoading.value = false }
}

async function fetchWorkspaceUsers() {
  try {
    const res = await workspaceService.listUsers(props.workspaceId)
    workspaceUsers.value = res.users
  } catch {}
}

async function fetchWorkspaceMeta() {
  try {
    const res = await workspaceService.getWorkspace(props.workspaceId)
    workspaceMeta.value = res.workspace
  } catch {}
}

async function fetchVideoCalendarItems(startDate: string, endDate: string) {
  try {
    const items = await videoPlanningService.getCalendarItems(
      props.workspaceId,
      startDate,
      endDate,
    )
    // Safety filter: discard any item whose workspaceId doesn't match the current workspace
    videoCalendarItems.value = items.filter(i => i.workspaceId === props.workspaceId)
  } catch {
    // Non-critical: calendar video items are supplementary
  }
}

async function fetchGhlMeetings(startDate: string, endDate: string) {
  try {
    const res = await ghlService.getWorkspaceMeetings(props.workspaceId, { startDate, endDate })
    ghlMeetings.value = res.meetings || []
  } catch {
    // Non-critical: meetings are supplementary
  }
}

// ── Handlers ────────────────────────────────────────────────

function handleMeetingClick(meeting: any) {
  selectedMeeting.value = meeting
  showMeetingModal.value = true
}

function handlePrev() {
  if (viewMode.value.includes('month')) {
    currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
  } else {
    currentWeekStart.value = new Date(currentWeekStart.value.setDate(currentWeekStart.value.getDate() - 7))
  }
}

function handleNext() {
  if (viewMode.value.includes('month')) {
    currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
  } else {
    currentWeekStart.value = new Date(currentWeekStart.value.setDate(currentWeekStart.value.getDate() + 7))
  }
}

function handleToday() {
  currentMonth.value = new Date()
  currentWeekStart.value = getThisMonday(new Date())
}

function openCreate(date?: Date) {
  defaultModalDate.value = date || null
  selectedEntry.value = null
  showModal.value = true
}

const isClient = computed(() => !userStore.isInternal && userStore.role !== 'superadmin')

async function handleVideoClick(videoChip: any) {
  // Clients see the Instagram-style preview
  if (isClient.value) {
    const calItem = videoCalendarItems.value.find(v => v._id === videoChip._id)
    if (calItem) {
      selectedVideoCalendarItem.value = calItem
      showInstagramPreviewModal.value = true
    }
    return
  }

  isLoading.value = true
  try {
    const planning = await videoPlanningService.getByEntry(videoChip.entryId)
    if (planning) {
      const item = planning.items.find((i: VideoItem) => i._id === videoChip._id)
      if (item) {
        selectedVideoItem.value = item
        showVideoItemModal.value = true
      }
    }
  } finally {
    isLoading.value = false
  }
}

function openEdit(entry: PlanningEntry | GlobalPlanningEntry) {
  selectedEntry.value = entry as PlanningEntry
  showModal.value = true
}

async function handleSave(formData: any) {
  isSaving.value = true
  try {
    // Construct ISO date with time in Guayaquil/Ecuador context
    const fullDateStr = `${formData.date}T${formData.time}:00`
    const localDate = new Date(fullDateStr)
    const payload = { ...formData, date: localDate.toISOString() }

    if (selectedEntry.value) {
      await planningService.updateEntry(selectedEntry.value._id, payload)
      toast.success('Entrada actualizada')
    } else {
      await planningService.createEntry(props.workspaceId, payload)
      toast.success('Entrada creada')
    }
    showModal.value = false
    refreshCurrentView()
  } catch {
    toast.error('Error al guardar')
  } finally { isSaving.value = false }
}

async function handleDelete() {
  if (!selectedEntry.value) return
  const isConfirmed = await confirm.confirm({
    title: '¿Eliminar entrada?',
    message: 'Esta acción no se puede deshacer.',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    requireHold: true,
  })
  
  if (isConfirmed) {
    try {
      await planningService.deleteEntry(selectedEntry.value._id)
      toast.success('Entrada eliminada')
      showModal.value = false
      refreshCurrentView()
    } catch { toast.error('Error al eliminar') }
  }
}

function refreshCurrentView() {
  if (viewMode.value === 'global-month') fetchGlobalMonth()
  else if (viewMode.value === 'global-week') fetchGlobalWeek()
  else if (viewMode.value === 'week') fetchWeekEntries()
  else fetchEntries()
}

// ── Watchers & Lifecycle ────────────────────────────────────

watch(() => props.allowGlobal, (newVal) => {
  if (!newVal && viewMode.value.includes('global')) {
    viewMode.value = viewMode.value.replace('global-', '') as any
  }
})

watch(viewMode, refreshCurrentView, { immediate: true })
watch(currentMonth, () => {
  if (viewMode.value.includes('month')) refreshCurrentView()
})
watch(currentWeekStart, () => {
  if (viewMode.value.includes('week')) refreshCurrentView()
})

onMounted(() => {
  fetchWorkspaceUsers()
  fetchWorkspaceMeta()
})

// Helpers
function getThisMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}
</script>

<template>
  <div class="planning-calendar">
    <PlanningHeader
      v-model:viewMode="viewMode"
      v-model:showMineOnly="showMineOnly"
      :current-month="currentMonth"
      :current-week-start="currentWeekStart"
      :is-internal="allowGlobal && (userStore.role === 'superadmin' || userStore.isInternal)"
      :workspace-name="workspaceMeta?.name || ''"
      :workspace-meta-page-id="workspaceMeta?.metaAds?.pageId || ''"
      :can-manage="canManage"
      :can-create="canCreate"
      @prev="handlePrev"
      @next="handleNext"
      @today="handleToday"
      @create="openCreate()"
    />

    <PlanningTypeFilters v-model="calendarFilter" />

    <Transition name="view-fade" mode="out-in">
      <div v-if="isLoading || isWeekLoading" class="planning-calendar__loading">
        <div class="planning-calendar__spinner" />
      </div>

      <div v-else :key="viewMode" class="planning-calendar__view-container">
        <!-- Month Views -->
        <PlanningMonthView
          v-if="viewMode.includes('month')"
          :current-month="currentMonth"
          :entries="activeViewEntries"
          :video-items="activeVideoItems"
          :ghl-meetings="ghlMeetings"
          :is-global="viewMode === 'global-month'"
          :can-manage="canManage"
          :workspace-name="workspaceMeta?.name || ''"
          :workspace-meta-page-id="workspaceMeta?.metaAds?.pageId || ''"
          @click-day="openCreate"
          @edit-entry="openEdit"
          @click-video="handleVideoClick"
          @click-meeting="handleMeetingClick"
        />

        <!-- Week Views -->
        <PlanningWeekView
          v-else
          :monday="currentWeekStart"
          :entries="activeViewEntries"
          :video-items="activeVideoItems"
          :ghl-meetings="ghlMeetings"
          :is-global="viewMode === 'global-week'"
          :can-manage="canManage"
          :workspace-name="workspaceMeta?.name || ''"
          :workspace-meta-page-id="workspaceMeta?.metaAds?.pageId || ''"
          @edit-entry="openEdit"
          @click-video="handleVideoClick"
          @click-meeting="handleMeetingClick"
        />
      </div>
    </Transition>

    <!-- Modals -->
    <VideoPlanningItemModal
      :show="showVideoItemModal"
      :item="selectedVideoItem"
      :is-saving="false"
      @close="showVideoItemModal = false"
    />

    <VideoInstagramPreviewModal
      :show="showInstagramPreviewModal"
      :item="selectedVideoCalendarItem"
      :workspace-name="workspaceMeta?.name || ''"
      :workspace-logo-url="workspaceMeta?.metaAds?.pageId ? `https://graph.facebook.com/${workspaceMeta.metaAds.pageId}/picture?type=square&width=96&height=96` : ''"
      @close="showInstagramPreviewModal = false"
    />
    <!-- Internal/Superadmin Modal Overlay -->
    <PlanningEventModal
      v-if="userStore.isInternal || userStore.role === 'superadmin'"
      :show="showModal"
      :entry="selectedEntry"
      :workspace-id="workspaceId"
      :workspace-name="workspaceMeta?.name || ''"
      :workspace-meta-page-id="workspaceMeta?.metaAds?.pageId || ''"
      :workspace-users="workspaceUsers"
      :is-saving="isSaving"
      :can-manage="canManage"
      :default-date="(defaultModalDate as Date | null)"
      @close="showModal = false"
      @save="handleSave"
      @delete="handleDelete"
    />
    
    <!-- Strict Read-Only Client Modal Overlay -->
    <ClientPlanningEventModal
      v-else
      :show="showModal"
      :entry="selectedEntry"
      :workspace-id="workspaceId"
      :workspace-name="workspaceMeta?.name || ''"
      :workspace-meta-page-id="workspaceMeta?.metaAds?.pageId || ''"
      :workspace-users="workspaceUsers"
      :video-items="selectedEntry ? videoCalendarItems.filter(v => v.entryId === selectedEntry!._id) : []"
      @close="showModal = false" @saved="refresh"
    />

    <GhlMeetingDetailModal
      :show="showMeetingModal"
      :meeting="selectedMeeting"
      @close="showMeetingModal = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.planning-calendar {
  padding: 0;
  min-height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 1200px) {
    gap: 1.5rem;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: 6rem 0;
  }

  &__spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba($primary, 0.1);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__view-container {
    flex: 1;
    min-height: 0;
  }
}

// Transitions
.view-fade-enter-active, .view-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.view-fade-enter-from, .view-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
