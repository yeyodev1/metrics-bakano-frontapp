import APIBase from './httpBase'
import type { LoginPayload, LoginResponse } from '@/types'

class AuthService extends APIBase {
  /**
   * POST /api/auth/login
   * Returns user data and JWT token from the backend.
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    // Public endpoint — no Authorization header needed
    const publicHeaders = { 'Content-Type': 'application/json' }

    const response = await this.post<LoginResponse>('auth/login', payload, publicHeaders)
    return response.data
  }

  /**
   * GET /api/auth/me
   * Returns current user data.
   */
  async me(): Promise<{ message: string; user: AuthUser }> {
    const response = await this.get<{ message: string; user: AuthUser }>('auth/me')
    return response.data
  }
}

// Singleton — one instance shared across the app
export const authService = new AuthService()
