import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    const outcome = await login(correo.trim(), password)
    setEnviando(false)

    if (outcome.ok) {
      navigate('/', { replace: true })
      return
    }
    if (outcome.code === 'NOT_WHITELISTED') {
      navigate('/acceso-denegado', { replace: true })
      return
    }
    if (outcome.code === 'RATE_LIMITED') {
      setError('Demasiados intentos. Espere unos segundos e intente de nuevo.')
      return
    }
    setError('Credenciales incorrectas. Verifique su correo y contraseña.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md sm:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-bold text-primary">Portal Ejecutivo BQS</h1>
          <p className="mt-1 text-sm text-slate-500">Acceso a cuentas por cobrar y facturación</p>
        </header>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="correo" className="mb-1 block text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              id="correo"
              type="email"
              autoComplete="username"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              aria-invalid={error !== null}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error !== null}
              aria-describedby={error !== null ? 'login-error' : undefined}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error !== null && (
            <p id="login-error" role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Best Quality Solutions · desarrollado por Dataholics
        </p>
      </div>
    </main>
  )
}
