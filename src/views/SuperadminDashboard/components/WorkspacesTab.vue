<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import WorkspacesSummaryBar from './WorkspacesSummaryBar.vue'
import DeactivateWorkspaceModal from './DeactivateWorkspaceModal.vue'
import RenameWorkspaceModal from './RenameWorkspaceModal.vue'
import { workspaceService } from '@/services/workspace.service'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useUserFormModal } from '@/composables/useUserFormModal'
import type { Workspace, WorkspaceUser } from '@/types'
import WorkspaceList from './WorkspaceList.vue'
import WorkspaceUsersList from './WorkspaceUsersList.vue'
import AddExistingUserModal from './AddExistingUserModal.vue'

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
// Filtro activo de los chips (activos/inactivos/sin_perfil/sin_meta) y el
// total del filtro, para el "Mostrando X de Y" del pie.
const filtro = ref<'' | 'activos' | 'inactivos' | 'sin_perfil' | 'sin_meta'>('')
const total = ref(0)

const selectedWorkspace = ref<Workspace | null>(null)
const users = ref<WorkspaceUser[]>([])
const isLoadingUsers = ref(false)

const togglingWorkspaceId = ref<string | null>(null)
const deletingWorkspaceId = ref<string | null>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Los conteos cambian al crear, activar o borrar un entorno: si no se
// recargan, la barra queda mintiendo hasta el proximo refresco de la pagina.
const summaryRef = ref<InstanceType<typeof WorkspacesSummaryBar> | null>(null)
const recargarResumen = () => summaryRef.value?.recargar()

const wsADesactivar = ref<Workspace | null>(null)
const desactivando = ref(false)

async function confirmarDesactivacion(datos: { motivo: string; nota?: string }) {
  const ws = wsADesactivar.value
  if (!ws) return

  desactivando.value = true
  try {
    await workspaceService.toggleWorkspaceActive(ws._id, false, datos)
    ws.isActive = false
    recargarResumen()
    wsADesactivar.value = null
    toast.success(`Entorno "${ws.name}" desactivado.`)
  } catch {
    toast.error('No se pudo desactivar el entorno.')
  } finally {
    desactivando.value = false
  }
}

// Renombrar: el nombre viaja a los avisos del cliente, asi que se cambia en
// un modal aparte y no editando la tarjeta al vuelo.
const wsARenombrar = ref<Workspace | null>(null)
const renombrando = ref(false)
const renameModal = ref<InstanceType<typeof RenameWorkspaceModal> | null>(null)

async function confirmarRenombre(nombre: string) {
  const ws = wsARenombrar.value
  if (!ws) return

  renombrando.value = true
  try {
    const { workspace } = await workspaceService.updateWorkspace(ws._id, nombre)
    ws.name = workspace?.name ?? nombre
    if (selectedWorkspace.value?._id === ws._id) selectedWorkspace.value.name = ws.name
    wsARenombrar.value = null
    toast.success(`Entorno renombrado a "${ws.name}".`)
  } catch (err: any) {
    const status = err?.response?.status
    const msg = status === 409
      ? 'Ya existe otro entorno con ese nombre.'
      : 'No se pudo cambiar el nombre.'
    renameModal.value?.mostrarError(msg)
  } finally {
    renombrando.value = false
  }
}

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
      limit: 10,
      filter: filtro.value || undefined
    })

    if (isLoadMore) {
      workspaces.value = [...workspaces.value, ...response.workspaces]
    } else {
      workspaces.value = response.workspaces
    }

    hasMore.value = response.metadata?.hasMore ?? false
    total.value = response.metadata?.total ?? response.workspaces.length
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

  // Desactivar exige motivo: sin el, un entorno caido no dejaba rastro y
  // habia que preguntar por WhatsApp si era falta de pago o una pausa.
  if (willDeactivate) {
    wsADesactivar.value = ws
    return
  }

  togglingWorkspaceId.value = ws._id
  try {
    await workspaceService.toggleWorkspaceActive(ws._id, true)
    ws.isActive = !willDeactivate
    recargarResumen()
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
    recargarResumen()
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

async function selectWorkspace(workspace: Workspace | null): Promise<void> {
  if (!workspace || selectedWorkspace.value?._id === workspace._id) {
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

// Agregar a alguien que ya existe en otro entorno, sin re-tipear sus datos.
const showAddExisting = ref(false)

function onExistingUserAdded(user: WorkspaceUser): void {
  users.value.unshift(user)
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
  recargarResumen()
}

watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchWorkspaces()
  }, 400)
})

// Cambiar de chip recarga desde la página 1 con el criterio del servidor.
watch(filtro, () => {
  fetchWorkspaces()
})

defineExpose({ onCreated, selectedWorkspace })

onMounted(fetchWorkspaces)
</script>

<template>
  <div class="superadmin-dashboard__body">
    <!-- Los conteos que el listado paginado no puede dar por si solo; ahora tambien filtran. -->
    <WorkspacesSummaryBar v-if="!selectedWorkspace" ref="summaryRef" v-model:filtro="filtro" />

    <DeactivateWorkspaceModal
      :show="!!wsADesactivar"
      :nombre="wsADesactivar?.name || ''"
      :guardando="desactivando"
      @close="wsADesactivar = null"
      @confirmar="confirmarDesactivacion"
    />

    <RenameWorkspaceModal
      ref="renameModal"
      :show="!!wsARenombrar"
      :nombre="wsARenombrar?.name || ''"
      :guardando="renombrando"
      @close="wsARenombrar = null"
      @confirmar="confirmarRenombre"
    />

    <!-- View: Workspaces Grid -->
    <WorkspaceList
      v-if="!selectedWorkspace"
      v-model:search-query="searchQuery"
      :workspaces="workspaces"
      :is-loading-workspaces="isLoadingWorkspaces"
      :has-more="hasMore"
      :is-loading-more="isLoadingMore"
      :total="total"
      :selected-workspace="selectedWorkspace"
      :toggling-workspace-id="togglingWorkspaceId"
      :deleting-workspace-id="deletingWorkspaceId"
      @open-create-workspace="emit('openCreateWorkspace')"
      @select-workspace="selectWorkspace"
      @rename-workspace="(ws: Workspace) => (wsARenombrar = ws)"
      @handle-toggle-workspace-active="handleToggleWorkspaceActive"
      @handle-delete-workspace="handleDeleteWorkspace"
      @fetch-workspaces="fetchWorkspaces"
    />

    <!-- View: Workspace Users -->
    <WorkspaceUsersList
      v-else
      :selected-workspace="selectedWorkspace"
      :users="users"
      :is-loading-users="isLoadingUsers"
      @back="selectWorkspace(null)"
      @open-create-user="openCreateUser"
      @open-add-existing="showAddExisting = true"
      @open-edit-user="openEditUser"
      @confirm-delete-user="confirmDeleteUser"
    />

    <AddExistingUserModal
      :show="showAddExisting"
      :workspace="selectedWorkspace"
      :current-user-ids="users.map(u => u._id)"
      @close="showAddExisting = false"
      @added="onExistingUserAdded"
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
}
</style>
