/**
 * Caché en memoria de respuestas pedidas por adelantado.
 *
 * Sin esto el prefetch de datos no sirve de nada: la vista volvería a pedir lo
 * mismo al montarse. La ventana es corta a propósito — adelantar la carga no
 * puede convertirse en mostrar cifras viejas.
 */

const TTL_MS = 30000

interface Entrada {
  guardadaEn: number
  promesa: Promise<unknown>
}

class PrefetchCache {
  private entradas = new Map<string, Entrada>()

  /** Lanza la petición y la guarda. Si ya hay una fresca en curso, no repite. */
  recordar<T>(clave: string, cargar: () => Promise<T>): Promise<T> {
    const vigente = this.leer<T>(clave)
    if (vigente) return vigente

    // Se guarda la promesa, no el resultado: si la vista se monta mientras el
    // prefetch sigue en vuelo, se engancha a la misma petición en vez de abrir otra.
    const promesa = cargar().catch((error) => {
      this.entradas.delete(clave)
      throw error
    })
    this.entradas.set(clave, { guardadaEn: Date.now(), promesa })
    return promesa
  }

  /** Devuelve la promesa guardada si sigue fresca. */
  leer<T>(clave: string): Promise<T> | null {
    const entrada = this.entradas.get(clave)
    if (!entrada) return null
    if (Date.now() - entrada.guardadaEn > TTL_MS) {
      this.entradas.delete(clave)
      return null
    }
    return entrada.promesa as Promise<T>
  }

  /**
   * Tras escribir hay que tirar lo cacheado, o el usuario guarda su facturación
   * y ve la cifra de antes.
   */
  invalidar(prefijo: string) {
    for (const clave of [...this.entradas.keys()]) {
      if (clave.startsWith(prefijo)) this.entradas.delete(clave)
    }
  }
}

export const prefetchCache = new PrefetchCache()
