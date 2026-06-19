import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorCode } from '../../lib/api'
import { actualizarCotizacion, crearCotizacion, listarCotizaciones } from '../../lib/cotizaciones'
import type { CotizacionPayload } from '../../lib/cotizaciones'
import { formatMoneda } from '../../lib/format'
import type { Cotizacion, PaginationMeta } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'

const ESTATUS: Cotizacion['Estatus'][] = ['Aprobada', 'Pendiente PO', 'Cerrada']

const VACIO: CotizacionPayload = {
  ID_Cotizacion: '',
  ID_Cliente: '',
  PO_Referencia: '',
  Monto_Autorizado: '',
  Piezas_Autorizadas: '',
  Estatus: 'Pendiente PO',
}

type Aviso = { tipo: 'ok' | 'error'; texto: string }

export function CotizacionesPage() {
  const { usuario } = useAuth()
  const puedeEscribir =
    usuario?.roles.some((r) => r === 'facturacion' || r === 'admin') ?? false

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState('')
  const [page, setPage] = useState(1)
  const [aplicado, setAplicado] = useState<{ idCliente: string; estatus: string }>({
    idCliente: '',
    estatus: '',
  })
  const [recargar, setRecargar] = useState(0)

  const [form, setForm] = useState<CotizacionPayload | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // El setState ocurre DESPUES del await (no sincrono en el cuerpo del efecto),
  // con guarda `active` para evitar updates tras desmontar.
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { cotizaciones: filas, meta: m } = await listarCotizaciones({
          idCliente: aplicado.idCliente,
          estatus: aplicado.estatus,
          page,
        })
        if (active) {
          setCotizaciones(filas)
          setMeta(m)
        }
      } catch {
        if (active) setAviso({ tipo: 'error', texto: 'No se pudieron cargar las cotizaciones.' })
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

  function abrirNueva() {
    setEditandoId(null)
    setForm({ ...VACIO })
    setAviso(null)
  }

  function abrirEdicion(c: Cotizacion) {
    setEditandoId(c.ID_Cotizacion)
    setForm({
      ID_Cotizacion: c.ID_Cotizacion,
      ID_Cliente: c.ID_Cliente,
      PO_Referencia: c.PO_Referencia ?? '',
      Monto_Autorizado: c.Monto_Autorizado,
      Piezas_Autorizadas: c.Piezas_Autorizadas ?? '',
      Estatus: c.Estatus,
    })
    setAviso(null)
  }

  function mensajeError(code: string | null): string {
    switch (code) {
      case 'CONFLICT':
        return 'El ID de cotización ya existe.'
      case 'NOT_FOUND':
        return 'El cliente referenciado no existe.'
      case 'VALIDATION':
        return 'Revisa los datos: ID COT-XXXX, monto numérico ≥ 0 y cliente válido.'
      case 'READ_ONLY':
        return 'Tu rol es de solo lectura; no puedes guardar cambios.'
      case 'FORBIDDEN':
        return 'No tienes permiso para gestionar cotizaciones.'
      default:
        return 'No se pudo guardar la cotización.'
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (form === null) return
    setGuardando(true)
    setAviso(null)
    try {
      const payload: CotizacionPayload = {
        ...form,
        ID_Cotizacion: form.ID_Cotizacion.trim().toUpperCase(),
        ID_Cliente: form.ID_Cliente.trim().toUpperCase(),
        PO_Referencia: form.PO_Referencia?.trim() ? form.PO_Referencia.trim() : null,
        Monto_Autorizado: form.Monto_Autorizado.trim(),
        Piezas_Autorizadas: form.Piezas_Autorizadas?.trim() ? form.Piezas_Autorizadas.trim() : null,
      }
      if (editandoId !== null) {
        await actualizarCotizacion(editandoId, {
          PO_Referencia: payload.PO_Referencia,
          Monto_Autorizado: payload.Monto_Autorizado,
          Piezas_Autorizadas: payload.Piezas_Autorizadas,
          Estatus: payload.Estatus,
        })
        setAviso({ tipo: 'ok', texto: 'Cotización actualizada.' })
      } else {
        await crearCotizacion(payload)
        setAviso({ tipo: 'ok', texto: 'Cotización creada.' })
      }
      setForm(null)
      setEditandoId(null)
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
          <h1 className="text-lg font-bold">Cotizaciones (Tier 0)</h1>
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
              onClick={abrirNueva}
              className="rounded-md border border-primary px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary-soft"
            >
              + Nueva
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
          <form onSubmit={guardar} className="mb-6 grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2">
            <h2 className="col-span-full font-semibold text-slate-900">
              {editandoId !== null ? `Editar ${editandoId}` : 'Nueva cotización'}
            </h2>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">ID_Cotizacion</span>
              <input
                required
                disabled={editandoId !== null}
                value={form.ID_Cotizacion}
                onChange={(e) => setForm({ ...form, ID_Cotizacion: e.target.value })}
                placeholder="COT-0001"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:bg-slate-100"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">ID_Cliente</span>
              <input
                required
                disabled={editandoId !== null}
                value={form.ID_Cliente}
                onChange={(e) => setForm({ ...form, ID_Cliente: e.target.value })}
                placeholder="CLI-001"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:bg-slate-100"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">PO de referencia</span>
              <input
                value={form.PO_Referencia ?? ''}
                onChange={(e) => setForm({ ...form, PO_Referencia: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Monto autorizado (MXN)</span>
              <input
                required
                inputMode="decimal"
                value={form.Monto_Autorizado}
                onChange={(e) => setForm({ ...form, Monto_Autorizado: e.target.value })}
                placeholder="100000.00"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Piezas autorizadas</span>
              <input
                inputMode="numeric"
                value={form.Piezas_Autorizadas ?? ''}
                onChange={(e) => setForm({ ...form, Piezas_Autorizadas: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Estatus</span>
              <select
                value={form.Estatus}
                onChange={(e) => setForm({ ...form, Estatus: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                {ESTATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="col-span-full flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-md bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(null)
                  setEditandoId(null)
                }}
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
          ) : cotizaciones.length === 0 ? (
            <p className="p-4 text-slate-500">No hay cotizaciones que coincidan.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Cotización</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">PO</th>
                  <th className="px-4 py-3 text-right">Autorizado</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cotizaciones.map((c) => (
                  <tr key={c.ID_Cotizacion} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.ID_Cotizacion}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.ID_Cliente}</td>
                    <td className="px-4 py-3 text-slate-600">{c.PO_Referencia ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatMoneda(c.Monto_Autorizado)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.Estatus}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/cotizaciones/${encodeURIComponent(c.ID_Cotizacion)}`}
                          className="rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                        >
                          Consumo
                        </Link>
                        {puedeEscribir && (
                          <button
                            type="button"
                            onClick={() => abrirEdicion(c)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                          >
                            Editar
                          </button>
                        )}
                      </div>
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
              Página {meta.page} de {meta.total_pages} · {meta.total} cotizaciones
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
