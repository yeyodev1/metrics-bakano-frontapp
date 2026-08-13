<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { useGlobalUserModal } from '@/composables/useGlobalUserModal'
import { useToast } from '@/composables/useToast'
import type { Workspace, WorkspaceUser } from '@/types'
import AccountAdminsFilter from './AccountAdminsFilter.vue'
import AccountAdminsTable from './AccountAdminsTable.vue'
import ResendInviteModal from './ResendInviteModal.vue'

const globalUserModal = useGlobalUserModal()
const toast = useToast()

const users = ref<WorkspaceUser[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const filterWorkspaceId = ref('')
const workspaces = ref<Workspace[]>([])

const isFilterDrawerOpen = ref(false)
const filterInternalRole = ref('')

// Resend invite state
const resendTarget = ref<WorkspaceUser | null>(null)
const isResendingInvite = ref(false)

async function fetchAllUsers(): Promise<void> {
  isLoading.value = true
  try {
    const { users: data } = await workspaceService.listAllCollaborators(
      searchQuery.value.trim() || undefined,
      filterWorkspaceId.value || undefined
    )
    users.value = data
  } catch {
    toast.error('Error al cargar usuarios')
  } finally {
    isLoading.value = false
  }
}

async function fetchWorkspacesList(): Promise<void> {
  try {
    const response = await workspaceService.listWorkspaces({ limit: 100, minimal: true })
    workspaces.value = response.workspaces
  } catch {
    // Fail silently
  }
}

async function openCreateGlobalUser() {
  const newUser = await globalUserModal.open({ mode: 'create' })
  if (newUser) {
    users.value.unshift(newUser)
  }
}

async function openEditGlobalUser(user: WorkspaceUser) {
  const updatedUser = await globalUserModal.open({ mode: 'edit', user })
  if (updatedUser) {
    const index = users.value.findIndex(u => u._id === updatedUser._id)
    if (index !== -1) {
      users.value[index] = updatedUser
    }
  }
}

function openResendInvite(user: WorkspaceUser) {
  resendTarget.value = user
}

async function submitResendInvite(password: string) {
  if (!resendTarget.value) return
  isResendingInvite.value = true
  try {
    await workspaceService.resendInvite(resendTarget.value._id, password)
    toast.success(`Invitación enviada a ${resendTarget.value.email}`)
    resendTarget.value = null
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Error al reenviar invitación')
  } finally {
    isResendingInvite.value = false
  }
}

const allUsersFiltered = computed(() => {
  let result = users.value
  if (filterInternalRole.value) {
    result = result.filter(u => u.internalRole === filterInternalRole.value)
  }
  return result
})

const hasActiveFilters = computed(() => !!(filterWorkspaceId.value || filterInternalRole.value))

function clearAllFilters() {
  filterWorkspaceId.value = ''
  filterInternalRole.value = ''
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchAllUsers()
  }, 400)
})

watch(filterWorkspaceId, () => {
  fetchAllUsers()
})

onMounted(() => {
  fetchAllUsers()
  fetchWorkspacesList()
})
</script>

<template>
  <div class="superadmin-dashboard__account-admins">
    <div class="superadmin-dashboard__section-header superadmin-dashboard__section-header--row">
      <div class="superadmin-dashboard__section-title">
        <h3>Usuarios de cuenta</h3>
        <p>Cada persona con acceso a un entorno de cliente, una por fila</p>
      </div>
      <div class="superadmin-dashboard__header-actions">
        <div class="superadmin-dashboard__search-wrap superadmin-dashboard__search-wrap--all-users">
          <i class="fa-solid fa-magnifying-glass" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar por nombre o correo..." 
            class="superadmin-dashboard__search-input"
          />
        </div>

        <button
          class="superadmin-dashboard__btn-secondary"
          :class="{ 'superadmin-dashboard__btn-secondary--active': hasActiveFilters }"
          @click="isFilterDrawerOpen = !isFilterDrawerOpen"
        >
          <i class="fa-solid fa-filter" />
          Filtros
          <span v-if="hasActiveFilters" class="superadmin-dashboard__filter-badge" />
        </button>

        <button class="superadmin-dashboard__btn-primary" @click="openCreateGlobalUser">
          <i class="fa-solid fa-user-plus" />
          Nuevo usuario
        </button>
      </div>

      <!-- Filter Sidebar/Drawer -->
      <AccountAdminsFilter
        v-model:show="isFilterDrawerOpen"
        v-model:filter-workspace-id="filterWorkspaceId"
        v-model:filter-internal-role="filterInternalRole"
        :workspaces="workspaces"
        @clear="clearAllFilters"
      />
    </div>

    <div v-if="isLoading" class="superadmin-dashboard__loading">
      <div class="superadmin-dashboard__spinner" />
      <p>Cargando colaboradores...</p>
    </div>

    <div v-else-if="users.length === 0" class="superadmin-dashboard__empty-state">
      <div class="superadmin-dashboard__empty-icon">
        <i class="fa-solid fa-user-gear" />
      </div>
      <h3>No se encontraron colaboradores</h3>
      <p v-if="searchQuery || filterWorkspaceId">
        No hay resultados que coincidan con tus filtros actuales.
        <button class="superadmin-dashboard__link" @click="searchQuery = ''; filterWorkspaceId = ''">
          Limpiar filtros
        </button>
      </p>
      <p v-else>
        Actualmente no hay administradores de cuenta registrados en el sistema.
        Empieza creando uno para vincularlo a sus entornos.
      </p>
      <button v-if="!searchQuery && !filterWorkspaceId" class="superadmin-dashboard__btn-primary" @click="openCreateGlobalUser">
        <i class="fa-solid fa-plus" />
        Crear Mi Primer Colaborador
      </button>
    </div>

    <AccountAdminsTable
      v-else
      :users="allUsersFiltered"
      @edit-user="openEditGlobalUser"
      @resend-invite="openResendInvite"
    />

    <!-- Local Resend Invite Modal -->
    <ResendInviteModal
      :target="resendTarget"
      :is-sending="isResendingInvite"
      @close="resendTarget = null"
      @submit="submitResendInvite"
    />
  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__account-admins {
  width: 100%;
  background: $white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba($primary-dark, 0.05);
  border: 1px solid rgba($primary-dark, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.superadmin-dashboard__section-header {
  padding: 1.25rem 0;
  border-bottom: 1px solid rgba($primary-dark, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &--row {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;

    @media (min-width: 1024px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.superadmin-dashboard__section-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  h3 {
    color: $primary-dark;
    font-weight: 700;
    margin: 0;
  }

  p {
    font-size: 0.85rem;
    color: $text-secondary;
    margin: 0;
  }
}

.superadmin-dashboard__header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;

  @media (min-width: 1200px) {
    width: auto;
    flex-wrap: nowrap;
    gap: 1.5rem;
  }
}

.superadmin-dashboard__search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  i {
    position: absolute;
    left: 0.875rem;
    font-size: 0.85rem;
    color: $text-secondary;
    pointer-events: none;
  }

  &--all-users {
    flex: 1;
    min-width: 250px;

    @media (min-width: 640px) {
      min-width: 300px;
    }
  }
}

.superadmin-dashboard__search-input {
  width: 100%;
  padding: 0.6rem 0.75rem 0.6rem 2.5rem;
  border-radius: 10px;
  border: 1.5px solid rgba($primary-dark, 0.1);
  font-size: 0.9rem;
  background: rgba($primary-dark, 0.02);
  transition: all 0.25s ease;

  &:focus {
    outline: none;
    border-color: $primary;
    background: $white;
    box-shadow: 0 0 0 4px rgba($primary, 0.1);
  }
}

.superadmin-dashboard__btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  color: $primary-dark;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    background: rgba($primary, 0.03);
    border-color: rgba($primary, 0.3);
    transform: translateY(-1px);
  }

  &--active {
    background: rgba($primary, 0.08);
    border-color: $primary;
    color: $primary;
  }
}

.superadmin-dashboard__btn-primary {
  background: $primary;
  color: $white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: box-shadow 0.2s, opacity 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba($primary, 0.3);
    opacity: 0.95;
  }
}

.superadmin-dashboard__filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: $alert-error;
  border-radius: 50%;
  border: 2px solid $white;
}

.superadmin-dashboard__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: $text-secondary;
}

.superadmin-dashboard__spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.superadmin-dashboard__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  background: rgba($primary, 0.02);
  border-radius: 20px;
  border: 2px dashed rgba($primary, 0.1);
  margin-top: 2rem;
  animation: fadeIn 0.5s ease-out;

  h3 {
    font-size: 1.5rem;
    color: $primary-dark;
    margin: 1rem 0 0.5rem;
  }

  p {
    color: $text-secondary;
    max-width: 400px;
    margin-bottom: 2rem;
    line-height: 1.6;
  }
}

.superadmin-dashboard__empty-icon {
  width: 80px;
  height: 80px;
  background: $white;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: $primary;
  box-shadow: 0 10px 25px rgba($primary, 0.1);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: 30px;
    border: 2px dashed rgba($primary, 0.1);
    animation: rotate 20s linear infinite;
  }
}

.superadmin-dashboard__link {
  background: none;
  border: none;
  color: $primary;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
