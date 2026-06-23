/* session.ts — Adaptador de sesión para la capa visual portada del demo.
 *
 * El demo se construyó sobre un `useSession()` con helpers de conveniencia
 * (hasRole / isReadOnly / canWrite). Aquí derivamos esos helpers a partir del
 * `useAuth()` real (Axios + refresh por cookie), de modo que los componentes y
 * páginas portados funcionen sin reescribir su lógica de roles.
 *
 * Recordatorio de seguridad: el ocultamiento por rol en el cliente es
 * cosmético; el backend revalida toda escritura (ver CLAUDE.md, regla 1).
 */
import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Rol, Usuario } from '@/lib/types'

export interface Session {
  usuario: Usuario | null
  cargando: boolean
  /** ¿el usuario tiene al menos uno de los roles indicados? */
  hasRole: (...roles: Rol[]) => boolean
  /** perfil Dirección: solo lectura (sus tokens solo permiten GET). */
  isReadOnly: boolean
  /** hay sesión y no es solo lectura. */
  canWrite: boolean
  logout: () => Promise<void>
}

export function useSession(): Session {
  const { usuario, cargando, logout } = useAuth()

  return useMemo<Session>(() => {
    const isReadOnly = usuario?.solo_lectura ?? false
    return {
      usuario,
      cargando,
      hasRole: (...roles: Rol[]) =>
        !!usuario && roles.some((r) => usuario.roles.includes(r)),
      isReadOnly,
      canWrite: !!usuario && !isReadOnly,
      logout,
    }
  }, [usuario, cargando, logout])
}
