<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useUserFormModal } from '@/composables/useUserFormModal'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace, WorkspaceUser, ApiError } from '@/types'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const userModal = useUserFormModal()

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

// ── User Management (Create/Edit/Delete) ───────────────────
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
    toast.success(`Entorno "${workspace.name}" creado con éxito.`)
    selectWorkspace(workspace)
  } catch (err: unknown) {
    const e = err as ApiError
    if (e.status === 409) {
      workspaceError.value = 'Ya existe un entorno con ese nombre.'
    } else {
      toast.error('Ocurrió un error al crear el entorno.')
    }
  } finally {
    isSavingWorkspace.value = false
  }
}

// ── User Management (Create/Edit/Delete) ───────────────────

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
    } catch (err: unknown) {
      toast.error('Ocurrió un error al eliminar el usuario.')
    }
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

        <div v-else-if="workspaces.length === 0" class="superadmin-dashboard__empty-state">
          <div class="superadmin-dashboard__empty-state-icon">
            <i class="fa-solid fa-layer-group" aria-hidden="true" />
          </div>
          <h4 class="superadmin-dashboard__empty-state-title">No hay entornos de trabajo</h4>
          <p class="superadmin-dashboard__empty-state-desc">Crea un nuevo entorno para empezar a organizar a tus clientes y colaboradores.</p>
          <button class="superadmin-dashboard__btn-outline superadmin-dashboard__btn-outline--sm" @click="openCreateWorkspace">
            <i class="fa-solid fa-plus" /> Crear primer entorno
          </button>
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

          <div v-else-if="users.length === 0" class="superadmin-dashboard__empty-state">
            <div class="superadmin-dashboard__empty-state-icon superadmin-dashboard__empty-state-icon--users">
              <i class="fa-solid fa-users" />
            </div>
            <h4 class="superadmin-dashboard__empty-state-title">Sin usuarios registrados</h4>
            <p class="superadmin-dashboard__empty-state-desc">Este entorno está vacío. Añade administradores y colaboradores para que puedan analizar los datos.</p>
            <button class="superadmin-dashboard__btn-primary superadmin-dashboard__btn-primary--sm" @click="openCreateUser">
              <i class="fa-solid fa-user-plus" /> Invitar Usuario
            </button>
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
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.1);

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
      gap: 0;
    }
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

  &__title {
    font-size: 1.5rem;
    margin: 0;
  }

  &__topbar-right {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    width: 100%;

    @media (min-width: 768px) {
      width: auto;
      flex-wrap: nowrap;
      gap: 1.5rem;
    }
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
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: start;

    @media (min-width: 1024px) {
      display: grid;
      grid-template-columns: 350px 1fr;
    }
  }

  &__workspaces,
  &__users {
    width: 100%;
    background: $white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba($primary-dark, 0.05);
    border: 1px solid rgba($primary-dark, 0.05);
    min-height: 400px;

    @media (min-width: 1024px) {
      min-height: 600px;
    }
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

  // ── Empty States ─────────────────────────────────────────
  &__empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4rem 2rem;
    height: 100%;
    color: $text-secondary;

    &-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($primary, 0.1) 100%);
      color: $primary;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 24px rgba($primary, 0.1);

      &--users {
        background: linear-gradient(135deg, rgba($BAKANO-GREEN, 0.05) 0%, rgba($BAKANO-GREEN, 0.1) 100%);
        color: darken($BAKANO-GREEN, 10%);
        box-shadow: 0 8px 24px rgba($BAKANO-GREEN, 0.15);
      }
    }

    &-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: $primary-dark;
      margin: 0 0 0.5rem;
    }

    &-desc {
      font-size: 0.95rem;
      max-width: 320px;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }
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
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);

    @media (min-width: 640px) {
      flex-direction: row;
      align-items: flex-start;
    }
  }

  &__users-title {
    margin: 0;
    font-size: 1.1rem;
    color: $primary-dark;

    @media (min-width: 640px) {
      font-size: 1.25rem;
    }
  }

  &__users-sub {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    color: $text-secondary;
  }

  &__users-actions-top {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    width: 100%;

    button {
      flex: 1;
      justify-content: center;

      @media (min-width: 640px) {
        flex: auto;
      }
    }

    @media (min-width: 640px) {
      width: auto;
      flex-wrap: nowrap;
    }
  }

  &__user-grid {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
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

    &--sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
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
    transition: box-shadow 0.2s, opacity 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba($primary, 0.3);
      opacity: 0.95;
    }

    &--sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
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
