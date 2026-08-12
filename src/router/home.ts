import type { RouteLocationRaw } from 'vue-router'

/**
 * A dónde pertenece cada quien dentro de la app.
 *
 * Vive aparte porque lo usan dos sitios: el guard, al entrar con sesión a una
 * ruta pública, y la página 404, para su botón principal. Cuando esta regla
 * estaba solo dentro del guard, cualquier pantalla que quisiera "llévame a mi
 * panel" la reimplementaba y se desincronizaba al agregar un rol.
 */
export function resolveHomeRoute(): RouteLocationRaw {
  const token = localStorage.getItem('access_token')
  if (!token) return { name: 'AuthLogin' }

  let role: string | undefined
  let internalRole: string | undefined
  let workspaceId: string | undefined

  try {
    const [, payloadSegment] = token.split('.')
    if (payloadSegment) {
      const payload = JSON.parse(atob(payloadSegment)) as {
        role?: string
        internalRole?: string
        workspaceId?: string
      }
      role = payload.role
      internalRole = payload.internalRole
      workspaceId = payload.workspaceId
    }
  } catch {
    // Token ilegible: se cae al login, que es donde se arregla.
  }

  role = role ?? localStorage.getItem('user_role') ?? undefined
  internalRole = internalRole ?? localStorage.getItem('user_internalRole') ?? undefined
  workspaceId = workspaceId ?? localStorage.getItem('user_workspaceId') ?? undefined

  if (role === 'superadmin') return { name: 'AdminWorkspaces' }
  if (internalRole === 'editor') return { name: 'EditorDashboard' }
  if (internalRole === 'trafficker' || internalRole === 'project_manager') {
    return { name: 'TraffickerDashboard' }
  }
  if (internalRole === 'sales_executive') return { name: 'SalesExecutiveDashboard' }
  if (workspaceId) return { name: 'BillingRoas', params: { workspaceId } }

  return { name: 'AuthLogin' }
}

/** Etiqueta del botón: dice a dónde lleva, no "inicio" a secas. */
export function homeRouteLabel(): string {
  return localStorage.getItem('access_token') ? 'Ir a mi panel' : 'Iniciar sesión'
}

/** Un _id de Mongo: 24 caracteres hexadecimales. */
const MONGO_ID = /^[a-f\d]{24}$/i

export function isWorkspaceIdValido(id: unknown): id is string {
  return typeof id === 'string' && MONGO_ID.test(id)
}
