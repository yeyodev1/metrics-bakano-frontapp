<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useUserFormModal } from '@/composables/useUserFormModal'
import { useSuperadminModal } from '@/composables/useSuperadminModal'
import { useGlobalUserModal } from '@/composables/useGlobalUserModal'
import { workspaceService } from '@/services/workspace.service'
import { useUserStore } from '@/stores/user'
import type { Workspace, WorkspaceUser, ApiError } from '@/types'
import GlobalUserModal from '@/components/common/GlobalUserModal.vue'
import PlanningCalendar from '@/components/PlanningCalendar.vue'
import { surveyService } from '@/services/survey.service'
import type { ISurvey } from '@/types/survey'

// ── Directives ─────────────────────────────────────────────
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

const userStore = useUserStore()

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const userModal = useUserFormModal()
const superadminModal = useSuperadminModal()
const globalUserModal = useGlobalUserModal()

// ── State ──────────────────────────────────────────────────
const activeTab = ref<'workspaces' | 'account-admins' | 'superadmins' | 'planning' | 'surveys'>('workspaces')

// ── Planning tab state ──────────────────────────────────────
const planningSelectedId = ref<string>('')
const planningSearch = ref<string>('')
const planningFilteredWorkspaces = computed(() => {
  const q = planningSearch.value.trim().toLowerCase()
  if (!q) return workspaces.value
  return workspaces.value.filter(w => w.name.toLowerCase().includes(q))
})
const planningSelectedWorkspace = computed(() =>
  workspaces.value.find(w => w._id === planningSelectedId.value)
)
const PLANNING_COLORS = [
  '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#db2777', '#2563eb', '#ea580c', '#65a30d', '#0d9488',
]
function planningColor(wsId: string): string {
  const idx = workspaces.value.findIndex(w => w._id === wsId)
  return PLANNING_COLORS[idx % PLANNING_COLORS.length] as string
}
function planningInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
}
function planningMetaUrl(pageId: string): string {
  return `https://graph.facebook.com/${pageId}/picture?type=square`
}

const workspaces = ref<Workspace[]>([])
const isLoadingWorkspaces = ref(false)
const searchQuery = ref('')
const page = ref(1)
const hasMore = ref(false)
const isLoadingMore = ref(false)

const selectedWorkspace = ref<Workspace | null>(null)
const users = ref<WorkspaceUser[]>([])
const isLoadingUsers = ref(false)

// Create workspace modal
const showCreateWorkspace = ref(false)
const newWorkspaceName = ref('')
const isSavingWorkspace = ref(false)
const workspaceError = ref('')

// ── Superadmin Management State ────────────────────────────
const superadmins = ref<any[]>([])
const isLoadingSuperadmins = ref(false)

const allUsers = ref<WorkspaceUser[]>([])
const isLoadingAllUsers = ref(false)
const searchAllUsersQuery = ref('')
const filterWorkspaceId = ref('')
const isFilterDrawerOpen = ref(false)

// Searchable Dropdown state
const workspaceSearchText = ref('')
const isWorkspaceDropdownOpen = ref(false)

const filteredWorkspaces = computed(() => {
  if (!workspaceSearchText.value.trim()) return workspaces.value
  const query = workspaceSearchText.value.toLowerCase()
  return workspaces.value.filter(ws => ws.name.toLowerCase().includes(query))
})

const currentFilterWorkspaceName = computed(() => {
  const ws = workspaces.value.find(w => w._id === filterWorkspaceId.value)
  return ws ? ws.name : 'Todos los Entornos'
})

// ── Workspace Management ──────────────────────────────────
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

// Watch for search query changes with debounce
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchWorkspaces()
  }, 400)
})

watch(searchAllUsersQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchAllUsers()
  }, 400)
})

watch(filterWorkspaceId, () => {
  fetchAllUsers()
})

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

// ── Superadmin Management Actions ─────────────────────────
async function fetchSuperadmins(): Promise<void> {
  isLoadingSuperadmins.value = true
  try {
    const { admins } = await workspaceService.listSuperadmins()
    superadmins.value = admins
  } catch {
    toast.error('Error al cargar superadmins')
  } finally {
    isLoadingSuperadmins.value = false
  }
}

function openCreateSuperadmin(): void {
  superadminModal.open().then((user) => {
    if (user) superadmins.value.unshift(user)
  })
}

async function confirmDeleteSuperadmin(admin: any): Promise<void> {
  const isConfirmed = await confirm.confirm({
    title: '¿Eliminar superadmin?',
    message: `Esta acción es irreversible. Se eliminará a ${admin.email} con todos sus privilegios de sistema.`,
    confirmText: 'Sí, eliminar superadmin',
    cancelText: 'Cancelar',
    requireHold: true
  })

  if (isConfirmed) {
    try {
      await workspaceService.deleteSuperadmin(admin._id)
      superadmins.value = superadmins.value.filter(a => a._id !== admin._id)
      toast.success('Superadmin eliminado.')
    } catch {
      toast.error('Error al eliminar el superadmin.')
    }
  }
}

function switchTab(tab: 'workspaces' | 'account-admins' | 'superadmins' | 'planning' | 'surveys'): void {
  activeTab.value = tab
  if (tab === 'superadmins' && superadmins.value.length === 0) {
    fetchSuperadmins()
  } else if (tab === 'account-admins' && allUsers.value.length === 0) {
    fetchAllUsers()
  } else if (tab === 'planning' && !planningSelectedId.value && workspaces.value.length > 0) {
    planningSelectedId.value = workspaces.value[0]!._id
  } else if (tab === 'surveys' && dashboardSurveys.value.length === 0) {
    fetchDashboardSurveys()
  }
}

async function fetchAllUsers(): Promise<void> {
  isLoadingAllUsers.value = true
  try {
    const { users } = await workspaceService.listAllCollaborators(
      searchAllUsersQuery.value.trim() || undefined,
      filterWorkspaceId.value || undefined
    )
    allUsers.value = users
  } catch {
    toast.error('Error al cargar usuarios')
  } finally {
    isLoadingAllUsers.value = false
  }
}

async function openCreateGlobalUser() {
  const newUser = await globalUserModal.open({ mode: 'create' })
  if (newUser) {
    allUsers.value.unshift(newUser)
  }
}

async function openEditGlobalUser(user: WorkspaceUser) {
  const updatedUser = await globalUserModal.open({ mode: 'edit', user })
  if (updatedUser) {
    const index = allUsers.value.findIndex(u => u._id === updatedUser._id)
    if (index !== -1) {
      allUsers.value[index] = updatedUser
    }
  }
}

// ── Resend invite ────────────────────────────────────────
const resendTarget = ref<WorkspaceUser | null>(null)
const resendPwd = ref('')
const isResendingInvite = ref(false)

function openResendInvite(user: WorkspaceUser) {
  resendTarget.value = user
  resendPwd.value = ''
}

async function submitResendInvite() {
  if (!resendTarget.value || resendPwd.value.length < 8) return
  isResendingInvite.value = true
  try {
    await workspaceService.resendInvite(resendTarget.value._id, resendPwd.value)
    toast.success(`Invitación enviada a ${resendTarget.value.email}`)
    resendTarget.value = null
    resendPwd.value = ''
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Error al reenviar invitación')
  } finally {
    isResendingInvite.value = false
  }
}

// ── Surveys tab ────────────────────────────────────────────
const dashboardSurveys = ref<ISurvey[]>([])
const isLoadingSurveys = ref(false)
const surveyFilterStatus = ref<'all' | 'draft' | 'active' | 'closed'>('all')

const filteredDashboardSurveys = computed(() => {
  if (surveyFilterStatus.value === 'all') return dashboardSurveys.value
  return dashboardSurveys.value.filter(s => s.status === surveyFilterStatus.value)
})

async function fetchDashboardSurveys(): Promise<void> {
  isLoadingSurveys.value = true
  try {
    const { surveys } = await surveyService.listSurveys()
    dashboardSurveys.value = surveys
  } catch {
    toast.error('Error al cargar encuestas')
  } finally {
    isLoadingSurveys.value = false
  }
}

function surveyCreatorName(survey: ISurvey): string {
  if (typeof survey.createdBy === 'object' && survey.createdBy !== null) {
    return (survey.createdBy as any).name || (survey.createdBy as any).email
  }
  return '—'
}

function formatSurveyDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(fetchWorkspaces)
</script>

<template>
  <div class="superadmin-dashboard">

    <!-- Top bar -->
    <header class="superadmin-dashboard__topbar">
      <div class="superadmin-dashboard__topbar-left">
        <div v-if="activeTab === 'workspaces' && selectedWorkspace" class="superadmin-dashboard__ws-badge">
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
          v-if="activeTab === 'workspaces'"
          id="btn-create-workspace"
          class="superadmin-dashboard__btn-primary"
          type="button"
          @click="openCreateWorkspace"
        >
          <i class="fa-solid fa-plus" aria-hidden="true" />
          Nuevo entorno
        </button>
        <button
          v-else-if="activeTab === 'surveys'"
          class="superadmin-dashboard__btn-primary"
          type="button"
          @click="router.push({ name: 'SurveyNew' })"
        >
          <i class="fa-solid fa-plus" />
          Nueva encuesta
        </button>
        <button
          v-else
          class="superadmin-dashboard__btn-danger-outline"
          type="button"
          @click="openCreateSuperadmin"
        >
          <i class="fa-solid fa-user-shield" />
          Nuevo Superadmin
        </button>
      </div>
    </header>

    <!-- Tab Navigation -->
    <nav class="superadmin-dashboard__tabs">
      <button
        class="superadmin-dashboard__tab"
        :class="{ 'superadmin-dashboard__tab--active': activeTab === 'workspaces' }"
        @click="switchTab('workspaces')"
      >
        <i class="fa-solid fa-layer-group" /> Entornos & Clientes
      </button>
      <button
        class="superadmin-dashboard__tab"
        :class="{ 'superadmin-dashboard__tab--active': activeTab === 'account-admins' }"
        @click="switchTab('account-admins')"
      >
        <i class="fa-solid fa-users-gear" /> Admins de Cuenta
      </button>
      <button
        class="superadmin-dashboard__tab superadmin-dashboard__tab--danger"
        :class="{ 'superadmin-dashboard__tab--active superadmin-dashboard__tab--danger-active': activeTab === 'superadmins' }"
        @click="switchTab('superadmins')"
      >
        <i class="fa-solid fa-user-shield" /> Superadmins del Sistema
      </button>
      <button
        class="superadmin-dashboard__tab superadmin-dashboard__tab--planning"
        :class="{ 'superadmin-dashboard__tab--active superadmin-dashboard__tab--planning-active': activeTab === 'planning' }"
        @click="switchTab('planning')"
      >
        <i class="fa-solid fa-calendar-range" /> Planificación Global
      </button>
      <button
        class="superadmin-dashboard__tab superadmin-dashboard__tab--surveys"
        :class="{ 'superadmin-dashboard__tab--active superadmin-dashboard__tab--surveys-active': activeTab === 'surveys' }"
        @click="switchTab('surveys')"
      >
        <i class="fa-solid fa-clipboard-list" /> Encuestas
        <span class="superadmin-dashboard__tab-global-tag">GLOBAL</span>
      </button>
    </nav>

    <!-- Content: Workspaces Tab -->
    <div v-if="activeTab === 'workspaces'" class="superadmin-dashboard__body">

      <!-- Left: workspace list -->
      <section class="superadmin-dashboard__workspaces">
        <div class="superadmin-dashboard__section-header">
          <div class="superadmin-dashboard__section-title">
            <h3>Entornos</h3>
            <span class="superadmin-dashboard__count">{{ workspaces.length }}</span>
          </div>
          <div class="superadmin-dashboard__search-wrap">
            <i class="fa-solid fa-magnifying-glass" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar..." 
              class="superadmin-dashboard__search-input"
            />
          </div>
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
              <img
                v-if="ws.metaAds?.pageId"
                :src="`https://graph.facebook.com/${ws.metaAds.pageId}/picture?type=normal`"
                :alt="ws.name"
                class="superadmin-dashboard__ws-icon-img"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <i v-else class="fa-solid fa-building" />
            </div>
            <div class="superadmin-dashboard__ws-info">
              <span class="superadmin-dashboard__ws-name">{{ ws.name }}</span>
              <span class="superadmin-dashboard__ws-meta">
                <span v-if="ws.metaAds?.pageId" class="superadmin-dashboard__ws-meta-badge">
                  <i class="fa-brands fa-meta" /> Meta
                </span>
                <span v-if="ws.adminId">{{ ws.adminId.email }}</span>
                <span v-else class="superadmin-dashboard__ws-meta-empty">Sin admin asignado</span>
              </span>
            </div>
          </li>
        </ul>

        <!-- Load More -->
        <div v-if="hasMore" class="superadmin-dashboard__load-more">
          <button 
            class="superadmin-dashboard__btn-ghost superadmin-dashboard__btn-ghost--full"
            :disabled="isLoadingMore"
            @click="fetchWorkspaces(true)"
          >
            <span v-if="!isLoadingMore">Cargar más</span>
            <span v-else class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
          </button>
        </div>
      </section>

      <!-- Right: Users panel -->
      <section class="superadmin-dashboard__users">
        <div v-if="!selectedWorkspace" class="superadmin-dashboard__placeholder">
          <div class="superadmin-dashboard__placeholder-content">
            <div class="superadmin-dashboard__placeholder-orb">
              <i class="fa-solid fa-briefcase" />
              <div class="superadmin-dashboard__placeholder-arrow">
                <i class="fa-solid fa-arrow-pointer" />
              </div>
            </div>
            <h3>Gestión de Usuarios</h3>
            <p>Selecciona un entorno de la lista para ver y gestionar sus miembros.</p>
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
                @click="router.push({ name: 'AppDashboard', params: { workspaceId: selectedWorkspace?._id } })"
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

    <!-- Content: Account Admins Tab -->
    <div v-if="activeTab === 'account-admins'" class="superadmin-dashboard__account-admins">
      <div class="superadmin-dashboard__section-header superadmin-dashboard__section-header--row">
        <div class="superadmin-dashboard__section-title">
          <h3>Gestión Global de Usuarios</h3>
          <p>Administradores y colaboradores de todos los entornos</p>
        </div>
        <div class="superadmin-dashboard__header-actions">
          <div class="superadmin-dashboard__search-wrap superadmin-dashboard__search-wrap--all-users">
            <i class="fa-solid fa-magnifying-glass" />
            <input 
              v-model="searchAllUsersQuery" 
              type="text" 
              placeholder="Buscar colaboradores..." 
              class="superadmin-dashboard__search-input"
            />
          </div>

          <button 
            class="superadmin-dashboard__btn-secondary" 
            :class="{ 'superadmin-dashboard__btn-secondary--active': filterWorkspaceId }"
            @click="isFilterDrawerOpen = !isFilterDrawerOpen"
          >
            <i class="fa-solid fa-filter" />
            Filtros
            <span v-if="filterWorkspaceId" class="superadmin-dashboard__filter-badge" />
          </button>

          <button class="superadmin-dashboard__btn-primary" @click="openCreateGlobalUser">
            <i class="fa-solid fa-user-plus" />
            Crear Colaborador
          </button>
        </div>

        <!-- Filter Sidebar/Drawer placeholder-logic -->
        <Transition name="slide-fade">
          <div v-if="isFilterDrawerOpen" class="superadmin-dashboard__filter-drawer">
            <div class="superadmin-dashboard__filter-drawer-header">
              <h3>Filtros Avanzados</h3>
              <button @click="isFilterDrawerOpen = false; workspaceSearchText = ''; isWorkspaceDropdownOpen = false">
                <i class="fa-solid fa-xmark" />
              </button>
            </div>
            <div class="superadmin-dashboard__filter-drawer-body">
              <div class="superadmin-dashboard__filter-item">
                <label>Filtrar por Entorno</label>
                <div class="superadmin-dashboard__searchable-select" v-click-outside="() => isWorkspaceDropdownOpen = false">
                  <div 
                    class="superadmin-dashboard__searchable-select-trigger" 
                    @click="isWorkspaceDropdownOpen = !isWorkspaceDropdownOpen"
                  >
                    <span>{{ currentFilterWorkspaceName }}</span>
                    <i class="fa-solid fa-chevron-down" :class="{ 'fa-rotate-180': isWorkspaceDropdownOpen }" />
                  </div>
                  
                  <Transition name="fade-scale">
                    <div v-if="isWorkspaceDropdownOpen" class="superadmin-dashboard__searchable-select-dropdown">
                      <div class="superadmin-dashboard__dropdown-search" @click.stop>
                        <i class="fa-solid fa-magnifying-glass" />
                        <input 
                          v-model="workspaceSearchText" 
                          type="text" 
                          placeholder="Buscar entorno..." 
                        />
                      </div>
                      <ul class="superadmin-dashboard__dropdown-list">
                        <li 
                          :class="{ 'superadmin-dashboard__dropdown-item--active': filterWorkspaceId === '' }"
                          @click="filterWorkspaceId = ''; isWorkspaceDropdownOpen = false"
                        >
                          <i class="fa-solid fa-globe" />
                          Todos los Entornos
                        </li>
                        <li 
                          v-for="ws in filteredWorkspaces" 
                          :key="ws._id"
                          :class="{ 'superadmin-dashboard__dropdown-item--active': filterWorkspaceId === ws._id }"
                          @click="filterWorkspaceId = ws._id; isWorkspaceDropdownOpen = false"
                        >
                          <i class="fa-solid fa-building" />
                          {{ ws.name }}
                        </li>
                        <li v-if="filteredWorkspaces.length === 0" class="superadmin-dashboard__dropdown-item--empty">
                          No se encontraron entornos
                        </li>
                      </ul>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
            <div class="superadmin-dashboard__filter-drawer-footer">
              <button class="superadmin-dashboard__btn-text" @click="filterWorkspaceId = ''; workspaceSearchText = ''; isWorkspaceDropdownOpen = false">
                <i class="fa-solid fa-trash-can" />
                Limpiar
              </button>
              <button class="superadmin-dashboard__btn-primary" @click="isFilterDrawerOpen = false; workspaceSearchText = ''; isWorkspaceDropdownOpen = false">
                <i class="fa-solid fa-check" />
                Aplicar
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <div v-if="isLoadingAllUsers" class="superadmin-dashboard__loading">
        <div class="superadmin-dashboard__spinner" />
        <p>Cargando colaboradores...</p>
      </div>

      <div v-else-if="allUsers.length === 0" class="superadmin-dashboard__empty-state">
        <div class="superadmin-dashboard__empty-icon">
          <i class="fa-solid fa-user-gear" />
        </div>
        <h3>No se encontraron colaboradores</h3>
        <p v-if="searchAllUsersQuery || filterWorkspaceId">
          No hay resultados que coincidan con tus filtros actuales.
          <button class="superadmin-dashboard__link" @click="searchAllUsersQuery = ''; filterWorkspaceId = ''">
            Limpiar filtros
          </button>
        </p>
        <p v-else>
          Actualmente no hay administradores de cuenta registrados en el sistema.
          Empieza creando uno para vincularlo a sus entornos.
        </p>
        <button v-if="!searchAllUsersQuery && !filterWorkspaceId" class="superadmin-dashboard__btn-primary" @click="openCreateGlobalUser">
          <i class="fa-solid fa-plus" />
          Crear Mi Primer Colaborador
        </button>
      </div>

      <div v-else class="superadmin-dashboard__user-table-container">
        <table class="superadmin-dashboard__user-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Rol Interno</th>
              <th>Entornos Asignados</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in allUsers" :key="user._id">
              <td>
                <div class="superadmin-dashboard__user-identity">
                  <div class="superadmin-dashboard__user-name-wrapper">
                    <strong>{{ user.name || 'Sin nombre' }}</strong>
                    <span v-if="user.isInternal" class="superadmin-dashboard__internal-badge">
                      <i class="fa-solid fa-shield-halved" />
                      Bakano Team
                    </span>
                  </div>
                  <span>{{ user.email }}</span>
                </div>
              </td>
              <td>
                <span
                  v-if="user.isInternal && user.internalRole"
                  class="superadmin-dashboard__internal-role-chip"
                >
                  {{ {
                    director: 'Director',
                    estratega: 'Estratega',
                    project_manager: 'Project Manager',
                    content_manager: 'Content Manager',
                    account_manager: 'Account Manager',
                    community_manager: 'Community Manager',
                    productor: 'Productor',
                    disenador: 'Diseñador',
                    copywriter: 'Copywriter',
                    analista: 'Analista',
                    desarrollador: 'Desarrollador'
                  }[user.internalRole] || user.internalRole }}
                </span>
                <span v-else class="superadmin-dashboard__no-role">—</span>
              </td>
              <td>
                <div class="superadmin-dashboard__user-workspaces">
                  <div v-for="ws in user.workspaces" :key="ws.workspaceId?._id" class="superadmin-dashboard__ws-tag">
                    {{ ws.workspaceId?.name || '---' }} 
                    <small>({{ ws.role === 'admin' ? 'Admin' : 'Colaborador' }})</small>
                  </div>
                  <span v-if="!user.workspaces?.length" class="superadmin-dashboard__ws-tag superadmin-dashboard__ws-tag--none">
                    Sin entornos
                  </span>
                </div>
              </td>
              <td>
                <span class="superadmin-dashboard__status-chip" :class="{ 'superadmin-dashboard__status-chip--active': user.isActive }">
                  {{ user.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="superadmin-dashboard__actions">
                  <button class="superadmin-dashboard__action-btn" @click="openEditGlobalUser(user)" title="Editar">
                    <i class="fa-solid fa-pen" />
                  </button>
                  <button class="superadmin-dashboard__action-btn superadmin-dashboard__action-btn--invite" @click="openResendInvite(user)" title="Reenviar invitación">
                    <i class="fa-solid fa-paper-plane" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Resend invite mini modal -->
    <Transition name="fade">
      <div v-if="resendTarget" class="superadmin-dashboard__resend-overlay" @click.self="resendTarget = null">
        <div class="superadmin-dashboard__resend-modal">
          <div class="superadmin-dashboard__resend-header">
            <div class="superadmin-dashboard__resend-icon">
              <i class="fa-solid fa-paper-plane" />
            </div>
            <div>
              <h4>Reenviar invitación</h4>
              <p>{{ resendTarget.name || resendTarget.email }}</p>
            </div>
            <button class="superadmin-dashboard__resend-close" @click="resendTarget = null">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
          <p class="superadmin-dashboard__resend-desc">
            Se actualizará la contraseña y se enviará el email de bienvenida con las nuevas credenciales a <strong>{{ resendTarget.email }}</strong>.
          </p>
          <div class="superadmin-dashboard__resend-row">
            <input
              v-model="resendPwd"
              type="password"
              minlength="8"
              placeholder="Nueva contraseña (mín. 8 caracteres)"
              class="superadmin-dashboard__resend-input"
              @keydown.enter.prevent="submitResendInvite"
              autofocus
            />
          </div>
          <div class="superadmin-dashboard__resend-footer">
            <button class="superadmin-dashboard__btn-ghost" @click="resendTarget = null">Cancelar</button>
            <button
              class="superadmin-dashboard__btn-primary"
              :disabled="isResendingInvite || resendPwd.length < 8"
              @click="submitResendInvite"
            >
              <span v-if="isResendingInvite" class="superadmin-dashboard__spinner" />
              <i v-else class="fa-solid fa-paper-plane" />
              {{ isResendingInvite ? 'Enviando...' : 'Enviar invitación' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Content: Superadmins Tab -->
    <div v-if="activeTab === 'superadmins'" class="superadmin-dashboard__superadmins-panel">

      <!-- Danger Alert -->
      <div class="superadmin-dashboard__danger-alert">
        <div class="superadmin-dashboard__danger-alert-icon">
          <i class="fa-solid fa-triangle-exclamation" />
        </div>
        <div class="superadmin-dashboard__danger-alert-body">
          <strong>Zona de Alto Privilegio</strong>
          <p>Los usuarios Superadmin tienen <strong>acceso total e irrestricto</strong> al sistema: pueden crear y eliminar entornos, gestionar cualquier usuario, y modificar cualquier configuración de clientes. Crea estas cuentas solo para personas de absoluta confianza.</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoadingSuperadmins" class="superadmin-dashboard__loading">
        <span class="superadmin-dashboard__spinner" />
        <p>Cargando superadmins...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="superadmins.length === 0" class="superadmin-dashboard__empty-state">
        <div class="superadmin-dashboard__empty-state-icon superadmin-dashboard__empty-state-icon--danger">
          <i class="fa-solid fa-user-shield" />
        </div>
        <h4 class="superadmin-dashboard__empty-state-title">No hay superadmins registrados</h4>
        <p class="superadmin-dashboard__empty-state-desc">Solo verás tu propia cuenta en esta lista una vez que se sincronice.</p>
      </div>

      <!-- Superadmin List -->
      <div v-else class="superadmin-dashboard__superadmin-grid">
        <div
          v-for="admin in superadmins"
          :key="admin._id"
          class="superadmin-dashboard__superadmin-card"
          :class="{ 'superadmin-dashboard__superadmin-card--self': admin._id === userStore.id }"
        >
          <div class="superadmin-dashboard__user-main">
            <div class="superadmin-dashboard__superadmin-avatar">
              <i class="fa-solid fa-user-shield" />
            </div>
            <div class="superadmin-dashboard__user-info">
              <div class="superadmin-dashboard__user-name-row">
                <span class="superadmin-dashboard__user-name">{{ admin.name || 'Sin nombre' }}</span>
                <span class="superadmin-dashboard__role-badge superadmin-dashboard__role-badge--superadmin">
                  superadmin
                </span>
                <span v-if="admin._id === userStore.id" class="superadmin-dashboard__self-tag">
                  <i class="fa-solid fa-circle-check" /> Tú
                </span>
              </div>
              <span class="superadmin-dashboard__user-email">{{ admin.email }}</span>
            </div>
          </div>
          <div class="superadmin-dashboard__user-actions">
            <button
              v-if="admin._id !== userStore.id"
              class="superadmin-dashboard__action-btn superadmin-dashboard__action-btn--danger"
              title="Eliminar superadmin"
              @click="confirmDeleteSuperadmin(admin)"
            >
              <i class="fa-solid fa-trash-can" />
            </button>
            <span v-else class="superadmin-dashboard__self-lock" title="No puedes eliminarte a ti mismo">
              <i class="fa-solid fa-lock" />
            </span>
          </div>
        </div>
      </div>
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

    <!-- Content: Planning Tab -->
    <div v-if="activeTab === 'planning'" class="superadmin-dashboard__planning">
      <div class="superadmin-dashboard__planning-body">

        <!-- Sidebar -->
        <aside class="superadmin-dashboard__planning-sidebar">
          <div class="superadmin-dashboard__planning-sidebar-header">
            <span class="superadmin-dashboard__planning-sidebar-title">
              <i class="fa-solid fa-building" /> Clientes
            </span>
            <span class="superadmin-dashboard__planning-sidebar-count">{{ planningFilteredWorkspaces.length }}</span>
          </div>

          <div class="superadmin-dashboard__planning-search">
            <i class="fa-solid fa-magnifying-glass" />
            <input v-model="planningSearch" type="text" placeholder="Buscar cliente…" autocomplete="off" />
            <button v-if="planningSearch" class="superadmin-dashboard__planning-search-clear" @click="planningSearch = ''">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>

          <div class="superadmin-dashboard__planning-list">
            <div v-if="isLoadingWorkspaces" v-for="n in 5" :key="n" class="superadmin-dashboard__planning-skeleton" />
            <div v-else-if="planningFilteredWorkspaces.length === 0" class="superadmin-dashboard__planning-empty">
              <i class="fa-solid fa-magnifying-glass" />
              <span>Sin resultados</span>
            </div>
            <template v-else>
              <div
                v-for="ws in planningFilteredWorkspaces"
                :key="ws._id"
                class="superadmin-dashboard__planning-item"
                :class="{ 'is-active': ws._id === planningSelectedId }"
                :style="{ '--item-color': planningColor(ws._id) }"
              >
                <button
                  class="superadmin-dashboard__planning-item-main"
                  @click="planningSelectedId = ws._id"
                >
                  <div
                    class="superadmin-dashboard__planning-item-avatar"
                    :style="{ background: planningColor(ws._id) }"
                  >
                    <img
                      v-if="ws.metaAds?.pageId"
                      :src="planningMetaUrl(ws.metaAds.pageId)"
                      :alt="ws.name"
                      @error="($event.target as HTMLImageElement).style.display = 'none'"
                    />
                    <span v-else>{{ planningInitials(ws.name) }}</span>
                  </div>
                  <div class="superadmin-dashboard__planning-item-info">
                    <span class="superadmin-dashboard__planning-item-name">{{ ws.name }}</span>
                    <span v-if="ws.metaAds?.pageId" class="superadmin-dashboard__planning-item-badge">
                      <i class="fa-brands fa-meta" /> Meta
                    </span>
                  </div>
                  <i v-if="ws._id === planningSelectedId" class="fa-solid fa-circle-check superadmin-dashboard__planning-item-check" />
                </button>
                <RouterLink
                  :to="{ name: 'AppDashboard', params: { workspaceId: ws._id } }"
                  class="superadmin-dashboard__planning-item-goto"
                  :title="`Ir al entorno de ${ws.name}`"
                >
                  <i class="fa-solid fa-arrow-up-right-from-square" />
                </RouterLink>
              </div>
            </template>
          </div>

          <div v-if="planningSelectedWorkspace" class="superadmin-dashboard__planning-active-hint">
            <div
              class="superadmin-dashboard__planning-active-avatar"
              :style="{ background: planningColor(planningSelectedWorkspace._id) }"
            >
              <img
                v-if="planningSelectedWorkspace.metaAds?.pageId"
                :src="planningMetaUrl(planningSelectedWorkspace.metaAds.pageId)"
                :alt="planningSelectedWorkspace.name"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span v-else>{{ planningInitials(planningSelectedWorkspace.name) }}</span>
            </div>
            <div>
              <span class="superadmin-dashboard__planning-active-label">Creando en</span>
              <span class="superadmin-dashboard__planning-active-name">{{ planningSelectedWorkspace.name }}</span>
            </div>
          </div>
        </aside>

        <!-- Calendar -->
        <div class="superadmin-dashboard__planning-calendar">
          <div v-if="isLoadingWorkspaces || !planningSelectedId" class="superadmin-dashboard__planning-placeholder">
            <span class="superadmin-dashboard__spinner" />
            <p>Cargando clientes…</p>
          </div>
          <PlanningCalendar
            v-else
            :key="planningSelectedId"
            :workspaceId="planningSelectedId"
            default-view="global-month"
          />
        </div>

      </div>
    </div>

    <!-- Content: Surveys Tab -->
    <div v-if="activeTab === 'surveys'" class="superadmin-dashboard__surveys">
      <div class="superadmin-dashboard__surveys-header">
        <div class="superadmin-dashboard__surveys-notice">
          <i class="fa-solid fa-earth-americas" />
          <span>Las encuestas son <strong>globales</strong> — no están vinculadas a ningún entorno ni cliente específico.</span>
        </div>
        <div class="superadmin-dashboard__surveys-filters">
          <button
            v-for="f in [{ key: 'all', label: 'Todas' }, { key: 'draft', label: 'Borrador' }, { key: 'active', label: 'Activas' }, { key: 'closed', label: 'Cerradas' }]"
            :key="f.key"
            class="superadmin-dashboard__surveys-filter-btn"
            :class="{ 'superadmin-dashboard__surveys-filter-btn--active': surveyFilterStatus === f.key }"
            @click="surveyFilterStatus = f.key as any"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="isLoadingSurveys" class="superadmin-dashboard__surveys-list">
        <div v-for="n in 5" :key="n" class="superadmin-dashboard__survey-card superadmin-dashboard__survey-card--skeleton">
          <div class="superadmin-dashboard__survey-card-left">
            <div class="skeleton-block skeleton-block--status"></div>
            <div class="superadmin-dashboard__survey-info">
              <div class="skeleton-block skeleton-block--title"></div>
              <div class="skeleton-block skeleton-block--meta"></div>
            </div>
          </div>
          <div class="superadmin-dashboard__survey-actions">
            <div class="skeleton-block skeleton-block--action"></div>
            <div class="skeleton-block skeleton-block--action"></div>
          </div>
        </div>
      </div>

      <div v-else-if="filteredDashboardSurveys.length === 0" class="superadmin-dashboard__empty-state">
        <div class="superadmin-dashboard__empty-state-icon">
          <i class="fa-solid fa-clipboard-list" />
        </div>
        <h4 class="superadmin-dashboard__empty-state-title">No hay encuestas</h4>
        <p class="superadmin-dashboard__empty-state-desc">Crea una nueva encuesta para comenzar.</p>
        <button class="superadmin-dashboard__btn-primary" @click="router.push({ name: 'SurveyNew' })">
          <i class="fa-solid fa-plus" /> Nueva encuesta
        </button>
      </div>

      <div v-else class="superadmin-dashboard__surveys-list">
        <div
          v-for="survey in filteredDashboardSurveys"
          :key="survey._id"
          class="superadmin-dashboard__survey-card"
        >
          <div class="superadmin-dashboard__survey-card-left">
            <span
              class="superadmin-dashboard__survey-status"
              :class="`superadmin-dashboard__survey-status--${survey.status}`"
            >
              {{ survey.status === 'draft' ? 'Borrador' : survey.status === 'active' ? 'Activa' : 'Cerrada' }}
            </span>
            <div class="superadmin-dashboard__survey-info">
              <span class="superadmin-dashboard__survey-title">{{ survey.title }}</span>
              <span class="superadmin-dashboard__survey-meta">
                {{ survey.questions.length }} preguntas · Creada por {{ surveyCreatorName(survey) }} · {{ formatSurveyDate(survey.createdAt) }}
              </span>
            </div>
          </div>
          <div class="superadmin-dashboard__survey-actions">
            <RouterLink
              v-if="survey.status === 'draft'"
              :to="{ name: 'SurveyEdit', params: { surveyId: survey._id } }"
              class="superadmin-dashboard__action-btn"
              title="Editar"
            >
              <i class="fa-solid fa-pen-to-square" />
            </RouterLink>
            <RouterLink
              :to="{ name: 'SurveyResults', params: { surveyId: survey._id } }"
              class="superadmin-dashboard__action-btn"
              title="Ver resultados"
            >
              <i class="fa-solid fa-chart-bar" />
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <GlobalUserModal />

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
    gap: 0.75rem;
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
      grid-template-columns: 300px 1fr;
    }

    @media (min-width: 1280px) {
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
    flex-direction: column;
    gap: 1rem;

    &--row {
      flex-direction: column; // Force column on small mobile
      align-items: stretch;
      gap: 1.5rem;

      @media (min-width: 1024px) {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    h3 {
      margin: 0;
      font-size: 1.1rem;
    }
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__search-wrap {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%; // Ensure it fills the container

    i {
      position: absolute;
      left: 0.875rem;
      font-size: 0.85rem;
      color: $text-secondary;
      pointer-events: none;
    }
  }

  &__search-input {
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
    flex-shrink: 0;
    overflow: hidden;
  }

  &__ws-icon-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  &__ws-meta-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: #1877f2;
    background: rgba(#1877f2, 0.08);
    padding: 0.1rem 0.4rem;
    border-radius: 100px;
  }

  &__ws-meta-empty {
    color: rgba($text-secondary, 0.6);
    font-style: italic;
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
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
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
    padding: 1rem;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0; // Allow content to shrink
    transition: box-shadow 0.2s ease;
    background: $white;

    &:hover {
      box-shadow: 0 4px 12px rgba($primary-dark, 0.05);
    }

    @media (min-width: 640px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
    }

    // Special handling for the 1024px - 1087px range where the panel is narrow
    @media (min-width: 1024px) and (max-width: 1150px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__user-main {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0; // Critical for truncation
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
    min-width: 0;
    overflow: hidden;
  }

  &__user-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  &__user-name {
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__role-badge {
    flex-shrink: 0;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    padding-top: 0.75rem;
    border-top: 1px solid rgba($primary-dark, 0.05);
    flex-shrink: 0;

    @media (min-width: 640px) {
      padding-top: 0;
      border-top: none;
    }

    @media (min-width: 1024px) and (max-width: 1150px) {
      padding-top: 0.75rem;
      border-top: 1px solid rgba($primary-dark, 0.05);
    }
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

    &--invite:hover {
      background: rgba(#6d28d9, 0.1);
      color: #6d28d9;
    }
  }

  // ── Resend invite modal ──────────────────────────────────
  &__resend-overlay {
    position: fixed; inset: 0; z-index: 1300;
    background: rgba(#0a192f, 0.55); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }

  &__resend-modal {
    background: $white; border-radius: 16px; width: 100%; max-width: 440px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2); padding: 1.75rem;
    display: flex; flex-direction: column; gap: 1rem;
    animation: popIn 0.3s cubic-bezier(0.16,1,0.3,1);
  }

  &__resend-header {
    display: flex; align-items: center; gap: 1rem;
    h4 { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
    p  { margin: 0; font-size: 0.8rem; color: $text-secondary; }
  }

  &__resend-icon {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: rgba(#6d28d9, 0.1); color: #6d28d9;
    display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
  }

  &__resend-close {
    margin-left: auto; width: 30px; height: 30px; border-radius: 50%; border: none;
    background: rgba($primary-dark, 0.06); color: $text-secondary;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    &:hover { background: rgba($primary-dark, 0.12); }
  }

  &__resend-desc {
    margin: 0; font-size: 0.83rem; color: $text-secondary; line-height: 1.6;
  }

  &__resend-row { display: flex; gap: 0.5rem; }

  &__resend-input {
    flex: 1; padding: 0.75rem 1rem; border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.12); font-family: inherit;
    font-size: 0.9rem; transition: all 0.2s;
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  }

  &__resend-footer {
    display: flex; justify-content: flex-end; gap: 0.75rem;
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

    &--full {
      width: 100%;
      border-radius: 0;
      padding: 1rem;
    }
  }

  &__load-more {
    border-top: 1px solid rgba($primary-dark, 0.05);
  }

  &__placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    background: radial-gradient(circle at center, rgba($primary, 0.02) 0%, transparent 70%);

    &-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 320px;
      gap: 1.25rem;
      animation: fadeIn 0.8s ease-out;

      h3 {
        margin: 0;
        font-size: 1.25rem;
        color: $primary-dark;
        font-weight: 700;
      }

      p {
        margin: 0;
        color: $text-secondary;
        line-height: 1.6;
        font-size: 0.95rem;
      }
    }

    &-orb {
      position: relative;
      width: 80px;
      height: 80px;
      background: $white;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.25rem;
      color: $primary;
      box-shadow:
        0 10px 25px rgba($primary, 0.1),
        0 4px 10px rgba($primary, 0.05);
      margin-bottom: 0.5rem;

      &::after {
        content: '';
        position: absolute;
        inset: -10px;
        border-radius: 30px;
        border: 2px dashed rgba($primary, 0.1);
        animation: rotate 20s linear infinite;
      }
    }

    &-arrow {
      position: absolute;
      bottom: -5px;
      right: -5px;
      width: 32px;
      height: 32px;
      background: $primary;
      color: $white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      border: 3px solid $white;
      box-shadow: 0 4px 10px rgba($primary, 0.3);
      animation: bounceSmall 2s infinite;
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @keyframes bounceSmall {

    0%,
    100% {
      transform: translateY(0);
    }

    50% {
      transform: translateY(-3px);
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

  // ── Tabs ──────────────────────────────────────────────────
  &__tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid rgba($primary-dark, 0.08);
    padding-bottom: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  &__tab {
    flex: none;
    white-space: nowrap;
    background: transparent;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 8px 8px 0 0;
    font-weight: 600;
    font-size: 0.82rem;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    position: relative;
    bottom: -2px;
    border-bottom: 2px solid transparent;

    @media (min-width: 640px) {
      padding: 0.75rem 1.25rem;
      font-size: 0.9rem;
      gap: 0.5rem;
    }

    &:hover {
      color: $primary-dark;
      background: rgba($primary-dark, 0.03);
    }

    &--active {
      color: $primary;
      border-bottom: 2px solid $primary;
      background: $white;
    }

    &--danger {
      &:hover {
        color: $alert-error;
        background: rgba($alert-error, 0.04);
      }
    }

    &--danger-active {
      color: $alert-error !important;
      border-bottom-color: $alert-error !important;
    }

    &--surveys {
      i { color: $primary; }
      &:hover { color: $primary; }
    }

    &--surveys-active {
      color: $primary !important;
      border-bottom-color: $primary !important;
    }
  }

  &__tab-global-tag {
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.07em;
    color: $primary;
    background: rgba($primary, 0.12);
    padding: 0.1rem 0.4rem;
    border-radius: 100px;
    border: 1px solid rgba($primary, 0.2);
  }

  // ── Superadmins Panel ─────────────────────────────────────
  &__superadmins-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__danger-alert {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: rgba($alert-error, 0.06);
    border: 1px solid rgba($alert-error, 0.2);
    border-left: 4px solid $alert-error;
    border-radius: 10px;
    color: darken($alert-error, 10%);

    &-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      padding-top: 0.1rem;
    }

    &-body {
      strong {
        display: block;
        font-size: 1rem;
        margin-bottom: 0.35rem;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.5;
        color: rgba(darken($alert-error, 20%), 0.85);
      }
    }
  }

  &__superadmin-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
  }

  &__superadmin-card {
    background: $white;
    border: 1px solid rgba($alert-error, 0.15);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 4px 16px rgba($alert-error, 0.08);
    }

    // On mobile: main info + actions separated with a border-top (same pattern as user-card)
    .superadmin-dashboard__user-main {
      padding-bottom: 1rem;
    }

    .superadmin-dashboard__user-actions {
      padding-top: 0.75rem;
      border-top: 1px solid rgba($primary-dark, 0.05);
      justify-content: flex-end;
    }

    @media (min-width: 640px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;

      .superadmin-dashboard__user-main {
        padding-bottom: 0;
      }

      .superadmin-dashboard__user-actions {
        padding-top: 0;
        border-top: none;
      }
    }

    &--self {
      border-color: rgba($primary, 0.2);
      background: rgba($primary, 0.01);
    }
  }

  &__superadmin-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba($alert-error, 0.1);
    color: $alert-error;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  &__role-badge--superadmin {
    background: rgba($alert-error, 0.1);
    color: $alert-error;
    font-size: 0.65rem;
    text-transform: uppercase;
    font-weight: 800;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  &__self-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    color: $primary;
    font-weight: 700;
    background: rgba($primary, 0.08);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
  }

  &__self-lock {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: rgba($primary-dark, 0.04);
    color: rgba($text-secondary, 0.5);
    font-size: 0.85rem;
  }

  // ── Danger Button Variant ─────────────────────────────────
  &__btn-danger-outline {
    background: transparent;
    border: 1px solid rgba($alert-error, 0.4);
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: $alert-error;
    transition: all 0.2s;

    &:hover {
      background: rgba($alert-error, 0.06);
      border-color: $alert-error;
    }
  }

  // ── Danger Modal Variant ──────────────────────────────────
  &__modal--danger {
    border-top: 4px solid $alert-error;
  }

  &__modal-header--danger {
    background: rgba($alert-error, 0.04);
    border-bottom-color: rgba($alert-error, 0.1);
  }

  &__modal-danger-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    i {
      color: $alert-error;
      font-size: 1.2rem;
    }

    h3 {
      margin: 0;
    }
  }

  &__modal-danger-warning {
    margin: 0 1.5rem;
    padding: 0.75rem 1rem;
    background: rgba($alert-error, 0.07);
    border: 1px solid rgba($alert-error, 0.15);
    border-radius: 8px;
    font-size: 0.875rem;
    color: darken($alert-error, 10%);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      font-size: 1rem;
      flex-shrink: 0;
    }
  }

  &__empty-state-icon--danger {
    background: linear-gradient(135deg, rgba($alert-error, 0.05) 0%, rgba($alert-error, 0.1) 100%);
    color: $alert-error;
    box-shadow: 0 8px 24px rgba($alert-error, 0.1);
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

  &__account-admins {
    width: 100%;
    background: $white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba($primary-dark, 0.05);
    border: 1px solid rgba($primary-dark, 0.05);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap; // Fix responsiveness
    width: 100%;

    @media (min-width: 1200px) {
      width: auto;
      flex-wrap: nowrap;
      gap: 1.5rem;
    }
  }

  &__search-wrap--all-users {
    flex: 1;
    min-width: 250px;

    @media (min-width: 640px) {
      min-width: 300px;
    }
  }

  &__user-table-container {
    width: 100%;
    overflow-x: auto;
    margin-top: 1.5rem;
  }

  &__user-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;

    th {
      text-align: left;
      padding: 1rem;
      background: rgba($primary-dark, 0.02);
      color: $text-secondary;
      font-weight: 600;
      border-bottom: 1px solid rgba($primary-dark, 0.05);
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid rgba($primary-dark, 0.03);
    }
  }

  &__user-identity {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    span {
      color: $text-secondary;
      font-size: 0.85rem;
    }
  }

  &__user-name-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;

    strong {
      color: $primary-dark;
      font-size: 0.95rem;
    }
  }

  &__internal-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.6rem;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.05) 100%);
    color: $primary;
    border: 1px solid rgba($primary, 0.2);
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.02em;

    i {
      font-size: 0.75rem;
    }
  }

  &__internal-role-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.7rem;
    background: linear-gradient(135deg, rgba($secondary, 0.1) 0%, rgba($secondary, 0.06) 100%);
    color: darken($secondary, 10%);
    border: 1px solid rgba($secondary, 0.25);
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
  }

  &__no-role {
    color: rgba($primary-dark, 0.25);
    font-size: 0.9rem;
  }

  &__user-workspaces {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__ws-tag {
    padding: 0.25rem 0.6rem;
    background: rgba($primary, 0.08);
    color: $primary;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;

    small {
      opacity: 0.7;
      font-weight: 400;
      margin-left: 0.2rem;
    }

    &--none {
      background: rgba($text-secondary, 0.1);
      color: $text-secondary;
    }
  }

  // ── Filter Drawer ──────────────────────────────────────────
  &__filter-drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: 350px;
    height: 100vh;
    background: $white;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    padding: 2rem;
    gap: 1.5rem;
  }

  &__filter-drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    padding-bottom: 1rem;

    h3 {
      font-size: 1.25rem;
      color: $primary-dark;
    }

    button {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: $text-secondary;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: $primary;
      }
    }
  }

  &__filter-drawer-body {
    flex: 1;
    overflow-y: auto;
  }

  &__filter-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: $text-secondary;
    }
  }

  &__btn-secondary {
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

  &__btn-text {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: 1px solid transparent;
    color: $text-secondary;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.5rem 0.8rem;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: rgba($alert-error, 0.05);
      color: $alert-error;
    }

    i {
      font-size: 0.9rem;
    }
  }

  // Searchable Select Styles
  &__searchable-select {
    position: relative;
    width: 100%;
  }

  &__searchable-select-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1.25rem;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 14px;
    font-size: 0.95rem;
    color: $primary-dark;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: rgba($primary, 0.4);
      background: rgba($primary, 0.01);
    }

    i {
      font-size: 0.8rem;
      color: $text-secondary;
      transition: transform 0.3s;
    }
  }

  &__searchable-select-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: $white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba($primary-dark, 0.06);
    z-index: 1100;
    overflow: hidden;
    animation: slideDown 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  }

  &__dropdown-search {
    position: relative;
    padding: 0.75rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    background: rgba($primary-dark, 0.02);

    i {
      position: absolute;
      left: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      color: $text-secondary;
      font-size: 0.85rem;
    }

    input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.25rem;
      border: 1.5px solid rgba($primary-dark, 0.08);
      border-radius: 10px;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: $primary;
        background: $white;
        box-shadow: 0 0 0 3px rgba($primary, 0.08);
      }
    }
  }

  &__dropdown-list {
    list-style: none;
    padding: 0.5rem;
    margin: 0;
    max-height: 220px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba($primary-dark, 0.1);
      border-radius: 10px;
    }

    li {
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.9rem;
      color: $text-secondary;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s;

      i {
        font-size: 0.9rem;
        opacity: 0.5;
      }

      &:hover {
        background: rgba($primary, 0.05);
        color: $primary;

        i {
          opacity: 1;
        }
      }

      &.superadmin-dashboard__dropdown-item--active {
        background: $primary;
        color: $white;
        font-weight: 600;

        i {
          color: $white;
          opacity: 1;
        }
      }

      &.superadmin-dashboard__dropdown-item--empty {
        justify-content: center;
        padding: 2rem 1rem;
        color: $text-secondary;
        font-style: italic;
        cursor: default;

        &:hover {
          background: none;
        }
      }
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // Transitions
  .fade-scale-enter-active,
  .fade-scale-leave-active {
    transition: opacity 0.2s, transform 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
  }

  .fade-scale-enter-from,
  .fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  &__filter-drawer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    border-top: 1px solid rgba($primary-dark, 0.05);
  }

  &__filter-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 8px;
    height: 8px;
    background: $alert-error;
    border-radius: 50%;
    border: 2px solid $white;
  }

  // ── Empty State ──────────────────────────────────────────
  &__empty-state {
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

  &__empty-icon {
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

  &__link {
    background: none;
    border: none;
    color: $primary;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    margin-left: 0.25rem;
  }

  // Transition
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.3s ease-out;
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateX(20px);
    opacity: 0;
  }

  // ── Planning tab ──────────────────────────────────────────
  &__tab--planning {
    &:hover {
      color: #7c3aed;
      background: rgba(124, 58, 237, 0.04);
    }
  }

  &__tab--planning-active {
    color: #7c3aed !important;
    border-bottom-color: #7c3aed !important;
  }

  &__planning {
    padding: 1.5rem 0 0;
  }

  &__planning-body {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;

    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  &__planning-sidebar {
    width: 260px;
    flex-shrink: 0;
    background: $white;
    border-radius: 16px;
    border: 1px solid rgba($primary-dark, 0.06);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: sticky;
    top: 1rem;

    @media (max-width: 900px) {
      width: 100%;
      position: static;
    }
  }

  &__planning-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.1rem 0.75rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
  }

  &__planning-sidebar-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $text-secondary;
    display: flex;
    align-items: center;
    gap: 0.45rem;

    i {
      color: $primary;
      font-size: 0.8rem;
    }
  }

  &__planning-sidebar-count {
    font-size: 0.72rem;
    font-weight: 700;
    color: $white;
    background: $primary;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    min-width: 22px;
    text-align: center;
  }

  &__planning-search {
    position: relative;
    padding: 0.65rem 0.9rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);

    i:first-child {
      position: absolute;
      left: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.75rem;
      color: $text-secondary;
      opacity: 0.5;
      pointer-events: none;
    }

    input {
      width: 100%;
      padding: 0.5rem 2rem 0.5rem 1.9rem;
      border-radius: 10px;
      border: 1.5px solid rgba($primary-dark, 0.08);
      background: rgba($primary-dark, 0.025);
      font-size: 0.83rem;
      color: $primary-dark;
      font-family: inherit;
      transition: all 0.2s;

      &::placeholder {
        color: rgba($text-secondary, 0.5);
      }

      &:focus {
        outline: none;
        border-color: $primary;
        background: $white;
        box-shadow: 0 0 0 3px rgba($primary, 0.08);
      }
    }
  }

  &__planning-search-clear {
    position: absolute;
    right: 1.35rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: $text-secondary;
    opacity: 0.5;
    font-size: 0.75rem;
    padding: 0.2rem;
    display: flex;
    align-items: center;

    &:hover {
      opacity: 1;
    }
  }

  &__planning-list {
    flex: 1;
    overflow-y: auto;
    max-height: 380px;
    padding: 0.4rem 0;
    scrollbar-width: thin;
    scrollbar-color: rgba($primary, 0.18) transparent;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba($primary, 0.18);
      border-radius: 4px;
    }

    @media (max-width: 900px) {
      max-height: 200px;
    }
  }

  &__planning-skeleton {
    height: 44px;
    margin: 0.25rem 0.6rem;
    border-radius: 10px;
    background: linear-gradient(90deg, rgba($primary-dark, 0.06) 25%, rgba($primary-dark, 0.03) 50%, rgba($primary-dark, 0.06) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }

  &__planning-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    color: $text-secondary;
    font-size: 0.8rem;
    opacity: 0.6;
    text-align: center;

    i {
      font-size: 1.1rem;
    }
  }

  &__planning-item {
    display: flex;
    align-items: center;
    margin: 0.2rem 0.5rem;
    border-radius: 10px;
    border: 1.5px solid transparent;
    transition: all 0.18s;
    overflow: hidden;

    &:hover {
      background: rgba($primary-dark, 0.025);
      border-color: rgba($primary-dark, 0.07);
    }

    &.is-active {
      background: color-mix(in srgb, var(--item-color, #{$primary}) 7%, transparent);
      border-color: color-mix(in srgb, var(--item-color, #{$primary}) 35%, transparent);
    }
  }

  &__planning-item-main {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.6rem;
    background: transparent;
    border: none;
    cursor: pointer;
    flex: 1;
    min-width: 0;
    text-align: left;
  }

  &__planning-item-avatar {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 800;
    color: $white;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
    }
  }

  &__planning-item-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
    flex: 1;
  }

  &__planning-item-name {
    font-size: 0.83rem;
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .is-active & {
      color: var(--item-color, #{$primary});
      font-weight: 700;
    }
  }

  &__planning-item-badge {
    font-size: 0.62rem;
    font-weight: 700;
    color: #0866ff;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    opacity: 0.8;

    i {
      font-size: 0.6rem;
    }
  }

  &__planning-item-check {
    font-size: 0.85rem;
    flex-shrink: 0;
    color: var(--item-color, #{$primary});
  }

  &__planning-item-goto {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    margin-right: 0.35rem;
    border-radius: 7px;
    color: $text-secondary;
    font-size: 0.7rem;
    text-decoration: none;
    transition: all 0.18s;
    flex-shrink: 0;
    opacity: 0.4;

    &:hover {
      background: rgba($primary, 0.1);
      color: $primary;
      opacity: 1;
    }
  }

  &__planning-active-hint {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.85rem 1rem;
    border-top: 1px solid rgba($primary-dark, 0.06);
    background: rgba($primary-dark, 0.015);
  }

  &__planning-active-avatar {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 800;
    color: $white;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 7px;
    }
  }

  &__planning-active-label {
    display: block;
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $text-secondary;
    font-weight: 700;
  }

  &__planning-active-name {
    display: block;
    font-size: 0.82rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__planning-calendar {
    flex: 1;
    min-width: 0;
  }

  &__planning-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 6rem 0;
    color: $text-secondary;
    font-size: 0.9rem;
  }

  // ── Surveys Tab ───────────────────────────────────────────
  &__surveys {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__surveys-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    @media (min-width: 640px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  &__surveys-notice {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba($primary, 0.06);
    border: 1px solid rgba($primary, 0.15);
    border-radius: 10px;
    font-size: 0.875rem;
    color: $primary-dark;

    i { color: $primary; font-size: 1rem; flex-shrink: 0; }
  }

  &__surveys-filters {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__surveys-filter-btn {
    padding: 0.45rem 1rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 100px;
    background: $white;
    font-size: 0.8rem;
    font-weight: 600;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { border-color: $primary; color: $primary; }

    &--active {
      background: $primary;
      border-color: $primary;
      color: $white;
    }
  }

  &__surveys-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__survey-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.06);
    border-radius: 12px;
    transition: box-shadow 0.2s, border-color 0.2s;

    &:hover {
      border-color: rgba($primary, 0.15);
      box-shadow: 0 4px 16px rgba($primary-dark, 0.04);
    }
  }

  &__survey-card-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  }

  &__survey-status {
    flex-shrink: 0;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 0.25rem 0.7rem;
    border-radius: 100px;

    &--draft {
      background: rgba($text-secondary, 0.1);
      color: $text-secondary;
    }
    &--active {
      background: rgba($alert-success, 0.1);
      color: $alert-success;
    }
    &--closed {
      background: rgba($alert-error, 0.08);
      color: $alert-error;
    }
  }

  &__survey-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  &__survey-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__survey-meta {
    font-size: 0.78rem;
    color: $text-secondary;
  }

  &__survey-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  &__survey-card--skeleton {
    cursor: default;
    pointer-events: none;
    border-color: rgba($primary-dark, 0.04);
    position: relative;
    overflow: hidden;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        rgba($white, 0) 0,
        rgba($white, 0.3) 50%,
        rgba($white, 0) 100%
      );
      animation: shimmer 2s infinite;
    }
  }

  .skeleton-block {
    background: rgba($primary-dark, 0.05);
    border-radius: 4px;

    &--status { width: 60px; height: 18px; border-radius: 100px; flex-shrink: 0; }
    &--title { width: 220px; height: 16px; margin-bottom: 0.25rem; }
    &--meta { width: 350px; height: 12px; }
    &--action { width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0; }
  }
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

@keyframes popIn {
  from { transform: scale(0.9) translateY(10px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
