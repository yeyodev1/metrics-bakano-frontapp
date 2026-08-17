import { useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { prefetchCache } from '@/services/prefetchCache'
import { billingService } from '@/services/billing.service'

/**
 * Adelanta el trabajo de una ruta mientras el usuario todavía está decidiendo.
 *
 * No es `speculationrules`: eso prerenderiza documentos completos y aquí la
 * navegación es de cliente (vue-router intercepta el click), así que el
 * prerender nunca se usaría. Lo que sí cuesta tiempo en una SPA es el chunk
 * lazy de la vista, y eso es lo que se adelanta.
 */

/** Espera antes de disparar: evita gastar en cada ítem que el ratón cruza de paso. */
const RETARDO_MS = 150

const chunksPedidos = new Set<string>()

export function useRoutePrefetch() {
  const router = useRouter()
  let temporizador: ReturnType<typeof setTimeout> | undefined

  /** Descarga el JS y el CSS de la vista sin montarla. */
  function precargarChunk(destino: RouteLocationRaw) {
    const resuelta = router.resolve(destino)
    if (chunksPedidos.has(resuelta.fullPath)) return
    chunksPedidos.add(resuelta.fullPath)

    for (const registro of resuelta.matched) {
      for (const componente of Object.values(registro.components ?? {})) {
        // Las rutas lazy guardan la función `() => import(...)`; una vez
        // cargada, vue-router la reemplaza por el componente ya resuelto.
        if (typeof componente === 'function') {
          try {
            ;(componente as () => Promise<unknown>)().catch(() => {})
          } catch {
            // Un fallo aquí no debe afectar en nada: es trabajo adelantado.
          }
        }
      }
    }
    return resuelta
  }

  /**
   * Nivel 2: además del chunk, los datos. Solo para las vistas cuya primera
   * carga se nota — pedir de más en todas cambiaría latencia por carga al
   * backend sin ganancia visible.
   */
  function precargarDatos(destino: RouteLocationRaw) {
    const resuelta = router.resolve(destino)
    if (resuelta.name !== 'BillingRoas') return

    const workspaceId = String(resuelta.params['workspaceId'] ?? '')
    if (!workspaceId) return

    const ahora = new Date()
    prefetchCache.recordar(
      billingService.claveMes(workspaceId, ahora.getFullYear(), ahora.getMonth() + 1),
      () => billingService.getMonthData(workspaceId, ahora.getFullYear(), ahora.getMonth() + 1),
    )
  }

  /** Al entrar el puntero. Arranca el chunk ya y los datos tras el retardo. */
  function alApuntar(destino: RouteLocationRaw) {
    precargarChunk(destino)
    clearTimeout(temporizador)
    temporizador = setTimeout(() => precargarDatos(destino), RETARDO_MS)
  }

  /** Al salir el puntero: lo que no llegó a dispararse, se cancela. */
  function alSalir() {
    clearTimeout(temporizador)
  }

  /**
   * En móvil no hay hover. `pointerdown` ocurre antes que el click, así que
   * regala el tiempo que el dedo tarda en levantarse.
   */
  function alTocar(destino: RouteLocationRaw) {
    precargarChunk(destino)
    precargarDatos(destino)
  }

  return { alApuntar, alSalir, alTocar }
}
