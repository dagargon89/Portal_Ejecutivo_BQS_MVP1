import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Protege rutas: exige sesion y, opcionalmente, un rol. El gating de UI NO es
 * la autoridad — el backend revalida cada accion (CLAUDE.md regla #1).
 */
export function ProtectedRoute({ children, rol }: { children: ReactNode; rol?: string }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Cargando…</div>
  }
  if (usuario === null) {
    return <Navigate to="/login" replace />
  }
  if (rol !== undefined && !usuario.roles.includes(rol)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
