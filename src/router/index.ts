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
        component: () => import('../views/ClientsGlobalView.vue'),
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
        path: 'workspaces/:workspaceId',
        name: 'AppDashboard',
        component: () => import('../views/WorkspaceDashboard.vue'),
        meta: { title: 'Bakano Ads: Dashboard Detallado', requiresAuth: true },
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
        const payload = JSON.parse(atob(payloadSegment)) as { role?: string; workspaceId?: string }
        if (payload.role === 'superadmin') {
          return next({ name: 'AdminWorkspaces' })
        } else {
          const workspaceId = payload.workspaceId || localStorage.getItem('user_workspaceId')
          if (workspaceId) {
            return next({ name: 'AppDashboard', params: { workspaceId } })
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

  // Internal-only guard
  if (to.meta?.requiresInternal) {
    const isInternal = localStorage.getItem('user_isInternal') === 'true'
    if (!isInternal) {
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
