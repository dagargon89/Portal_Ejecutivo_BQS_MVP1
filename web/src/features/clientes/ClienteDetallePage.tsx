import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorCode } from '../../lib/api'
import { obtenerCliente } from '../../lib/clientes'
import { formatEntero, formatMoneda } from '../../lib/format'
import type { ClienteConCartera } from '../../lib/types'

export function ClienteDetallePage() {
  const { id = '' } = useParams<{ id: string }>()
  const [cliente, setCliente] = useState<ClienteConCartera | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await obtenerCliente(id)
        if (active) setCliente(data)
      } catch (e) {
        if (active) {
          setError(errorCode(e) === 'NOT_FOUND' ? 'El cliente no existe.' : 'No se pudo cargar el cliente.')
        }
      } finally {
        if (active) setCargando(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Detalle de cliente</h1>
          <Link to="/clientes" className="text-sm font-medium underline-offset-2 hover:underline">
            ← Clientes
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        {cargando ? (
          <p className="text-slate-500">Cargando…</p>
        ) : error !== null ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : cliente === null ? null : (
          <>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <p className="font-mono text-xs text-slate-500">{cliente.ID_Cliente}</p>
              <h2 className="text-xl font-bold text-slate-900">{cliente.Nombre_Fiscal}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                {cliente.Nombre_Comercial !== null && cliente.Nombre_Comercial !== '' && (
                  <span>{cliente.Nombre_Comercial}</span>
                )}
                {cliente.RFC !== null && <span>RFC: {cliente.RFC}</span>}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    cliente.Estatus === 'Activo' ? 'bg-success-soft text-secondary-strong' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cliente.Estatus}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total autorizado (cotizaciones)</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatMoneda(cliente.cartera.total_autorizado)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Saldo por cobrar</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatMoneda(cliente.cartera.saldo_por_cobrar)}
                </p>
                <p className="mt-1 text-xs text-slate-400">Se alimenta con facturas/pagos (Sprint 3).</p>
              </div>
            </div>

            <h3 className="mt-8 mb-2 font-semibold text-slate-900">Cartera de cotizaciones</h3>
            <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
              {cliente.cartera.cotizaciones.length === 0 ? (
                <p className="p-4 text-slate-500">Sin cotizaciones registradas.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Cotización</th>
                      <th className="px-4 py-3">PO</th>
                      <th className="px-4 py-3 text-right">Autorizado</th>
                      <th className="px-4 py-3 text-right">Devengado</th>
                      <th className="px-4 py-3 text-right">Disponible</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cliente.cartera.cotizaciones.map((c) => (
                      <tr key={c.ID_Cotizacion} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link
                            to={`/cotizaciones/${encodeURIComponent(c.ID_Cotizacion)}`}
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {c.ID_Cotizacion}
                          </Link>
                          {c.Piezas_Autorizadas !== null && (
                            <span className="block text-xs text-slate-400">
                              {formatEntero(c.Piezas_Autorizadas)} pzas
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.PO_Referencia ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatMoneda(c.Monto_Autorizado)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatMoneda(c.devengado)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatMoneda(c.disponible)}</td>
                        <td className="px-4 py-3 text-slate-600">{c.Estatus}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                    <tr>
                      <td className="px-4 py-3" colSpan={2}>
                        Total
                      </td>
                      <td className="px-4 py-3 text-right">{formatMoneda(cliente.cartera.total_autorizado)}</td>
                      <td className="px-4 py-3" colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
