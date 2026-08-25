import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteLocationRaw,
  type RouteRecordRaw,
} from 'vue-router'
import { resolveHomeRoute, isWorkspaceIdValido } from './home'
import { sesionFresca } from './session'
import { applySeo } from './seo'

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
        meta: {
          title: 'metrics.bakano.ec — Plataforma de clientes de Bakano',
          seo: {
            description:
              'metrics.bakano.ec es la plataforma de clientes de Bakano, agencia de marketing en Ecuador. Aquí los clientes ven su facturación y ROAS de Meta Ads, la planificación mensual de videos y aprueban contenido. El acceso es solo para clientes.',
          },
        },
      },
      {
        path: 'login',
        name: 'AuthLogin',
        component: () => import('../views/LoginView.vue'),
        meta: {
          title: 'Entrar — Plataforma de clientes de Bakano',
          seo: {
            description:
              'Accede a metrics.bakano.ec, la plataforma de clientes de Bakano. Necesitas la cuenta que te entregó tu equipo; si aún no eres cliente, conoce Bakano en mkt.bakano.ec.',
          },
        },
      },
      {
        path: 'recuperar-contrasena',
        name: 'AuthForgotPassword',
        component: () => import('../views/auth/ForgotPasswordView.vue'),
        meta: {
          title: 'Recuperar contraseña — Plataforma de clientes de Bakano',
          seo: {
            description:
              'Recupera el acceso a metrics.bakano.ec. Te enviamos un enlace al correo de tu cuenta de cliente de Bakano.',
          },
        },
      },
      {
        // El token viaja en la ruta porque llega desde un enlace del correo.
        path: 'restablecer-contrasena/:token',
        name: 'AuthResetPassword',
        component: () => import('../views/auth/ResetPasswordView.vue'),
        meta: {
          title: 'Nueva contraseña — Plataforma de clientes de Bakano',
          // Lleva un token de un solo uso en la URL: fuera de los índices.
          seo: { noindex: true },
        },
      },
    ],
  },

  // ── Superadmin — dedicated layout ─────────────────────────
  {
    path: '/superadmin',
    component: () => import('../layout/AppLayout.vue'),
    meta: { requiresAuth: true, requiresRole: 'superadmin' },
    children: [
      {
        path: '/app/workspaces',
        name: 'AdminWorkspaces',
        component: () => import('../views/SuperadminDashboard/index.vue'),
        meta: { title: 'Bakano Ads: Gestión de Entornos', requiresAuth: true, requiresRole: 'superadmin' },
      },
      {
        path: '/app/superadmin/public-metrics',
        name: 'SuperadminPublicMetrics',
        component: () => import('../views/superadmin/PublicMetricsView.vue'),
        meta: { title: 'Bakano Ads: Métricas Públicas', requiresAuth: true, requiresRole: 'superadmin' },
      },
      {
        path: '/app/superadmin/api-keys',
        name: 'SuperadminApiKeys',
        component: () => import('../views/superadmin/ApiKeysView.vue'),
        meta: { title: 'Bakano Ads: API Keys', requiresAuth: true, requiresRole: 'superadmin' },
      },
      {
        path: '/app/superadmin/meta-integrations',
        name: 'SuperadminMetaIntegrations',
        component: () => import('../views/superadmin/MetaIntegrationsView.vue'),
        meta: { title: 'Bakano Ads: Integración Meta Global', requiresAuth: true, requiresRole: 'superadmin' },
      },
    ]
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
        path: 'workspaces/:workspaceId/meta-dashboard',
        name: 'WorkspaceMetaDashboard',
        component: () => import('../views/workspaces/MetaUnifiedDashboardView.vue'),
        meta: { title: 'Bakano Ads: Métricas Meta', requiresAuth: true, requiresInternal: true },
      },
      {
        path: 'workspaces/:workspaceId/planning',
        name: 'AppPlanning',
        component: () => import('../views/WorkspacePlanning.vue'),
        meta: { title: 'Bakano Ads: Planificación', requiresAuth: true },
      },
      {
        path: 'workspaces/:workspaceId/builder',
        name: 'WorkspaceContentBuilder',
        component: () => import('../views/workspaces/contentBuilder/index.vue'),
        // Interno: ocultar el link del sidebar no protege nada si la URL sigue
        // abierta. El builder muestra desempeño comparado y aprendizajes que
        // son insumo del equipo, no entregable del cliente.
        meta: {
          title: 'Bakano Ads: Content Builder Pro',
          requiresAuth: true,
          requiresInternal: true,
        },
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
      {
        // URL fija de la plantilla de WhatsApp aprobada por Meta: no puede
        // llevar ids, así que esta pantalla resuelve cuál planificación abrir.
        // Es estática, así que vue-router la prioriza sobre workspaces/:workspaceId.
        path: 'workspaces/new-planning-from-whatsapp',
        name: 'NewPlanningFromWhatsapp',
        component: () => import('../views/videoPlanning/NewPlanningFromWhatsappView.vue'),
        meta: { title: 'Bakano Ads: Tu planificación', requiresAuth: true },
      },
      {
        // La plantilla de WhatsApp puede llegar con basura pegada a la URL
        // (p. ej. /new-planning-from-whatsapp/billing). Sin esto, ese sufijo
        // hacía match con workspaces/:workspaceId/billing y el cliente
        // aterrizaba en Facturación con un workspaceId inválido.
        path: 'workspaces/new-planning-from-whatsapp/:rest(.*)*',
        redirect: { name: 'NewPlanningFromWhatsapp' },
      },
      {
        // El cliente revisa sus VIDEOS TERMINADOS (no los guiones).
        path: 'workspaces/:workspaceId/planning/:entryId/video-review',
        name: 'VideoReviewClient',
        component: () => import('../views/videoPlanning/ClientVideoReviewView.vue'),
        meta: { title: 'Bakano Ads: Revisión de Videos', requiresAuth: true },
      },
      {
        // URL fija de la plantilla de WhatsApp de revisión de videos: igual
        // que la de aprobación, la pantalla resuelve cuál revisión abrir.
        path: 'workspaces/review-videos-from-whatsapp',
        name: 'ReviewVideosFromWhatsapp',
        component: () => import('../views/videoPlanning/ReviewVideosFromWhatsappView.vue'),
        meta: { title: 'Bakano Ads: Revisa tus videos', requiresAuth: true },
      },
      {
        // Mismo blindaje contra sufijos pegados por WhatsApp.
        path: 'workspaces/review-videos-from-whatsapp/:rest(.*)*',
        redirect: { name: 'ReviewVideosFromWhatsapp' },
      },
      // ── Pulso interno: meta mensual + facturación ────────
      {
        // Ruta interna: la meta, el ritmo y quién no registra son conversación
        // del equipo de Bakano. Esconder el link no alcanza, la URL se cierra.
        path: 'workspaces/:workspaceId/pulso',
        name: 'WorkspacePulse',
        component: () => import('../views/workspaces/InternalPulseView/index.vue'),
        meta: { title: 'Bakano Ads: Meta del Mes', requiresAuth: true, requiresInternal: true },
      },
      {
        path: 'pulso',
        name: 'PulseOverview',
        component: () => import('../views/pulse/PulseOverviewView.vue'),
        meta: { title: 'Bakano Ads: Metas de Clientes', requiresAuth: true, requiresInternal: true },
      },
      // ── Billing & ROAS ───────────────────────────────────
      {
        path: 'workspaces/:workspaceId/billing',
        name: 'BillingRoas',
        component: () => import('../views/billing/BillingRoasView.vue'),
        meta: { title: 'Bakano Ads: Facturación & ROAS', requiresAuth: true },
      },
      // ── Facturación Bakano (portal de pagos del cliente) ─
      {
        path: 'workspaces/:workspaceId/facturacion',
        name: 'FinanceBilling',
        component: () => import('../views/financeBilling/FinanceBillingView.vue'),
        meta: { title: 'Bakano: Mi suscripción', requiresAuth: true },
      },
      // ── Brand Resources ──────────────────────────────────
      {
        path: 'workspaces/:workspaceId/resources',
        name: 'WorkspaceResources',
        component: () => import('../views/resources/ResourcesView.vue'),
        meta: { title: 'Bakano Ads: Recursos de Marca', requiresAuth: true },
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
      // ── Booking ──────────────────────────────────────────
      {
        path: 'workspaces/:workspaceId/booking',
        name: 'AppBooking',
        component: () => import('../views/booking/BookingView.vue'),
        meta: { title: 'Bakano Ads: Agendar Reunión', requiresAuth: true },
      },
      // ── Equipo Asignado ───────────────────────────────────
      {
        path: 'workspaces/:workspaceId/team',
        name: 'WorkspaceTeam',
        component: () => import('../views/workspaces/WorkspaceTeamView/index.vue'),
        meta: { title: 'Bakano Ads: Mi Equipo', requiresAuth: true },
      },
      {
        path: 'workspaces/:workspaceId/evaluations',
        name: 'WorkspaceEvaluations',
        component: () => import('../views/workspaces/WorkspaceEvaluationsView.vue'),
        meta: { title: 'Bakano Ads: Muro de Reconocimientos', requiresAuth: true },
      },
      // ── Team KPIs ─────────────────────────────────────
      {
        path: 'kpis',
        name: 'TeamKpis',
        component: () => import('../views/kpis/TeamKpisView.vue'),
        meta: { title: 'Bakano Ads: KPIs del Equipo', requiresAuth: true, requiresInternal: true },
      },
      // ── Sistema de Banderas ───────────────────────────
      {
        path: 'flags',
        name: 'FlagsDashboard',
        component: () => import('../views/flags/FlagsDashboardView.vue'),
        meta: { title: 'Bakano Ads: Sistema de Banderas', requiresAuth: true, requiresInternal: true },
      },
      // ── Revisión de videos editados ───────────────────
      {
        path: 'workspaces/review-videos-from-planning',
        name: 'ReviewVideosFromPlanning',
        component: () => import('../views/workspaces/reviewVideos/index.vue'),
        meta: { title: 'Bakano Ads: Revisión de Videos', requiresAuth: true, requiresInternal: true },
      },
      {
        path: 'sales-executive',
        name: 'SalesExecutiveDashboard',
        component: () => import('../views/sales/SalesExecutiveDashboard.vue'),
        meta: { title: 'Bakano Ads: Próximas Asesorías', requiresAuth: true, requiresInternal: true },
      },
      {
        path: 'sales-executive/:formId',
        name: 'SalesExecutiveFormDetail',
        component: () => import('../views/sales/SalesBookingFormDetailView.vue'),
        meta: { title: 'Bakano Ads: Perfil Comercial', requiresAuth: true, requiresInternal: true },
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
        // Misma vista que el panel, con la pestana de calendario activa: asi el
        // sidebar tiene rutas reales y el navegador recuerda donde estaba.
        path: 'calendario',
        name: 'EditorCalendario',
        component: () => import('../views/editor/EditorDashboard.vue'),
        meta: { title: 'Bakano Ads: Calendario del Editor', requiresAuth: true, requiresInternal: true },
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
  // Antes esto redirigía al login. Con sesión abierta era desconcertante: una
  // URL mal escrita te sacaba a una pantalla de ingreso sin decir por qué.
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/errors/NotFoundView.vue'),
    meta: { title: 'Bakano Ads: Página no encontrada' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0, behavior: 'smooth' }
  },
})

/**
 * Renderiza el 404 sin cambiar la URL.
 *
 * La ruta comodín acepta el path entero como `pathMatch`, así que devolver ese
 * mismo path deja la barra de direcciones igual. Importa: el usuario ve qué
 * enlace estaba abriendo, y puede corregirlo o compartirlo tal cual.
 */
function comoNoEncontrada(to: RouteLocationNormalized): RouteLocationRaw {
  return {
    name: 'NotFound',
    params: { pathMatch: to.path.slice(1).split('/') },
    query: to.query,
    hash: to.hash,
    replace: true,
  }
}

router.beforeEach(async (to, _from, next) => {
  const token = localStorage.getItem('access_token')
  const hasToken = !!token
  const requiresAuth = to.matched.some((r) => r.meta?.requiresAuth)

  // Con sesión, los checks de rol de abajo y los `onMounted` de las vistas
  // necesitan el usuario actual, no el de localStorage del día del login.
  if (hasToken && requiresAuth) await sesionFresca()

  // `:workspaceId` acepta cualquier texto, así que /app/workspaces/loquesea/planning
  // hacía match con una ruta real: se montaba la vista y disparaba media docena de
  // llamadas condenadas a fallar. Si el id no tiene forma de _id de Mongo, no hay
  // nada que buscar: es un 404 y se corta antes de pedir nada.
  if ('workspaceId' in to.params && !isWorkspaceIdValido(to.params.workspaceId)) {
    return next(comoNoEncontrada(to))
  }

  // Unauthenticated trying to access protected route
  if (requiresAuth && !hasToken) {
    return next({ name: 'AuthLogin', query: { redirect: to.fullPath }, replace: true })
  }

  // Editor isolation: block editors from all routes outside /editor
  if (hasToken) {
    const internalRole = localStorage.getItem('user_internalRole')
    if (internalRole === 'editor') {
      // NotFound entra en la lista: un editor con una URL mala merece saber que
      // no existe, no aterrizar en su dashboard como si hubiera pedido eso.
      const allowedForEditor = ['EditorDashboard', 'EditorCalendario', 'EditorVideoPlanning', 'AuthLogin', 'NotFound']
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
    const home = resolveHomeRoute()
    // Sin destino propio se queda donde está, en vez de rebotar contra el login.
    if ((home as { name?: string }).name !== 'AuthLogin') return next(home)
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
  applySeo(to)
})

export default router
