<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
import { workspaceService } from '@/services/workspace.service'
import type { Workspace, WorkspaceUser, ApiError, CreateUserPayload, UpdateUserPayload } from '@/types'

// ── State ──────────────────────────────────────────────────
const workspaces = ref<Workspace[]>([])
const isLoadingWorkspaces = ref(false)

const selectedWorkspace = ref<Workspace | null>(null)
const users = ref<WorkspaceUser[]>([])
const isLoadingUsers = ref(false)

// Create workspace modal
const showCreateWorkspace = ref(false)
const newWorkspaceName = ref('')
const isSavingWorkspace = ref(false)
const workspaceError = ref('')

// User modal (Create/Edit)
const showUserModal = ref(false)
const isEditingUser = ref(false)
const selectedUser = ref<WorkspaceUser | null>(null)
const userForm = ref<CreateUserPayload & { id?: string }>({
  name: '',
  email: '',
  password: '',
  role: 'colaborador'
})
const isSavingUser = ref(false)
const userError = ref('')

// Delete confirmation
const showDeleteConfirm = ref(false)
const userToDelete = ref<WorkspaceUser | null>(null)
const isDeletingUser = ref(false)

// ── Fetch ──────────────────────────────────────────────────
async function fetchWorkspaces(): Promise<void> {
  isLoadingWorkspaces.value = true
  try {
    const { workspaces: data } = await workspaceService.listWorkspaces()
    workspaces.value = data
  } finally {
    isLoadingWorkspaces.value = false
  }
}

async function selectWorkspace(workspace: Workspace): Promise<void> {
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

// ── Create workspace ───────────────────────────────────────
function openCreateWorkspace(): void {
  newWorkspaceName.value = ''
  workspaceError.value = ''
  showCreateWorkspace.value = true
}

async function handleCreateWorkspace(): Promise<void> {
  if (!newWorkspaceName.value.trim() || isSavingWorkspace.value) return
  isSavingWorkspace.value = true
  workspaceError.value = ''
  try {
    const { workspace } = await workspaceService.createWorkspace(newWorkspaceName.value.trim())
    workspaces.value.unshift(workspace)
    showCreateWorkspace.value = false
    selectWorkspace(workspace)
  } catch (err: unknown) {
    const e = err as ApiError
    workspaceError.value = e.status === 409 ? 'Ya existe un entorno con ese nombre.' : 'Error al crear el entorno.'
  } finally {
    isSavingWorkspace.value = false
  }
}

// ── User Management (Create/Edit/Delete) ───────────────────
function openCreateUser(): void {
  isEditingUser.value = false
  selectedUser.value = null
  userForm.value = {
    name: '',
    email: '',
    password: '',
    role: 'colaborador'
  }
  userError.value = ''
  showUserModal.value = true
}

function openEditUser(user: WorkspaceUser): void {
  isEditingUser.value = true
  selectedUser.value = user
  userForm.value = {
    name: user.name || '',
    email: user.email,
    password: '', // Password is empty for edit unless they want to change it
    role: user.role
  }
  userError.value = ''
  showUserModal.value = true
}

async function handleSaveUser(): Promise<void> {
  if (!selectedWorkspace.value || isSavingUser.value) return

  // Basic validation
  if (!userForm.value.email.trim()) {
    userError.value = 'El correo es obligatorio.'
    return
  }
  if (!isEditingUser.value && userForm.value.password.length < 8) {
    userError.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  isSavingUser.value = true
  userError.value = ''

  try {
    if (isEditingUser.value && selectedUser.value) {
      // Update
      const payload: UpdateUserPayload = {
        name: userForm.value.name,
        email: userForm.value.email
      }
      if (userForm.value.password) payload.password = userForm.value.password

      const { user } = await workspaceService.updateUser(
        selectedWorkspace.value._id,
        selectedUser.value._id,
        payload
      )

      const index = users.value.findIndex(u => u._id === user._id)
      if (index !== -1) users.value[index] = user

    } else {
      // Create
      const { user } = await workspaceService.createUser(selectedWorkspace.value._id, {
        name: userForm.value.name,
        email: userForm.value.email,
        password: userForm.value.password,
        role: userForm.value.role
      })
      users.value.unshift(user)
    }
    showUserModal.value = false
  } catch (err: unknown) {
    const e = err as ApiError
    if (e.status === 409) userError.value = 'Ese correo ya está en uso.'
    else userError.value = 'Error al guardar el usuario.'
  } finally {
    isSavingUser.value = false
  }
}

function confirmDeleteUser(user: WorkspaceUser): void {
  userToDelete.value = user
  showDeleteConfirm.value = true
}

async function handleDeleteUser(): Promise<void> {
  if (!selectedWorkspace.value || !userToDelete.value || isDeletingUser.value) return

  isDeletingUser.value = true
  try {
    await workspaceService.deleteUser(selectedWorkspace.value._id, userToDelete.value._id)
    users.value = users.value.filter(u => u._id !== userToDelete.value?._id)
    showDeleteConfirm.value = false
  } catch (err: unknown) {
    alert('Error al eliminar el usuario.')
  } finally {
    isDeletingUser.value = false
    userToDelete.value = null
  }
}

onMounted(fetchWorkspaces)
</script>

<template>
  <div class="superadmin-dashboard">

    <!-- Top bar -->
    <header class="superadmin-dashboard__topbar">
      <div class="superadmin-dashboard__topbar-left">
        <div v-if="selectedWorkspace" class="superadmin-dashboard__ws-badge">
          <i class="fa-solid fa-briefcase" />
          <span>{{ selectedWorkspace.name }}</span>
        </div>
        <div v-else>
          <h1 class="superadmin-dashboard__title">Superadmin Panel</h1>
        </div>
      </div>
      
      <div class="superadmin-dashboard__topbar-right">
        <div class="superadmin-dashboard__superadmin-badge">
          <i class="fa-solid fa-shield-check" /> Superadmin Mode
        </div>
        <button
          id="btn-create-workspace"
          class="superadmin-dashboard__btn-primary"
          type="button"
          @click="openCreateWorkspace"
        >
          <i class="fa-solid fa-plus" aria-hidden="true" />
          Nuevo entorno
        </button>
      </div>
    </header>

    <!-- Content: split -->
    <div class="superadmin-dashboard__body">

      <!-- Left: workspace list -->
      <section class="superadmin-dashboard__workspaces">
        <div class="superadmin-dashboard__section-header">
          <h3>Entornos</h3>
          <span class="superadmin-dashboard__count">{{ workspaces.length }}</span>
        </div>

        <div v-if="isLoadingWorkspaces" class="superadmin-dashboard__loading">
          <span class="superadmin-dashboard__spinner" />
          <p>Cargando entornos...</p>
        </div>

        <div v-else-if="workspaces.length === 0" class="superadmin-dashboard__empty">
          <i class="fa-regular fa-building-circle-xmark superadmin-dashboard__empty-icon" aria-hidden="true" />
          <p>No hay entornos de trabajo aún.</p>
        </div>

        <ul v-else class="superadmin-dashboard__workspace-list" role="list">
          <li
            v-for="ws in workspaces"
            :key="ws._id"
            class="superadmin-dashboard__workspace-card"
            :class="{ 'superadmin-dashboard__workspace-card--active': selectedWorkspace?._id === ws._id }"
            role="button"
            @click="selectWorkspace(ws)"
          >
            <div class="superadmin-dashboard__ws-icon">
              <i class="fa-solid fa-building" />
            </div>
            <div class="superadmin-dashboard__ws-info">
              <span class="superadmin-dashboard__ws-name">{{ ws.name }}</span>
              <span v-if="ws.adminId" class="superadmin-dashboard__ws-meta">
                {{ ws.adminId.email }}
              </span>
            </div>
          </li>
        </ul>
      </section>

      <!-- Right: Users panel -->
      <section class="superadmin-dashboard__users">
        <div v-if="!selectedWorkspace" class="superadmin-dashboard__placeholder">
          <div class="superadmin-dashboard__placeholder-content">
            <i class="fa-solid fa-arrow-left" />
            <p>Selecciona un entorno para gestionar sus usuarios</p>
          </div>
        </div>

        <template v-else>
          <div class="superadmin-dashboard__users-header">
            <div>
              <h2 class="superadmin-dashboard__users-title">Usuarios en {{ selectedWorkspace.name }}</h2>
              <p class="superadmin-dashboard__users-sub">{{ users.length }} usuarios registrados</p>
            </div>
            <div class="superadmin-dashboard__users-actions-top">
              <button
                class="superadmin-dashboard__btn-outline"
                type="button"
                @click="router.push({ name: 'WorkspaceDashboard', params: { workspaceId: selectedWorkspace?._id } })"
              >
                <i class="fa-solid fa-right-to-bracket" />
                Ingresar al entorno
              </button>
              <button
                class="superadmin-dashboard__btn-primary"
                type="button"
                @click="openCreateUser"
              >
                <i class="fa-solid fa-user-plus" />
                Nuevo usuario
              </button>
            </div>
          </div>

          <div v-if="isLoadingUsers" class="superadmin-dashboard__loading">
            <span class="superadmin-dashboard__spinner" />
          </div>

          <div v-else-if="users.length === 0" class="superadmin-dashboard__empty">
            <i class="fa-solid fa-users-slash superadmin-dashboard__empty-icon" />
            <p>No hay usuarios en este entorno.</p>
          </div>

          <div v-else class="superadmin-dashboard__user-grid">
            <div
              v-for="user in users"
              :key="user._id"
              class="superadmin-dashboard__user-card"
            >
              <div class="superadmin-dashboard__user-main">
                <div class="superadmin-dashboard__user-avatar" :class="`superadmin-dashboard__user-avatar--${user.role}`">
                  {{ (user.name || user.email).charAt(0).toUpperCase() }}
                </div>
                <div class="superadmin-dashboard__user-info">
                  <div class="superadmin-dashboard__user-name-row">
                    <span class="superadmin-dashboard__user-name">{{ user.name || 'Sin nombre' }}</span>
                    <span class="superadmin-dashboard__role-badge" :class="`superadmin-dashboard__role-badge--${user.role}`">
                      {{ user.role }}
                    </span>
                  </div>
                  <span class="superadmin-dashboard__user-email">{{ user.email }}</span>
                </div>
              </div>
              
              <div class="superadmin-dashboard__user-actions">
                <button class="superadmin-dashboard__action-btn" title="Editar" @click="openEditUser(user)">
                  <i class="fa-solid fa-pen-to-square" />
                </button>
                <button class="superadmin-dashboard__action-btn superadmin-dashboard__action-btn--danger" title="Eliminar" @click="confirmDeleteUser(user)">
                  <i class="fa-solid fa-trash-can" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- Modal: Create Workspace -->
    <Transition name="modal">
      <div v-if="showCreateWorkspace" class="superadmin-dashboard__overlay" @click.self="showCreateWorkspace = false">
        <div class="superadmin-dashboard__modal">
          <div class="superadmin-dashboard__modal-header">
            <h3>Nuevo Entorno</h3>
            <button class="superadmin-dashboard__close-btn" @click="showCreateWorkspace = false">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
          <form @submit.prevent="handleCreateWorkspace">
            <div class="superadmin-dashboard__form-group">
              <label>Nombre del Entorno</label>
              <input v-model="newWorkspaceName" type="text" placeholder="Ej: Bakano Marketing" required />
            </div>
            <p v-if="workspaceError" class="superadmin-dashboard__error">{{ workspaceError }}</p>
            <div class="superadmin-dashboard__modal-footer">
              <button type="button" class="superadmin-dashboard__btn-ghost" @click="showCreateWorkspace = false">Cancelar</button>
              <button type="submit" class="superadmin-dashboard__btn-primary" :disabled="isSavingWorkspace">
                <span v-if="!isSavingWorkspace">Crear</span>
                <span v-else class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Modal: User (Create/Edit) -->
    <Transition name="modal">
      <div v-if="showUserModal" class="superadmin-dashboard__overlay" @click.self="showUserModal = false">
        <div class="superadmin-dashboard__modal">
          <div class="superadmin-dashboard__modal-header">
            <h3>{{ isEditingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
            <button class="superadmin-dashboard__close-btn" @click="showUserModal = false">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
          <form @submit.prevent="handleSaveUser">
            <div class="superadmin-dashboard__form-group">
              <label>Nombre</label>
              <input v-model="userForm.name" type="text" placeholder="Nombre completo" />
            </div>
            <div class="superadmin-dashboard__form-group">
              <label>Email</label>
              <input v-model="userForm.email" type="email" placeholder="email@ejemplo.com" required />
            </div>
            <div class="superadmin-dashboard__form-group">
              <label>Contraseña {{ isEditingUser ? '(opcional)' : '' }}</label>
              <input v-model="userForm.password" type="password" placeholder="••••••••" :required="!isEditingUser" minlength="8" />
            </div>
            <div v-if="!isEditingUser" class="superadmin-dashboard__form-group">
              <label>Rol</label>
              <select v-model="userForm.role" class="superadmin-dashboard__select">
                <option value="admin">Administrador</option>
                <option value="colaborador">Colaborador</option>
              </select>
            </div>
            
            <p v-if="userError" class="superadmin-dashboard__error">{{ userError }}</p>
            
            <div class="superadmin-dashboard__modal-footer">
              <button type="button" class="superadmin-dashboard__btn-ghost" @click="showUserModal = false">Cancelar</button>
              <button type="submit" class="superadmin-dashboard__btn-primary" :disabled="isSavingUser">
                <span v-if="!isSavingUser">{{ isEditingUser ? 'Guardar Cambios' : 'Crear Usuario' }}</span>
                <span v-else class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Modal: Delete Confirm -->
    <Transition name="modal">
      <div v-if="showDeleteConfirm" class="superadmin-dashboard__overlay" @click.self="showDeleteConfirm = false">
        <div class="superadmin-dashboard__modal superadmin-dashboard__modal--small">
          <div class="superadmin-dashboard__confirm-content">
            <div class="superadmin-dashboard__warn-icon">
              <i class="fa-solid fa-triangle-exclamation" />
            </div>
            <h3>¿Eliminar usuario?</h3>
            <p>Esta acción no se puede deshacer. Se eliminará a <strong>{{ userToDelete?.email }}</strong> permanentemente.</p>
          </div>
          <div class="superadmin-dashboard__modal-footer superadmin-dashboard__modal-footer--center">
            <button class="superadmin-dashboard__btn-ghost" @click="showDeleteConfirm = false">Cancelar</button>
            <button class="superadmin-dashboard__btn-danger" @click="handleDeleteUser" :disabled="isDeletingUser">
              <span v-if="!isDeletingUser">Sí, eliminar</span>
              <span v-else class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard {
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  &__topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.1);
  }

  &__ws-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: $primary-light;
    border: 1px solid rgba($primary, 0.2);
    border-radius: 99px;
    color: $primary;
    font-weight: 600;
  }

  &__topbar-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  &__superadmin-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.05) 100%);
    color: $primary;
    border: 1px solid rgba($primary, 0.2);
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    animation: fadeIn 0.5s ease-out;

    i {
      font-size: 0.9rem;
      color: $primary; // Override icon color for consistency
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 2rem;
    align-items: start;
  }

  &__workspaces,
  &__users {
    background: $white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba($primary-dark, 0.05);
    border: 1px solid rgba($primary-dark, 0.05);
    min-height: 600px;
  }

  &__section-header {
    padding: 1.25rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 1.1rem;
    }
  }

  &__count {
    background: rgba($primary, 0.1);
    color: $primary;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 700;
  }

  // ── Workspace Card ───────────────────────────────────────
  &__workspace-list {
    list-style: none;
    padding: 0.75rem;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__workspace-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba($primary, 0.03);
    }

    &--active {
      background: rgba($primary, 0.08) !important;
      border: 1px solid rgba($primary, 0.2);
    }
  }

  &__ws-icon {
    width: 40px;
    height: 40px;
    background: $primary-light;
    color: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 1.2rem;
  }

  &__ws-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__ws-name {
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ws-meta {
    font-size: 0.8rem;
    color: $text-secondary;
  }

  // ── Users Panel ──────────────────────────────────────────
  &__users-header {
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
  }

  &__users-title {
    margin: 0;
    font-size: 1.25rem;
    color: $primary-dark;
  }

  &__users-sub {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    color: $text-secondary;
  }

  &__users-actions-top {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  &__user-grid {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  &__user-card {
    padding: 1.25rem;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba($primary-dark, 0.05);
    }
  }

  &__user-main {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__user-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    background: $primary-light;
    color: $primary;

    &--admin {
      background: rgba($secondary, 0.1);
      color: $secondary;
    }

    &--colaborador {
      background: rgba($BAKANO-GREEN, 0.1);
      color: $BAKANO-GREEN;
    }
  }

  &__user-info {
    display: flex;
    flex-direction: column;
  }

  &__user-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__user-name {
    font-weight: 600;
    color: $primary-dark;
  }

  &__role-badge {
    font-size: 0.65rem;
    text-transform: uppercase;
    font-weight: 800;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    background: #eee;

    &--admin {
      background: rgba($secondary, 0.1);
      color: $secondary;
    }

    &--colaborador {
      background: rgba($BAKANO-GREEN, 0.1);
      color: $BAKANO-GREEN;
    }
  }

  &__user-email {
    font-size: 0.85rem;
    color: $text-secondary;
  }

  &__user-actions {
    display: flex;
    gap: 0.5rem;
  }

  &__action-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: rgba($primary-dark, 0.05);
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary, 0.1);
      color: $primary;
    }

    &--danger:hover {
      background: $alert-error-bg;
      color: $alert-error;
    }
  }

  // ── Utility ──────────────────────────────────────────────
  &__btn-outline {
    background: transparent;
    border: 1px solid rgba($primary-dark, 0.15);
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: $primary-dark;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary-dark, 0.03);
      border-color: $primary;
      color: $primary;
    }
  }

  &__btn-primary {
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
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__btn-danger {
    background: $alert-error;
    color: $white;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  &__btn-ghost {
    background: transparent;
    border: 1px solid transparent;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    color: $text-secondary;

    &:hover {
      background: rgba($primary-dark, 0.05);
    }
  }

  &__placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;

    &-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      i {
        font-size: 2rem;
        opacity: 0.3;
      }
    }
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
    color: $text-secondary;
  }

  &__spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba($primary, 0.2);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    &--sm {
      width: 14px;
      height: 14px;
      border-width: 2px;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
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

  // ── Modals ────────────────────────────────────────────────
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba($primary-dark, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  &__modal {
    background: $white;
    width: 100%;
    max-width: 500px;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;

    &--small {
      max-width: 400px;
    }
  }

  &__modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
    }
  }

  &__close-btn {
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    color: $text-secondary;
  }

  form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  &__form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-size: 0.9rem;
      font-weight: 600;
      color: $primary-dark;
    }

    input,
    select {
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid rgba($primary-dark, 0.15);
      font-family: inherit;
      font-size: 1rem;

      &:focus {
        border-color: $primary;
        outline: none;
        box-shadow: 0 0 0 3px rgba($primary, 0.1);
      }
    }
  }

  &__modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 0.5rem;

    &--center {
      justify-content: center;
      padding-top: 1.5rem;
    }
  }

  &__confirm-content {
    padding: 2rem 2rem 0;
    text-align: center;

    h3 {
      margin: 1rem 0 0.5rem;
    }

    p {
      margin: 0;
      color: $text-secondary;
    }
  }

  &__warn-icon {
    width: 60px;
    height: 60px;
    background: $alert-error-bg;
    color: $alert-error;
    border-radius: 50%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  &__error {
    color: $alert-error;
    font-size: 0.85rem;
    margin: 0;
  }

  // Transition
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s;

    .superadmin-dashboard__modal {
      transition: transform 0.3s;
    }
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;

    .superadmin-dashboard__modal {
      transform: scale(0.95);
    }
  }
}
</style>
