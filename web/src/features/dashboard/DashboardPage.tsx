import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleDashed, TrendingUp, Wallet } from 'lucide-react'
import { KpiCard, KpiSkeleton } from '../../components/KpiCard'
import { useResumenEjecutivo } from '../../hooks/useResumenEjecutivo'
import { obtenerPorFacturar } from '../../lib/dashboard'
import { formatMoneda } from '../../lib/format'
import type { PorFacturarItem } from '../../lib/types'

/**
 * Dashboard ejecutivo móvil — las 3 preguntas (RF-DASH). Las cifras llegan ya
 * calculadas del backend (RF-DASH-04); el cliente solo las formatea y presenta.
 * 3 KPIs legibles a 360px sin scroll horizontal (RNF-07); estado con ícono +
 * texto + barra de acento, contraste AA (RNF-08).
 */
export function DashboardPage() {
  const { resumen, cargando, error } = useResumenEjecutivo()
  const [desglose, setDesglose] = useState<PorFacturarItem[]>([])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await obtenerPorFacturar()
        if (active) setDesglose(data.desglose)
      } catch {
        if (active) setDesglose([])
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Dashboard ejecutivo</h1>
          <Link to="/" className="text-sm font-medium underline-offset-2 hover:underline">
            ← Inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        {error ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            No se pudo cargar el dashboard. Verifica tu sesión y tus permisos de lectura.
          </p>
        ) : cargando || resumen === null ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Periodo {resumen.periodo} · {resumen.moneda}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                label="¿Qué ya se facturó?"
                value={formatMoneda(resumen.facturado_mes)}
                note="Mes en curso"
                accent="secondary"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <KpiCard
                label="¿Qué falta por facturar?"
                value={formatMoneda(resumen.por_facturar)}
                note="Devengado pendiente"
                accent="warning"
                icon={<CircleDashed className="h-5 w-5" />}
              />
              <KpiCard
                label="¿Cuánto te deben?"
                value={formatMoneda(resumen.por_cobrar)}
                note="Neto de abonos"
                accent="primary"
                icon={<Wallet className="h-5 w-5" />}
              />
            </div>

            {desglose.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CircleDashed className="h-4 w-4 text-warning-strong" aria-hidden />
                  Por facturar — desglose por cotización
                </h2>
                <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Cotización
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Cliente
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Capturas
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Pendiente
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {desglose.map((d) => (
                        <tr key={d.ID_Cotizacion} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.ID_Cotizacion}</td>
                          <td className="px-4 py-3 text-slate-600">{d.Nombre_Comercial ?? d.ID_Cliente}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">{d.capturas}</td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                            {formatMoneda(d.monto_devengado_pendiente)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
