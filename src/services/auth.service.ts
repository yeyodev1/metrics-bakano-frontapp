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

  /**
   * POST /api/auth/forgot-password
   * Responde igual exista o no el correo, a propósito.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await this.post<{ message: string }>(
      'auth/forgot-password',
      { email },
      { 'Content-Type': 'application/json' },
    )
    return res.data
  }

  /** Comprueba el enlace antes de pedir la contraseña nueva. */
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const res = await this.get<{ valid: boolean; email?: string }>(
      `auth/reset-password/${token}`,
    )
    return res.data
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const res = await this.post<{ message: string }>(
      'auth/reset-password',
      { token, password },
      { 'Content-Type': 'application/json' },
    )
    return res.data
  }
}

// Singleton — one instance shared across the app
export const authService = new AuthService()
