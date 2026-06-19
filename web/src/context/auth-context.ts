import { createContext } from 'react'
import type { Usuario } from '../lib/types'

export type LoginOutcome = { ok: true } | { ok: false; code: string }

export interface AuthState {
  usuario: Usuario | null
  cargando: boolean
  login: (correo: string, password: string) => Promise<LoginOutcome>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
