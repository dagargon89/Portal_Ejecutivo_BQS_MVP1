import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { clearAccessToken, getAccessToken, setAccessToken } from './auth'
import type { ApiEnvelope, ApiErrorEnvelope, RefreshResponse } from './types'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** Cliente HTTP de la SPA. `withCredentials` envia la cookie HttpOnly de refresh. */
export const api = axios.create({ baseURL, withCredentials: true })

// --- Request: adjunta el Bearer en memoria ---
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token !== null) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Callback al fallar definitivamente la sesion (lo fija AuthProvider) ---
let onAuthFailure: (() => void) | null = null
export function setOnAuthFailure(callback: () => void): void {
  onAuthFailure = callback
}

// --- Refresh con candado single-flight (varios 401 disparan UN solo refresh) ---
let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post<ApiEnvelope<RefreshResponse>>(
      `${baseURL}/v1/auth/refresh`,
      null,
      { withCredentials: true },
    )
    const token = response.data.data.access_token
    setAccessToken(token)
    return token
  } catch {
    clearAccessToken()
    return null
  }
}

// --- Response: ante 401 intenta refresh y reintenta la peticion una vez ---
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const status = error.response?.status
    const url = original?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh')

    if (status === 401 && original !== undefined && original._retried !== true && !isAuthEndpoint) {
      original._retried = true
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null
      })
      const token = await refreshing
      if (token !== null) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
      onAuthFailure?.()
    }

    return Promise.reject(error)
  },
)

/** Extrae el `code` del envelope de error de la API, si lo hay. */
export function errorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorEnvelope | undefined
    return data?.error?.code ?? null
  }
  return null
}

/** Errores por campo (validación) del envelope de error, si los hay. */
export function errorFields(error: unknown): Record<string, string> | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorEnvelope | undefined
    return data?.error?.fields ?? null
  }
  return null
}

/** Mensaje legible: prioriza el del envelope de error; cae a Error.message. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorEnvelope | undefined
    if (data?.error?.message) return data.error.message
    if (error.message) return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return 'Ocurrió un error inesperado.'
}
