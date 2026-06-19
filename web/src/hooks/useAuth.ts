import { useContext } from 'react'
import { AuthContext } from '../context/auth-context'
import type { AuthState } from '../context/auth-context'

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
