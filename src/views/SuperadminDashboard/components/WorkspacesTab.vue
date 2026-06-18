<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useUserFormModal } from '@/composables/useUserFormModal'
import type { Workspace, WorkspaceUser } from '@/types'
import WorkspaceList from './WorkspaceList.vue'
import WorkspaceUsersList from './WorkspaceUsersList.vue'

const confirm = useConfirm()
const toast = useToast()
const userModal = useUserFormModal()

const emit = defineEmits<{
  (e: 'openCreateWorkspace'): void
}>()

const workspaces = ref<Workspace[]>([])
const isLoadingWorkspaces = ref(false)
const searchQuery = ref('')
const page = ref(1)
const hasMore = ref(false)
const isLoadingMore = ref(false)

const selectedWorkspace = ref<Workspace | null>(null)
const users = ref<WorkspaceUser[]>([])
const isLoadingUsers = ref(false)

const togglingWorkspaceId = ref<string | null>(null)
const deletingWorkspaceId = ref<string | null>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function fetchWorkspaces(isLoadMore = false): Promise<void> {
  if (isLoadMore) {
    isLoadingMore.value = true
    page.value++
  } else {
    isLoadingWorkspaces.value = true
    page.value = 1
  }

  try {
    const response = await workspaceService.listWorkspaces({
      search: searchQuery.value.trim() || undefined,
      page: page.value,
      limit: 10
    })

    if (isLoadMore) {
      workspaces.value = [...workspaces.value, ...response.workspaces]
    } else {
      workspaces.value = response.workspaces
    }

    hasMore.value = response.metadata?.hasMore ?? false
  } catch (err) {
    toast.error('Error al cargar entornos')
  } finally {
    isLoadingWorkspaces.value = false
    isLoadingMore.value = false
  }
}

async function handleToggleWorkspaceActive(ws: Workspace, e: Event): Promise<void> {
  e.stopPropagation()
  const willDeactivate = ws.isActive
  const isConfirmed = await confirm.confirm({
    title: willDeactivate ? 'Desactivar entorno' : 'Activar entorno',
    message: willDeactivate
      ? `¿Desactivar "${ws.name}"? Los usuarios no podrán acceder y se detendrán todas las notificaciones.`
      : `¿Activar "${ws.name}"? Los usuarios podrán acceder nuevamente.`,
    confirmText: willDeactivate ? 'Desactivar' : 'Activar',
  })
  if (!isConfirmed) return

  togglingWorkspaceId.value = ws._id
  try {
    await workspaceService.toggleWorkspaceActive(ws._id, !willDeactivate)
    ws.isActive = !willDeactivate
    toast.success(`Entorno "${ws.name}" ${ws.isActive ? 'activado' : 'desactivado'}.`)
  } catch {
    toast.error('Error al cambiar el estado del entorno.')
  } finally {
    togglingWorkspaceId.value = null
  }
}

async function handleDeleteWorkspace(ws: Workspace, e: Event): Promise<void> {
  e.stopPropagation()
  const expectedText = `eliminar ${ws.name}`
  const isConfirmed = await confirm.confirm({
    title: 'Eliminar entorno (Irreversible)',
    message: `¿Estás seguro de eliminar "${ws.name}"? Esta acción borrará el entorno y eliminará la referencia de todos los usuarios asignados permanentemente. (Usuarios de Bakano no serán eliminados).`,
    confirmText: 'Sí, Eliminar',
    requireHold: true,
    requireInput: expectedText
  })
  if (!isConfirmed) return

  deletingWorkspaceId.value = ws._id
  try {
    await workspaceService.deleteWorkspace(ws._id)
    toast.success(`Entorno "${ws.name}" eliminado correctamente.`)
    workspaces.value = workspaces.value.filter(w => w._id !== ws._id)
    if (selectedWorkspace.value?._id === ws._id) {
      selectedWorkspace.value = null
      users.value = []
    }
  } catch {
    toast.error('Error al eliminar el entorno.')
  } finally {
    deletingWorkspaceId.value = null
  }
}

async function selectWorkspace(workspace: Workspace): Promise<void> {
  if (selectedWorkspace.value?._id === workspace._id) {
    selectedWorkspace.value = null
    users.value = []
    return
  }
  selectedWorkspace.value = workspace
  users.value = []
  isLoadingUsers.value = true
  try {
    const { users: data } = await workspaceService.listUsers(workspace._id)
    users.value = data
  } finally {
    isLoadingUsers.value = false
  }
}

async function openCreateUser(): Promise<void> {
  if (!selectedWorkspace.value) return
  const newUser = await userModal.open({
    mode: 'create',
    workspaceId: selectedWorkspace.value._id
  })
  if (newUser) {
    users.value.unshift(newUser)
  }
}

async function openEditUser(user: WorkspaceUser): Promise<void> {
  if (!selectedWorkspace.value) return
  const updatedUser = await userModal.open({
    mode: 'edit',
    workspaceId: selectedWorkspace.value._id,
    user
  })
  if (updatedUser) {
    const index = users.value.findIndex(u => u._id === updatedUser._id)
    if (index !== -1) {
      users.value[index] = updatedUser
    }
  }
}

async function confirmDeleteUser(user: WorkspaceUser): Promise<void> {
  if (!selectedWorkspace.value) return

  const isConfirmed = await confirm.confirm({
    title: '¿Eliminar usuario?',
    message: `Esta acción no se puede deshacer. Se eliminará a ${user.email} permanentemente del entorno.`,
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    requireHold: true
  })

  if (isConfirmed) {
    try {
      await workspaceService.deleteUser(selectedWorkspace.value._id, user._id)
      users.value = users.value.filter(u => u._id !== user._id)
      toast.success('Usuario eliminado exitosamente.')
    } catch {
      toast.error('Ocurrió un error al eliminar el usuario.')
    }
  }
}

function onCreated(ws: Workspace) {
  workspaces.value.unshift(ws)
  selectWorkspace(ws)
}

watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchWorkspaces()
  }, 400)
})

defineExpose({ onCreated, selectedWorkspace })

onMounted(fetchWorkspaces)
</script>

<template>
  <div class="superadmin-dashboard__body">
    <!-- Left: workspaces panel -->
    <WorkspaceList
      v-model:search-query="searchQuery"
      :workspaces="workspaces"
      :is-loading-workspaces="isLoadingWorkspaces"
      :has-more="hasMore"
      :is-loading-more="isLoadingMore"
      :selected-workspace="selectedWorkspace"
      :toggling-workspace-id="togglingWorkspaceId"
      :deleting-workspace-id="deletingWorkspaceId"
      @open-create-workspace="emit('openCreateWorkspace')"
      @select-workspace="selectWorkspace"
      @handle-toggle-workspace-active="handleToggleWorkspaceActive"
      @handle-delete-workspace="handleDeleteWorkspace"
      @fetch-workspaces="fetchWorkspaces"
    />

    <!-- Right: Users panel -->
    <WorkspaceUsersList
      :selected-workspace="selectedWorkspace"
      :users="users"
      :is-loading-users="isLoadingUsers"
      @open-create-user="openCreateUser"
      @open-edit-user="openEditUser"
      @confirm-delete-user="confirmDeleteUser"
    />
  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: start;
  width: 100%;

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 300px 1fr;
  }

  @media (min-width: 1280px) {
    grid-template-columns: 350px 1fr;
  }
}
</style>
