import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  // Public layout — unauthenticated routes
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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to, _from, next) => {
  const hasToken = !!localStorage.getItem('access_token')
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)

  // Only block protected routes when the user is NOT authenticated
  if (requiresAuth && !hasToken) {
    return next({ name: 'Login', replace: true })
  }

  // Allow all public routes freely (including /login regardless of token state)
  next()
})

export default router
