import { ref, computed, readonly } from 'vue'

/**
 * Estado de la conexión, visto desde las peticiones reales.
 *
 * `navigator.onLine` se usa solo como señal de apoyo: miente cuando hay wifi
 * conectado sin salida a internet, que es justo el caso que más se da. La señal
 * dura son los eventos que emite `httpBase`: `net:down` cuando una petición se
 * queda sin servidor al otro lado, `net:up` cuando alguna responde.
 */

// Estado a nivel de módulo: todos los componentes miran el mismo.
const caido = ref(false)
const huboRespuestaAlguna = ref(false)
const reintentos = ref(0)

let iniciado = false

function iniciar() {
  if (iniciado) return
  iniciado = true

  window.addEventListener('net:down', () => (caido.value = true))
  window.addEventListener('net:up', () => {
    caido.value = false
    huboRespuestaAlguna.value = true
  })

  // El evento del navegador solo adelanta el aviso; que vuelva `online` no
  // prueba que el backend responda, así que no se limpia `caido` desde aquí.
  window.addEventListener('offline', () => (caido.value = true))
}

export function useNetworkStatus() {
  iniciar()

  /**
   * Arranque en frío: la app abrió sin conseguir ni una respuesta. No hay nada
   * en pantalla que proteger, así que ahí sí corresponde tapar todo.
   */
  const arranqueSinRed = computed(() => caido.value && !huboRespuestaAlguna.value)

  /**
   * Reintentar no es más que avisar; cada vista decide si recarga. Se expone el
   * contador para poder observarlo con `watch`.
   */
  function reintentar() {
    reintentos.value++
    window.dispatchEvent(new CustomEvent('net:retry'))
  }

  return {
    caido: readonly(caido),
    arranqueSinRed,
    reintentos: readonly(reintentos),
    reintentar,
  }
}
