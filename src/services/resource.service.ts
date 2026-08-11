import APIBase from './httpBase'
import type { Resource, ResourceListResponse, ResourceUploadResponse } from '@/types'

class ResourceService extends APIBase {
  async getResources(workspaceId: string): Promise<Resource[]> {
    const res = await this.get<ResourceListResponse>(`workspaces/${workspaceId}/resources`)
    return res.data.resources
  }

  // 'catalogo' es una categoría válida del modelo y faltaba aquí, así que la
  // pantalla de recursos subía los catálogos como 'otro' y quedaban invisibles
  // para el perfil de marca, que lee 'catalogo'.
  async uploadResource(
    workspaceId: string,
    file: File,
    categoria: 'logo' | 'linea_grafica' | 'catalogo' | 'otro',
  ): Promise<Resource> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('categoria', categoria)
    const res = await this.post<ResourceUploadResponse>(`workspaces/${workspaceId}/resources`, fd)
    return res.data.resource
  }

  async deleteResource(workspaceId: string, resourceId: string): Promise<void> {
    await this.delete(`workspaces/${workspaceId}/resources/${resourceId}`)
  }
}

export const resourceService = new ResourceService()
