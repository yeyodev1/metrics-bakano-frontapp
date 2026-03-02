import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  // ── Public — unauthenticated ──────────────────────────────
  {
    path: '/',
    component: () => import('../layout/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/HomeView.vue'),
        meta: { title: 'Home' },
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
        meta: { title: 'Iniciar Sesión' },
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
        path: 'workspaces',
        name: 'SuperadminDashboard',
        component: () => import('../views/SuperadminDashboard.vue'),
        meta: { title: 'Entornos de trabajo', requiresAuth: true, requiresRole: 'superadmin' },
      },
      {
        path: 'workspaces/:workspaceId',
        name: 'WorkspaceDashboard',
        component: () => import('../views/WorkspaceDashboard.vue'),
        meta: { title: 'Dashboard del Espacio de Trabajo', requiresAuth: true },
      },
    ],
  },

  // ── Catch-all ─────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'Login' },
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
    return next({ name: 'Login', replace: true })
  }

  // Role guard: decode role from JWT payload (without external lib)
  const requiresRole = to.meta?.requiresRole as string | undefined
  if (requiresRole && hasToken && token) {
    try {
      const [, payloadSegment] = token.split('.')
      if (!payloadSegment) throw new Error('Malformed JWT')
      const payload = JSON.parse(atob(payloadSegment)) as { role?: string }
      if (payload.role !== requiresRole) {
        return next({ name: 'Login', replace: true })
      }
    } catch {
      return next({ name: 'Login', replace: true })
    }
  }

  next()
})

export default router
