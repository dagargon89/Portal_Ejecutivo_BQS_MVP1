import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorCode } from '../../lib/api'
import { emitirFactura, listarFacturas } from '../../lib/facturas'
import { formatMoneda } from '../../lib/format'
import type { EstatusFactura, Factura, PaginationMeta } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'

const ESTATUS: EstatusFactura[] = ['Vigente', 'Vencida', 'Pagada']

const COLOR_ESTATUS: Record<EstatusFactura, string> = {
  Vigente: 'bg-primary-soft text-primary',
  Vencida: 'bg-danger-soft text-danger',
  Pagada: 'bg-success-soft text-secondary-strong',
}

type Aviso = { tipo: 'ok' | 'error'; texto: string }

interface FormEmision {
  Folio_Factura: string
  ID_Cliente: string
  Fecha_Emision: string
  Fecha_Vencimiento: string
  Monto_Subtotal: string
  Monto_Total: string
  capturas: string
}

const VACIO: FormEmision = {
  Folio_Factura: '',
  ID_Cliente: '',
  Fecha_Emision: '',
  Fecha_Vencimiento: '',
  Monto_Subtotal: '',
  Monto_Total: '',
  capturas: '',
}

export function FacturasPage() {
  const { usuario } = useAuth()
  const puedeEscribir = usuario?.roles.some((r) => r === 'facturacion' || r === 'admin') ?? false

  const [facturas, setFacturas] = useState<Factura[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState('')
  const [page, setPage] = useState(1)
  const [aplicado, setAplicado] = useState<{ idCliente: string; estatus: string }>({ idCliente: '', estatus: '' })
  const [recargar, setRecargar] = useState(0)

  const [form, setForm] = useState<FormEmision | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { facturas: filas, meta: m } = await listarFacturas({
          idCliente: aplicado.idCliente,
          estatus: aplicado.estatus,
          page,
        })
        if (active) {
          setFacturas(filas)
          setMeta(m)
        }
      } catch {
        if (active) setAviso({ tipo: 'error', texto: 'No se pudieron cargar las facturas.' })
      } finally {
        if (active) setCargando(false)
      }
    })()
    return () => {
      active = false
    }
  }, [aplicado, page, recargar])

  function buscar(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    setAplicado({ idCliente: filtroCliente, estatus: filtroEstatus })
  }

  function abrirEmision() {
    setForm({ ...VACIO, Fecha_Emision: new Date().toISOString().slice(0, 10) })
    setAviso(null)
  }

  function mensajeError(code: string | null): string {
    switch (code) {
      case 'ILLEGAL_TRANSITION':
        return 'Alguna captura ya fue facturada; no se puede refacturar.'
      case 'NOT_FOUND':
        return 'El cliente o alguna captura no existen.'
      case 'CONFLICT':
        return 'El folio de factura ya existe.'
      case 'VALIDATION':
        return 'Revisa: cliente, fechas (vto ≥ emisión), totales y capturas Pendiente del mismo cliente.'
      case 'READ_ONLY':
        return 'Tu rol es de solo lectura; no puedes emitir facturas.'
      case 'FORBIDDEN':
        return 'Solo facturación puede emitir facturas.'
      default:
        return 'No se pudo emitir la factura.'
    }
  }

  async function emitir(e: FormEvent) {
    e.preventDefault()
    if (form === null) return
    setGuardando(true)
    setAviso(null)
    try {
      const capturas = form.capturas
        .split(/[\s,]+/)
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c !== '')
      await emitirFactura({
        Folio_Factura: form.Folio_Factura.trim().toUpperCase(),
        ID_Cliente: form.ID_Cliente.trim().toUpperCase(),
        Fecha_Emision: form.Fecha_Emision,
        Fecha_Vencimiento: form.Fecha_Vencimiento,
        Monto_Subtotal: form.Monto_Subtotal.trim(),
        Monto_Total: form.Monto_Total.trim(),
        capturas,
      })
      setForm(null)
      setAviso({ tipo: 'ok', texto: 'Factura emitida (Vigente).' })
      setRecargar((n) => n + 1)
    } catch (error) {
      setAviso({ tipo: 'error', texto: mensajeError(errorCode(error)) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Facturas</h1>
          <Link to="/" className="text-sm font-medium underline-offset-2 hover:underline">
            ← Inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <form onSubmit={buscar} className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            placeholder="Filtrar por ID_Cliente (CLI-001)…"
            aria-label="Filtrar por cliente"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            aria-label="Filtrar por estatus"
            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos</option>
            {ESTATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Filtrar
          </button>
          {puedeEscribir && (
            <button
              type="button"
              onClick={abrirEmision}
              className="rounded-md border border-primary px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary-soft"
            >
              + Emitir
            </button>
          )}
        </form>

        {aviso !== null && (
          <p
            role="alert"
            className={`mb-4 rounded-md px-3 py-2 text-sm ${
              aviso.tipo === 'ok' ? 'bg-success-soft text-secondary-strong' : 'bg-danger-soft text-danger'
            }`}
          >
            {aviso.texto}
          </p>
        )}

        {form !== null && (
          <form onSubmit={emitir} className="mb-6 grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2">
            <h2 className="col-span-full font-semibold text-slate-900">Emitir factura desde devengado</h2>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Folio (opcional)</span>
              <input
                value={form.Folio_Factura}
                onChange={(e) => setForm({ ...form, Folio_Factura: e.target.value })}
                placeholder="(automático) o F-9001"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">ID_Cliente</span>
              <input
                required
                value={form.ID_Cliente}
                onChange={(e) => setForm({ ...form, ID_Cliente: e.target.value })}
                placeholder="CLI-001"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Fecha de emisión</span>
              <input
                required
                type="date"
                value={form.Fecha_Emision}
                onChange={(e) => setForm({ ...form, Fecha_Emision: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Fecha de vencimiento</span>
              <input
                required
                type="date"
                value={form.Fecha_Vencimiento}
                onChange={(e) => setForm({ ...form, Fecha_Vencimiento: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Subtotal (MXN)</span>
              <input
                required
                inputMode="decimal"
                value={form.Monto_Subtotal}
                onChange={(e) => setForm({ ...form, Monto_Subtotal: e.target.value })}
                placeholder="60344.83"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Total con IVA (MXN)</span>
              <input
                required
                inputMode="decimal"
                value={form.Monto_Total}
                onChange={(e) => setForm({ ...form, Monto_Total: e.target.value })}
                placeholder="70000.00"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Capturas de devengado (IDs separados por coma)</span>
              <input
                required
                value={form.capturas}
                onChange={(e) => setForm({ ...form, capturas: e.target.value })}
                placeholder="BIT-0001, BIT-0002"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <div className="col-span-full flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-md bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {guardando ? 'Emitiendo…' : 'Emitir factura'}
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

        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          {cargando ? (
            <p className="p-4 text-slate-500">Cargando…</p>
          ) : facturas.length === 0 ? (
            <p className="p-4 text-slate-500">No hay facturas que coincidan.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Emisión</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facturas.map((f) => (
                  <tr key={f.Folio_Factura} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{f.Folio_Factura}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{f.ID_Cliente}</td>
                    <td className="px-4 py-3 text-slate-600">{f.Fecha_Emision}</td>
                    <td className="px-4 py-3 text-slate-600">{f.Fecha_Vencimiento}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatMoneda(f.Monto_Total)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_ESTATUS[f.Estatus_Pago]}`}>
                        {f.Estatus_Pago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/facturas/${encodeURIComponent(f.Folio_Factura)}`}
                        className="rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                      >
                        Detalle / pagos
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta !== null && meta.total_pages > 1 && (
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Paginación">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              ← Anterior
            </button>
            <span className="text-slate-500">
              Página {meta.page} de {meta.total_pages} · {meta.total} facturas
            </span>
            <button
              type="button"
              disabled={page >= meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              Siguiente →
            </button>
          </nav>
        )}
      </section>
    </main>
  )
}
