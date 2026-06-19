import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function HomePage() {
  const { usuario, logout } = useAuth()

  if (usuario === null) {
    return null
  }

  const esAdmin = usuario.roles.includes('admin')

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Portal Ejecutivo BQS</h1>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/25"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Sesión iniciada como</p>
          <p className="text-lg font-semibold text-slate-900">{usuario.nombre}</p>
          <p className="text-sm text-slate-600">{usuario.correo}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {usuario.roles.map((rol) => (
              <span key={rol} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                {rol}
              </span>
            ))}
            {usuario.solo_lectura && (
              <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
                solo lectura
              </span>
            )}
          </div>
        </div>

        {esAdmin && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Administración</h2>
            <p className="mt-1 text-sm text-slate-600">Gestiona los correos autorizados a acceder al portal.</p>
            <Link
              to="/admin/whitelist"
              className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Gestionar whitelist
            </Link>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-400">
          El dashboard de las tres preguntas se habilita en un sprint posterior.
        </p>
      </section>
    </main>
  )
}
