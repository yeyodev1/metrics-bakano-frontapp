/**
 * Normaliza texto para comparar sin distinguir acentos ni mayúsculas.
 * "Construmía" y "construmia" deben coincidir en cualquier buscador.
 */
export function normalizarTexto(texto: string | null | undefined): string {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** true si `texto` contiene `busqueda`, ignorando acentos y mayúsculas. */
export function contieneTexto(texto: string | null | undefined, busqueda: string): boolean {
  return normalizarTexto(texto).includes(normalizarTexto(busqueda))
}
