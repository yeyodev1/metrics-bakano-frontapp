import axios from 'axios'
import type { AxiosResponse, AxiosRequestConfig } from 'axios'
import { resolveApiOrigin } from '@/config/api'

/**
 * Avisa del estado de la red a quien quiera escuchar. Se usa `CustomEvent` por
 * lo mismo que `auth:token-expired`: los servicios no conocen a los componentes.
 *
 * Solo se avisa de conexión perdida. Hubo una versión que además avisaba de
 * "conexión lenta" pasados unos segundos, y como aquí hay endpoints que tardan
 * eso de forma normal (Meta, Tumesero), el aviso salía casi siempre: un cartel
 * permanente no informa de nada.
 */
function avisarRed(evento: 'net:up') {
  window.dispatchEvent(new CustomEvent(evento))
}

class APIBase {
  private baseUrl: string
  private axiosInstance = axios.create()

  constructor() {
    const origen = resolveApiOrigin()
    this.baseUrl = origen.baseUrl

    if (origen.aviso) console.warn(`[api] ${origen.aviso}`)
    // Saber contra qué backend se está hablando evita media hora de confusión
    // cuando los datos no son los que se esperaban.
    if (import.meta.env.DEV) {
      console.info(`[api] ${origen.entorno} → ${this.baseUrl}`)
    }

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.timeout = config.timeout || 15000
        return config
      },
      (error) => Promise.reject(error),
    )

    this.axiosInstance.interceptors.response.use(
      (response) => {
        avisarRed('net:up')
        return response
      },
      (error) => {
        const requestHadToken = !!error.config?.headers?.['Authorization']
        if (error.response?.status === 401 && requestHadToken) {
          window.dispatchEvent(new CustomEvent('auth:token-expired'))
        }

        // Sin `response` no hubo servidor al otro lado. Un 500 no cuenta: ese
        // llegó y es problema del backend, no de la conexión del usuario.
        if (!error.response) {
          // Agotar los 15s no prueba que no haya red: pasa con endpoints
          // pesados (Meta, Tumesero) sobre una conexión que funciona. Decirle
          // "sin conexión" a alguien que sí la tiene es peor que no decir nada,
          // así que un timeout no avisa de nada.
          const esTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          if (!esTimeout) window.dispatchEvent(new CustomEvent('net:down'))
        }
        return Promise.reject(error)
      },
    )
  }

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    return headers
  }

  protected async get<T>(
    endpoint: string,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    try {
      return await this.axiosInstance.get<T>(url, {
        headers: headers || this.getHeaders(),
        ...config,
      })
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || error.message,
          data: error.response.data,
        }
      }
      throw { status: 500, message: 'Unknown error' }
    }
  }

  protected async post<T>(
    endpoint: string,
    data: unknown,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    const isFormData = data instanceof FormData
    const finalHeaders = headers || this.getHeaders()

    if (isFormData) {
      delete finalHeaders['Content-Type']
    }

    try {
      return await this.axiosInstance.post<T>(url, data, {
        headers: finalHeaders,
        ...config,
      })
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || error.message,
          data: error.response.data,
        }
      }
      throw { status: 500, message: 'Unknown error' }
    }
  }

  protected async put<T>(
    endpoint: string,
    data: unknown,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    try {
      return await this.axiosInstance.put<T>(url, data, {
        headers: headers || this.getHeaders(),
        ...config,
      })
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || error.message,
          data: error.response.data,
        }
      }
      throw { status: 500, message: 'Unknown error' }
    }
  }

  protected async patch<T>(
    endpoint: string,
    data: unknown,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    try {
      return await this.axiosInstance.patch<T>(url, data, {
        headers: headers || this.getHeaders(),
        ...config,
      })
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || error.message,
          data: error.response.data,
        }
      }
      throw { status: 500, message: 'Unknown error' }
    }
  }

  protected async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    try {
      return await this.axiosInstance.delete<T>(url, {
        headers: headers || this.getHeaders(),
        ...config,
      })
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw {
          status: error.response.status,
          message: error.response.data?.message || error.message,
          data: error.response.data,
        }
      }
      throw { status: 500, message: 'Unknown error' }
    }
  }
}

export default APIBase
