import type { PaceStatus } from '@/services/internalPulse.service'

export function money(value: number, compacto = false): string {
  if (compacto && Math.abs(value) >= 1000) {
    return `$${(value / 1000).toLocaleString('es-EC', { maximumFractionDigits: 1 })}k`
  }
  return `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function pct(value: number, decimales = 0): string {
  return `${value.toLocaleString('es-EC', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}%`
}

/** "2026-08-14" → "14 ago". Se corta el día del string para no cruzar zonas. */
export function diaCorto(dateStr: string): string {
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${meses[m - 1]}`
}

export function nombreMes(month: number): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  return meses[month - 1] ?? ''
}

export const ESTADO_LABEL: Record<PaceStatus, string> = {
  sin_meta: 'Sin meta definida',
  atrasado: 'Atrasado',
  en_linea: 'En línea',
  adelante: 'Adelante',
  cumplida: 'Meta cumplida',
}

export const ESTADO_ICONO: Record<PaceStatus, string> = {
  sin_meta: 'fa-solid fa-bullseye',
  atrasado: 'fa-solid fa-arrow-trend-down',
  en_linea: 'fa-solid fa-equals',
  adelante: 'fa-solid fa-arrow-trend-up',
  cumplida: 'fa-solid fa-trophy',
}

const ROLES: Record<string, string> = {
  director: 'Dirección',
  estratega: 'Estratega',
  project_manager: 'Project Manager',
  content_manager: 'Content Manager',
  account_manager: 'Account Manager',
  community_manager: 'Community Manager',
  productor: 'Productor',
  asistente_produccion: 'Asistente de producción',
  editor: 'Editor',
  disenador: 'Diseñador',
  copywriter: 'Copywriter',
  analista: 'Analista',
  desarrollador: 'Desarrollador',
  trafficker: 'Trafficker',
  sales_executive: 'Ejecutivo comercial',
}

export function rolLabel(rol?: string): string {
  if (!rol) return 'Equipo'
  return ROLES[rol] ?? rol
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
