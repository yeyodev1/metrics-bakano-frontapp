import { ref, computed, type Ref } from 'vue'
import type { GuionIA } from '@/types/videoPlanning'

/**
 * El guión que queda en el textarea. El Hook 2 solo aparece si se generó
 * aparte; si no, ya viene dentro del cuerpo y meterlo otra vez lo duplicaría.
 */
export function composeGuion(g: GuionIA): string {
  return [g.gancho, g.hook2, g.cuerpo, g.cta].filter((p) => p && p.trim()).join('\n\n')
}

/**
 * Protege lo que se editó a mano de una regeneración.
 *
 * La content manager reescribe partes del guión y antes cualquier generación
 * nueva pisaba el textarea completo sin avisar. Ahora el guión nuevo espera en
 * `pendiente` hasta que ella decida.
 */
export function useGuionEditable(texto: Ref<string>) {
  /** Copia del guión tal como lo dejó la IA. Si el textarea ya no coincide, se editó a mano. */
  const deIA = ref('')

  /** Guión recién generado que espera permiso para reemplazar al editado a mano. */
  const pendiente = ref<string | null>(null)

  const editadoAMano = computed(() => !!texto.value.trim() && texto.value !== deIA.value)

  /**
   * Arranca el seguimiento al abrir un item. Solo cuenta como "de la IA" si lo
   * guardado sigue siendo idéntico a lo que la IA escribió; cualquier retoque
   * posterior lo deja como editado a mano.
   */
  function sync(guionIA?: GuionIA | null) {
    deIA.value = guionIA ? composeGuion(guionIA) : ''
    pendiente.value = null
  }

  function recibirGenerado(g: GuionIA) {
    const nuevo = composeGuion(g)
    if (editadoAMano.value) {
      pendiente.value = nuevo
      return
    }
    texto.value = nuevo
    deIA.value = nuevo
  }

  function aplicarPendiente() {
    if (!pendiente.value) return
    texto.value = pendiente.value
    deIA.value = pendiente.value
    pendiente.value = null
  }

  function descartarPendiente() {
    pendiente.value = null
  }

  return { pendiente, editadoAMano, sync, recibirGenerado, aplicarPendiente, descartarPendiente }
}
