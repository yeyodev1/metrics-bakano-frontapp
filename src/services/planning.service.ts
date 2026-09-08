import APIBase from './httpBase'
import type {
  PlanningEntryResponse,
  PlanningEntryListResponse,
  CreatePlanningEntryPayload,
  UpdatePlanningEntryPayload,
  GlobalPlanningWeekResponse,
  MonthlyProductionStatusResponse,
} from '@/types'
import type { ScriptRef } from '@/types/videoPlanning'

class PlanningService extends APIBase {
  /**
   * Planificaciones del mes de TODOS los entornos del usuario en una sola
   * peticion. El calendario del editor hacia una por cliente.
   */
  async listMine(params: { startDate: string; endDate: string }): Promise<PlanningEntryListResponse> {
    const res = await this.get<PlanningEntryListResponse>('planning/mine', undefined, { params })
    return res.data
  }

  async listEntries(
    workspaceId: string,
    params: { startDate?: string; endDate?: string } = {},
  ): Promise<PlanningEntryListResponse> {
    const res = await this.get<PlanningEntryListResponse>(`planning/${workspaceId}`, undefined, {
      params,
    })
    return res.data
  }

  async createEntry(
    workspaceId: string,
    payload: CreatePlanningEntryPayload,
  ): Promise<PlanningEntryResponse> {
    const res = await this.post<PlanningEntryResponse>(`planning/${workspaceId}`, payload)
    return res.data
  }

  async updateEntry(
    entryId: string,
    payload: UpdatePlanningEntryPayload,
  ): Promise<PlanningEntryResponse> {
    const res = await this.put<PlanningEntryResponse>(`planning/${entryId}`, payload)
    return res.data
  }

  async deleteEntry(entryId: string): Promise<void> {
    await this.delete(`planning/${entryId}`)
  }
  /**
   * Trae en vivo las citas de producción del CRM del rango visible. Devuelve
   * cuántas cambiaron para que el calendario recargue solo si hace falta.
   */
  async syncCrm(params: { startDate: string; endDate: string }): Promise<{ cambios: number; omitido?: string; error?: string }> {
    const res = await this.post<{ cambios: number; omitido?: string; error?: string }>(
      'planning/crm-sync',
      undefined,
      { params, timeout: 30000 },
    )
    return res.data
  }

  /** Producción del mes cumplida o pendiente, por entorno. */
  async monthlyStatus(params: { year: number; month: number }): Promise<MonthlyProductionStatusResponse> {
    const res = await this.get<MonthlyProductionStatusResponse>('planning/monthly-status', undefined, { params })
    return res.data
  }

  async listMyWeek(
    params: { startDate: string; endDate: string },
  ): Promise<GlobalPlanningWeekResponse> {
    const res = await this.get<GlobalPlanningWeekResponse>('planning/my-week', undefined, { params })
    return res.data
  }

  async listGlobal(
    params: { startDate: string; endDate: string },
  ): Promise<GlobalPlanningWeekResponse> {
    const res = await this.get<GlobalPlanningWeekResponse>('planning/my-week', undefined, { params })
    return res.data
  }

  async uploadItemMedia(itemId: string, file: File): Promise<{ url: string; mediaType: 'video' | 'image' }> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await this.post<{ url: string; mediaType: 'video' | 'image' }>(
      `video-planning/items/${itemId}/upload-media`,
      fd,
    )
    return res.data
  }

  /**
   * Adjunta una imagen o PDF como referencia del guión de ese video. `leePorIA`
   * viene en false si Gemini rechazó el archivo: se ve en la app, pero no
   * alimenta al guión.
   */
  async uploadScriptRef(
    itemId: string,
    file: File,
  ): Promise<{ ref: ScriptRef; leePorIA: boolean }> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await this.post<{ ref: ScriptRef; leePorIA: boolean }>(
      `video-planning/items/${itemId}/script-refs`,
      fd,
    )
    return res.data
  }

  async deleteScriptRef(itemId: string, refId: string): Promise<void> {
    await this.delete(`video-planning/items/${itemId}/script-refs/${refId}`)
  }
}

export const planningService = new PlanningService()
