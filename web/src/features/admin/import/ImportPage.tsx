/* Importación inicial (admin): sube CSV/XLSX de clientes/cotizaciones a la cola
 * asíncrona y muestra el estado del job con polling. UI re-estilizada del demo. */
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/lib/api'
import { obtenerJob, subirImportacion } from '@/lib/import'
import type { EntidadImport } from '@/lib/import'
import type { Job } from '@/lib/types'

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
  const toast = useToast()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [modo, setModo] = useState<ModoEntidad>('auto')
  const [enviando, setEnviando] = useState(false)
  const [job, setJob] = useState<Job | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const esCsv = archivo !== null && archivo.name.toLowerCase().endsWith('.csv')

  // Poll del estado del job hasta que termine (completado/fallido).
  useEffect(() => {
    if (job === null || job.estado === 'completado' || job.estado === 'fallido') return
    const id = job.id
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          setJob(await obtenerJob(id))
        } catch {
          // Reintenta en el siguiente ciclo; no interrumpe la UI.
        }
      })()
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [job])

  function elegir(e: ChangeEvent<HTMLInputElement>) {
    setArchivo(e.target.files?.[0] ?? null)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (archivo === null) {
      toast.push({ tipo: 'warning', titulo: 'Selecciona un archivo CSV o XLSX.' })
      return
    }
    if (archivo.name.toLowerCase().endsWith('.csv') && modo === 'auto') {
      toast.push({
        tipo: 'warning',
        titulo: 'Indica la entidad',
        descripcion: 'Para CSV elige clientes o cotizaciones.',
      })
      return
    }
    setEnviando(true)
    setJob(null)
    try {
      const entidad: EntidadImport | null = modo === 'auto' ? null : modo
      const encolado = await subirImportacion(archivo, entidad)
      setJob(await obtenerJob(encolado.job_id))
      setArchivo(null)
      if (inputRef.current !== null) inputRef.current.value = ''
      toast.push({ tipo: 'success', titulo: 'Importación encolada' })
    } catch (err) {
      toast.push({ tipo: 'error', titulo: 'No se pudo encolar', descripcion: errorMessage(err) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Importación inicial"
        description="Carga el padrón de clientes y cotizaciones (CSV/XLSX); el procesamiento es asíncrono."
      />

      <Card className="p-6">
        <p className="text-sm text-slate-600">
          El sistema consolida los clientes variantes a un único ID y sanea los montos. La cola
          ejecuta el trabajo y aquí verás el estado.
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

          <Select
            label="Entidad"
            value={modo}
            onChange={(e) => setModo(e.target.value as ModoEntidad)}
            hint={
              esCsv && modo === 'auto'
                ? 'Un CSV contiene una sola entidad: elige clientes o cotizaciones.'
                : undefined
            }
          >
            <option value="auto">Detectar por hojas (XLSX: Clientes/Cotizaciones)</option>
            <option value="clientes">Clientes</option>
            <option value="cotizaciones">Cotizaciones</option>
          </Select>

          <Button
            type="submit"
            icon={<Upload className="h-4 w-4" aria-hidden />}
            loading={enviando}
            className="self-start"
          >
            Importar
          </Button>
        </form>
      </Card>

      {job !== null ? (
        <Card>
          <CardHeader
            title={`Job #${job.id}`}
            action={
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${CLASE_ESTADO[job.estado]}`}
              >
                {ETIQUETA_ESTADO[job.estado]}
              </span>
            }
          />
          <div className="px-4 py-4 sm:px-6">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Tipo</dt>
              <dd className="text-slate-800">{job.tipo}</dd>
              <dt className="text-slate-500">Intentos</dt>
              <dd className="text-slate-800">
                {job.intentos} / {job.max_intentos}
              </dd>
            </dl>
            {job.ultimo_error !== null ? (
              <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                {job.ultimo_error}
              </p>
            ) : null}
            {job.estado === 'pendiente' || job.estado === 'procesando' ? (
              <p className="mt-3 text-xs text-slate-400">
                Actualizando estado automáticamente… El worker de la cola procesa los jobs por lotes.
              </p>
            ) : null}
            {job.estado === 'completado' ? (
              <Link to="/clientes" className="mt-4 inline-block">
                <Button variant="secondary">Ver clientes consolidados</Button>
              </Link>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
