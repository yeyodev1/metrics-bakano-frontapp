export interface ApiError {
  status: number
  message: string
  data?: unknown
}

// ── Auth types ────────────────────────────────────────────
export interface LoginPayload {
  email: string
  password: string
}

export type InternalRole =
  | 'director'
  | 'estratega'
  | 'project_manager'
  | 'content_manager'
  | 'account_manager'
  | 'community_manager'
  | 'editor'
  | 'productor'
  | 'disenador'
  | 'copywriter'
  | 'analista'
  | 'desarrollador'
  | 'asistente_produccion'
  | 'trafficker'
  | 'sales_executive'

export interface AuthUser {
  _id: string
  name?: string
  email: string
  role: 'superadmin' | 'user'
  isInternal?: boolean
  internalRole?: InternalRole
  workspaceId?: string
  presentationVideoUrl?: string
  photoUrl?: string
  workspaces?: Array<{
    workspaceId: string
    role: 'admin' | 'colaborador'
  }>
}

export interface LoginResponse {
  message: string
  user: AuthUser
  token: string
}

// ── Workspace types ───────────────────────────────────────
export interface BrandProfileFile {
  _id?: string
  nombre: string
  url: string
  publicId: string
  tipo: string
}

export interface CustomerJourneyCase {
  casoNumero: number
  nombreCaso?: string
  potencialCliente: string
  efectoAnuncio: string
  accionEsperada: string
}

export interface SegmentoMercado {
  nombre: string
  descripcion: string
}

export interface BrandProfile {
  descripcion?: string
  tipoNegocio?: 'SERVICIOS' | 'PRODUCTOS'
  vertical?: string
  publicoObjetivo?: string
  propuestaValor?: string
  tono?: string
  productosServicios?: string
  problemaResuelto?: string
  trafficDirection?: 'WHATSAPP' | 'GHL'
  trafficLink?: string
  archivos?: BrandProfileFile[]
  segmentosMercado?: SegmentoMercado[]
  canalesDetail?: string[]
  actividadesClave?: string[]
  customerJourneyCases?: CustomerJourneyCase[]
  updatedAt?: string
}

export interface Resource {
  _id: string
  nombre: string
  url: string
  publicId: string
  tipo: string
  categoria: 'logo' | 'linea_grafica' | 'catalogo' | 'otro'
  uploadedBy: string
  createdAt: string
}

export interface ResourceListResponse {
  resources: Resource[]
}

export interface ResourceUploadResponse {
  message: string
  resource: Resource
}

export interface OnboardingStatus {
  videoGenesisAccepted: boolean
  contractSubmitted: boolean
  resourcesCompleted: boolean
  meetingScheduled: boolean
}

export interface OnboardingStatusResponse {
  onboardingStatus: OnboardingStatus
  preNegotiatedContract?: any
}

export interface Workspace {
  _id: string
  name: string
  adminId?: {
    _id: string
    name?: string
    email: string
    role: string
    isActive: boolean
  } | null
  isActive: boolean
  metaAds?: {
    accessToken: string
    pageAccessToken?: string
    pageId?: string
    pageName?: string
    adAccountId?: string
    adAccountName?: string
    instagramAccountId?: string
    instagramAccountName?: string
    pictureUrl?: string
    lastSyncedAt?: string
  }
  brandProfile?: BrandProfile
  brandProfileInviteSentAt?: string
  onboardingStatus?: OnboardingStatus
  contractData?: {
    pdfUrl?: string
    [key: string]: any
  }
  userRole?: 'admin' | 'colaborador'
  createdAt: string
  updatedAt: string
}

export interface WorkspaceResponse {
  message: string
  workspace: Workspace
}

export interface WorkspaceListResponse {
  message: string
  workspaces: Workspace[]
  metadata?: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

// ── Branch types ─────────────────────────────────────────
export interface IBranch {
  _id: string
  workspaceId: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BranchResponse {
  message: string
  branch: IBranch
}

export interface BranchListResponse {
  message: string
  branches: IBranch[]
}

// ── User types ───────────────────────────────────────────
export interface WorkspaceUser {
  _id: string
  name?: string
  email: string
  role: 'admin' | 'colaborador' | 'user'
  isInternal?: boolean
  internalRole?: InternalRole
  workspaceId?: string
  presentationVideoUrl?: string
  photoUrl?: string
  workspaces?: {
    workspaceId: {
      _id: string
      name: string
    }
    role: 'admin' | 'colaborador'
  }[]
  isActive: boolean
  phoneNumber?: string
  phoneExtension?: string
  createdAt: string
}

export interface CreateUserPayload {
  name?: string
  email: string
  password: string
  role: 'admin' | 'colaborador'
  isInternal?: boolean
  phoneNumber?: string
  phoneExtension?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  role?: 'admin' | 'colaborador'
  phoneNumber?: string
  phoneExtension?: string
  isInternal?: boolean
}

export interface CreateGlobalUserPayload {
  name?: string
  email: string
  password?: string
  isInternal?: boolean
  internalRole?: InternalRole
  workspaces: {
    workspaceId: string
    role: 'admin' | 'colaborador'
  }[]
  phoneNumber?: string
  phoneExtension?: string
  sendWelcomeEmail?: boolean
}

export interface UpdateGlobalUserPayload {
  name?: string
  email?: string
  password?: string
  workspaces?: {
    workspaceId: string
    role: 'admin' | 'colaborador'
  }[]
  phoneNumber?: string
  phoneExtension?: string
  isInternal?: boolean
  internalRole?: InternalRole | null
}

export interface UserResponse {
  message: string
  user: WorkspaceUser
}

export interface UserListResponse {
  message: string
  users: WorkspaceUser[]
}



// ── Planning types ──────────────────────────────────────────
export interface PlanningEntry {
  _id: string
  workspaceId: string
  title: string
  date: string
  notes?: string
  assignedTo?: {
    _id: string
    name?: string
    email: string
    internalRole?: string
  }[]
  createdBy: string
  createdAt: string
  updatedAt: string
  /** Solo en /planning/mine: nombre y logo del entorno ya resueltos. */
  workspaceName?: string
  workspacePhoto?: string | null
}

export interface PlanningEntryResponse {
  message: string
  entry: PlanningEntry
}

export interface PlanningEntryListResponse {
  message: string
  entries: PlanningEntry[]
}

export interface CreatePlanningEntryPayload {
  title: string
  date: string
  time?: string
  notes?: string
  assignedTo?: string[]
}

export interface UpdatePlanningEntryPayload {
  title?: string
  date?: string
  time?: string
  notes?: string
  assignedTo?: string[]
}

// Entry returned by the global /my-week endpoint (includes workspace name + optional Meta page id)
export interface GlobalPlanningEntry extends PlanningEntry {
  workspaceName: string
  workspaceMetaPageId?: string
}

export interface GlobalPlanningWeekResponse {
  message: string
  entries: GlobalPlanningEntry[]
}

// ── Client Meetings ─────────────────────────────────────────
export interface ClientMeetingWorkspace {
  _id: string
  name: string
  metaAds?: { pageId?: string; pageName?: string }
}

export interface ClientMeeting {
  _id: string
  workspaceId: string
  pmUserId: string
  nextMeetingDate: string
  lastMeetingDate?: string
  intervalDays: number
  agenda?: string
  meetingLink?: string
  notes?: string
  recordingLink?: string
  contactUserId?: string
  contactName?: string
  contactEmail?: string
  workspace?: ClientMeetingWorkspace | null
  createdAt: string
  updatedAt: string
}

export interface MeetingListResponse {
  meetings: ClientMeeting[]
}

export interface MeetingResponse {
  meeting: ClientMeeting
}

export interface CreateMeetingPayload {
  workspaceId: string
  nextMeetingDate: string
  agenda?: string
  intervalDays?: number
  pmUserId?: string
  contactUserId?: string
  contactName?: string
  contactEmail?: string
  meetingLink?: string
  notes?: string
}

export interface UpdateMeetingPayload {
  nextMeetingDate?: string
  agenda?: string
  intervalDays?: number
  meetingLink?: string
  notes?: string
  contactUserId?: string
  contactName?: string
  contactEmail?: string
}

// ── Notifications ───────────────────────────────────────────
export type NotificationType =
  | 'new_client_assigned'
  | 'video_status_changed'
  | 'video_planning_resent'
  | 'billing_reminder'

export interface AppNotification {
  _id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  workspaceId?: string
  referenceId?: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationListResponse {
  notifications: AppNotification[]
}

export interface UnreadCountResponse {
  count: number
}
