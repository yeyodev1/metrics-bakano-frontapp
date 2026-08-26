import { ref, watch, type Ref } from 'vue'
import { internalPulseService, type WorkspacePulse } from '@/services/internalPulse.service'
import { claveMes, parseClaveMes } from './utils/meses'

/**
 * Sigue al mes elegido en el modal de meta.
 *
 * La meta ya puesta, lo facturado y los días del mes cambian con el mes: si el
 * modal siguiera mostrando los del mes de la vista, se guardaría una meta
 * calculada sobre cifras que no eran de ese mes.
 */
export function usePulseMes(workspaceId: string, inicial: Ref<WorkspacePulse>) {
  const pulseMes = ref<WorkspacePulse>(inicial.value)
  const mesElegido = ref(claveMes(inicial.value.period.year, inicial.value.period.month))
  const cargando = ref(false)
  const errorCarga = ref('')

  watch(inicial, (p) => {
    pulseMes.value = p
    mesElegido.value = claveMes(p.period.year, p.period.month)
  })

  watch(mesElegido, async (clave) => {
    const { year, month } = parseClaveMes(clave)
    const actual = pulseMes.value.period
    if (year === actual.year && month === actual.month) return

    cargando.value = true
    errorCarga.value = ''
    try {
      pulseMes.value = await internalPulseService.getWorkspacePulse(workspaceId, year, month)
    } catch {
      errorCarga.value = 'No se pudo cargar ese mes. Elige otro o vuelve a intentar.'
      // Volver al mes que sí está cargado: dejarlo en el elegido mostraría
      // cifras de un mes distinto al que dice el selector.
      mesElegido.value = claveMes(actual.year, actual.month)
    } finally {
      cargando.value = false
    }
  })

  return { pulseMes, mesElegido, cargando, errorCarga }
}
