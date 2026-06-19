import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorCode } from '../../lib/api'
import { obtenerFactura, registrarPago } from '../../lib/facturas'
import { formatMoneda } from '../../lib/format'
import type { EstatusFactura, FacturaConDetalle } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'

const COLOR_ESTATUS: Record<EstatusFactura, string> = {
  Vigente: 'bg-primary-soft text-primary',
  Vencida: 'bg-danger-soft text-danger',
  Pagada: 'bg-success-soft text-secondary-strong',
}

type Aviso = { tipo: 'ok' | 'error'; texto: string }

interface FormPago {
  ID_Pago: string
  Fecha_Pago: string
  Monto_Pagado: string
  Referencia: string
}

export function FacturaDetallePage() {
  const { folio = '' } = useParams<{ folio: string }>()
  const { usuario } = useAuth()
  const puedeEscribir = usuario?.roles.some((r) => r === 'facturacion' || r === 'admin') ?? false

  const [factura, setFactura] = useState<FacturaConDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [recargar, setRecargar] = useState(0)

  const [form, setForm] = useState<FormPago | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const f = await obtenerFactura(folio)
        if (active) setFactura(f)
      } catch (e) {
        if (active) {
          setError(errorCode(e) === 'NOT_FOUND' ? 'La factura no existe.' : 'No se pudo cargar la factura.')
        }
      } finally {
        if (active) setCargando(false)
      }
    })()
    return () => {
      active = false
    }
  }, [folio, recargar])

  function abrirPago() {
    setForm({ ID_Pago: '', Fecha_Pago: new Date().toISOString().slice(0, 10), Monto_Pagado: '', Referencia: '' })
    setAviso(null)
  }

  function mensajeError(code: string | null): string {
    switch (code) {
      case 'OVERPAYMENT':
        return 'El abono excede el saldo pendiente de la factura.'
      case 'ILLEGAL_TRANSITION':
        return 'La factura ya está pagada; no admite más pagos.'
      case 'VALIDATION':
        return 'El monto del pago debe ser numérico y mayor a cero.'
      case 'READ_ONLY':
        return 'Tu rol es de solo lectura; no puedes registrar pagos.'
      case 'FORBIDDEN':
        return 'Solo facturación puede registrar pagos.'
      default:
        return 'No se pudo registrar el pago.'
    }
  }

  async function pagar(e: FormEvent) {
    e.preventDefault()
    if (form === null) return
    setGuardando(true)
    setAviso(null)
    try {
      await registrarPago(folio, {
        ID_Pago: form.ID_Pago.trim().toUpperCase(),
        Fecha_Pago: form.Fecha_Pago,
        Monto_Pagado: form.Monto_Pagado.trim(),
        Referencia: form.Referencia.trim() !== '' ? form.Referencia.trim() : null,
      })
      setForm(null)
      setAviso({ tipo: 'ok', texto: 'Pago registrado.' })
      setRecargar((n) => n + 1)
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(errorCode(err)) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Factura</h1>
          <Link to="/facturas" className="text-sm font-medium underline-offset-2 hover:underline">
            ← Facturas
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-8">
        {cargando ? (
          <p className="text-slate-500">Cargando…</p>
        ) : error !== null ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : factura === null ? null : (
          <>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-500">{factura.Folio_Factura}</p>
                  <Link
                    to={`/clientes/${encodeURIComponent(factura.ID_Cliente)}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {factura.ID_Cliente}
                  </Link>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${COLOR_ESTATUS[factura.Estatus_Pago]}`}>
                  {factura.Estatus_Pago}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Emisión {factura.Fecha_Emision} · Vence {factura.Fecha_Vencimiento}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Metrica etiqueta="Total" valor={formatMoneda(factura.Monto_Total)} />
              <Metrica etiqueta="Pagado" valor={formatMoneda(factura.pagado)} />
              <Metrica etiqueta="Saldo por cobrar" valor={formatMoneda(factura.saldo)} fuerte />
            </div>

            {aviso !== null && (
              <p
                role="alert"
                className={`mt-6 rounded-md px-3 py-2 text-sm ${
                  aviso.tipo === 'ok' ? 'bg-success-soft text-secondary-strong' : 'bg-danger-soft text-danger'
                }`}
              >
                {aviso.texto}
              </p>
            )}

            {puedeEscribir && factura.Estatus_Pago !== 'Pagada' && form === null && (
              <button
                type="button"
                onClick={abrirPago}
                className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                + Registrar pago
              </button>
            )}

            {form !== null && (
              <form onSubmit={pagar} className="mt-6 grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2">
                <h2 className="col-span-full font-semibold text-slate-900">Registrar abono</h2>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">ID de pago (opcional)</span>
                  <input
                    value={form.ID_Pago}
                    onChange={(e) => setForm({ ...form, ID_Pago: e.target.value })}
                    placeholder="(automático)"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Fecha de pago</span>
                  <input
                    required
                    type="date"
                    value={form.Fecha_Pago}
                    onChange={(e) => setForm({ ...form, Fecha_Pago: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Monto del abono (MXN)</span>
                  <input
                    required
                    inputMode="decimal"
                    value={form.Monto_Pagado}
                    onChange={(e) => setForm({ ...form, Monto_Pagado: e.target.value })}
                    placeholder="20000.00"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Referencia</span>
                  <input
                    value={form.Referencia}
                    onChange={(e) => setForm({ ...form, Referencia: e.target.value })}
                    placeholder="SPEI / cheque…"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <div className="col-span-full flex gap-2">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="rounded-md bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                  >
                    {guardando ? 'Registrando…' : 'Registrar pago'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(null)}
                    className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <h3 className="mt-8 mb-2 font-semibold text-slate-900">Abonos registrados</h3>
            <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
              {factura.pagos.length === 0 ? (
                <p className="p-4 text-slate-500">Sin pagos registrados.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Pago</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Referencia</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {factura.pagos.map((p) => (
                      <tr key={p.ID_Pago} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.ID_Pago}</td>
                        <td className="px-4 py-3 text-slate-600">{p.Fecha_Pago}</td>
                        <td className="px-4 py-3 text-slate-600">{p.Referencia ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatMoneda(p.Monto_Pagado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
