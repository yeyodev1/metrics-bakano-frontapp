import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  // ── Public — unauthenticated ──────────────────────────────
  {
    path: '/',
    component: () => import('../layout/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'PublicHome',
        component: () => import('../views/HomeView.vue'),
        meta: { title: 'Bakano Ads: Impulsando tu ROAS' },
      },
      {
        path: 'login',
        name: 'AuthLogin',
        component: () => import('../views/LoginView.vue'),
        meta: { title: 'Bakano Ads: Acceso Cliente' },
      },
    ],
  },

  // ── App — authenticated ───────────────────────────────────
  {
    path: '/app',
    component: () => import('../layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'clients',
        name: 'ClientsGlobal',
        component: () => import('../views/ClientsGlobalView/index.vue'),
        meta: { title: 'Bakano Ads: Vista Global de Clientes', requiresAuth: true, requiresInternal: true },
      },
      {
        path: 'planning',
        name: 'InternalPlanning',
        component: () => import('../views/InternalPlanningView.vue'),
        meta: { title: 'Bakano Ads: Planificador Global', requiresAuth: true, requiresInternal: true },
      },
      {
        path: 'workspaces',
        name: 'AdminWorkspaces',
        component: () => import('../views/SuperadminDashboard.vue'),
        meta: { title: 'Bakano Ads: Gestión de Entornos', requiresAuth: true, requiresRole: 'superadmin' },
      },
      {
        path: 'superadmin/public-metrics',
        name: 'SuperadminPublicMetrics',
        component: () => import('../views/superadmin/PublicMetricsView.vue'),
        meta: { title: 'Bakano Ads: Métricas Públicas', requiresAuth: true, requiresRole: 'superadmin' },
      },
      {
        path: 'superadmin/api-keys',
        name: 'SuperadminApiKeys',
        component: () => import('../views/superadmin/ApiKeysView.vue'),
        meta: { title: 'Bakano Ads: API Keys', requiresAuth: true, requiresRole: 'superadmin' },
      },
      {
        path: 'workspaces/:workspaceId',
        redirect: to => ({ name: 'BillingRoas', params: { workspaceId: to.params.workspaceId } })
      },
      {
        path: 'workspaces/:workspaceId/visual',
        name: 'AppVisual',
        component: () => import('../views/WorkspaceVisualDashboard.vue'),
        meta: { title: 'Bakano Ads: Análisis Visual', requiresAuth: true },
      },
      {
        path: 'workspaces/:workspaceId/planning',
        name: 'AppPlanning',
        component: () => import('../views/WorkspacePlanning.vue'),
        meta: { title: 'Bakano Ads: Planificación', requiresAuth: true },
      },
      {
        path: 'workspaces/:workspaceId/settings',
        name: 'AppSettings',
        component: () => import('../views/settings/WorkspaceSettings.vue'),
        meta: { title: 'Bakano Ads: Configuración del Entorno', requiresAuth: true },
      },
      // ── Branches ───────────────────────────────────────────
      {
        path: 'workspaces/:workspaceId/branches',
        name: 'WorkspaceBranches',
        component: () => import('../views/branches/WorkspaceBranchesView.vue'),
        meta: { title: 'Bakano Ads: Sucursales', requiresAuth: true },
      },
      // ── Surveys ───────────────────────────────────────────
      {
        path: 'surveys',
        name: 'SurveyList',
        component: () => import('../views/surveys/SurveyListView.vue'),
        meta: { title: 'Bakano Ads: Encuestas', requiresAuth: true },
      },
      {
        path: 'surveys/new',
        name: 'SurveyNew',
        component: () => import('../views/surveys/SurveyBuilderView.vue'),
        meta: { title: 'Bakano Ads: Nueva Encuesta', requiresAuth: true },
      },
      {
        path: 'surveys/:surveyId/edit',
        name: 'SurveyEdit',
        component: () => import('../views/surveys/SurveyBuilderView.vue'),
        meta: { title: 'Bakano Ads: Editar Encuesta', requiresAuth: true },
      },
      {
        path: 'surveys/:surveyId/results',
        name: 'SurveyResults',
        component: () => import('../views/surveys/SurveyResultsView.vue'),
        meta: { title: 'Bakano Ads: Resultados de Encuesta', requiresAuth: true },
      },
      {
        path: 'survey/:token',
        name: 'SurveyFill',
        component: () => import('../views/surveys/SurveyFillView.vue'),
        meta: { title: 'Bakano Ads: Responder Encuesta', requiresAuth: true },
      },
      {
        path: 'workspaces/:workspaceId/surveys',
        name: 'MySurveys',
        component: () => import('../views/surveys/MySurveysView.vue'),
        meta: { title: 'Bakano Ads: Mis Encuestas', requiresAuth: true },
      },
      // ── Video Planning ────────────────────────────────────
      {
        path: 'workspaces/:workspaceId/planning/:entryId/video-planning',
        name: 'VideoPlanning',
        component: () => import('../views/videoPlanning/VideoPlanningView.vue'),
        meta: { title: 'Bakano Ads: Planificación de Videos', requiresAuth: true },
      },
      {
        path: 'workspaces/:workspaceId/planning/:entryId/video-planning/client',
        name: 'VideoPlanningClient',
        component: () => import('../views/videoPlanning/ClientVideoPlanningView.vue'),
        meta: { title: 'Bakano Ads: Aprobación de Videos', requiresAuth: true },
      },
      // ── Billing & ROAS ───────────────────────────────────
      {
        path: 'workspaces/:workspaceId/billing',
        name: 'BillingRoas',
        component: () => import('../views/billing/BillingRoasView.vue'),
        meta: { title: 'Bakano Ads: Facturación & ROAS', requiresAuth: true },
      },
      // ── Brand Profile ─────────────────────────────────────
      {
        path: 'workspaces/:workspaceId/brand-profile',
        name: 'WorkspaceBrandProfile',
        component: () => import('../views/workspaces/WorkspaceBrandProfileView.vue'),
        meta: { title: 'Bakano Ads: Perfil de Marca', requiresAuth: true },
      },
      // ── Legalidades ───────────────────────────────────────
      {
        path: 'workspaces/:workspaceId/legal',
        name: 'WorkspaceLegal',
        component: () => import('../views/workspaces/WorkspaceLegalView.vue'),
        meta: { title: 'Bakano Ads: Legalidades y Contrato', requiresAuth: true },
      },
      // ── Equipo Asignado ───────────────────────────────────
      {
        path: 'workspaces/:workspaceId/team',
        name: 'WorkspaceTeam',
        component: () => import('../views/workspaces/WorkspaceTeamView/index.vue'),
        meta: { title: 'Bakano Ads: Mi Equipo', requiresAuth: true },
      },
      // ── Team KPIs ─────────────────────────────────────
      {
        path: 'kpis',
        name: 'TeamKpis',
        component: () => import('../views/kpis/TeamKpisView.vue'),
        meta: { title: 'Bakano Ads: KPIs del Equipo', requiresAuth: true, requiresInternal: true },
      },
      // ── Meetings calendar ─────────────────────────────────
      {
        path: 'meetings',
        name: 'PMCalendar',
        component: () => import('../views/meetings/MeetingsView.vue'),
        meta: { title: 'Bakano Ads: Calendario de Reuniones', requiresAuth: true, requiresInternal: true },
      },
      // ── Notifications ─────────────────────────────────────
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('../views/notifications/NotificationsView.vue'),
        meta: { title: 'Bakano Ads: Notificaciones', requiresAuth: true },
      },
      // ── Trafficker ────────────────────────────────────────
      {
        path: 'trafficker',
        name: 'TraffickerDashboard',
        component: () => import('../views/trafficker/TraffickerDashboard.vue'),
        meta: { title: 'Bakano Ads: Panel Trafficker', requiresAuth: true, requiresInternal: true },
      },
      {
        path: 'trafficker/:workspaceId',
        name: 'TraffickerWorkspace',
        component: () => import('../views/trafficker/TraffickerWorkspaceView.vue'),
        meta: { title: 'Bakano Ads: Entorno - Trafficker', requiresAuth: true, requiresInternal: true },
      },
    ],
  },

  // ── Editor — dedicated layout, no internal sidebar ───────
  {
    path: '/editor',
    component: () => import('../layout/EditorLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'EditorDashboard',
        component: () => import('../views/editor/EditorDashboard.vue'),
        meta: { title: 'Bakano Ads: Panel Editor', requiresAuth: true, requiresInternal: true },
      },
      {
        path: 'workspaces/:workspaceId/planning/:entryId/videos',
        name: 'EditorVideoPlanning',
        component: () => import('../views/editor/EditorVideoPlanningView.vue'),
        meta: { title: 'Bakano Ads: Videos de Producción', requiresAuth: true, requiresInternal: true },
      },
    ],
  },

  // ── Client Onboarding (full-screen, no sidebar) ───────────
  {
    path: '/onboarding/:workspaceId',
    component: () => import('../layout/OnboardingLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ClientOnboarding',
        component: () => import('../views/onboarding/index.vue'),
        meta: { title: 'Bakano Ads: Onboarding de Cliente', requiresAuth: true },
      },
    ],
  },

  // ── Catch-all ─────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'AuthLogin' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('access_token')
  const hasToken = !!token
  const requiresAuth = to.matched.some((r) => r.meta?.requiresAuth)

  // Unauthenticated trying to access protected route
  if (requiresAuth && !hasToken) {
    return next({ name: 'AuthLogin', query: { redirect: to.fullPath }, replace: true })
  }

  // Editor isolation: block editors from all routes outside /editor
  if (hasToken) {
    const internalRole = localStorage.getItem('user_internalRole')
    if (internalRole === 'editor') {
      const allowedForEditor = ['EditorDashboard', 'EditorVideoPlanning', 'AuthLogin']
      if (to.name && !allowedForEditor.includes(to.name as string)) {
        return next({ name: 'EditorDashboard', replace: true })
      }
    }
  }

  // Handle ?redirect= after login
  if (hasToken && to.query.redirect) {
    const redirectPath = to.query.redirect as string
    return next(redirectPath)
  }

  // Already authenticated trying to access public routes
  if (hasToken && (to.name === 'AuthLogin' || to.name === 'PublicHome' || to.path === '/')) {
    try {
      const [, payloadSegment] = token.split('.')
      if (payloadSegment) {
        const payload = JSON.parse(atob(payloadSegment)) as { role?: string; workspaceId?: string; internalRole?: string }
        if (payload.role === 'superadmin') {
          return next({ name: 'AdminWorkspaces' })
        } else if (payload.internalRole === 'editor') {
          return next({ name: 'EditorDashboard' })
        } else if (payload.internalRole === 'trafficker' || payload.internalRole === 'project_manager') {
          return next({ name: 'TraffickerDashboard' })
        } else {
          const workspaceId = payload.workspaceId || localStorage.getItem('user_workspaceId')
          if (workspaceId) {
            return next({ name: 'BillingRoas', params: { workspaceId } })
          }
        }
      }
    } catch {
      // silent catch
    }
  }

  // Role guard: decode role from JWT payload (without external lib)
  const requiresRole = to.meta?.requiresRole as string | undefined
  if (requiresRole && hasToken && token) {
    try {
      const [, payloadSegment] = token.split('.')
      if (!payloadSegment) throw new Error('Malformed JWT')
      const payload = JSON.parse(atob(payloadSegment)) as { role?: string }
      if (payload.role !== requiresRole) {
        return next({ name: 'AuthLogin', replace: true })
      }
    } catch {
      return next({ name: 'AuthLogin', replace: true })
    }
  }

  // Internal-only guard (superadmin also allowed)
  if (to.meta?.requiresInternal) {
    const isInternal = localStorage.getItem('user_isInternal') === 'true'
    const role = localStorage.getItem('user_role')
    if (!isInternal && role !== 'superadmin') {
      return next({ name: 'AuthLogin', replace: true })
    }
  }

  next()
})

router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  document.title = title || 'Bakano Ads - Plataforma de Clientes'
})

export default router
