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
  | 'content_manager'
  | 'account_manager'
  | 'community_manager'
  | 'editor'
  | 'productor'
  | 'disenador'
  | 'copywriter'
  | 'analista'
  | 'desarrollador'

export interface AuthUser {
  _id: string
  name?: string
  email: string
  role: 'superadmin' | 'user'
  isInternal?: boolean
  internalRole?: InternalRole
  workspaceId?: string
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
    pageId: string
    pageName: string
    adAccountId?: string
    adAccountName?: string
    lastSyncedAt: string
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

// ── User types ───────────────────────────────────────────
export interface WorkspaceUser {
  _id: string
  name?: string
  email: string
  role: 'admin' | 'colaborador' | 'user'
  isInternal?: boolean
  internalRole?: InternalRole
  workspaceId?: string
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
