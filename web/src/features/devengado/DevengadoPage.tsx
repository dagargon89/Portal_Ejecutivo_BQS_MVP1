import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorCode } from '../../lib/api'
import { obtenerCotizacion } from '../../lib/cotizaciones'
import { crearDevengado, listarDevengado } from '../../lib/devengado'
import type { DevengadoPayload } from '../../lib/devengado'
import { formatEntero, formatMoneda } from '../../lib/format'
import type { CotizacionConConsumo, Devengado } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'

type Aviso = { tipo: 'ok' | 'error'; texto: string }

const VACIO: DevengadoPayload = {
  ID_Captura: '',
  Fecha: '',
  Horas_Trabajadas: '',
  Piezas_Sorteadas: '',
  Monto_Devengado: '',
}

export function DevengadoPage() {
  const { usuario } = useAuth()
  const puedeEscribir = usuario?.roles.some((r) => r === 'capturista' || r === 'admin') ?? false

  const [cotInput, setCotInput] = useState('')
  const [cotId, setCotId] = useState('') // criterio aplicado
  const [recargar, setRecargar] = useState(0)

  const [coti, setCoti] = useState<CotizacionConConsumo | null>(null)
  const [filas, setFilas] = useState<Devengado[]>([])
  const [cargando, setCargando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  const [form, setForm] = useState<DevengadoPayload | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (cotId === '') return
    let active = true
    void (async () => {
      try {
        const [c, lista] = await Promise.all([obtenerCotizacion(cotId), listarDevengado(cotId)])
        if (active) {
          setCoti(c)
          setFilas(lista.devengado)
        }
      } catch (e) {
        if (active) {
          setCoti(null)
          setFilas([])
          setAviso({
            tipo: 'error',
            texto: errorCode(e) === 'NOT_FOUND' ? 'La cotización no existe.' : 'No se pudo cargar el devengado.',
          })
        }
      } finally {
        if (active) setCargando(false)
      }
    })()
    return () => {
      active = false
    }
  }, [cotId, recargar])

  function buscar(e: FormEvent) {
    e.preventDefault()
    setAviso(null)
    setForm(null)
    setCargando(true)
    setCotId(cotInput.trim().toUpperCase())
  }

  function abrirNuevo() {
    setForm({ ...VACIO, Fecha: new Date().toISOString().slice(0, 10) })
    setAviso(null)
  }

  function mensajeError(code: string | null): string {
    switch (code) {
      case 'VALIDATION':
        return 'Revisa los datos: fecha válida y monto devengado numérico ≥ 0.'
      case 'NOT_FOUND':
        return 'La cotización no existe.'
      case 'CONFLICT':
        return 'El ID de captura ya existe.'
      case 'READ_ONLY':
        return 'Tu rol es de solo lectura; no puedes registrar devengado.'
      case 'FORBIDDEN':
        return 'Solo el rol capturista puede registrar devengado.'
      default:
        return 'No se pudo registrar el devengado.'
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (form === null || cotId === '') return
    setGuardando(true)
    setAviso(null)
    try {
      await crearDevengado(cotId, {
        ID_Captura: form.ID_Captura.trim().toUpperCase(),
        Fecha: form.Fecha,
        Horas_Trabajadas: form.Horas_Trabajadas.trim() !== '' ? form.Horas_Trabajadas.trim() : '0',
        Piezas_Sorteadas: form.Piezas_Sorteadas?.trim() ? form.Piezas_Sorteadas.trim() : null,
        Monto_Devengado: form.Monto_Devengado.trim(),
      })
      setForm(null)
      setAviso({ tipo: 'ok', texto: 'Devengado registrado (Pendiente de facturar).' })
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
          <h1 className="text-lg font-bold">Captura de devengado</h1>
          <Link to="/" className="text-sm font-medium underline-offset-2 hover:underline">
            ← Inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <form onSubmit={buscar} className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            required
            value={cotInput}
            onChange={(e) => setCotInput(e.target.value)}
            placeholder="ID de cotización (COT-0001)…"
            aria-label="ID de cotización"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Abrir
          </button>
          {puedeEscribir && coti !== null && (
            <button
              type="button"
              onClick={abrirNuevo}
              className="rounded-md border border-primary px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary-soft"
            >
              + Devengado
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

        {coti !== null && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metrica etiqueta="Autorizado" valor={formatMoneda(coti.Monto_Autorizado)} />
            <Metrica etiqueta="Devengado" valor={formatMoneda(coti.consumo.devengado_acumulado)} />
            <Metrica etiqueta="Por facturar" valor={formatMoneda(coti.consumo.devengado_pendiente)} />
            <Metrica etiqueta="Disponible" valor={formatMoneda(coti.consumo.disponible)} fuerte />
          </div>
        )}

        {form !== null && (
          <form onSubmit={guardar} className="mb-6 grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2">
            <h2 className="col-span-full font-semibold text-slate-900">Nuevo devengado en {cotId}</h2>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">ID de captura (opcional)</span>
              <input
                value={form.ID_Captura}
                onChange={(e) => setForm({ ...form, ID_Captura: e.target.value })}
                placeholder="(automático)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Fecha</span>
              <input
                required
                type="date"
                value={form.Fecha}
                onChange={(e) => setForm({ ...form, Fecha: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Horas trabajadas</span>
              <input
                inputMode="decimal"
                value={form.Horas_Trabajadas}
                onChange={(e) => setForm({ ...form, Horas_Trabajadas: e.target.value })}
                placeholder="40.00"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Piezas sorteadas</span>
              <input
                inputMode="numeric"
                value={form.Piezas_Sorteadas ?? ''}
                onChange={(e) => setForm({ ...form, Piezas_Sorteadas: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Monto devengado (MXN)</span>
              <input
                required
                inputMode="decimal"
                value={form.Monto_Devengado}
                onChange={(e) => setForm({ ...form, Monto_Devengado: e.target.value })}
                placeholder="10000.00"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
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
          ) : cotId === '' ? (
            <p className="p-4 text-slate-500">Indica una cotización para ver y capturar su devengado.</p>
          ) : filas.length === 0 ? (
            <p className="p-4 text-slate-500">Sin devengado registrado para {cotId}.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Captura</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Horas</th>
                  <th className="px-4 py-3 text-right">Piezas</th>
                  <th className="px-4 py-3 text-right">Devengado</th>
                  <th className="px-4 py-3">Facturación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((d) => (
                  <tr key={d.ID_Captura} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.ID_Captura}</td>
                    <td className="px-4 py-3 text-slate-600">{d.Fecha}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatEntero(d.Horas_Trabajadas)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatEntero(d.Piezas_Sorteadas)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatMoneda(d.Monto_Devengado)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.Estatus_Facturacion === 'Facturado'
                            ? 'bg-success-soft text-secondary-strong'
                            : 'bg-warning-soft text-warning-strong'
                        }`}
                      >
                        {d.Estatus_Facturacion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  )
}

function Metrica({ etiqueta, valor, fuerte = false }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{etiqueta}</p>
      <p className={`mt-1 ${fuerte ? 'text-lg font-bold text-slate-900' : 'text-base font-semibold text-slate-700'}`}>
        {valor}
      </p>
    </div>
  )
}
