<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useUserFormModal } from '@/composables/useUserFormModal'
import type { Workspace, WorkspaceUser, ApiError } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workspaceId = route.params.workspaceId as string

const confirm = useConfirm()
const toast = useToast()
const userModal = useUserFormModal()

// Permissions logic
const canManageIntegrations = computed(() => {
  return userStore.role === 'superadmin'
})

const canManageTeam = computed(() => {
  return userStore.role === 'admin' || userStore.role === 'superadmin' || workspace.value?.userRole === 'admin'
})

// Workspace state
const workspace = ref<Workspace | null>(null)
const isLoadingWorkspace = ref(true)
const workspaceError = ref('')

// Users state
const users = ref<WorkspaceUser[]>([])
const isLoadingUsers = ref(false)

const bakanoUsers = computed(() => users.value.filter(u => u.email.endsWith('@bakano.ec')))
const clientUsers = computed(() => users.value.filter(u => !u.email.endsWith('@bakano.ec')))

// Edit workspace name
const isEditingName = ref(false)
const editNameValue = ref('')
const isSavingName = ref(false)

// ── Initial Fetch ─────────────────────────────────────────

async function fetchWorkspace() {
  isLoadingWorkspace.value = true
  workspaceError.value = ''
  try {
    const { workspace: data } = await workspaceService.getWorkspace(workspaceId)
    workspace.value = data
    editNameValue.value = data.name
    await fetchUsers()
  } catch (err: unknown) {
    const e = err as ApiError
    workspaceError.value = e.message || 'Error al cargar la configuración del entorno.'
  } finally {
    isLoadingWorkspace.value = false
  }
}

async function fetchUsers() {
  isLoadingUsers.value = true
  try {
    const { users: data } = await workspaceService.listUsers(workspaceId)
    users.value = data
  } catch (err) {
    console.error('Error fetching users', err)
  } finally {
    isLoadingUsers.value = false
  }
}

// ── Workspace Settings ─────────────────────────────────────

function toggleEditName() {
  isEditingName.value = true
}

async function saveWorkspaceName() {
  if (isSavingName.value || !editNameValue.value.trim() || editNameValue.value === workspace.value?.name) {
    isEditingName.value = false
    return
  }

  isSavingName.value = true
  try {
    const data = await workspaceService.updateWorkspace(workspaceId, editNameValue.value)
    if (workspace.value) workspace.value.name = data.workspace.name
    editNameValue.value = data.workspace.name
    toast.success('Nombre actualizado')
  } catch (err: unknown) {
    const e = err as ApiError
    workspaceError.value = e.message || 'Error al actualizar el entorno.'
    editNameValue.value = workspace.value?.name || ''
  } finally {
    isSavingName.value = false
    isEditingName.value = false
  }
}

function cancelEditName() {
  if (workspace.value) {
    editNameValue.value = workspace.value.name
  }
  isEditingName.value = false
}

async function openCreateUser(): Promise<void> {
  const newUser = await userModal.open({
    mode: 'create',
    workspaceId
  })
  if (newUser) {
    users.value.unshift(newUser)
  }
}

async function openEditUser(user: WorkspaceUser): Promise<void> {
  const updatedUser = await userModal.open({
    mode: 'edit',
    workspaceId,
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
  // Prevent self-deletion
  if (user._id === userStore.id) {
    toast.error('¿Estas tratando de dañar el sistema? ¿Borrándote a ti mismo? Por dios, desloguéate como una persona normal... jajaja')
    return
  }

  const isConfirmed = await confirm.confirm({
    title: '¿Retirar acceso?',
    message: `Se revocará permanentemente el acceso de ${user.email} a este entorno.`,
    confirmText: 'Sí, Revocar Acceso',
    cancelText: 'Cancelar',
    requireHold: true
  })

  if (isConfirmed) {
    try {
      await workspaceService.deleteUser(workspaceId, user._id)
      users.value = users.value.filter(u => u._id !== user._id)
      toast.success('Acceso revocado correctamente.')
    } catch (err: unknown) {
      toast.error('Ocurrió un error al retirar el acceso.')
    }
  }
}

function canManageUser(user: WorkspaceUser): boolean {
  if (!canManageTeam.value) return false
  if (!userStore.isInternal && user.email.endsWith('@bakano.ec')) return false
  return true
}

function handleInternalUserClick(user: WorkspaceUser) {
  if (user.email.endsWith('@bakano.ec')) {
    router.push({ name: 'WorkspaceTeam', params: { workspaceId } })
  }
}

function formatInternalRole(role?: string): string {
  if (!role) return 'Especialista'
  const roleMap: Record<string, string> = {
    director: 'Director',
    estratega: 'Estratega',
    project_manager: 'Project Manager',
    account_manager: 'Account Manager',
    content_manager: 'Content Manager',
    community_manager: 'Community Manager',
    copywriter: 'Copywriter',
    editor: 'Editor de Video',
    disenador: 'Diseñador',
    productor: 'Productor',
    asistente_produccion: 'Asist. de Producción',
    trafficker: 'Trafficker',
    analista: 'Analista de Datos',
    desarrollador: 'Desarrollador'
  }
  return roleMap[role] || 'Especialista'
}

onMounted(() => {
  fetchWorkspace()
})
</script>

<template>
  <div class="workspace-settings">
    <!-- Header -->
    <header class="workspace-settings__header">
      <div class="workspace-settings__context">
        <button class="workspace-settings__back-btn" @click="router.push({ name: 'BillingRoas', params: { workspaceId } })">
          <i class="fa-solid fa-arrow-left" />
        </button>
        <div>
          <h1>Configuración del Entorno</h1>
          <p class="workspace-settings__subtitle">Gestiona integraciones, usuarios y preferencias.</p>
        </div>
      </div>
      <div v-if="userStore.role === 'superadmin'" class="workspace-settings__superadmin-badge">
        <i class="fa-solid fa-shield-check" /> Superadmin Mode
      </div>
    </header>

    <div v-if="isLoadingWorkspace" class="workspace-settings__loading">
      <div class="workspace-settings__spinner" />
    </div>

    <div v-else-if="workspaceError" class="workspace-settings__error-state">
      <i class="fa-solid fa-circle-exclamation" />
      <p>{{ workspaceError }}</p>
    </div>

    <div v-else class="workspace-settings__content">
      
      <!-- Panel 1: General Info -->
      <section class="workspace-settings__panel">
        <div class="workspace-settings__panel-header">
          <h2><i class="fa-solid fa-building" /> Información General</h2>
        </div>
        <div class="workspace-settings__panel-body">
          <div class="workspace-settings__field-group">
            <label>Nombre del Espacio</label>
            <div class="workspace-settings__input-row">
              <input 
                v-if="isEditingName" 
                v-model="editNameValue" 
                type="text" 
                class="workspace-settings__input"
                @keyup.enter="saveWorkspaceName"
              />
              <span v-else class="workspace-settings__ro-value">{{ workspace?.name }}</span>
              
              <div v-if="canManageIntegrations" class="workspace-settings__field-actions">
                <template v-if="isEditingName">
                  <button class="workspace-settings__btn-icon workspace-settings__btn-icon--success" @click="saveWorkspaceName" :disabled="isSavingName"><i class="fa-solid fa-check" /></button>
                  <button class="workspace-settings__btn-icon workspace-settings__btn-icon--danger" @click="cancelEditName" :disabled="isSavingName"><i class="fa-solid fa-xmark" /></button>
                </template>
                <button v-else class="workspace-settings__btn-icon" @click="toggleEditName" title="Editar Nombre"><i class="fa-solid fa-pen" /></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Panel 2: Integrations -->
      <section class="workspace-settings__panel">
        <div class="workspace-settings__panel-header">
          <h2><i class="fa-solid fa-link" /> Integraciones de Datos</h2>
        </div>
        <div class="workspace-settings__panel-body">
          <div class="workspace-settings__crm-notice" style="display: flex; gap: 1rem; align-items: flex-start; padding: 1.5rem; background: #fafafa; border: 1px solid rgba(0,0,0,0.05); border-radius: 12px;">
            <div class="workspace-settings__crm-icon" style="width: 48px; height: 48px; border-radius: 12px; background: rgba(230, 40, 92, 0.1); color: #e6285c; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
              <i class="fa-solid fa-database" />
            </div>
            <div class="workspace-settings__crm-info">
              <h3 style="margin: 0 0 0.5rem; font-size: 1.1rem; color: #1e293b;">Integraciones migradas al CRM</h3>
              <p style="margin: 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">
                La conexión de fuentes de tráfico como Meta Ads y Google Ads ahora se gestiona de forma centralizada en nuestro CRM. 
                Puedes revisar y administrar tus integraciones directamente desde allí.
              </p>
              <a href="https://crm.bakano.ec" target="_blank" class="workspace-settings__btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1rem; text-decoration: none;">
                Ir a crm.bakano.ec <i class="fa-solid fa-arrow-up-right-from-square" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Panel 3: Users/Team -->
      <section class="workspace-settings__panel">
        <div class="workspace-settings__panel-header">
          <div>
            <h2><i class="fa-solid fa-users" /> Equipo de Trabajo</h2>
            <p v-if="canManageTeam" class="workspace-settings__panel-sub">{{ users.length }} usuarios tienen acceso a los datos de este entorno.</p>
            <p v-else class="workspace-settings__panel-sub"><i class="fa-solid fa-lock" /> No tienes permisos para gestionar el equipo. Contacta a un administrador.</p>
          </div>
          <button v-if="canManageTeam" class="workspace-settings__btn-primary" @click="openCreateUser">
            <i class="fa-solid fa-user-plus" /> Invitar Usuario
          </button>
        </div>
        
        <div class="workspace-settings__panel-body">
          <div v-if="isLoadingUsers" class="workspace-settings__loading">
             <div class="workspace-settings__spinner workspace-settings__spinner--sm" />
          </div>
          <div v-else-if="users.length === 0" class="workspace-settings__empty-list">
             Nadie ha sido invitado a este entorno aún.
          </div>
          <div v-else class="workspace-settings__teams-container" style="display: flex; flex-direction: column; gap: 2.5rem;">
            
            <!-- Tu Equipo -->
            <div v-if="clientUsers.length > 0" class="workspace-settings__team-section">
              <h3 style="margin: 0 0 1rem; font-size: 1.1rem; color: #334155; border-bottom: 2px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem;">Tu Equipo de Trabajo</h3>
              <div class="workspace-settings__table-wrapper">
                <table class="workspace-settings__table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th v-if="canManageTeam">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in clientUsers" :key="user._id">
                      <td>
                        <div class="workspace-settings__user-cell">
                          <div class="workspace-settings__avatar">
                            <img v-if="user.photoUrl" :src="user.photoUrl" alt="Avatar" class="workspace-settings__avatar-img" />
                            <span v-else>{{ (user.name || user.email).charAt(0).toUpperCase() }}</span>
                          </div>
                          <div class="workspace-settings__user-cell-info">
                            <strong>{{ user.name || 'Invitado' }}</strong>
                            <span class="workspace-settings__email-text">{{ user.email }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="workspace-settings__role-badge" :class="`workspace-settings__role-badge--${user.role}`">
                          {{ user.role }}
                        </span>
                      </td>
                      <td v-if="canManageTeam">
                        <div v-if="canManageUser(user)" class="workspace-settings__table-actions">
                          <button class="workspace-settings__btn-icon" @click="openEditUser(user)">
                            <i class="fa-solid fa-pen" />
                          </button>
                          <button class="workspace-settings__btn-icon workspace-settings__btn-icon--danger" @click="confirmDeleteUser(user)">
                            <i class="fa-solid fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Equipo Bakano (Premium Design) -->
            <div v-if="bakanoUsers.length > 0" class="workspace-settings__team-section">
              <h3 style="margin: 0 0 1.5rem; font-size: 1.25rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; letter-spacing: -0.02em;">
                <i class="fa-solid fa-star" style="color: #f59e0b; font-size: 1.1rem;"></i> Equipo Designado por Bakano
              </h3>
              
              <div class="workspace-settings__premium-team-list">
                <div 
                  v-for="user in bakanoUsers" 
                  :key="user._id" 
                  class="workspace-settings__premium-member-card"
                  @click="handleInternalUserClick(user)"
                >
                  <div class="workspace-settings__premium-member-avatar-wrapper">
                    <img v-if="user.photoUrl" :src="user.photoUrl" alt="Avatar" class="workspace-settings__premium-member-avatar" />
                    <span v-else class="workspace-settings__premium-member-avatar-fallback">{{ (user.name || user.email).charAt(0).toUpperCase() }}</span>
                  </div>
                  
                  <div class="workspace-settings__premium-member-info">
                    <strong class="workspace-settings__premium-member-name">{{ user.name || 'Especialista Bakano' }}</strong>
                    <span class="workspace-settings__premium-member-email">{{ user.email }}</span>
                  </div>

                  <div class="workspace-settings__premium-member-role">
                    <span class="workspace-settings__premium-role-badge">
                      {{ formatInternalRole(user.internalRole) }}
                    </span>
                  </div>

                  <div v-if="canManageTeam && canManageUser(user)" class="workspace-settings__premium-member-actions" @click.stop>
                    <button class="workspace-settings__btn-icon" @click.stop="openEditUser(user)" title="Editar Usuario">
                      <i class="fa-solid fa-pen" />
                    </button>
                    <button class="workspace-settings__btn-icon workspace-settings__btn-icon--danger" @click.stop="confirmDeleteUser(user)" title="Eliminar Usuario">
                      <i class="fa-solid fa-trash" />
                    </button>
                  </div>
                  <div v-else class="workspace-settings__premium-member-go-icon">
                    <i class="fa-solid fa-arrow-right" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>

    <!-- Modals -->
    <!-- Meta Page Picker (Removed) -->
    <!-- Meta Ad Account Picker (Removed) -->

  </div>
</template>

<style lang="scss" scoped>
.workspace-settings {
  padding: 2rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.1);
    padding-bottom: 1.5rem;

    @media (min-width: 768px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  &__context {
    display: flex;
    align-items: center;
    gap: 1rem;

    h1 {
      margin: 0;
      font-size: 1.4rem;
      color: $primary-dark;
      line-height: 1.2;

      @media (min-width: 768px) {
        font-size: 1.8rem;
      }
    }
  }

  &__subtitle {
    margin: 0.2rem 0 0;
    color: $text-secondary;
    font-size: 0.95rem;
  }

  &__back-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $primary-dark;
    transition: all 0.2s;
    font-size: 1.2rem;

    &:hover {
      background: $primary-light;
      border-color: $primary;
      color: $primary;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10rem 0;
    width: 100%;
  }

  &__panel {
    background: $white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba($primary-dark, 0.03);
    border: 1px solid rgba($primary-dark, 0.06);
    overflow: hidden;
  }

  &__panel-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
    background: #fafafa;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    @media (min-width: 768px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
    }

    h2 {
      margin: 0;
      font-size: 1.15rem;
      color: $primary-dark;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      i {
        color: $primary;
        font-size: 1rem;
      }
    }
  }

  &__panel-sub {
    margin: 0.2rem 0 0;
    color: $text-secondary;
    font-size: 0.85rem;
  }

  &__panel-body {
    padding: 1.25rem;

    @media (min-width: 768px) {
      padding: 2rem;
    }
  }

  // General Info Text Input
  &__field-group {
    width: 100%;
    max-width: 500px;

    label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: $text-secondary;
      margin-bottom: 0.75rem;
    }
  }

  &__input-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #fafafa;
    padding: 1rem;
    border-radius: 10px;
    border: 1px solid rgba($primary-dark, 0.05);
  }

  &__ro-value {
    font-weight: 600;
    font-size: 1.1rem;
    color: $primary-dark;
    flex: 1;
  }

  &__input {
    flex: 1;
    border: 1px solid $primary;
    border-radius: 6px;
    padding: 0.5rem;
    font-size: 1.1rem;
    outline: none;
    font-weight: 600;
  }

  // Roles Badge
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
    }
  }

  // Integrations card
  &__text-helper {
    margin: 0 0 1.5rem;
    color: $text-secondary;
  }

  &__integration-card {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.25rem;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 12px;
    margin-bottom: 1rem;
    transition: all 0.2s;
    background: $white;

    @media (min-width: 768px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
    }

    &--active {
      border-color: rgba($primary, 0.3);
      box-shadow: 0 4px 15px rgba($primary, 0.05);
    }

    &--disabled {
      opacity: 0.6;
      background: #fafafa;
    }
  }

  &__integration-left {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    min-width: 0;

    @media (min-width: 768px) {
      align-items: center;
      gap: 1.5rem;
    }
  }

  &__integration-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: rgba(#1877f2, 0.1);
    color: #1877f2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.7rem;
  }

  &__integration-info {
    flex: 1;
    min-width: 0;

    h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;

      @media (min-width: 768px) {
        font-size: 1.1rem;
      }
    }

    p {
      margin: 0;
      color: $text-secondary;
      font-size: 0.9rem;
    }
  }

  &__integration-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  &__pill {
    background: $primary-light;
    color: $primary;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;

    @media (min-width: 768px) {
      font-size: 0.8rem;
      max-width: 250px;
    }

    &--restricted {
      background: rgba($text-secondary, 0.05);
      color: $text-secondary;
      border: 1px solid rgba($text-secondary, 0.2);
      padding: 0.4rem 0.8rem;
    }
  }

  &__integration-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: flex-end;

    @media (max-width: 767px) {
      border-top: 1px solid rgba($primary-dark, 0.05);
      padding-top: 1rem;

      button {
        flex: 1;
        justify-content: center;
      }
    }
  }

  // Buttons inside Settings
  &__btn-primary {
    background: $primary;
    color: $white;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__btn-outline {
    background: transparent;
    border: 1px solid rgba($primary-dark, 0.2);
    color: $primary-dark;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: rgba($primary, 0.05);
      border-color: $primary;
      color: $primary;
    }
  }

  &__btn-ghost {
    background: transparent;
    border: none;
    color: $text-secondary;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: rgba($primary-dark, 0.05);
      color: $primary-dark;
    }
  }

  &__btn-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: $text-secondary;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba($primary-dark, 0.05);
    }

    &--success:hover {
      background: rgba($BAKANO-GREEN, 0.1);
      color: $BAKANO-GREEN;
    }

    &--danger:hover {
      background: rgba(255, 71, 87, 0.1);
      color: #ff4757;
    }
  }

  // Users Table
  &__table-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 0 -0.5rem;
    padding: 0 0.5rem;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th {
      text-align: left;
      padding: 1rem;
      color: $text-secondary;
      font-weight: 600;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba($primary-dark, 0.1);
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid rgba($primary-dark, 0.05);
      vertical-align: middle;
    }
  }

  &__user-cell {
    display: flex;
    align-items: center;
    gap: 1rem;

    &--clickable {
      cursor: pointer;
      transition: opacity 0.2s;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $primary-light;
    color: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    overflow: hidden;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__user-cell-info {
    display: flex;
    flex-direction: column;

    strong {
      color: $primary-dark;
    }

    span {
      color: $text-secondary;
      font-size: 0.85rem;
    }
  }

  &__email-text {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__designated-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary-dark, 0.2));
    color: $primary;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba($primary, 0.2);

    i {
      font-size: 0.6rem;
    }
  }

  &__role-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    text-transform: uppercase;
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

  &__table-actions {
    display: flex;
    gap: 0.5rem;
  }

  // Forms / Modals
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba($primary-dark, 0.7);
    backdrop-filter: blur(5px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__premium-member-card {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.04);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
      border-color: rgba($primary, 0.15);

      .workspace-settings__premium-member-go-icon {
        transform: translateX(0);
        opacity: 1;
        color: $primary;
        background: rgba($primary, 0.08);
      }
    }
  }

  &__premium-member-avatar-wrapper {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 1.25rem;
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.02) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }

  &__premium-member-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__premium-member-avatar-fallback {
    color: $primary;
    font-weight: 700;
    font-size: 1.3rem;
  }

  &__premium-member-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__premium-member-name {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  &__premium-member-email {
    font-size: 0.85rem;
    color: #64748b;
  }

  &__premium-member-role {
    margin: 0 2rem;
    
    @media (max-width: 768px) {
      display: none;
    }
  }

  &__premium-member-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__premium-member-go-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f8fafc;
    color: #cbd5e1;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateX(-10px);
    opacity: 0.5;
    font-size: 1.2rem;
  }

  &__premium-role-badge {
    display: inline-block;
    padding: 0.4rem 1.2rem;
    background: #f1f5f9;
    color: #475569;
    font-size: 0.75rem;
    font-weight: 800;
    border-radius: 100px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  &__modal {
    background: $white;
    width: 100%;
    max-width: 500px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;

    &--sm {
      max-width: 400px;
    }
  }

  &__modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    background: #fafafa;

    h3 {
      margin: 0;
    }
  }

  &__form {
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
      font-weight: 600;
      font-size: 0.9rem;
    }

    input,
    select {
      padding: 0.75rem;
      border: 1px solid rgba($primary-dark, 0.2);
      border-radius: 8px;
    }
  }

  &__page-list {
    max-height: 400px;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__page-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 10px;
    cursor: pointer;

    &:hover {
      border-color: $primary;
      background: rgba($primary, 0.03);
    }

    i {
      font-size: 1.2rem;
      color: $primary;
      opacity: 0.7;
    }

    div {
      display: flex;
      flex-direction: column;

      strong {
        color: $primary-dark;
      }

      span {
        font-size: 0.8rem;
        color: $text-secondary;
      }
    }
  }

  &__page-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba($primary, 0.15);
    flex-shrink: 0;
  }

  &__page-item--suggested {
    border-color: rgba($primary, 0.35);
    background: rgba($primary, 0.03);
  }

  &__page-item-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__suggested-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.5rem;
    background: rgba($primary, 0.1);
    color: $primary;
    border-radius: 100px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;

    i {
      font-size: 0.55rem;
    }
  }

  &__modal-footer {
    padding: 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    border-top: 1px solid rgba($primary-dark, 0.05);
  }

  &__error-text {
    color: $alert-error;
    font-size: 0.85rem;
    font-weight: 600;
  }
}

// Loading States
.workspace-settings__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  &--sm {
    width: 16px;
    height: 16px;
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
</style>
