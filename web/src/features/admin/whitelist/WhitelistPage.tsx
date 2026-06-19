import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, errorCode } from '../../../lib/api'
import type { ApiCollectionEnvelope, ApiEnvelope, WhitelistEntry } from '../../../lib/types'

export function WhitelistPage() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([])
  const [cargando, setCargando] = useState(true)
  const [nuevo, setNuevo] = useState('')
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const cargar = useCallback(async () => {
    try {
      const resp = await api.get<ApiCollectionEnvelope<WhitelistEntry>>('/v1/admin/whitelist')
      setEntries(resp.data.data)
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar la lista.' })
    } finally {
      setCargando(false)
    }
  }, [])

  // Carga inicial: el setState ocurre DESPUES del await (no sincrono en el
  // cuerpo del efecto), con guarda `active` para evitar updates tras desmontar.
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const resp = await api.get<ApiCollectionEnvelope<WhitelistEntry>>('/v1/admin/whitelist')
        if (active) setEntries(resp.data.data)
      } catch {
        if (active) setMensaje({ tipo: 'error', texto: 'No se pudo cargar la lista.' })
      } finally {
        if (active) setCargando(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function agregar(e: FormEvent) {
    e.preventDefault()
    setMensaje(null)
    try {
      await api.post<ApiEnvelope<WhitelistEntry>>('/v1/admin/whitelist', { correo: nuevo.trim() })
      setNuevo('')
      setMensaje({ tipo: 'ok', texto: 'Correo agregado.' })
      await cargar()
    } catch (error) {
      const code = errorCode(error)
      setMensaje({
        tipo: 'error',
        texto: code === 'CONFLICT' ? 'El correo ya existe en la whitelist.' : 'Correo inválido.',
      })
    }
  }

  async function revocar(id: number) {
    setMensaje(null)
    try {
      await api.delete(`/v1/admin/whitelist/${String(id)}`)
      await cargar()
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo revocar el correo.' })
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Whitelist de acceso</h1>
          <Link to="/" className="text-sm font-medium underline-offset-2 hover:underline">
            ← Inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <form onSubmit={agregar} className="mb-6 flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row">
          <input
            type="email"
            required
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="correo@empresa.com"
            aria-label="Correo a autorizar"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Agregar
          </button>
        </form>

        {mensaje !== null && (
          <p
            role="alert"
            className={`mb-4 rounded-md px-3 py-2 text-sm ${
              mensaje.tipo === 'ok' ? 'bg-success-soft text-secondary-strong' : 'bg-danger-soft text-danger'
            }`}
          >
            {mensaje.texto}
          </p>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {cargando ? (
            <p className="p-4 text-slate-500">Cargando…</p>
          ) : entries.length === 0 ? (
            <p className="p-4 text-slate-500">No hay correos registrados.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{entry.correo}</p>
                    <span
                      className={`text-xs font-medium ${entry.activo ? 'text-secondary-strong' : 'text-slate-400'}`}
                    >
                      {entry.activo ? '● Activo' : '○ Revocado'}
                    </span>
                  </div>
                  {entry.activo && (
                    <button
                      type="button"
                      onClick={() => void revocar(entry.id)}
                      className="rounded-md border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                    >
                      Revocar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
