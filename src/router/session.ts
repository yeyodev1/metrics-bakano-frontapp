import { authService } from '@/services/auth.service'
import { useUserStore } from '@/stores/user'

/**
 * Trae del servidor quién es el usuario ANTES de que el guard decida nada.
 *
 * El store se hidrata desde localStorage, y ahí `isInternal` / `internalRole`
 * son los del día en que la persona entró. Si después la convirtieron en
 * colaboradora interna o le cambiaron el rol, la app seguía tratándola como
 * cliente: la vista de planificación la mandaba a la pantalla de aprobación
 * y las rutas internas la rebotaban al login. App.vue ya pedía /me, pero
 * en paralelo: el guard y los `onMounted` corrían antes con datos viejos.
 *
 * Se pide una sola vez por carga y con tope de tiempo: una API lenta no puede
 * dejar la navegación colgada, en ese caso se sigue con lo que hay guardado.
 */
let pendiente: Promise<void> | null = null

const TOPE_MS = 4000

export function sesionFresca(): Promise<void> {
  if (pendiente) return pendiente
  const userStore = useUserStore()
  if (!userStore.isAuthenticated || !userStore.id) return Promise.resolve()

  const refresco = authService
    .me()
    .then(({ user }) => {
      userStore.setUser({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        workspaces: user.workspaces as any,
        isInternal: user.isInternal ?? false,
        internalRole: user.internalRole ?? undefined,
        workspaceId: userStore.workspaceId || undefined,
      })
    })
    .catch(() => {
      // Token vencido lo resuelve el interceptor; cualquier otro fallo deja
      // la sesión local tal cual.
    })

  const tope = new Promise<void>((resolve) => setTimeout(resolve, TOPE_MS))
  pendiente = Promise.race([refresco, tope])
  return pendiente
}

/** Para volver a pedir /me tras un login nuevo en la misma pestaña. */
export function olvidarSesionFresca(): void {
  pendiente = null
}
