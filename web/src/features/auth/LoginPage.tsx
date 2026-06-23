/* Login (público). Valida credenciales + whitelist en el backend; ante
 * NOT_WHITELISTED redirige a /acceso-denegado. UI re-estilizada del demo. */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/hooks/useAuth'

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
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Marca (oculta en móvil) */}
      <div className="hidden flex-col justify-between bg-primary p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">
            BQS
          </span>
          <span className="text-sm font-semibold">Portal Ejecutivo · Dataholics</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Cuentas por cobrar y facturación, en un vistazo.</h2>
          <p className="mt-3 max-w-md text-sm text-white/80">
            Las tres preguntas del negocio —qué se facturó, qué falta por facturar y cuánto deben—
            calculadas en el servidor.
          </p>
        </div>
        <p className="text-xs text-white/60">Best Quality Solutions México</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-sm">
          <header className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-slate-500">Acceso a cuentas por cobrar y facturación</p>
          </header>

          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <TextField
              label="Correo"
              type="email"
              autoComplete="username"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error !== null ? (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {error}
              </p>
            ) : null}

            <Button type="submit" loading={enviando} className="w-full">
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Best Quality Solutions · desarrollado por Dataholics
          </p>
        </div>
      </div>
    </main>
  )
}
