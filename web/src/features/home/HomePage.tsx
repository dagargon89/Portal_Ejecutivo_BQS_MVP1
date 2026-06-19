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

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to="/clientes"
            className="block rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-900">Clientes</h2>
            <p className="mt-1 text-sm text-slate-600">
              Cartera consolidada del Tier 0: un solo ID por cliente, con sus cotizaciones y saldo.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-primary">Abrir clientes →</span>
          </Link>

          <Link
            to="/cotizaciones"
            className="block rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-900">Cotizaciones</h2>
            <p className="mt-1 text-sm text-slate-600">
              Montos autorizados por cliente y su consumo (devengado vs autorizado).
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-primary">Abrir cotizaciones →</span>
          </Link>
        </div>

        {esAdmin && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Administración</h2>
            <p className="mt-1 text-sm text-slate-600">
              Gestiona los correos autorizados e importa el padrón inicial de clientes y cotizaciones.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/admin/whitelist"
                className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Gestionar whitelist
              </Link>
              <Link
                to="/admin/import"
                className="inline-block rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
              >
                Importación inicial
              </Link>
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-400">
          El dashboard de las tres preguntas se habilita en un sprint posterior.
        </p>
      </section>
    </main>
  )
}
