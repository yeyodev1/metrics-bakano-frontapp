import { defineStore } from 'pinia'

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  role: string | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    role: null,
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
    },

    setUser(payload: { id?: string; name?: string; email?: string; role?: string }) {
      try {
        if (payload.id !== undefined) { this.id = payload.id; localStorage.setItem('user_id', payload.id) }
        if (payload.email !== undefined) { this.email = payload.email; localStorage.setItem('user_email', payload.email) }
        if (payload.role !== undefined) { this.role = payload.role; localStorage.setItem('user_role', payload.role) }
        if (payload.name !== undefined) { this.name = payload.name; localStorage.setItem('user_name', payload.name) }
      } catch { /* localStorage unavailable */ }
      this.isAuthenticated = true
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.role = null
      this.isAuthenticated = false
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_email')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_name')
      } catch { /* localStorage unavailable */ }
    },
  },
})
