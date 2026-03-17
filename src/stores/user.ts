import { defineStore } from 'pinia'

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  role: string | null
  workspaceId: string | null
  workspaces: Array<{ workspaceId: string; role: 'admin' | 'colaborador' }> | null
  internalRole: string | null
  isInternal: boolean
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    role: null,
    workspaceId: null,
    workspaces: null,
    internalRole: null,
    isInternal: false,
    isAuthenticated: false,
  }),

  actions: {
    // Called once on app boot — restores session from localStorage
    hydrate() {
      const token = localStorage.getItem('access_token')
      if (!token) return

      this.isAuthenticated = true
      this.id = localStorage.getItem('user_id')
      this.email = localStorage.getItem('user_email')
      this.role = localStorage.getItem('user_role')
      this.name = localStorage.getItem('user_name')
      this.workspaceId = localStorage.getItem('user_workspaceId')
      this.isInternal = localStorage.getItem('user_isInternal') === 'true'
      this.internalRole = localStorage.getItem('user_internalRole')

      // Fallback: decode internalRole from JWT if localStorage is missing it
      if (!this.internalRole) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1])) as { internalRole?: string }
          if (payload.internalRole) {
            this.internalRole = payload.internalRole
            localStorage.setItem('user_internalRole', payload.internalRole)
          }
        } catch { /* silent */ }
      }
      
      const ws = localStorage.getItem('user_workspaces')
      if (ws) {
        try {
          this.workspaces = JSON.parse(ws)
        } catch {
          this.workspaces = null
        }
      }
    },

    setUser(payload: { id?: string; name?: string; email?: string; role?: string; workspaceId?: string; isInternal?: boolean; internalRole?: string; workspaces?: Array<{ workspaceId: string; role: 'admin' | 'colaborador' }> }) {
      try {
        if (payload.id !== undefined) { this.id = payload.id; localStorage.setItem('user_id', payload.id) }
        if (payload.email !== undefined) { this.email = payload.email; localStorage.setItem('user_email', payload.email) }
        if (payload.role !== undefined) { this.role = payload.role; localStorage.setItem('user_role', payload.role) }
        if (payload.name !== undefined) { this.name = payload.name; localStorage.setItem('user_name', payload.name) }
        if (payload.workspaceId !== undefined) { this.workspaceId = payload.workspaceId; localStorage.setItem('user_workspaceId', payload.workspaceId) }
        if (payload.workspaces !== undefined) {
          this.workspaces = payload.workspaces as any
          localStorage.setItem('user_workspaces', JSON.stringify(payload.workspaces))
        }
        if (payload.isInternal !== undefined) {
          this.isInternal = payload.isInternal
          localStorage.setItem('user_isInternal', String(payload.isInternal))
        }
        if (payload.internalRole !== undefined) {
          this.internalRole = payload.internalRole
          localStorage.setItem('user_internalRole', String(payload.internalRole))
        }
      } catch { /* localStorage unavailable */ }
      this.isAuthenticated = true
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.role = null
      this.internalRole = null
      this.isInternal = false
      this.isAuthenticated = false
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_email')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_name')
        localStorage.removeItem('user_workspaceId')
        localStorage.removeItem('user_workspaces')
        localStorage.removeItem('user_isInternal')
        localStorage.removeItem('user_internalRole')
      } catch { /* localStorage unavailable */ }
    },
  },
})
