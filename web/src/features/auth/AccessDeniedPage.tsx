import { Link } from 'react-router-dom'

/**
 * Pantalla de acceso denegado (Caso QA 5): credenciales validas pero el correo
 * no esta autorizado en la whitelist.
 */
export function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-md">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-2xl text-warning"
        >
          ⚠
        </div>
        <h1 className="text-lg font-bold text-slate-900">Acceso denegado</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu cuenta no está autorizada para acceder a este portal. Si crees que es un error, contacta al
          administrador.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </main>
  )
}
