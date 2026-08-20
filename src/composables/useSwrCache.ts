/**
 * Caché "stale-while-revalidate" para las pantallas del editor.
 *
 * El panel del editor volvía a pedir la cola entera (cientos de items) cada
 * vez que se entraba, y el usuario miraba un spinner aunque los datos fueran
 * los mismos de hace un minuto. Aquí la pantalla pinta al instante lo último
 * que se vio (sessionStorage, sobrevive a recargas) y refresca por detrás.
 *
 * - `ttlMs`: mientras no venza, ni siquiera se vuelve a pedir.
 * - Vencido: se entrega lo viejo de inmediato y se repide; el llamador recibe
 *   la versión fresca por `onFresh`.
 */

const PREFIJO = 'swr:'
const enVuelo = new Map<string, Promise<unknown>>()

interface Guardado<T> {
  en: number
  datos: T
}

function leer<T>(clave: string): Guardado<T> | null {
  try {
    const raw = sessionStorage.getItem(PREFIJO + clave)
    return raw ? (JSON.parse(raw) as Guardado<T>) : null
  } catch {
    return null
  }
}

function escribir<T>(clave: string, datos: T) {
  try {
    sessionStorage.setItem(PREFIJO + clave, JSON.stringify({ en: Date.now(), datos }))
  } catch {
    /* cuota llena: seguimos sin caché */
  }
}

export interface SwrOpciones<T> {
  /** Tiempo en que la copia se considera fresca y no se repide. */
  ttlMs?: number
  /** Se llama con los datos nuevos cuando la petición de fondo termina. */
  onFresh?: (datos: T) => void
}

/**
 * Devuelve de inmediato la copia guardada (o null) y dispara la carga si hace
 * falta. La promesa resuelve con los datos frescos (o los viejos si falla la red
 * y había copia).
 */
export function swr<T>(
  clave: string,
  cargar: () => Promise<T>,
  { ttlMs = 60_000, onFresh }: SwrOpciones<T> = {},
): { cached: T | null; fresh: Promise<T> } {
  const guardado = leer<T>(clave)
  const fresco = guardado && Date.now() - guardado.en < ttlMs

  if (fresco) return { cached: guardado.datos, fresh: Promise.resolve(guardado.datos) }

  let promesa = enVuelo.get(clave) as Promise<T> | undefined
  if (!promesa) {
    promesa = cargar()
      .then((datos) => {
        escribir(clave, datos)
        onFresh?.(datos)
        return datos
      })
      .catch((err) => {
        if (guardado) return guardado.datos
        throw err
      })
      .finally(() => enVuelo.delete(clave))
    enVuelo.set(clave, promesa)
  } else if (onFresh) {
    promesa.then(onFresh).catch(() => {})
  }

  return { cached: guardado?.datos ?? null, fresh: promesa }
}

/** Tras escribir hay que tirar lo cacheado, o el editor ve el estado de antes. */
export function swrInvalidar(prefijo: string) {
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const k = sessionStorage.key(i)
    if (k && k.startsWith(PREFIJO + prefijo)) sessionStorage.removeItem(k)
  }
}
