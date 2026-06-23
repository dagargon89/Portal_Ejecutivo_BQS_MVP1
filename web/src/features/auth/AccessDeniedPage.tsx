import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * Pantalla de acceso denegado (Caso QA 5): credenciales válidas pero el correo
 * no está autorizado en la whitelist.
 */
export function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-md">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning"
        >
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Acceso denegado</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu cuenta no está autorizada para acceder a este portal. Si crees que es un error, contacta
          al administrador.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button>Volver al inicio de sesión</Button>
        </Link>
      </div>
    </main>
  )
}
