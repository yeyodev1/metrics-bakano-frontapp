import { ref, watch, type Ref } from 'vue'
import type { GuionIA } from '@/types/videoPlanning'

export interface GuionBloque {
  /** Identidad estable para el v-for: el texto cambia mientras se escribe. */
  id: number
  texto: string
}

/** Los bloques van separados por una línea en blanco, igual que los compone la IA. */
export function partirGuion(texto: string): string[] {
  return texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function unirGuion(partes: string[]): string {
  return partes.map((p) => p.trim()).filter(Boolean).join('\n\n')
}

/**
 * Rótulos de cada bloque. Solo se usan si el guión sigue teniendo la misma
 * cantidad de partes con las que la IA lo escribió; si se agregaron o quitaron
 * bloques a mano, poner "Cuerpo" sobre otra cosa engañaría.
 */
export function rotulosDe(guionIA: GuionIA | null | undefined, cantidad: number): string[] {
  const partes: Array<[string, string | undefined]> = [
    ['Hook (0-3 seg)', guionIA?.gancho],
    ['Hook 2', guionIA?.hook2],
    ['Cuerpo', guionIA?.cuerpo],
    ['Cierre', guionIA?.cta],
  ]
  const rotulos = partes.filter(([, v]) => v && v.trim()).map(([label]) => label)
  if (rotulos.length === cantidad) return rotulos
  return Array.from({ length: cantidad }, (_, i) => `Bloque ${i + 1}`)
}

/**
 * Edición por bloques del guión.
 *
 * Antes el guión era un solo textarea: tocar una palabra marcaba todo el guión
 * como editado a mano y cualquier reemplazo se llevaba también las partes que
 * estaban bien. Ahora cada bloque se edita y se reemplaza por su cuenta.
 */
export function useGuionBloques(texto: Ref<string>) {
  const bloques = ref<GuionBloque[]>([])
  let seq = 0
  /** Último texto que escribimos nosotros: distingue un cambio externo de uno propio. */
  let ultimo = ''

  function cargar(t: string) {
    bloques.value = partirGuion(t).map((parte) => ({ id: ++seq, texto: parte }))
    ultimo = t
  }

  /** Vuelca los bloques al texto que se guarda. */
  function sincronizar() {
    ultimo = unirGuion(bloques.value.map((b) => b.texto))
    texto.value = ultimo
  }

  watch(
    texto,
    (t) => {
      // Solo recargar cuando el cambio vino de afuera (abrir otro item, aplicar
      // un guión nuevo); si no, se re-partiría el bloque mientras se escribe.
      if (t !== ultimo) cargar(t)
    },
    { immediate: true }
  )

  function agregar() {
    bloques.value.push({ id: ++seq, texto: '' })
  }

  function quitar(idx: number) {
    bloques.value.splice(idx, 1)
    sincronizar()
  }

  function mover(idx: number, delta: number) {
    const destino = idx + delta
    if (destino < 0 || destino >= bloques.value.length) return
    const [b] = bloques.value.splice(idx, 1)
    bloques.value.splice(destino, 0, b)
    sincronizar()
  }

  /** Reemplaza un solo bloque; el resto del guión queda tal cual. */
  function reemplazar(idx: number, nuevo: string) {
    if (idx < bloques.value.length) bloques.value[idx].texto = nuevo
    else bloques.value.push({ id: ++seq, texto: nuevo })
    sincronizar()
  }

  return { bloques, sincronizar, agregar, quitar, mover, reemplazar }
}
