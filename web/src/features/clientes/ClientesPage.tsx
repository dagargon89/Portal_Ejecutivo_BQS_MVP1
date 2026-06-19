import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorCode } from '../../lib/api'
import {
  actualizarCliente,
  crearCliente,
  darDeBajaCliente,
  listarClientes,
} from '../../lib/clientes'
import type { ClientePayload } from '../../lib/clientes'
import type { Cliente, PaginationMeta } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'

const VACIO: ClientePayload = {
  ID_Cliente: '',
  Nombre_Fiscal: '',
  Nombre_Comercial: '',
  RFC: '',
  Estatus: 'Activo',
}

type Aviso = { tipo: 'ok' | 'error'; texto: string }

export function ClientesPage() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.roles.includes('admin') ?? false

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  const [q, setQ] = useState('')
  const [estatus, setEstatus] = useState('')
  const [page, setPage] = useState(1)
  const [aplicado, setAplicado] = useState<{ q: string; estatus: string }>({ q: '', estatus: '' })
  const [recargar, setRecargar] = useState(0)

  const [form, setForm] = useState<ClientePayload | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // El setState ocurre DESPUES del await (no sincrono en el cuerpo del efecto),
  // con guarda `active` para evitar updates tras desmontar.
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { clientes: filas, meta: m } = await listarClientes({
          q: aplicado.q,
          estatus: aplicado.estatus,
          page,
        })
        if (active) {
          setClientes(filas)
          setMeta(m)
        }
      } catch {
        if (active) setAviso({ tipo: 'error', texto: 'No se pudo cargar la lista de clientes.' })
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
    setAplicado({ q, estatus })
  }

  function abrirNuevo() {
    setEditandoId(null)
    setForm({ ...VACIO })
    setAviso(null)
  }

  function abrirEdicion(c: Cliente) {
    setEditandoId(c.ID_Cliente)
    setForm({
      ID_Cliente: c.ID_Cliente,
      Nombre_Fiscal: c.Nombre_Fiscal,
      Nombre_Comercial: c.Nombre_Comercial ?? '',
      RFC: c.RFC ?? '',
      Estatus: c.Estatus,
    })
    setAviso(null)
  }

  function mensajeError(code: string | null): string {
    switch (code) {
      case 'CONFLICT':
        return 'El ID o el RFC ya están registrados en otro cliente.'
      case 'VALIDATION':
        return 'Revisa los datos: ID con formato CLI-XXX, nombre fiscal y RFC válido (12–13).'
      case 'READ_ONLY':
        return 'Tu rol es de solo lectura; no puedes guardar cambios.'
      case 'FORBIDDEN':
        return 'No tienes permiso para gestionar clientes.'
      default:
        return 'No se pudo guardar el cliente.'
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (form === null) return
    setGuardando(true)
    setAviso(null)
    try {
      const payload: ClientePayload = {
        ...form,
        ID_Cliente: form.ID_Cliente.trim().toUpperCase(),
        Nombre_Fiscal: form.Nombre_Fiscal.trim(),
        Nombre_Comercial: form.Nombre_Comercial?.trim() ? form.Nombre_Comercial.trim() : null,
        RFC: form.RFC?.trim() ? form.RFC.trim().toUpperCase() : null,
      }
      if (editandoId !== null) {
        const { ID_Cliente: _omit, ...resto } = payload
        void _omit
        await actualizarCliente(editandoId, resto)
        setAviso({ tipo: 'ok', texto: 'Cliente actualizado.' })
      } else {
        await crearCliente(payload)
        setAviso({ tipo: 'ok', texto: 'Cliente creado.' })
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

  async function darBaja(c: Cliente) {
    if (!window.confirm(`¿Dar de baja lógica a ${c.Nombre_Fiscal}? Quedará como Inactivo.`)) {
      return
    }
    setAviso(null)
    try {
      await darDeBajaCliente(c.ID_Cliente)
      setAviso({ tipo: 'ok', texto: 'Cliente dado de baja.' })
      setRecargar((n) => n + 1)
    } catch (error) {
      setAviso({ tipo: 'error', texto: mensajeError(errorCode(error)) })
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Clientes (Tier 0)</h1>
          <Link to="/" className="text-sm font-medium underline-offset-2 hover:underline">
            ← Inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <form onSubmit={buscar} className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, ID o RFC…"
            aria-label="Buscar cliente"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={estatus}
            onChange={(e) => setEstatus(e.target.value)}
            aria-label="Filtrar por estatus"
            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Buscar
          </button>
          {esAdmin && (
            <button
              type="button"
              onClick={abrirNuevo}
              className="rounded-md border border-primary px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary-soft"
            >
              + Nuevo
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
              {editandoId !== null ? `Editar ${editandoId}` : 'Nuevo cliente'}
            </h2>
            {editandoId === null && (
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
            )}
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nombre fiscal</span>
              <input
                required
                value={form.Nombre_Fiscal}
                onChange={(e) => setForm({ ...form, Nombre_Fiscal: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nombre comercial</span>
              <input
                value={form.Nombre_Comercial ?? ''}
                onChange={(e) => setForm({ ...form, Nombre_Comercial: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">RFC</span>
              <input
                value={form.RFC ?? ''}
                onChange={(e) => setForm({ ...form, RFC: e.target.value })}
                placeholder="XAXX010101000"
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
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
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
          ) : clientes.length === 0 ? (
            <p className="p-4 text-slate-500">No hay clientes que coincidan.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nombre fiscal</th>
                  <th className="px-4 py-3">RFC</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map((c) => (
                  <tr key={c.ID_Cliente} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.ID_Cliente}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{c.Nombre_Fiscal}</span>
                      {c.Nombre_Comercial !== null && c.Nombre_Comercial !== '' && (
                        <span className="block text-xs text-slate-500">{c.Nombre_Comercial}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.RFC ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.Estatus === 'Activo' ? 'bg-success-soft text-secondary-strong' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.Estatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/clientes/${encodeURIComponent(c.ID_Cliente)}`}
                          className="rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                        >
                          Ver cartera
                        </Link>
                        {esAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => abrirEdicion(c)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                            >
                              Editar
                            </button>
                            {c.Estatus === 'Activo' && (
                              <button
                                type="button"
                                onClick={() => void darBaja(c)}
                                className="rounded-md border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-soft"
                              >
                                Baja
                              </button>
                            )}
                          </>
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
              Página {meta.page} de {meta.total_pages} · {meta.total} clientes
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
