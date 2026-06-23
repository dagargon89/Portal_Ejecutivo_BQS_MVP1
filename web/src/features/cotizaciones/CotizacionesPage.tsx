/* Cotizaciones (Tier 0): lista con filtros por cliente/estatus y alta/edición
 * (rol facturación o admin) en modal. UI re-estilizada del demo, cableada a la
 * capa real (lib/cotizaciones + Axios). */
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileSpreadsheet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useSession } from '@/auth/session'
import { useAsync } from '@/hooks/useAsync'
import { errorFields, errorMessage } from '@/lib/api'
import { actualizarCotizacion, crearCotizacion, listarCotizaciones } from '@/lib/cotizaciones'
import type { CotizacionPayload } from '@/lib/cotizaciones'
import { formatMoneda } from '@/lib/format'
import type { Cotizacion } from '@/lib/types'

const ESTATUS: Cotizacion['Estatus'][] = ['Aprobada', 'Pendiente PO', 'Cerrada']

const VACIO: CotizacionPayload = {
  ID_Cotizacion: '',
  ID_Cliente: '',
  PO_Referencia: '',
  Monto_Autorizado: '',
  Piezas_Autorizadas: '',
  Estatus: 'Pendiente PO',
}

export function CotizacionesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { hasRole } = useSession()
  const puedeEscribir = hasRole('facturacion', 'admin')

  const [idCliente, setIdCliente] = useState('')
  const [estatus, setEstatus] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<CotizacionPayload | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const { data, loading, error, reload } = useAsync(
    () => listarCotizaciones({ idCliente: idCliente || undefined, estatus: estatus || undefined, page }),
    [idCliente, estatus, page],
  )

  function abrirNueva() {
    setEditandoId(null)
    setForm({ ...VACIO })
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
  }

  const columns: Column<Cotizacion>[] = [
    { key: 'cot', header: 'Cotización', mono: true, render: (r) => r.ID_Cotizacion },
    { key: 'cliente', header: 'Cliente', mono: true, render: (r) => r.ID_Cliente },
    { key: 'po', header: 'PO', render: (r) => r.PO_Referencia ?? '—' },
    { key: 'aut', header: 'Autorizado', num: true, render: (r) => formatMoneda(r.Monto_Autorizado) },
    { key: 'estatus', header: 'Estatus', render: (r) => r.Estatus },
    ...(puedeEscribir
      ? [
          {
            key: 'acciones',
            header: '',
            align: 'right' as const,
            thClassName: 'w-24',
            render: (r: Cotizacion) => (
              <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => abrirEdicion(r)}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Editar
                </button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cotizaciones"
        description="Montos y piezas autorizadas por cliente; base del consumo devengado."
        actions={
          puedeEscribir ? (
            <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={abrirNueva}>
              Nueva cotización
            </Button>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
          <TextField
            label=""
            aria-label="Filtrar por ID de cliente"
            placeholder="Filtrar por ID_Cliente (CLI-001)…"
            value={idCliente}
            onChange={(e) => {
              setIdCliente(e.target.value)
              setPage(1)
            }}
          />
          <Select
            label=""
            aria-label="Filtrar por estatus"
            value={estatus}
            onChange={(e) => {
              setEstatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todos los estatus</option>
            {ESTATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <TableSkeleton cols={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.cotizaciones.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="h-8 w-8" />}
          title="Sin cotizaciones"
          message="No hay cotizaciones que coincidan con el filtro."
        />
      ) : data ? (
        <>
          <DataTable
            columns={columns}
            rows={data.cotizaciones}
            rowKey={(r) => r.ID_Cotizacion}
            onRowClick={(r) => navigate(`/cotizaciones/${encodeURIComponent(r.ID_Cotizacion)}`)}
            caption="Lista de cotizaciones"
          />
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      ) : null}

      <CotizacionModal
        form={form}
        editandoId={editandoId}
        onClose={() => {
          setForm(null)
          setEditandoId(null)
        }}
        onSaved={() => {
          const editaba = editandoId !== null
          setForm(null)
          setEditandoId(null)
          toast.push({ tipo: 'success', titulo: editaba ? 'Cotización actualizada' : 'Cotización creada' })
          reload()
        }}
      />
    </div>
  )
}

function CotizacionModal({
  form,
  editandoId,
  onClose,
  onSaved,
}: {
  form: CotizacionPayload | null
  editandoId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [local, setLocal] = useState<CotizacionPayload>(form ?? VACIO)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)

  const sig = form ? `${editandoId ?? 'nueva'}:${form.ID_Cotizacion}` : null
  if (sig !== signature) {
    setSignature(sig)
    setLocal(form ?? VACIO)
    setErrors({})
  }

  const set =
    (k: keyof CotizacionPayload) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setLocal((f) => ({ ...f, [k]: e.target.value }))

  async function guardar() {
    setSaving(true)
    setErrors({})
    try {
      const payload: CotizacionPayload = {
        ...local,
        ID_Cotizacion: local.ID_Cotizacion.trim().toUpperCase(),
        ID_Cliente: local.ID_Cliente.trim().toUpperCase(),
        PO_Referencia: local.PO_Referencia?.trim() ? local.PO_Referencia.trim() : null,
        Monto_Autorizado: local.Monto_Autorizado.trim(),
        Piezas_Autorizadas: local.Piezas_Autorizadas?.trim() ? local.Piezas_Autorizadas.trim() : null,
      }
      if (editandoId !== null) {
        await actualizarCotizacion(editandoId, {
          PO_Referencia: payload.PO_Referencia,
          Monto_Autorizado: payload.Monto_Autorizado,
          Piezas_Autorizadas: payload.Piezas_Autorizadas,
          Estatus: payload.Estatus,
        })
      } else {
        await crearCotizacion(payload)
      }
      onSaved()
    } catch (e) {
      const fields = errorFields(e)
      if (fields) setErrors(fields)
      toast.push({ tipo: 'error', titulo: 'No se pudo guardar', descripcion: errorMessage(e) })
    } finally {
      setSaving(false)
    }
  }

  const bloqueado = editandoId !== null

  return (
    <Modal
      open={form !== null}
      title={editandoId !== null ? `Editar ${editandoId}` : 'Nueva cotización'}
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
        <TextField
          label="ID Cotización"
          placeholder="COT-0001"
          value={local.ID_Cotizacion}
          onChange={set('ID_Cotizacion')}
          error={errors.ID_Cotizacion}
          disabled={bloqueado}
        />
        <TextField
          label="ID Cliente"
          placeholder="CLI-001"
          value={local.ID_Cliente}
          onChange={set('ID_Cliente')}
          error={errors.ID_Cliente}
          disabled={bloqueado}
        />
        <TextField
          label="PO de referencia"
          value={local.PO_Referencia ?? ''}
          onChange={set('PO_Referencia')}
        />
        <TextField
          label="Monto autorizado (MXN)"
          inputMode="decimal"
          placeholder="100000.00"
          value={local.Monto_Autorizado}
          onChange={set('Monto_Autorizado')}
          error={errors.Monto_Autorizado}
        />
        <TextField
          label="Piezas autorizadas"
          inputMode="numeric"
          value={local.Piezas_Autorizadas ?? ''}
          onChange={set('Piezas_Autorizadas')}
        />
        <Select label="Estatus" value={local.Estatus} onChange={set('Estatus')}>
          {ESTATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
    </Modal>
  )
}
