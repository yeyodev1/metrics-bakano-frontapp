<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace, WorkspaceUser } from '@/types'
import { useUserStore } from '@/stores/user'

import ClientsGlobalHeader from './components/ClientsGlobalHeader.vue'
import ClientsGlobalList from './components/ClientsGlobalList.vue'
import ClientsGlobalUsersList from './components/ClientsGlobalUsersList.vue'
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
  }
}

onMounted(() => {
  fetchWorkspaces()
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
        @load-more="loadMore"
        @toggle-workspace="selectWorkspace"
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
