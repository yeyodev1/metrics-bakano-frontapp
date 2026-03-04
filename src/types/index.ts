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

export interface AuthUser {
  _id: string
  name?: string
  email: string
  role: 'superadmin' | 'user'
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
}

// ── User types ───────────────────────────────────────────
export interface WorkspaceUser {
  _id: string
  name?: string
  email: string
  role: 'admin' | 'colaborador'
  workspaceId: string
  isActive: boolean
  createdAt: string
}

export interface CreateUserPayload {
  name?: string
  email: string
  password: string
  role: 'admin' | 'colaborador'
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  role?: 'admin' | 'colaborador'
}

export interface UserResponse {
  message: string
  user: WorkspaceUser
}

export interface UserListResponse {
  message: string
  users: WorkspaceUser[]
}


