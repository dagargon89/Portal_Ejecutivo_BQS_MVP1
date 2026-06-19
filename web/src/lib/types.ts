/**
 * API contract types — Portal Ejecutivo BQS (base path /api/v1).
 *
 * Success envelope:   { "data": ... }  (+ "meta" on collections)
 * Error envelope:     { "error": { "code", "message", "fields"? } }
 */

/** Standard success envelope for a single resource. */
export interface ApiEnvelope<T> {
  data: T
}

/** Pagination metadata returned on collection endpoints. */
export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

/** Standard success envelope for a paginated collection. */
export interface ApiCollectionEnvelope<T> {
  data: T[]
  meta: PaginationMeta
}

/** Standard error envelope. */
export interface ApiError {
  code: string
  message: string
  fields?: Record<string, string>
}

export interface ApiErrorEnvelope {
  error: ApiError
}

/** Known backend error codes used by the auth + admin flows. */
export type ApiErrorCode =
  | 'BAD_CREDENTIALS'
  | 'NOT_WHITELISTED'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'

/** Roles defined in the system. */
export type Rol = 'direccion' | 'capturista' | 'facturacion' | 'admin'

/** User shape returned by POST /auth/login. */
export interface UsuarioLogin {
  id: number
  correo: string
  nombre: string
  roles: string[]
}

/** Full user shape returned by GET /auth/me. */
export interface Usuario {
  id: number
  correo: string
  nombre: string
  roles: string[]
  solo_lectura: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  usuario: UsuarioLogin
}

export interface RefreshResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

/** A whitelist entry (GET /admin/whitelist). */
export interface WhitelistEntry {
  id: number
  correo: string
  activo: boolean
  creado_en: string
}
