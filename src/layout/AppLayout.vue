<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { workspaceService } from '@/services/workspace.service'
import { useConfirm } from '@/composables/useConfirm'
import type { Workspace } from '@/types'
import { getWorkspaceImage } from '@/utils/workspaceImage'
import logoDark from '@/assets/logos/bakano-light.png'
import SoundToggleButton from '@/components/common/SoundToggleButton.vue'


const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const confirm = useConfirm()

const workspaces = ref<Workspace[]>([])
const workspacesLoaded = ref(false)
const isDropdownOpen = ref(false)
const isSidebarOpen = ref(false)
const wsSearch = ref('')
const showInvasiveOnboardingModal = ref(false)
const showWsSearch = ref(false)
const isWsSearching = ref(false)

const INTERNAL_ROLE_LABELS: Record<string, string> = {
  director: 'Director',
  estratega: 'Estratega',
  project_manager: 'Project Manager',
  content_manager: 'Content Manager',
  account_manager: 'Account Manager',
  community_manager: 'Community Manager',
  productor: 'Productor',
  asistente_produccion: 'Asistente de Producción',
  editor: 'Editor',
  disenador: 'Diseñador',
  copywriter: 'Copywriter',
  analista: 'Analista',
  desarrollador: 'Desarrollador',
  trafficker: 'Trafficker',
  sales_executive: 'Ejecutivo de Ventas',
}

const userRoleLabel = computed(() => {
  if (userStore.role === 'superadmin') return 'Superadmin'
  if (userStore.isInternal && userStore.internalRole) {
    return INTERNAL_ROLE_LABELS[userStore.internalRole] || userStore.internalRole
  }
  const wsRole = activeWorkspace.value?.userRole || userStore.role
  return wsRole === 'admin' ? 'Admin / Owner' : 'Colaborador'
})

const filteredDropdownWorkspaces = computed(() => {
  const q = wsSearch.value.toLowerCase().trim()
  if (!q) return workspaces.value
  return workspaces.value.filter(w => w.name.toLowerCase().includes(q))
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(wsSearch, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchWorkspaces()
  }, 300)
})

const GLOBAL_ROUTE_NAMES = ['AdminWorkspaces', 'InternalPlanning', 'ClientsGlobal', 'SurveyList', 'SurveyNew', 'SurveyEdit', 'SurveyResults', 'PMCalendar', 'TeamKpis', 'TraffickerDashboard', 'TraffickerWorkspace', 'SalesExecutiveDashboard', 'SuperadminMetaIntegrations']


const isGlobalView = computed(() => GLOBAL_ROUTE_NAMES.includes(route.name as string))

const isSurveyRoute = computed(() =>
  ['SurveyList', 'SurveyNew', 'SurveyEdit', 'SurveyResults'].includes(route.name as string)
)

const currentWorkspaceId = computed(() => {
  if (isGlobalView.value) return null
  return route.params.workspaceId as string || userStore.workspaceId || workspaces.value[0]?._id
})

const activeWorkspace = computed(() => {
  return workspaces.value.find(w => w._id === currentWorkspaceId.value)
})

const isSubAccountMode = computed(() => {
  if (!userStore.isInternal && userStore.role !== 'superadmin') {
    return true
  }
  // Robust check for sub-account mode using path, in case params are delayed on direct load
  return route.path.includes('/workspaces/') && !isGlobalView.value
})

const globalBackRoute = computed(() => {
  if (userStore.role === 'superadmin') {
    return { name: 'AdminWorkspaces' }
  }
  if (userStore.isInternal) {
    if (userStore.internalRole === 'trafficker') {
      return { name: 'TraffickerDashboard' }
    }
    if (userStore.internalRole === 'sales_executive') {
      return { name: 'SalesExecutiveDashboard' }
    }
    return { name: 'ClientsGlobal' }
  }
  return null
})

const isWorkspaceDeactivated = computed(() => {
  if (!workspacesLoaded.value) return false
  if (userStore.isInternal || userStore.role === 'superadmin') return false
  const wsId = route.params.workspaceId as string
  if (!wsId) return false
  return !workspaces.value.some(w => w._id === wsId)
})

const isBrandProfileCompleted = computed(() => {
  if (userStore.brandProfileCompleted) return true
  const bp = activeWorkspace.value?.brandProfile
  if (!bp) return false

  const checks = [
    bp.descripcion?.trim(),
    bp.tipoNegocio,
    bp.publicoObjetivo?.trim(),
    bp.propuestaValor?.trim(),
    bp.tono?.trim(),
    bp.productosServicios?.trim(),
    bp.problemaResuelto?.trim(),
    bp.trafficDirection,
    bp.trafficLink?.trim(),
  ]
  return checks.filter(Boolean).length === 9
})

const isOnboardingCompleted = computed(() => {
  if (userStore.isInternal || userStore.role === 'superadmin') return true
  const st = activeWorkspace.value?.onboardingStatus
  if (!st) return false
  return st.meetingScheduled
})

const isContractPending = computed(() => {
  if (userStore.isInternal || userStore.role === 'superadmin') return false
  const st = activeWorkspace.value?.onboardingStatus
  if (!st) return true
  return !st.contractSubmitted
})

async function fetchWorkspaces() {
  isWsSearching.value = true
  try {
    const limit = (userStore.role === 'superadmin' || userStore.isInternal) ? 100 : 10
    const res = await workspaceService.listWorkspaces({
      limit,
      search: wsSearch.value.trim() || undefined
    })

    let list = res.workspaces || []

    // Ensure the currently active workspace is in the list
    const activeId = route.params.workspaceId as string
    if (activeId && !list.some(w => w._id === activeId)) {
      try {
        const { workspace: activeWs } = await workspaceService.getWorkspace(activeId)
        if (activeWs) {
          list.push(activeWs)
        }
      } catch (err) {
        console.error('Error fetching active workspace for sidebar', err)
      }
    }

    workspaces.value = list
    if (!wsSearch.value.trim()) {
      showWsSearch.value = list.length > 5
    }
  } catch (e) {
    console.error('Error fetching workspaces for sidebar', e)
  } finally {
    workspacesLoaded.value = true
    isWsSearching.value = false
  }
}

onMounted(async () => {
  await fetchWorkspaces()

  if (isContractPending.value && currentWorkspaceId.value) {
    showInvasiveOnboardingModal.value = true
  }

  userStore.fetchPendingSurveys()
  notificationStore.fetchUnreadCount()
  document.addEventListener('click', closeDropdownOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOnClickOutside)
})

function toggleDropdown(e: Event) {
  e.stopPropagation()
  isDropdownOpen.value = !isDropdownOpen.value
}

function selectWorkspace(ws: Workspace) {
  isDropdownOpen.value = false
  wsSearch.value = ''
  router.push({ name: 'BillingRoas', params: { workspaceId: ws._id } })
}

function closeDropdownOnClickOutside(e: Event) {
  const target = e.target as HTMLElement
  if (!target.closest('.app-layout__ws-selector')) {
    isDropdownOpen.value = false
    wsSearch.value = ''
  }
}

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const parent = target.parentElement
  if (parent) {
    parent.classList.add('app-layout__ws-avatar--fallback')
  }
}

async function logout(): Promise<void> {
  const isConfirmed = await confirm.confirm({
    title: '¿Cerrar sesión?',
    message: 'Tendrás que iniciar sesión nuevamente para acceder a la plataforma.',
    confirmText: 'Sí, salir',
    cancelText: 'Cancelar',
    requireHold: true
  })

  if (isConfirmed) {
    userStore.clear()
    router.push({ name: 'AuthLogin' })
  }
}

// Close sidebar on navigation (mobile)
router.afterEach(() => {
  isSidebarOpen.value = false
})

// Trigger invasive modal again on every route change if onboarding is incomplete
watch(() => route.fullPath, () => {
  if (workspacesLoaded.value && isContractPending.value && currentWorkspaceId.value) {
    showInvasiveOnboardingModal.value = true
  }
})

// Fetch the active workspace if it's not in the loaded list
watch(() => route.params.workspaceId, async (newId) => {
  if (newId && !workspaces.value.some(w => w._id === newId)) {
    await fetchWorkspaces()
  }
})

</script>

<template>
  <div class="app-layout">
    <!-- MOBILE HEADER -->
    <header class="app-layout__mobile-header">
      <button class="app-layout__menu-toggle" @click="isSidebarOpen = true">
        <i class="fa-solid fa-bars" />
      </button>
      <img :src="logoDark" alt="Bakano" class="app-layout__logo-mobile" width="100" />
      <SoundToggleButton />
    </header>

    <!-- BACKDROP -->
    <Transition name="fade">
      <div v-if="isSidebarOpen" class="app-layout__backdrop" @click="isSidebarOpen = false" />
    </Transition>

    <aside class="app-layout__sidebar" :class="{ 'app-layout__sidebar--open': isSidebarOpen }">
      <div class="app-layout__sidebar-top">
        <div class="app-layout__sidebar-header">
          <div class="app-layout__brand">
            <img :src="logoDark" alt="Bakano" class="app-layout__logo" width="110" height="28" />
          </div>
          <SoundToggleButton tone="onDark" class="app-layout__sound-toggle" />
          <button class="app-layout__close-sidebar" @click="isSidebarOpen = false">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- WORKSPACE SELECTOR -->
        <div class="app-layout__ws-selector">
          <button 
            v-if="isSubAccountMode"
            class="app-layout__ws-button"
            :class="{ 'app-layout__ws-button--interactive': workspacesLoaded }"
            :disabled="!workspacesLoaded"
            @click="toggleDropdown"
          >
            <div class="app-layout__ws-avatar" :class="{ 'app-layout__ws-avatar--fallback': !activeWorkspace }">
              <template v-if="activeWorkspace">
                <img 
                  v-if="getWorkspaceImage(activeWorkspace)" 
                  :src="getWorkspaceImage(activeWorkspace)!" 
                  alt="Logo" 
                  class="app-layout__ws-page-img"
                  @error="handleImgError"
                />
                <span v-else>{{ activeWorkspace.name.substring(0, 2).toUpperCase() }}</span>
              </template>
              <template v-else-if="!workspacesLoaded || isWsSearching">
                <i class="fa-solid fa-spinner fa-spin" />
              </template>
              <template v-else>
                <i class="fa-solid fa-link-slash" />
              </template>
            </div>
            <div class="app-layout__ws-info">
              <span class="app-layout__ws-label">Entorno Actual</span>
              <span class="app-layout__ws-name">
                <template v-if="activeWorkspace">{{ activeWorkspace.name }}</template>
                <template v-else-if="!workspacesLoaded || isWsSearching">Cargando entorno...</template>
                <template v-else>Acceso Denegado</template>
              </span>
            </div>
            <i class="fa-solid fa-chevron-down app-layout__ws-chevron" :class="{ 'app-layout__ws-chevron--open': isDropdownOpen }" />
          </button>

          <button
            v-else
            class="app-layout__ws-button"
            :class="{ 'app-layout__ws-button--interactive app-layout__ws-button--global': userStore.isInternal || userStore.role === 'superadmin' }"
            :disabled="!userStore.isInternal && userStore.role !== 'superadmin'"
            @click="toggleDropdown"
          >
            <div class="app-layout__ws-avatar app-layout__ws-avatar--global">
              <i class="fa-solid fa-earth-americas" />
            </div>
            <div class="app-layout__ws-info">
              <span class="app-layout__ws-label">Control Central</span>
              <span class="app-layout__ws-name">Vista Global</span>
            </div>
            <i v-if="userStore.isInternal || userStore.role === 'superadmin'" class="fa-solid fa-chevron-down app-layout__ws-chevron" :class="{ 'app-layout__ws-chevron--open': isDropdownOpen }" />
          </button>

          <Transition name="dropdown-fade">
            <div v-if="isDropdownOpen" class="app-layout__ws-dropdown">
              <RouterLink
                v-if="globalBackRoute && activeWorkspace"
                :to="globalBackRoute"
                class="app-layout__ws-option app-layout__ws-option--global-switch"
                @click="isDropdownOpen = false"
              >
                <div class="app-layout__ws-avatar app-layout__ws-avatar--global app-layout__ws-avatar--sm">
                  <i class="fa-solid fa-earth-americas" />
                </div>
                <span class="app-layout__ws-option-name">Vista Global (Agencia)</span>
              </RouterLink>
              <div v-if="globalBackRoute && activeWorkspace" class="app-layout__nav-divider" style="margin: 4px 0;" />
              <div v-if="showWsSearch" class="app-layout__ws-search">
                <i v-if="isWsSearching" class="fa-solid fa-spinner fa-spin" />
                <i v-else class="fa-solid fa-magnifying-glass" />
                <input
                  v-model="wsSearch"
                  type="text"
                  placeholder="Buscar cliente…"
                  class="app-layout__ws-search-input"
                  @click.stop
                />
              </div>
              <div v-if="isWsSearching" class="app-layout__ws-loading-state">
                <i class="fa-solid fa-spinner fa-spin" />
                <span>Buscando entornos...</span>
              </div>
              <div v-else-if="filteredDropdownWorkspaces.length === 0" class="app-layout__ws-no-results">
                Sin resultados
              </div>
              <template v-else>
                <button
                  v-for="ws in filteredDropdownWorkspaces"
                  :key="ws._id"
                  class="app-layout__ws-option"
                  :class="{ 'app-layout__ws-option--active': ws._id === activeWorkspace?._id }"
                  @click="selectWorkspace(ws)"
                >
                   <div class="app-layout__ws-avatar app-layout__ws-avatar--sm">
                     <img
                       v-if="getWorkspaceImage(ws)"
                       :src="getWorkspaceImage(ws)!"
                       alt="Logo"
                       class="app-layout__ws-page-img"
                       @error="handleImgError"
                     />
                     <span v-else>{{ ws.name.substring(0, 2).toUpperCase() }}</span>
                   </div>
                   <span class="app-layout__ws-option-name">{{ ws.name }}</span>
                   <i v-if="ws._id === activeWorkspace?._id" class="fa-solid fa-check" />
                </button>
              </template>
            </div>
          </Transition>
        </div>

        <!-- Switch to Agency View Button -->
        <div v-if="isSubAccountMode && globalBackRoute" class="app-layout__agency-switch">
          <RouterLink :to="globalBackRoute" class="app-layout__agency-switch-btn">
            <i class="fa-solid fa-arrow-left" />
            <span>Volver a Control Central</span>
          </RouterLink>
        </div>
      </div>

      <nav class="app-layout__nav">
        <!-- ========================================== -->
        <!-- AGENCY VIEW LINKS (Visible when not in Sub-Account mode) -->
        <!-- ========================================== -->
        <template v-if="!isSubAccountMode">
          <!-- Control Central / Vista Global (Superadmin) -->
          <RouterLink
            v-if="userStore.role === 'superadmin'"
            class="app-layout__nav-item"
            :to="{ name: 'AdminWorkspaces' }"
          >
            <i class="fa-solid fa-grid-2" aria-hidden="true" />
            <span>Vista Global (Superadmin)</span>
          </RouterLink>

          <RouterLink
            v-if="userStore.role === 'superadmin'"
            class="app-layout__nav-item"
            :to="{ name: 'SuperadminMetaIntegrations' }"
          >
            <i class="fa-brands fa-meta" aria-hidden="true" />
            <span>Integración Meta</span>
            <span class="app-layout__nav-tag">GLOBAL</span>
          </RouterLink>

          <!-- Métricas & Alertas -->
          <RouterLink
            v-if="userStore.role === 'superadmin'"
            class="app-layout__nav-item"
            :to="{ name: 'SuperadminPublicMetrics' }"
          >
            <i class="fa-solid fa-chart-bar" aria-hidden="true" />
            <span>Métricas & Alertas</span>
            <span class="app-layout__nav-tag">API</span>
          </RouterLink>

          <!-- API Keys -->
          <RouterLink
            v-if="userStore.role === 'superadmin'"
            class="app-layout__nav-item"
            :to="{ name: 'SuperadminApiKeys' }"
          >
            <i class="fa-solid fa-key" aria-hidden="true" />
            <span>API Keys</span>
            <span class="app-layout__nav-tag">API</span>
          </RouterLink>

          <div class="app-layout__nav-section-label">Herramientas globales</div>

          <!-- Global planner — internal team only -->
          <RouterLink
            v-if="userStore.isInternal"
            class="app-layout__nav-item"
            :to="{ name: 'InternalPlanning' }"
          >
            <i class="fa-solid fa-calendar-range" aria-hidden="true" />
            <span>Planificador Global</span>
            <span class="app-layout__nav-tag">GLOBAL</span>
          </RouterLink>

          <!-- Clients global view — internal team only -->
          <RouterLink
            v-if="userStore.isInternal"
            class="app-layout__nav-item"
            :to="{ name: 'ClientsGlobal' }"
          >
            <i class="fa-solid fa-users" aria-hidden="true" />
            <span>Vista de Clientes</span>
            <span class="app-layout__nav-tag">GLOBAL</span>
          </RouterLink>

          <!-- Meetings calendar — internal team only -->
          <RouterLink
            v-if="userStore.isInternal"
            class="app-layout__nav-item"
            :to="{ name: 'PMCalendar' }"
          >
            <i class="fa-solid fa-handshake" aria-hidden="true" />
            <span>Reuniones</span>
            <span class="app-layout__nav-tag">GLOBAL</span>
          </RouterLink>

          <!-- Trafficker panel — trafficker + project_manager + superadmin -->
          <RouterLink
            v-if="(userStore.isInternal && ['trafficker', 'project_manager'].includes(userStore.internalRole || '')) || userStore.role === 'superadmin'"
            class="app-layout__nav-item"
            :to="{ name: 'TraffickerDashboard' }"
          >
            <i class="fa-solid fa-bullseye-arrow" aria-hidden="true" />
            <span>Panel Trafficker</span>
            <span class="app-layout__nav-tag">ADS</span>
          </RouterLink>

          <RouterLink
            v-if="userStore.internalRole === 'sales_executive' || userStore.role === 'superadmin'"
            class="app-layout__nav-item"
            :to="{ name: 'SalesExecutiveDashboard' }"
          >
            <i class="fa-solid fa-handshake" aria-hidden="true" />
            <span>Próximas asesorías</span>
            <span class="app-layout__nav-tag">VENTAS</span>
          </RouterLink>

          <!-- Team KPIs — superadmin and project_manager only -->
          <RouterLink
            v-if="userStore.role === 'superadmin' || (userStore.isInternal && userStore.internalRole === 'project_manager')"
            class="app-layout__nav-item"
            :to="{ name: 'TeamKpis' }"
          >
            <i class="fa-solid fa-chart-bar" aria-hidden="true" />
            <span>KPIs del Equipo</span>
            <span class="app-layout__nav-tag">GLOBAL</span>
          </RouterLink>

          <!-- Surveys — internal + superadmin (global tool) -->
          <RouterLink
            v-if="userStore.isInternal || userStore.role === 'superadmin'"
            class="app-layout__nav-item"
            :to="{ name: 'SurveyList' }"
          >
            <i class="fa-solid fa-clipboard-list" aria-hidden="true" />
            <span>Encuestas</span>
            <span class="app-layout__nav-tag">GLOBAL</span>
          </RouterLink>
        </template>

        <!-- ========================================== -->
        <!-- SUB-ACCOUNT VIEW LINKS (Visible when in Sub-Account mode) -->
        <!-- ========================================== -->
        <template v-else>
          <!-- Informativo CRM (solo clientes) -->
          <div v-if="currentWorkspaceId && !userStore.isInternal && userStore.role !== 'superadmin'" class="app-layout__crm-notice">
            <div class="app-layout__crm-notice-header">
              <i class="fa-solid fa-chart-pie" />
              <strong>Analítica en el CRM</strong>
            </div>
            <p class="app-layout__crm-notice-body">
              Tus tableros y analítica avanzada ahora viven en 
              <a href="https://crm.bakano.ec" target="_blank" rel="noopener noreferrer">crm.bakano.ec</a>. 
              Esta plataforma se mantiene para tu <strong>operativa diaria</strong>.
            </p>
            
            <div class="app-layout__crm-notice-contact">
              <span class="app-layout__crm-notice-label">¿Ayuda con el CRM?</span>
              <div class="app-layout__crm-notice-actions">
                <a href="https://api.leadconnectorhq.com/widget/bookings/soporte-tecnico-crm" target="_blank" rel="noopener noreferrer" class="app-layout__crm-btn app-layout__crm-btn--primary">
                  <i class="fa-solid fa-calendar-plus" /> Agendar
                </a>
                <div class="app-layout__crm-notice-links">
                  <a href="https://wa.me/593939380957" target="_blank" rel="noopener noreferrer" class="app-layout__crm-link" title="Soporte WhatsApp">
                    <i class="fa-brands fa-whatsapp" />
                  </a>
                  <a href="mailto:cjurado@bakano.ec" class="app-layout__crm-link" title="Correo de soporte">
                    <i class="fa-solid fa-envelope" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- 1. Facturación & ROAS — superadmin, admin y colaborador externo -->
          <RouterLink
            v-if="currentWorkspaceId && (userStore.role === 'superadmin' || !userStore.isInternal)"
            class="app-layout__nav-item"
            :to="{ name: 'BillingRoas', params: { workspaceId: currentWorkspaceId } }"
          >
            <i class="fa-solid fa-chart-column" aria-hidden="true" />
            <span>Facturación & ROAS</span>
          </RouterLink>

          <!-- 2. Sucursales (Puntos de venta) -->
          <RouterLink v-if="currentWorkspaceId" class="app-layout__nav-item" :to="{ name: 'WorkspaceBranches', params: { workspaceId: currentWorkspaceId } }">
            <i class="fa-solid fa-store" aria-hidden="true" />
            <span>Sucursales</span>
          </RouterLink>

          <RouterLink
            v-if="currentWorkspaceId && (userStore.role === 'superadmin' || userStore.internalRole === 'content_manager')"
            class="app-layout__nav-item"
            :to="{ name: 'WorkspaceMetaDashboard', params: { workspaceId: currentWorkspaceId } }"
          >
            <i class="fa-brands fa-meta" aria-hidden="true" />
            <span>Métricas Meta</span>
          </RouterLink>

          <!-- 3. Planificación -->
          <RouterLink v-if="currentWorkspaceId" class="app-layout__nav-item" :to="{ name: 'AppPlanning', params: { workspaceId: currentWorkspaceId } }">
            <i class="fa-solid fa-calendar-days" aria-hidden="true" />
            <span>Planificación</span>
          </RouterLink>

          <!-- 3b. Builder Pro de Contenido — equipo interno, no clientes.
               Expone métricas comparadas, aprendizajes y el feed del agente:
               material de trabajo del equipo de contenido, no del cliente. -->
          <RouterLink
            v-if="currentWorkspaceId && (userStore.isInternal || userStore.role === 'superadmin')"
            class="app-layout__nav-item"
            :to="{ name: 'WorkspaceContentBuilder', params: { workspaceId: currentWorkspaceId } }"
          >
            <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
            <span>Builder Pro</span>
            <span class="app-layout__nav-tag app-layout__nav-tag--purple">PRO</span>
          </RouterLink>

          <!-- Mi Equipo (Client assigned team) -->
          <RouterLink
            v-if="currentWorkspaceId"
            class="app-layout__nav-item"
            :to="{ name: 'WorkspaceTeam', params: { workspaceId: currentWorkspaceId } }"
          >
            <i class="fa-solid fa-users-viewfinder" aria-hidden="true" />
            <span>Mi Equipo</span>
          </RouterLink>

          <!-- Perfil de Marca — IA para community/content -->
          <RouterLink
            v-if="currentWorkspaceId"
            class="app-layout__nav-item"
            :to="{ name: 'WorkspaceBrandProfile', params: { workspaceId: currentWorkspaceId } }"
          >
            <i class="fa-solid fa-palette" aria-hidden="true" />
            <span>Perfil de Marca</span>
            <span class="app-layout__nav-tag">IA</span>
          </RouterLink>

          <!-- Recursos de Marca — logo + línea gráfica para content managers y editores -->
          <RouterLink
            v-if="currentWorkspaceId"
            class="app-layout__nav-item"
            :to="{ name: 'WorkspaceResources', params: { workspaceId: currentWorkspaceId } }"
          >
            <i class="fa-solid fa-folder-open" aria-hidden="true" />
            <span>Recursos</span>
          </RouterLink>

          <RouterLink v-if="currentWorkspaceId" class="app-layout__nav-item" :to="{ name: 'WorkspaceLegal', params: { workspaceId: currentWorkspaceId } }">
            <i class="fa-solid fa-file-contract" aria-hidden="true" />
            <span>Legalidades</span>
          </RouterLink>

          <!-- Surveys — clients (My Surveys) -->
          <RouterLink
            v-if="currentWorkspaceId && (!userStore.isInternal || userStore.role === 'superadmin')"
            class="app-layout__nav-item"
            :to="{ name: 'MySurveys', params: { workspaceId: currentWorkspaceId } }"
          >
            <div class="app-layout__nav-icon-container">
              <i class="fa-solid fa-clipboard-check" aria-hidden="true" />
              <span v-if="userStore.pendingSurveysCount > 0" class="app-layout__nav-badge">
                {{ userStore.pendingSurveysCount }}
              </span>
            </div>
            <span>Mis Encuestas</span>
          </RouterLink>

          <!-- Expert agendas — clients only -->
          <RouterLink
            v-if="currentWorkspaceId && (!userStore.isInternal || userStore.role === 'superadmin')"
            class="app-layout__nav-item"
            :to="{ name: 'AppBooking', params: { workspaceId: currentWorkspaceId } }"
          >
            <i class="fa-solid fa-calendar-plus" aria-hidden="true" />
            <span>Agenda y Asesorías</span>
            <span class="app-layout__nav-tag">NUEVO</span>
          </RouterLink>
        </template>
      </nav>

      <div class="app-layout__sidebar-bottom">
        <!-- Settings — client mode only -->
        <RouterLink
          v-if="currentWorkspaceId && isSubAccountMode"
          class="app-layout__nav-item"
          :to="{ name: 'AppSettings', params: { workspaceId: currentWorkspaceId } }"
        >
          <i class="fa-solid fa-gear" aria-hidden="true" />
          <span>Configuración</span>
        </RouterLink>

        <!-- Notifications — all authenticated users -->
        <RouterLink
          class="app-layout__nav-item"
          :to="{ name: 'Notifications' }"
        >
          <div class="app-layout__nav-icon-container">
            <i class="fa-solid fa-bell" aria-hidden="true" />
            <span v-if="notificationStore.unreadCount > 0" class="app-layout__nav-badge">
              {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
            </span>
          </div>
          <span>Notificaciones</span>
        </RouterLink>

        <div class="app-layout__footer">
        <div class="app-layout__user">
          <div class="app-layout__user-avatar" aria-hidden="true">
            <img v-if="userStore.photoUrl" :src="userStore.photoUrl" :alt="userStore.name || 'User'" />
            <span v-else>{{ userStore.name?.charAt(0).toUpperCase() || userStore.email?.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="app-layout__user-info">
            <span class="app-layout__user-email">{{ userStore.name || userStore.email }}</span>
            <span class="app-layout__user-role">{{ userRoleLabel }}</span>
          </div>
        </div>
        <button class="app-layout__logout" type="button" @click="logout" aria-label="Cerrar sesión" title="Cerrar sesión">
          <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
        </button>
      </div>
      </div>
    </aside>

    <main class="app-layout__main">
      <div
        v-if="!userStore.isInternal && userStore.role !== 'superadmin' && isContractPending && currentWorkspaceId"
        class="app-layout__onboarding-banner"
      >
        <i class="fa-solid fa-file-signature" />
        <div class="app-layout__onboarding-banner-text">
          <strong>Actualización de Términos y Condiciones</strong>
          <span>Por favor, revisa y acepta los términos actualizados con tu firma. Este paso es importante para tu servicio.</span>
        </div>
        <RouterLink :to="`/onboarding/${currentWorkspaceId}`" class="app-layout__onboarding-btn">
          Revisar y Firmar
        </RouterLink>
      </div>
      <div
        v-else-if="!userStore.isInternal && userStore.role !== 'superadmin' && !isBrandProfileCompleted && currentWorkspaceId"
        class="app-layout__onboarding-banner"
      >
        <i class="fa-solid fa-circle-exclamation" />
        <div class="app-layout__onboarding-banner-text">
          <strong>Completa tu perfil de marca</strong>
          <span>Para activar todas las funcionalidades de la plataforma, necesitas completar la información de tu negocio.</span>
        </div>
        <RouterLink :to="`/app/workspaces/${currentWorkspaceId}/brand-profile`" class="app-layout__onboarding-btn">
          Completar ahora
        </RouterLink>
      </div>
      <div v-if="isWorkspaceDeactivated && route.name !== 'VideoPlanningClient' && route.name !== 'VideoPlanning'" class="app-layout__deactivated">
        <div class="app-layout__deactivated-card">
          <div class="app-layout__deactivated-icon">🚧</div>
          <h2 class="app-layout__deactivated-title">Entorno no disponible</h2>
          <p class="app-layout__deactivated-body">
            No tienes acceso a este entorno o ha sido desactivado.<br>
            Verifica el enlace o comunícate con soporte.
          </p>
          <div class="app-layout__deactivated-actions">
            <button
              class="app-layout__deactivated-btn app-layout__deactivated-btn--logout"
              @click="logout"
            >
              <i class="fa-solid fa-arrow-right-from-bracket" />
              Cerrar sesión y cambiar de cuenta
            </button>
            <a
              href="https://wa.me/593939380957"
              target="_blank"
              rel="noopener noreferrer"
              class="app-layout__deactivated-btn app-layout__deactivated-btn--whatsapp"
            >
              <i class="fa-brands fa-whatsapp" />
              Contactar a soporte
            </a>
          </div>
        </div>
      </div>
      <RouterView v-else :key="$route.fullPath" />
    </main>

    <!-- Invasive Onboarding Modal -->
    <Transition name="fade">
      <div v-if="showInvasiveOnboardingModal" class="app-layout__invasive-backdrop">
        <div class="app-layout__invasive-modal">
          <div class="app-layout__invasive-icon">
            <i class="fa-solid fa-file-signature" />
          </div>
          <h2 class="app-layout__invasive-title">Firma Requerida</h2>
          <p class="app-layout__invasive-text">
            Hemos actualizado nuestros términos y condiciones. Por favor, tómate un minuto para revisarlos y firmar el nuevo acuerdo. Es muy importante para asegurar la continuidad de tu servicio.
          </p>
          <div class="app-layout__invasive-actions">
            <RouterLink :to="`/onboarding/${currentWorkspaceId}`" class="app-layout__invasive-btn-primary" @click="showInvasiveOnboardingModal = false">
              Revisar y Firmar Ahora
            </RouterLink>
            <button class="app-layout__invasive-btn-secondary" @click="showInvasiveOnboardingModal = false">
              Hacerlo más tarde
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f7f5;

  @media (min-width: 768px) {
    flex-direction: row;
  }

  // ── Mobile Header ──────────────────────────────────────
  &__mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background-color: $primary-dark;
    position: sticky;
    top: 0;
    z-index: 100;
    height: 60px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

    @media (min-width: 768px) {
      display: none;
    }
  }

  &__menu-toggle {
    background: none;
    border: none;
    color: $white;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__logo-mobile {
    height: 22px;
    width: auto;
  }

  &__mobile-spacer {
    width: 40px; // Balance the hamburger
  }

  // ── Backdrop ───────────────────────────────────────────
  &__backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 999;

    @media (min-width: 768px) {
      display: none;
    }
  }

  // ── Sidebar ────────────────────────────────────────────
  &__sidebar {
    display: flex;
    flex-direction: column;
    width: 280px;
    flex-shrink: 0;
    background-color: $primary-dark;
    padding: 0;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1000;
    overflow: hidden;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    @media (min-width: 768px) {
      position: sticky;
      transform: none;
      width: 270px;
      height: 100vh;
    }

    &--open {
      transform: translateX(0);
    }
  }

  &__sidebar-top {
    flex-shrink: 0;
    padding: 1.5rem 1rem 0;
  }

  &__sidebar-bottom {
    flex-shrink: 0;
    padding: 0 1rem 1.25rem;
    border-top: 1px solid rgba($white, 0.07);
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    .app-layout__nav-item {
      border-radius: 0 8px 8px 0;
    }
  }

  &__sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;

    @media (min-width: 768px) {
      .app-layout__close-sidebar {
        display: none;
      }
    }
  }

  // Sits at the far right of the sidebar header, opposite the brand.
  &__sound-toggle {
    margin-left: auto;
  }

  &__close-sidebar {
    background: rgba($white, 0.1);
    border: none;
    color: $white;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: rgba($white, 0.2);
    }
  }

  &__brand {
    padding: 0.5rem 0.75rem 1.2rem;
  }

  &__logo {
    height: 26px;
    width: auto;
    display: block;
  }

  // ── Workspace Selector ─────────────────────────────────
  &__ws-selector {
    position: relative;
    margin-bottom: 1.5rem;
    padding: 0 0.5rem;
  }

  &__ws-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    background: rgba($white, 0.05);
    border: 1px solid rgba($white, 0.1);
    padding: 0.75rem;
    border-radius: 10px;
    text-align: left;
    color: $white;
    transition: all 0.2s;

    &--interactive {
      background: rgba($white, 0.03);
      border: 1px solid rgba($white, 0.05);
      cursor: pointer;

      &:hover {
        background: rgba($white, 0.06);
        border-color: rgba($white, 0.1);
      }
    }

    &--global {
      background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.02) 100%);
      border: 1px solid rgba($primary, 0.2);
      cursor: default;
    }

    &--surveys {
      background: linear-gradient(135deg, rgba($primary, 0.12) 0%, rgba($primary, 0.04) 100%);
      border: 1px solid rgba($primary, 0.25);
    }

    &--clients {
      background: linear-gradient(135deg, rgba($primary, 0.12) 0%, rgba($primary, 0.04) 100%);
      border: 1px solid rgba($primary, 0.25);
    }

    &--internal-nav {
      background: rgba($primary, 0.06);
      border: 1px dashed rgba($primary, 0.25);
    }
  }

  &__ws-avatar {
    width: 40px;
    height: 40px;
    background: $primary;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: $white;
    flex-shrink: 0;
    overflow: hidden;

    &--fallback {
      background: rgba($white, 0.1);
      color: rgba($white, 0.6);
    }

    &--global {
      background: rgba($primary, 0.2);
      color: $primary;
      font-size: 1.1rem;
    }

    &--internal {
      background: linear-gradient(135deg, rgba($primary, 0.25) 0%, rgba($primary, 0.15) 100%);
      color: lighten($primary, 20%);
      font-size: 1rem;
      border: 1px solid rgba($primary, 0.3);
    }

    &--surveys {
      background: rgba($primary, 0.2);
      color: $primary;
      font-size: 1rem;
    }

    &--clients {
      background: rgba($primary, 0.2);
      color: $primary;
      font-size: 1rem;
    }

    &--sm {
      width: 28px;
      height: 28px;
      font-size: 0.75rem;
      border-radius: 6px;
    }

    &--fallback::after {
      content: attr(data-fallback);
    }
  }

  &__ws-page-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__ws-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__ws-label {
    font-size: 0.65rem;
    color: rgba($white, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.1rem;
  }

  &__ws-name {
    font-size: 0.9rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ws-global-tag {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: $primary;
    background: rgba($primary, 0.15);
    padding: 0.2rem 0.5rem;
    border-radius: 100px;
    border: 1px solid rgba($primary, 0.25);
    flex-shrink: 0;
  }

  &__ws-chevron {
    font-size: 0.8rem;
    color: rgba($white, 0.4);
    transition: transform 0.2s;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__ws-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0.5rem;
    right: 0.5rem;
    background: $primary-dark;
    border: 1px solid rgba($white, 0.1);
    border-radius: 10px;
    padding: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 250px;
    overflow-y: auto;
  }

  &__ws-search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem 0.5rem;
    border-bottom: 1px solid rgba($white, 0.07);
    margin-bottom: 0.25rem;

    i {
      color: rgba($white, 0.35);
      font-size: 0.8rem;
      flex-shrink: 0;
    }
  }

  &__ws-search-input {
    flex: 1;
    background: rgba($white, 0.07);
    border: 1px solid rgba($white, 0.1);
    border-radius: 6px;
    padding: 0.35rem 0.6rem;
    color: $white;
    font-size: 0.82rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;

    &::placeholder {
      color: rgba($white, 0.35);
    }

    &:focus {
      border-color: rgba($primary, 0.5);
      background: rgba($white, 0.1);
    }
  }

  &__ws-no-results {
    padding: 0.6rem 0.75rem;
    font-size: 0.8rem;
    color: rgba($white, 0.4);
    font-style: italic;
    text-align: center;
  }

  &__ws-loading-state {
    padding: 0.8rem 0.75rem;
    font-size: 0.8rem;
    color: rgba($white, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    i {
      color: $primary;
    }
  }

  &__ws-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.6rem 0.5rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba($white, 0.8);
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;

    &:hover {
      background: rgba($white, 0.05);
      color: $white;
    }

    &--active {
      background: rgba($primary, 0.15);
      color: $primary-light;
      font-weight: 600;

      &:hover {
        background: rgba($primary, 0.2);
      }
    }

    .fa-check {
      margin-left: auto;
      color: $primary;
      font-size: 0.85rem;
    }
  }

  &__ws-option-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  &__nav-divider {
    height: 1px;
    background: rgba($white, 0.07);
    margin: 0.25rem 0.5rem;
    border-radius: 1px;
  }

  // ── Nav ────────────────────────────────────────────────
  &__nav {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1rem 0.5rem;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba($white, 0.1);
      border-radius: 2px;
    }
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    color: rgba($white, 0.6);
    font-size: 0.95rem;
    font-weight: 500;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    i {
      font-size: 1.1rem;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    &:hover,
    &.router-link-active {
      background-color: rgba($white, 0.05);
      color: $white;
    }

    &.router-link-active {
      background-color: rgba($primary, 0.15);
      color: $primary-light;
      border-left: 3px solid $primary;
      border-radius: 0 8px 8px 0;
      padding-left: calc(1rem - 3px);
    }

  }

  &__nav-tag {
    margin-left: auto;
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: $primary;
    background: rgba($primary, 0.15);
    padding: 0.15rem 0.45rem;
    border-radius: 100px;
    border: 1px solid rgba($primary, 0.25);
    flex-shrink: 0;
  }

  &__crm-notice {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    background: linear-gradient(135deg, rgba($primary, 0.12) 0%, rgba($primary, 0.04) 100%);
    border: 1px solid rgba($primary, 0.25);
    border-radius: 12px;
    padding: 1.15rem;
    margin: 1rem 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &__crm-notice-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      color: $primary;
      font-size: 1.1rem;
    }

    strong {
      font-size: 0.9rem;
      color: $white;
      font-weight: 700;
    }
  }

  &__crm-notice-body {
    margin: 0;
    font-size: 0.78rem;
    color: rgba($white, 0.75);
    line-height: 1.45;

    a {
      color: lighten($primary, 15%);
      text-decoration: underline;
      font-weight: 600;

      &:hover {
        color: lighten($primary, 25%);
      }
    }

    strong {
      color: rgba($white, 0.9);
    }
  }

  &__crm-notice-contact {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.2rem;
    padding-top: 0.7rem;
    border-top: 1px solid rgba($white, 0.1);
  }

  &__crm-notice-label {
    font-size: 0.7rem;
    color: rgba($white, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  &__crm-notice-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &__crm-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.55rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;

    &--primary {
      background: $primary;
      color: $white;
      box-shadow: 0 2px 8px rgba($primary, 0.3);

      &:hover {
        background: lighten($primary, 5%);
        transform: translateY(-1px);
      }
    }
  }

  &__crm-notice-links {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  &__crm-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba($white, 0.08);
    color: rgba($white, 0.8);
    text-decoration: none;
    font-size: 0.95rem;
    transition: all 0.2s;

    &:hover {
      background: rgba($white, 0.15);
      color: $white;
      transform: translateY(-1px);
    }

    .fa-whatsapp {
      color: #25d366;
    }
  }

  &__nav-icon-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__nav-badge {
    position: absolute;
    top: -5px;
    right: -8px;
    background: $primary;
    color: $white;
    font-size: 0.65rem;
    font-weight: 800;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid $primary-dark;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  // ── Footer / user info ─────────────────────────────────
  &__footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0 0;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex: 1;
    min-width: 0;
  }

  &__user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba($primary, 0.2);
    color: $primary;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__user-email {
    font-size: 0.75rem;
    color: $white;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-role {
    font-size: 0.7rem;
    color: rgba($white, 0.5);
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  &__logout {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: rgba($text-light, 0.4);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    flex-shrink: 0;
    transition: color 0.15s ease, background-color 0.15s ease;

    &:hover {
      color: $alert-error;
      background-color: rgba($alert-error, 0.1);
    }
  }

  // ── Main ───────────────────────────────────────────────
  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
}

// Transitions
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.app-layout__onboarding-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fffbeb;
  border: 1.5px solid #fcd34d;
  border-radius: 12px;
  padding: 14px 18px;
  margin: 16px 16px 0;

  >i {
    font-size: 22px;
    color: #d97706;
    flex-shrink: 0;
  }
}

.app-layout__onboarding-banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 14px;
    font-weight: 700;
    color: #92400e;
  }

  span {
    font-size: 13px;
    color: #b45309;
  }
}

.app-layout__onboarding-btn {
  flex-shrink: 0;
  background: #d97706;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: #b45309;
  }
}

.app-layout__deactivated {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 100%;
}

.app-layout__deactivated-card {
  max-width: 480px;
  width: 100%;
  text-align: center;
  background: #fff;
  border: 1.5px solid rgba(239, 68, 68, 0.15);
  border-radius: 20px;
  padding: 40px 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

.app-layout__deactivated-icon {
  font-size: 52px;
  line-height: 1;
  margin-bottom: 20px;
}

.app-layout__deactivated-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px;
  line-height: 1.3;
}

.app-layout__deactivated-body {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 28px;
}

.app-layout__deactivated-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.app-layout__deactivated-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  width: 100%;
  justify-content: center;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }

  &--whatsapp {
    background: #25d366;
    color: #fff;
  }

  &--email {
    background: rgba(#0f172a, 0.06);
    color: #0f172a;
  }

  &--logout {
    background: #0f172a;
    color: #fff;
    border: none;
    cursor: pointer;
    font-family: inherit;
  }
}

// ── Invasive Onboarding Modal ────────────────────────────
.app-layout__invasive-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.app-layout__invasive-modal {
  background: #ffffff;
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: invasivePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes invasivePop {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.app-layout__invasive-icon {
  font-size: 3rem;
  color: #3b82f6; // Fallback in case $primary is a CSS var
  margin-bottom: 1.5rem;
}

.app-layout__invasive-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
}

.app-layout__invasive-text {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.app-layout__invasive-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.app-layout__invasive-btn-primary {
  display: block;
  width: 100%;
  padding: 1rem;
  background: #3b82f6;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

.app-layout__invasive-btn-secondary {
  background: none;
  border: none;
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;

  &:hover {
    color: #1e293b;
  }
}

.app-layout__agency-switch {
  padding: 0 0.5rem;
  margin-bottom: 1.2rem;
}

.app-layout__agency-switch-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba($white, 0.04);
  border: 1.5px dashed rgba($primary, 0.3);
  border-radius: 10px;
  color: rgba($white, 0.85);
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  i {
    color: $primary;
    font-size: 0.95rem;
    transition: transform 0.2s ease;
  }

  &:hover {
    background: rgba($primary, 0.12);
    border-color: $primary;
    color: $white;
    box-shadow: 0 0 12px rgba($primary, 0.25);

    i {
      transform: translateX(-4px);
    }
  }
}

.app-layout__ws-option--global-switch {
  background: rgba($primary, 0.08) !important;
  border: 1.5px dashed rgba($primary, 0.2) !important;
  color: $primary-light !important;
  font-weight: 700 !important;

  &:hover {
    background: rgba($primary, 0.15) !important;
    color: $white !important;
    border-color: $primary !important;
  }
}
</style>
