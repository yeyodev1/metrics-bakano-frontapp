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
  /** Hook 2 aparte; solo si el guión se generó con doble hook separado. */
  hook2?: string
  cuerpo: string
  /** Cierre por defecto. Los guiones viejos solo tienen este. */
  cta: string
  /** Cierre suave para el feed: comentar, guardar, seguir. */
  ctaFeed?: string
  /** Cierre duro para pauta: una sola acción comercial. */
  ctaAds?: string
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
  /** Archivo maestro en Drive (entrega al cliente). */
  driveFileId?: string
  driveLink?: string
  /** Revision interna del video editado (visto bueno del PM/CM). */
  edicionRevisada?: boolean
  edicionRevisadaNombre?: string
  edicionRevisadaEn?: string
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
  /** Contenido dio por terminada la planificación; habilita "Notificar al cliente". */
  listaParaCliente?: boolean
  clienteAprobado: boolean
  clienteAprobadoAt?: string
  clienteAprobadoPor?: string
  /** Carpeta del mes en Drive con los archivos maestros. */
  driveMonthFolderId?: string
  driveMonthFolderLink?: string
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

// ── Avisos al cliente ───────────────────────────────────────────────────────

export type TipoAviso = 'enviada' | 'recordatorio' | 'revisada'

/** Un destinatario, con el teléfono tal como está guardado y ya normalizado. */
export interface UsuarioAviso {
  id: string
  nombre: string
  apellido: string
  correo: string
  telefono: string
  extension: string
  /** Vacío cuando no hay número usable: ese es el que hay que cargar. */
  telefonoE164: string
  esAdmin: boolean
}

export interface DestinatariosAviso {
  entorno: string
  totalVideos: number
  tipoAviso: TipoAviso
  numeroEnvio: number
  puedeNotificar: boolean
  /** Todos los usuarios cliente del entorno. */
  correo: UsuarioAviso[]
  /** Solo administradores: son quienes aprueban. */
  whatsapp: UsuarioAviso[]
}

export interface NotificacionRegistro {
  canal: 'whatsapp' | 'email'
  enviadoEn: string
  porNombre?: string
  exito: boolean
  error?: string
  abiertoEn?: string
  clicEn?: string
}

export interface HistorialAvisos {
  puedeNotificar: boolean
  notificaciones: NotificacionRegistro[]
  resumen: {
    whatsapp: number
    email: number
    aperturas: number
    clics: number
    ultima: NotificacionRegistro | null
  }
}

export interface ResultadoNotificacion {
  tipoAviso: TipoAviso
  numeroEnvio: number
  whatsapp: { enviado: boolean; error?: string; contactos: { correo: string }[] }
  email: { enviado: boolean; error?: string; destinatarios: string[] }
}

/** Planificación que un entorno tiene sin aprobar, para aterrizar desde WhatsApp. */
export interface PlanificacionPendiente {
  planningId: string
  planningEntryId: string
  workspaceId: string
  totalVideos: number
  pendientes: number
  creadaEn: string
  mes: number | null
  anio: number | null
  ultimaNotificacion: string | null
}
