/* Captura de devengado (BITACORA_SORTEO): abre una cotización, muestra su
 * consumo y permite registrar nuevas capturas (rol capturista o admin).
 * UI re-estilizada del demo, cableada a la capa real (lib/devengado). */
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Modal } from '@/components/ui/Modal'
import { KpiCard } from '@/components/ui/KpiCard'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { StatusBadge, badgeDeFacturacion } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/components/ui/Toast'
import { useSession } from '@/auth/session'
import { useAsync } from '@/hooks/useAsync'
import { errorFields, errorMessage } from '@/lib/api'
import { obtenerCotizacion } from '@/lib/cotizaciones'
import { crearDevengado, listarDevengado } from '@/lib/devengado'
import type { DevengadoPayload } from '@/lib/devengado'
import { formatEntero, formatMoneda, fecha } from '@/lib/format'
import type { Devengado } from '@/lib/types'

const columns: Column<Devengado>[] = [
  { key: 'cap', header: 'Captura', mono: true, render: (r) => r.ID_Captura },
  { key: 'fecha', header: 'Fecha', render: (r) => fecha(r.Fecha) },
  { key: 'horas', header: 'Horas', num: true, render: (r) => formatEntero(r.Horas_Trabajadas) },
  { key: 'piezas', header: 'Piezas', num: true, render: (r) => formatEntero(r.Piezas_Sorteadas) },
  { key: 'monto', header: 'Devengado', num: true, render: (r) => formatMoneda(r.Monto_Devengado) },
  {
    key: 'estado',
    header: 'Facturación',
    render: (r) => <StatusBadge estado={badgeDeFacturacion(r.Estatus_Facturacion)} />,
  },
]

export function DevengadoPage() {
  const toast = useToast()
  const { hasRole } = useSession()
  const puedeEscribir = hasRole('capturista', 'admin')

  const [cotInput, setCotInput] = useState('')
  const [cotId, setCotId] = useState('') // criterio aplicado
  const [open, setOpen] = useState(false)

  const { data, loading, error, reload } = useAsync(
    () =>
      cotId === ''
        ? Promise.resolve(null)
        : Promise.all([obtenerCotizacion(cotId), listarDevengado(cotId)]).then(([coti, lista]) => ({
            coti,
            filas: lista.devengado,
          })),
    [cotId],
  )

  function buscar(e: FormEvent) {
    e.preventDefault()
    setCotId(cotInput.trim().toUpperCase())
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Captura de devengado"
        description="Trabajo de inspección/sorteo ejecutado, pendiente de facturar."
      />

      <Card className="p-4">
        <form onSubmit={buscar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              required
              value={cotInput}
              onChange={(e) => setCotInput(e.target.value)}
              placeholder="ID de cotización (COT-0001)…"
              aria-label="ID de cotización"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button type="submit">Abrir</Button>
          {puedeEscribir && data?.coti ? (
            <Button
              variant="secondary"
              icon={<Plus className="h-4 w-4" aria-hidden />}
              onClick={() => setOpen(true)}
            >
              Devengado
            </Button>
          ) : null}
        </form>
      </Card>

      {cotId === '' ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Indica una cotización"
          message="Escribe un ID de cotización para ver y capturar su devengado."
        />
      ) : loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data?.coti ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              label="Autorizado"
              value={formatMoneda(data.coti.Monto_Autorizado)}
              accent="primary"
              icon={<span aria-hidden>Σ</span>}
            />
            <KpiCard
              label="Devengado"
              value={formatMoneda(data.coti.consumo.devengado_acumulado)}
              accent="secondary"
              icon={<span aria-hidden>✓</span>}
            />
            <KpiCard
              label="Por facturar"
              value={formatMoneda(data.coti.consumo.devengado_pendiente)}
              accent="warning"
              icon={<span aria-hidden>•</span>}
            />
            <KpiCard
              label="Disponible"
              value={formatMoneda(data.coti.consumo.disponible)}
              accent="primary"
              icon={<span aria-hidden>=</span>}
            />
          </div>

          <Card>
            <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">Capturas de {cotId}</h2>
            </div>
            <div className="p-2 sm:p-4">
              {data.filas.length === 0 ? (
                <EmptyState title="Sin devengado registrado" message={`No hay capturas para ${cotId}.`} />
              ) : (
                <DataTable
                  columns={columns}
                  rows={data.filas}
                  rowKey={(r) => r.ID_Captura}
                  caption={`Devengado de ${cotId}`}
                />
              )}
            </div>
          </Card>

          <NuevoDevengadoModal
            open={open}
            cotId={cotId}
            onClose={() => setOpen(false)}
            onCreado={() => {
              setOpen(false)
              toast.push({ tipo: 'success', titulo: 'Devengado registrado', descripcion: 'Queda Pendiente de facturar.' })
              reload()
            }}
          />
        </>
      ) : null}
    </div>
  )
}

function NuevoDevengadoModal({
  open,
  cotId,
  onClose,
  onCreado,
}: {
  open: boolean
  cotId: string
  onClose: () => void
  onCreado: () => void
}) {
  const toast = useToast()
  const vacio: DevengadoPayload = {
    ID_Captura: '',
    Fecha: new Date().toISOString().slice(0, 10),
    Horas_Trabajadas: '',
    Piezas_Sorteadas: '',
    Monto_Devengado: '',
  }
  const [form, setForm] = useState<DevengadoPayload>(vacio)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [wasOpen, setWasOpen] = useState(false)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setForm({ ...vacio, Fecha: new Date().toISOString().slice(0, 10) })
      setErrors({})
    }
  }

  const set =
    (k: keyof DevengadoPayload) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function guardar() {
    setSaving(true)
    setErrors({})
    try {
      await crearDevengado(cotId, {
        ID_Captura: form.ID_Captura.trim().toUpperCase(),
        Fecha: form.Fecha,
        Horas_Trabajadas: form.Horas_Trabajadas.trim() !== '' ? form.Horas_Trabajadas.trim() : '0',
        Piezas_Sorteadas: form.Piezas_Sorteadas?.trim() ? form.Piezas_Sorteadas.trim() : null,
        Monto_Devengado: form.Monto_Devengado.trim(),
      })
      onCreado()
    } catch (e) {
      const fields = errorFields(e)
      if (fields) setErrors(fields)
      toast.push({ tipo: 'error', titulo: 'No se pudo registrar', descripcion: errorMessage(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={`Nuevo devengado en ${cotId}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="ID de captura (opcional)" placeholder="(automático)" value={form.ID_Captura} onChange={set('ID_Captura')} error={errors.ID_Captura} />
        <TextField label="Fecha" type="date" value={form.Fecha} onChange={set('Fecha')} error={errors.Fecha} />
        <TextField label="Horas trabajadas" inputMode="decimal" placeholder="40.00" value={form.Horas_Trabajadas} onChange={set('Horas_Trabajadas')} error={errors.Horas_Trabajadas} />
        <TextField label="Piezas sorteadas" inputMode="numeric" value={form.Piezas_Sorteadas ?? ''} onChange={set('Piezas_Sorteadas')} error={errors.Piezas_Sorteadas} />
        <div className="sm:col-span-2">
          <TextField label="Monto devengado (MXN)" inputMode="decimal" placeholder="10000.00" value={form.Monto_Devengado} onChange={set('Monto_Devengado')} error={errors.Monto_Devengado} />
        </div>
      </div>
    </Modal>
  )
}
