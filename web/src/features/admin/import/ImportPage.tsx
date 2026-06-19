import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorCode } from '../../../lib/api'
import { obtenerJob, subirImportacion } from '../../../lib/import'
import type { EntidadImport } from '../../../lib/import'
import type { Job } from '../../../lib/types'

type ModoEntidad = 'auto' | EntidadImport

const ETIQUETA_ESTADO: Record<Job['estado'], string> = {
  pendiente: 'En cola',
  procesando: 'Procesando',
  completado: 'Completado',
  fallido: 'Fallido',
}

const CLASE_ESTADO: Record<Job['estado'], string> = {
  pendiente: 'bg-warning-soft text-warning-strong',
  procesando: 'bg-primary-soft text-primary',
  completado: 'bg-success-soft text-secondary-strong',
  fallido: 'bg-danger-soft text-danger',
}

export function ImportPage() {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [modo, setModo] = useState<ModoEntidad>('auto')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const esCsv = archivo !== null && archivo.name.toLowerCase().endsWith('.csv')

  // Poll del estado del job hasta que termine (completado/fallido).
  useEffect(() => {
    if (job === null || job.estado === 'completado' || job.estado === 'fallido') {
      return
    }
    const id = job.id
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const actualizado = await obtenerJob(id)
          setJob(actualizado)
        } catch {
          // Reintenta en el siguiente ciclo; no interrumpe la UI.
        }
      })()
    }, 2500)
    return () => {
      window.clearTimeout(timer)
    }
  }, [job])

  function elegir(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setArchivo(f)
    setError(null)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (archivo === null) {
      setError('Selecciona un archivo CSV o XLSX.')
      return
    }
    const esCsvLocal = archivo.name.toLowerCase().endsWith('.csv')
    if (esCsvLocal && modo === 'auto') {
      setError('Para CSV indica si el archivo es de clientes o de cotizaciones.')
      return
    }
    setEnviando(true)
    setError(null)
    setJob(null)
    try {
      const entidad: EntidadImport | null = modo === 'auto' ? null : modo
      const encolado = await subirImportacion(archivo, entidad)
      const inicial = await obtenerJob(encolado.job_id)
      setJob(inicial)
      setArchivo(null)
      if (inputRef.current !== null) {
        inputRef.current.value = ''
      }
    } catch (err) {
      const code = errorCode(err)
      setError(
        code === 'VALIDATION'
          ? 'Archivo o parámetros inválidos. Usa CSV/XLSX y la entidad correcta.'
          : code === 'FORBIDDEN' || code === 'READ_ONLY'
            ? 'No tienes permiso para importar.'
            : 'No se pudo encolar la importación.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Importación inicial</h1>
          <Link to="/" className="text-sm font-medium underline-offset-2 hover:underline">
            ← Inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            Sube el padrón de <strong>clientes</strong> y de <strong>cotizaciones</strong> (CSV o XLSX). El sistema
            consolida los clientes variantes a un único ID y sanea los montos. El procesamiento es asíncrono: la cola
            lo ejecuta y aquí verás el estado.
          </p>

          <form onSubmit={enviar} className="mt-4 flex flex-col gap-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Archivo (.csv, .xlsx)</span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={elegir}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-primary-hover"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Entidad</span>
              <select
                value={modo}
                onChange={(e) => setModo(e.target.value as ModoEntidad)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="auto">Detectar por hojas (XLSX: Clientes/Cotizaciones)</option>
                <option value="clientes">Clientes</option>
                <option value="cotizaciones">Cotizaciones</option>
              </select>
              {esCsv && modo === 'auto' && (
                <span className="mt-1 block text-xs text-warning-strong">
                  Un CSV contiene una sola entidad: elige clientes o cotizaciones.
                </span>
              )}
            </label>

            {error !== null && (
              <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="self-start rounded-md bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {enviando ? 'Subiendo…' : 'Importar'}
            </button>
          </form>
        </div>

        {job !== null && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Job #{job.id}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${CLASE_ESTADO[job.estado]}`}>
                {ETIQUETA_ESTADO[job.estado]}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Tipo</dt>
              <dd className="text-slate-800">{job.tipo}</dd>
              <dt className="text-slate-500">Intentos</dt>
              <dd className="text-slate-800">
                {job.intentos} / {job.max_intentos}
              </dd>
            </dl>
            {job.ultimo_error !== null && (
              <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{job.ultimo_error}</p>
            )}
            {(job.estado === 'pendiente' || job.estado === 'procesando') && (
              <p className="mt-3 text-xs text-slate-400">
                Actualizando estado automáticamente… El worker de la cola procesa los jobs por lotes.
              </p>
            )}
            {job.estado === 'completado' && (
              <Link
                to="/clientes"
                className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Ver clientes consolidados
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
