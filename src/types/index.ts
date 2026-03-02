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
  role: 'superadmin' | 'admin' | 'collaborator'
}

export interface LoginResponse {
  message: string
  user: AuthUser
  token: string
}

