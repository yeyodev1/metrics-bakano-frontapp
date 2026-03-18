export enum EstadoIdea {
  APROBADO = 'APROBADO',
  POR_REVISAR = 'POR_REVISAR',
  RECHAZADO = 'RECHAZADO',
}

export enum EstadoProduccion {
  GRABADO = 'GRABADO',
  POR_GRABAR = 'POR_GRABAR',
  RECHAZADO = 'RECHAZADO',
}

export enum EstadoEdicion {
  EDITADO = 'EDITADO',
  POR_EDITAR = 'POR_EDITAR',
  RECHAZADO = 'RECHAZADO',
}

export enum EstadoPublicacion {
  PROGRAMADO = 'PROGRAMADO',
  PUBLICADO = 'PUBLICADO',
  POR_PUBLICAR = 'POR_PUBLICAR',
  DASH = '-',
}

export enum ClienteAprobacion {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

export interface VideoItem {
  _id: string
  numero: number
  tema: string
  descripcion?: string
  tipo?: string
  linkEjemplo?: string
  recursos?: string
  lugarGrabacion?: string
  guion?: string
  estadoIdea: EstadoIdea
  estadoProduccion: EstadoProduccion
  edicion: EstadoEdicion
  estadoPublicacion: EstadoPublicacion
  comentario?: string
  clienteAprobacion: ClienteAprobacion
  motivoRechazo?: string
  order: number
}

export interface VideoPlanning {
  _id: string
  planningEntryId: string
  workspaceId: string
  items: VideoItem[]
  clienteAprobado: boolean
  clienteAprobadoAt?: string
  clienteAprobadoPor?: string
  createdAt: string
  updatedAt: string
}

export interface VideoPlanningResponse {
  message: string
  planning: VideoPlanning
}

export interface CreateVideoItemPayload {
  tema: string
  descripcion?: string
  tipo?: string
  linkEjemplo?: string
  recursos?: string
  lugarGrabacion?: string
  guion?: string
  estadoIdea?: EstadoIdea
  estadoProduccion?: EstadoProduccion
  edicion?: EstadoEdicion
  estadoPublicacion?: EstadoPublicacion
  comentario?: string
}

export interface UpdateVideoItemPayload {
  tema?: string
  descripcion?: string
  tipo?: string
  linkEjemplo?: string
  recursos?: string
  lugarGrabacion?: string
  guion?: string
  estadoIdea?: EstadoIdea
  estadoProduccion?: EstadoProduccion
  edicion?: EstadoEdicion
  estadoPublicacion?: EstadoPublicacion
  comentario?: string
}

export interface ClientApprovalPayload {
  approvals: { itemId: string; clienteAprobacion: ClienteAprobacion; motivoRechazo?: string }[]
}
