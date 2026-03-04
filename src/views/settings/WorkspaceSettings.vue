<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { metaService } from '@/services/meta.service'
import { useMetaAds } from '@/composables/useMetaAds'
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
const canManageWorkspace = computed(() => {
  return userStore.role === 'admin' || userStore.role === 'superadmin'
})

// Workspace state
const workspace = ref<Workspace | null>(null)
const isLoadingWorkspace = ref(true)
const workspaceError = ref('')

// Users state
const users = ref<WorkspaceUser[]>([])
const isLoadingUsers = ref(false)

// Edit workspace name
const isEditingName = ref(false)
const editNameValue = ref('')
const isSavingName = ref(false)

// Meta Ads Composable
const {
  isLoggingIn,
  error: metaError,
  authStep,
  availablePages,
  initSDK,
  loginWithMeta,
  selectPageAndSave
} = useMetaAds()

const isFetchingAdAccounts = ref(false)
const showAdAccountModal = ref(false)
const adAccountsList = ref<any[]>([])

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

// ── Meta Ads Settings ─────────────────────────────────────

async function handleConnectMeta() {
  try {
    await loginWithMeta()
  } catch (err) {
    console.error('Meta connection failed:', err)
  }
}

async function handlePageSelection(page: any) {
  try {
    await selectPageAndSave(workspaceId, page)
    await fetchWorkspace()
    toast.success('Página de Facebook vinculada exitosamente.')
  } catch (err) {
    console.error('Page selection failed:', err)
    toast.error('Ocurrió un error al vincular la página.')
  }
}

async function fetchAdAccounts() {
  isFetchingAdAccounts.value = true
  try {
    const data = await metaService.listAdAccounts(workspaceId)
    adAccountsList.value = data.accounts || []
    showAdAccountModal.value = true
  } catch (err) {
    console.error('Error fetching ad accounts:', err)
    toast.error("Ocurrió un error al cargar las cuentas publicitarias.")
  } finally {
    isFetchingAdAccounts.value = false
  }
}

async function handleAdAccountSelection(account: any) {
  if (!workspace.value?.metaAds) return

  try {
    isFetchingAdAccounts.value = true
    await metaService.saveIntegration({
      workspaceId,
      pageId: workspace.value.metaAds.pageId,
      pageName: workspace.value.metaAds.pageName,
      accessToken: workspace.value.metaAds.accessToken,
      pageAccessToken: workspace.value.metaAds.pageAccessToken, // Send existing or undefined to not overwrite 
      adAccountId: account.account_id,
      adAccountName: account.name
    })
    showAdAccountModal.value = false
    await fetchWorkspace()
    toast.success('Cuenta publicitaria de Meta vinculada correctamente.')
  } catch (err) {
    console.error('Error saving ad account:', err)
    toast.error("Ocurrió un error al vincular la cuenta publicitaria.")
  } finally {
    isFetchingAdAccounts.value = false
  }
}

// ── User Management ───────────────────────────────────────

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

onMounted(() => {
  fetchWorkspace()
  initSDK()
})
</script>

<template>
  <div class="workspace-settings">
    <!-- Header -->
    <header class="workspace-settings__header">
      <div class="workspace-settings__context">
        <button class="workspace-settings__back-btn" @click="router.push({ name: 'WorkspaceDashboard', params: { workspaceId } })">
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
              
              <div v-if="canManageWorkspace" class="workspace-settings__field-actions">
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

      <!-- Panel 2: Integrations (Meta Ads) -->
      <section class="workspace-settings__panel">
        <div class="workspace-settings__panel-header">
          <h2><i class="fa-solid fa-link" /> Integraciones de Datos</h2>
        </div>
        <div class="workspace-settings__panel-body">
          <p class="workspace-settings__text-helper">Conecta tus fuentes de tráfico para calcular el retorno de inversión global.</p>
          
          <div class="workspace-settings__integration-card" :class="{ 'workspace-settings__integration-card--active': workspace?.metaAds }">
            <div class="workspace-settings__integration-left">
              <div class="workspace-settings__integration-icon">
                <i class="fa-brands fa-facebook" />
              </div>
              <div class="workspace-settings__integration-info">
                <h3>Facebook & Instagram Ads</h3>
                <p v-if="!workspace?.metaAds">No conectado</p>
                <div v-else class="workspace-settings__integration-details">
                  <span class="workspace-settings__pill">Página: {{ workspace.metaAds.pageName }}</span>
                  <span v-if="workspace.metaAds.adAccountName" class="workspace-settings__pill">C/P: {{ workspace.metaAds.adAccountName }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="canManageWorkspace" class="workspace-settings__integration-right">
              <template v-if="workspace?.metaAds">
                <button v-if="!workspace.metaAds.adAccountId" class="workspace-settings__btn-primary" @click="fetchAdAccounts">
                  Elegir Cuenta Ads
                </button>
                <button v-else class="workspace-settings__btn-outline" @click="fetchAdAccounts">
                  Cambiar Cuenta Ads
                </button>
                <button class="workspace-settings__btn-ghost" @click="handleConnectMeta" title="Renovar token de permisos">
                  <i class="fa-solid fa-rotate" />
                </button>
              </template>
              <button v-else class="workspace-settings__btn-primary" @click="handleConnectMeta" :disabled="isLoggingIn">
                {{ isLoggingIn ? 'Conectando...' : 'Conectar' }}
              </button>
            </div>
            <div v-else class="workspace-settings__integration-right">
              <span class="workspace-settings__pill workspace-settings__pill--restricted">
                <i class="fa-solid fa-lock" /> Solo lectura
              </span>
            </div>
          </div>
          <p v-if="metaError" class="workspace-settings__error-text">{{ metaError }}</p>

          <div class="workspace-settings__integration-card workspace-settings__integration-card--disabled">
            <div class="workspace-settings__integration-left">
              <div class="workspace-settings__integration-icon" style="background: rgba(219, 68, 55, 0.1); color: #db4437;">
                <i class="fa-brands fa-google" />
              </div>
              <div class="workspace-settings__integration-info">
                <h3>Google Ads</h3>
                <p>Próximamente</p>
              </div>
            </div>
            <div class="workspace-settings__integration-right">
              <button class="workspace-settings__btn-ghost" disabled>Pronto</button>
            </div>
          </div>

        </div>
      </section>

      <!-- Panel 3: Users/Team -->
      <section class="workspace-settings__panel">
        <div class="workspace-settings__panel-header">
          <div>
            <h2><i class="fa-solid fa-users" /> Equipo de Trabajo</h2>
            <p v-if="canManageWorkspace" class="workspace-settings__panel-sub">{{ users.length }} usuarios tienen acceso a los datos de este entorno.</p>
            <p v-else class="workspace-settings__panel-sub"><i class="fa-solid fa-lock" /> No tienes permisos para gestionar el equipo. Contacta a un administrador.</p>
          </div>
          <button v-if="canManageWorkspace" class="workspace-settings__btn-primary" @click="openCreateUser">
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
          <table v-else class="workspace-settings__table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th v-if="canManageWorkspace">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user._id">
                <td>
                  <div class="workspace-settings__user-cell">
                    <div class="workspace-settings__avatar">{{ (user.name || user.email).charAt(0).toUpperCase() }}</div>
                    <div class="workspace-settings__user-cell-info">
                      <strong>{{ user.name || 'Invitado' }}</strong>
                      <span>{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="workspace-settings__role-badge" :class="`workspace-settings__role-badge--${user.role}`">
                    {{ user.role }}
                  </span>
                </td>
                <td v-if="canManageWorkspace">
                  <div class="workspace-settings__table-actions">
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
      </section>

    </div>

    <!-- Modals -->
    <!-- Meta Page Picker -->
    <Transition name="modal">
      <div v-if="authStep === 'pick_page'" class="workspace-settings__overlay">
        <div class="workspace-settings__modal">
          <div class="workspace-settings__modal-header">
            <h3>Selecciona la Página a Vincular</h3>
          </div>
          <div class="workspace-settings__page-list">
            <div 
              v-for="page in availablePages" 
              :key="page.id" 
              class="workspace-settings__page-item"
              @click="handlePageSelection(page)"
            >
              <i class="fa-solid fa-flag" />
              <div>
                <strong>{{ page.name }}</strong>
                <span>ID: {{ page.id }}</span>
              </div>
            </div>
          </div>
          <div class="workspace-settings__modal-footer">
            <button class="workspace-settings__btn-ghost" @click="authStep = 'idle'">Cerrar</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Meta Ad Account Picker -->
    <Transition name="modal">
      <div v-if="showAdAccountModal" class="workspace-settings__overlay">
        <div class="workspace-settings__modal">
          <div class="workspace-settings__modal-header">
            <h3>Selecciona Cuenta Publicitaria</h3>
          </div>
          <div class="workspace-settings__page-list">
            <div 
              v-for="account in adAccountsList" 
              :key="account.account_id" 
              class="workspace-settings__page-item"
              @click="handleAdAccountSelection(account)"
            >
              <i class="fa-solid fa-bullhorn" />
              <div>
                <strong>{{ account.name }}</strong>
                <span>ID: {{ account.account_id }}</span>
              </div>
            </div>
          </div>
          <div class="workspace-settings__modal-footer">
            <button class="workspace-settings__btn-ghost" @click="showAdAccountModal = false">Cancelar</button>
          </div>
        </div>
      </div>
    </Transition>

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
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba($primary-dark, 0.1);
    padding-bottom: 1.5rem;
  }

  &__context {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    h1 {
      margin: 0;
      font-size: 1.8rem;
      color: $primary-dark;
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
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    align-items: center;

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
    padding: 2rem;
  }

  // General Info Text Input
  &__field-group {
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
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 12px;
    margin-bottom: 1rem;
    transition: all 0.2s;
    background: $white;

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
    align-items: center;
    gap: 1.5rem;
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
    h3 {
      margin: 0 0 0.25rem;
      font-size: 1.1rem;
    }

    p {
      margin: 0;
      color: $text-secondary;
      font-size: 0.9rem;
    }
  }

  &__integration-details {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  &__pill {
    background: $primary-light;
    color: $primary;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;

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
