import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorCode } from '../../lib/api'
import { obtenerCotizacion } from '../../lib/cotizaciones'
import { formatEntero, formatMoneda } from '../../lib/format'
import type { CotizacionConConsumo } from '../../lib/types'

export function CotizacionDetallePage() {
  const { id = '' } = useParams<{ id: string }>()
  const [coti, setCoti] = useState<CotizacionConConsumo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await obtenerCotizacion(id)
        if (active) setCoti(data)
      } catch (e) {
        if (active) {
          setError(errorCode(e) === 'NOT_FOUND' ? 'La cotización no existe.' : 'No se pudo cargar la cotización.')
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
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Detalle de cotización</h1>
          <Link to="/cotizaciones" className="text-sm font-medium underline-offset-2 hover:underline">
            ← Cotizaciones
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8">
        {cargando ? (
          <p className="text-slate-500">Cargando…</p>
        ) : error !== null ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : coti === null ? null : (
          <>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <p className="font-mono text-xs text-slate-500">{coti.ID_Cotizacion}</p>
              <h2 className="text-xl font-bold text-slate-900">{formatMoneda(coti.Monto_Autorizado)}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                <Link to={`/clientes/${encodeURIComponent(coti.ID_Cliente)}`} className="text-primary hover:underline">
                  {coti.ID_Cliente}
                </Link>
                {coti.PO_Referencia !== null && <span>PO: {coti.PO_Referencia}</span>}
                {coti.Piezas_Autorizadas !== null && <span>{formatEntero(coti.Piezas_Autorizadas)} pzas</span>}
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                  {coti.Estatus}
                </span>
              </div>
            </div>

            <h3 className="mt-8 mb-2 font-semibold text-slate-900">Consumo (devengado vs autorizado)</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Metrica etiqueta="Monto autorizado" valor={formatMoneda(coti.Monto_Autorizado)} fuerte />
              <Metrica etiqueta="Disponible" valor={formatMoneda(coti.consumo.disponible)} fuerte />
              <Metrica etiqueta="Devengado acumulado" valor={formatMoneda(coti.consumo.devengado_acumulado)} />
              <Metrica etiqueta="Devengado pendiente" valor={formatMoneda(coti.consumo.devengado_pendiente)} />
              <Metrica etiqueta="Devengado facturado" valor={formatMoneda(coti.consumo.devengado_facturado)} />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              El devengado se alimenta desde la bitácora de sorteos (Sprint 3); hoy puede ser cero.
            </p>
          </>
        )}
      </section>
    </main>
  )
}

function Metrica({ etiqueta, valor, fuerte = false }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{etiqueta}</p>
      <p className={`mt-1 ${fuerte ? 'text-2xl font-bold text-slate-900' : 'text-lg font-semibold text-slate-700'}`}>
        {valor}
      </p>
    </div>
  )
}
