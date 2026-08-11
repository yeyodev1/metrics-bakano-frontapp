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

export type TipoGuion = 'TOFU' | 'MOFU' | 'BOFU'

/** Where the script will run. Independent from the funnel stage. */
export type ObjetivoGuion = 'feed' | 'anuncio'

export type HookType =
  | 'pregunta'
  | 'dato'
  | 'testimonio'
  | 'polemica'
  | 'pov'
  | 'problema'
  | 'oferta'

export type FormatoContenido = 'reel' | 'carrusel' | 'estatico' | 'historia'

/** Structural attributes of a script — what the Pareto engine groups by. */
export interface ScriptMeta {
  objetivo?: ObjetivoGuion
  hookType?: HookType
  formato?: FormatoContenido
  duracionSeg?: number
  elementos?: {
    testimonio?: boolean
    autoridad?: boolean
    oferta?: boolean
    ctaExplicito?: boolean
    problemaNecesidad?: boolean
  }
  clasificadoPor?: 'ia' | 'humano'
  clasificadoEn?: string
}

export enum TipoReel {
  EDUCATIVO = 'Educativo',
  VENTA = 'Venta',
  CREACION_VALOR = 'Creación de valor',
}

export interface GuionIA {
  conceptoVisual: string
  gancho: string
  textoPantalla: string
  cuerpo: string
  cta: string
  broll: string
  generadoEn?: string
  contextoMes?: {
    productoMes?: string
    ofertaEspecial?: string
    referenciasAdicionales?: string
  }
}

export interface VideoItemMetrics {
  views?: number
  reach?: number
  impressions?: number
  likes?: number
  comments?: number
  saved?: number
  shares?: number
  adSpend?: number
  adROAS?: number
  lastSyncedAt?: string
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
  tipoGuion?: TipoGuion
  scriptMeta?: ScriptMeta
  guionIA?: GuionIA
  casoUsoRef?: number
  estadoIdea: EstadoIdea
  estadoProduccion: EstadoProduccion
  edicion: EstadoEdicion
  estadoPublicacion: EstadoPublicacion
  comentario?: string
  clienteAprobacion: ClienteAprobacion
  motivoRechazo?: string
  linkVideo?: string
  fechaPublicacion?: string
  copyPublicacion?: string
  order: number
  igMediaId?: string
  igPermalink?: string
  metaAdId?: string
  metrics?: VideoItemMetrics
  igContainerId?: string
  igScheduleStatus?: 'SCHEDULED' | 'FAILED'
  igScheduleError?: string
  fbPostId?: string
  fbScheduleStatus?: 'SCHEDULED' | 'FAILED'
  fbScheduleError?: string
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

/** A Meta ad, as offered in the linking picker. */
export interface MetaAdOption {
  id: string
  name: string
  status: string | null
  createdTime: string | null
  thumbnailUrl: string | null
  storyId: string | null
  spend: number
  impressions: number
  reach: number
  clicks: number
  leads: number
  roas: number
}

/** A script plus the planning document it belongs to. */
export interface WorkspaceVideoItem extends VideoItem {
  planningId: string
  planningEntryId: string
  /** Stands in for the publish date when the item has none. */
  planningCreatedAt?: string
}

export interface CreateVideoItemPayload {
  tema: string
  descripcion?: string
  tipo?: string
  tipoGuion?: TipoGuion
  scriptMeta?: ScriptMeta
  casoUsoRef?: number
  linkEjemplo?: string
  recursos?: string
  lugarGrabacion?: string
  guion?: string
  estadoIdea?: EstadoIdea
  estadoProduccion?: EstadoProduccion
  edicion?: EstadoEdicion
  estadoPublicacion?: EstadoPublicacion
  comentario?: string
  linkVideo?: string
  fechaPublicacion?: string
  copyPublicacion?: string
}

export interface UpdateVideoItemPayload {
  tema?: string
  descripcion?: string
  tipo?: string
  tipoGuion?: TipoGuion
  linkEjemplo?: string
  recursos?: string
  lugarGrabacion?: string
  guion?: string
  estadoIdea?: EstadoIdea
  estadoProduccion?: EstadoProduccion
  edicion?: EstadoEdicion
  estadoPublicacion?: EstadoPublicacion
  comentario?: string
  linkVideo?: string
  fechaPublicacion?: string
  copyPublicacion?: string
  publishToInstagram?: boolean
  publishToFacebook?: boolean
}

export interface ClientApprovalPayload {
  approvals: { itemId: string; clienteAprobacion: ClienteAprobacion; motivoRechazo?: string }[]
}

export interface VideoCalendarItem {
  _id: string
  planningId: string
  entryId: string
  workspaceId: string
  numero: number
  tema: string
  tipo?: string
  estadoPublicacion: EstadoPublicacion
  edicion: EstadoEdicion
  estadoProduccion: EstadoProduccion
  clienteAprobacion: ClienteAprobacion
  linkVideo?: string
  fechaPublicacion: string
  copyPublicacion?: string
}

export interface VideoCalendarResponse {
  items: VideoCalendarItem[]
}
