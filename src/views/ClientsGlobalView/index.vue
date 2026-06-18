<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { meetingService } from '@/services/meeting.service'
import type { Workspace, WorkspaceUser, ClientMeeting } from '@/types'
import { useUserStore } from '@/stores/user'

import ClientsGlobalHeader from './components/ClientsGlobalHeader.vue'
import ClientsGlobalList from './components/ClientsGlobalList.vue'
import ClientsGlobalUsersList from './components/ClientsGlobalUsersList.vue'
import ClientsGlobalMeetingModal from './components/ClientsGlobalMeetingModal.vue'
import ClientsGlobalUserModal from './components/ClientsGlobalUserModal.vue'

const userStore = useUserStore()

const LIMIT = 10

const workspaces = ref<Workspace[]>([])
const searchQuery = ref('')
const page = ref(1)
const hasMore = ref(false)
const total = ref(0)

const selectedWorkspace = ref<Workspace | null>(null)
const workspaceUsers = ref<WorkspaceUser[]>([])
const loadingWorkspaces = ref(false)
const loadingMore = ref(false)
const loadingUsers = ref(false)
const error = ref<string | null>(null)

// ── Meeting state ─────────────────────────────────────────────
const meetingMap = ref<Map<string, ClientMeeting>>(new Map())

async function fetchMeetings() {
  if (!userStore.isInternal && userStore.role !== 'superadmin') return
  try {
    const list = await meetingService.getMyMeetings()
    const m = new Map<string, ClientMeeting>()
    for (const meeting of list) m.set(meeting.workspaceId, meeting)
    meetingMap.value = m
  } catch {
    // silent
  }
}

// ── Search & Pagination ───────────────────────────────────────
async function fetchWorkspaces(append = false) {
  if (append) {
    loadingMore.value = true
  } else {
    loadingWorkspaces.value = true
    error.value = null
  }
  try {
    const res = await workspaceService.listWorkspaces({
      search: searchQuery.value.trim() || undefined,
      page: page.value,
      limit: LIMIT,
    })
    if (append) {
      workspaces.value = [...workspaces.value, ...res.workspaces]
    } else {
      workspaces.value = res.workspaces
    }
    hasMore.value = res.metadata?.hasMore ?? false
    total.value = res.metadata?.total ?? res.workspaces.length
  } catch {
    error.value = 'No se pudieron cargar los clientes.'
  } finally {
    loadingWorkspaces.value = false
    loadingMore.value = false
  }
}

function handleSearch() {
  page.value = 1
  selectedWorkspace.value = null
  workspaceUsers.value = []
  fetchWorkspaces()
}

async function loadMore() {
  page.value++
  await fetchWorkspaces(true)
}

// ── Select Workspace (Drill-down) ─────────────────────────────
async function selectWorkspace(ws: Workspace | null) {
  selectedWorkspace.value = ws
  if (!ws) {
    workspaceUsers.value = []
    return
  }

  loadingUsers.value = true
  try {
    const res = await workspaceService.listUsers(ws._id)
    workspaceUsers.value = res.users
  } catch {
    workspaceUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

// ── Meeting Modal ─────────────────────────────────────────────
const isMeetingModalOpen = ref(false)
const meetingModalWs = ref<Workspace | null>(null)
const meetingModalSaving = ref(false)
const meetingModalError = ref<string | null>(null)

function openMeetingModal(ws: Workspace, e: Event) {
  e.stopPropagation()
  meetingModalError.value = null
  meetingModalWs.value = ws
  isMeetingModalOpen.value = true
}

function closeMeetingModal() {
  isMeetingModalOpen.value = false
  meetingModalWs.value = null
}

async function saveMeetingModal(payload: { nextMeetingDate: string; agenda: string }) {
  if (!meetingModalWs.value) return
  meetingModalSaving.value = true
  meetingModalError.value = null
  try {
    const saved = await meetingService.createOrUpdate({
      workspaceId: meetingModalWs.value._id,
      nextMeetingDate: payload.nextMeetingDate,
      agenda: payload.agenda,
    })
    meetingMap.value = new Map(meetingMap.value).set(saved.workspaceId, saved)
    closeMeetingModal()
  } catch {
    meetingModalError.value = 'Error al guardar. Intenta de nuevo.'
  } finally {
    meetingModalSaving.value = false
  }
}

// ── User Modal ────────────────────────────────────────────────
const isUserModalOpen = ref(false)
const selectedUser = ref<WorkspaceUser | null>(null)
const selectedUserWorkspaceName = ref<string>('')

function openUserDetail(payload: { user: WorkspaceUser; workspaceName: string }) {
  selectedUser.value = payload.user
  selectedUserWorkspaceName.value = payload.workspaceName
  isUserModalOpen.value = true
}

function closeUserDetail() {
  isUserModalOpen.value = false
  selectedUser.value = null
}

// ── Lifecycle & Events ────────────────────────────────────────
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeUserDetail()
    closeMeetingModal()
  }
}

onMounted(() => {
  fetchWorkspaces()
  fetchMeetings()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="clients-global">
    <template v-if="!selectedWorkspace">
      <ClientsGlobalHeader
        v-model="searchQuery"
        :total="total"
        @search="handleSearch"
      />

      <ClientsGlobalList
        :workspaces="workspaces"
        :loading="loadingWorkspaces"
        :error="error"
        :hasMore="hasMore"
        :loadingMore="loadingMore"
        :meetingMap="meetingMap"
        @load-more="loadMore"
        @toggle-workspace="selectWorkspace"
        @open-meeting-modal="openMeetingModal"
      />
    </template>
    <template v-else>
      <ClientsGlobalUsersList
        :workspace="selectedWorkspace"
        :users="workspaceUsers"
        :isLoadingUsers="loadingUsers"
        @back="selectWorkspace(null)"
        @open-user-modal="openUserDetail"
      />
    </template>

    <ClientsGlobalMeetingModal
      :isOpen="isMeetingModalOpen"
      :workspace="meetingModalWs"
      :meeting="meetingModalWs ? meetingMap.get(meetingModalWs._id) : undefined"
      :saving="meetingModalSaving"
      :error="meetingModalError"
      @close="closeMeetingModal"
      @save="saveMeetingModal"
    />

    <ClientsGlobalUserModal
      :isOpen="isUserModalOpen"
      :user="selectedUser"
      :workspaceName="selectedUserWorkspaceName"
      :workspaces="workspaces"
      @close="closeUserDetail"
    />
  </div>
</template>

<style lang="scss" scoped>
.clients-global {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}
</style>
