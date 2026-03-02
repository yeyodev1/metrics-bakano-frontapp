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
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'colaborador'
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
    email: string
    role: string
    isActive: boolean
  } | null
  isActive: boolean
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

// ── Admin types ───────────────────────────────────────────
export interface WorkspaceAdmin {
  _id: string
  email: string
  role: 'admin'
  workspaceId: string
  isActive: boolean
  createdAt: string
}

export interface CreateAdminPayload {
  email: string
  password: string
}

export interface AdminResponse {
  message: string
  admin: WorkspaceAdmin
}

export interface AdminListResponse {
  message: string
  admins: WorkspaceAdmin[]
}

