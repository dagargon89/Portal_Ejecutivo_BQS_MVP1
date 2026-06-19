import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, errorCode, setOnAuthFailure } from '../lib/api'
import { clearAccessToken, setAccessToken } from '../lib/auth'
import type { ApiEnvelope, LoginResponse, RefreshResponse, Usuario } from '../lib/types'
import { AuthContext } from './auth-context'
import type { AuthState, LoginOutcome } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargarPerfil = useCallback(async () => {
    const me = await api.get<ApiEnvelope<Usuario>>('/v1/auth/me')
    setUsuario(me.data.data)
  }, [])

  const login = useCallback(
    async (correo: string, password: string): Promise<LoginOutcome> => {
      try {
        const resp = await api.post<ApiEnvelope<LoginResponse>>('/v1/auth/login', { correo, password })
        setAccessToken(resp.data.data.access_token)
        await cargarPerfil()
        return { ok: true }
      } catch (error) {
        clearAccessToken()
        return { ok: false, code: errorCode(error) ?? 'ERROR' }
      }
    },
    [cargarPerfil],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/v1/auth/logout')
    } catch {
      // El logout es idempotente; ignoramos errores de red.
    }
    clearAccessToken()
    setUsuario(null)
  }, [])

  // Rehidratacion al cargar: el token vive en memoria y se pierde al recargar,
  // asi que intentamos un refresh por cookie y, si va bien, cargamos el perfil.
  useEffect(() => {
    let active = true
    setOnAuthFailure(() => {
      clearAccessToken()
      if (active) setUsuario(null)
    })

    void (async () => {
      try {
        const r = await api.post<ApiEnvelope<RefreshResponse>>('/v1/auth/refresh')
        setAccessToken(r.data.data.access_token)
        await cargarPerfil()
      } catch {
        clearAccessToken()
        if (active) setUsuario(null)
      } finally {
        if (active) setCargando(false)
      }
    })()

    return () => {
      active = false
    }
  }, [cargarPerfil])

  const value = useMemo<AuthState>(
    () => ({ usuario, cargando, login, logout }),
    [usuario, cargando, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
