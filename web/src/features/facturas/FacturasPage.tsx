/* Facturas: lista con filtros (cliente/estatus) y emisión desde devengado
 * (rol facturación o admin) en modal. UI re-estilizada del demo, cableada a la
 * capa real (lib/facturas + Axios). */
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
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
import { StatusBadge, badgeDePago } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { useSession } from '@/auth/session'
import { useAsync } from '@/hooks/useAsync'
import { errorFields, errorMessage } from '@/lib/api'
import { emitirFactura, listarFacturas } from '@/lib/facturas'
import { formatMoneda, fecha } from '@/lib/format'
import type { EstatusFactura, Factura } from '@/lib/types'

const ESTATUS: EstatusFactura[] = ['Vigente', 'Vencida', 'Pagada']

interface FormEmision {
  Folio_Factura: string
  ID_Cliente: string
  Fecha_Emision: string
  Fecha_Vencimiento: string
  Monto_Subtotal: string
  Monto_Total: string
  capturas: string
}

const columns: Column<Factura>[] = [
  { key: 'folio', header: 'Folio', mono: true, render: (r) => r.Folio_Factura },
  { key: 'cliente', header: 'Cliente', mono: true, render: (r) => r.ID_Cliente },
  { key: 'emision', header: 'Emisión', render: (r) => fecha(r.Fecha_Emision) },
  { key: 'venc', header: 'Vence', render: (r) => fecha(r.Fecha_Vencimiento) },
  { key: 'total', header: 'Total', num: true, render: (r) => formatMoneda(r.Monto_Total) },
  {
    key: 'estado',
    header: 'Estado',
    render: (r) => <StatusBadge estado={badgeDePago(r.Estatus_Pago)} />,
  },
]

export function FacturasPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { hasRole } = useSession()
  const puedeEscribir = hasRole('facturacion', 'admin')

  const [idCliente, setIdCliente] = useState('')
  const [estatus, setEstatus] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)

  const { data, loading, error, reload } = useAsync(
    () => listarFacturas({ idCliente: idCliente || undefined, estatus: estatus || undefined, page }),
    [idCliente, estatus, page],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Facturas"
        description="Emisión desde devengado y seguimiento de saldo por factura."
        actions={
          puedeEscribir ? (
            <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setOpen(true)}>
              Emitir factura
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
      ) : data && data.facturas.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Sin facturas"
          message="No hay facturas que coincidan con el filtro."
        />
      ) : data ? (
        <>
          <DataTable
            columns={columns}
            rows={data.facturas}
            rowKey={(r) => r.Folio_Factura}
            onRowClick={(r) => navigate(`/facturas/${encodeURIComponent(r.Folio_Factura)}`)}
            caption="Lista de facturas"
          />
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      ) : null}

      <EmitirFacturaModal
        open={open}
        onClose={() => setOpen(false)}
        onEmitida={() => {
          setOpen(false)
          toast.push({ tipo: 'success', titulo: 'Factura emitida', descripcion: 'Queda como Vigente.' })
          reload()
        }}
      />
    </div>
  )
}

function EmitirFacturaModal({
  open,
  onClose,
  onEmitida,
}: {
  open: boolean
  onClose: () => void
  onEmitida: () => void
}) {
  const toast = useToast()
  const vacio: FormEmision = {
    Folio_Factura: '',
    ID_Cliente: '',
    Fecha_Emision: new Date().toISOString().slice(0, 10),
    Fecha_Vencimiento: '',
    Monto_Subtotal: '',
    Monto_Total: '',
    capturas: '',
  }
  const [form, setForm] = useState<FormEmision>(vacio)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [wasOpen, setWasOpen] = useState(false)

  // Reinicia el formulario al abrir el modal.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setForm({ ...vacio, Fecha_Emision: new Date().toISOString().slice(0, 10) })
      setErrors({})
    }
  }

  const set =
    (k: keyof FormEmision) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function emitir() {
    setSaving(true)
    setErrors({})
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
      onEmitida()
    } catch (e) {
      const fields = errorFields(e)
      if (fields) setErrors(fields)
      toast.push({ tipo: 'error', titulo: 'No se pudo emitir', descripcion: errorMessage(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Emitir factura desde devengado"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={emitir} loading={saving}>
            Emitir factura
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="Folio (opcional)"
          placeholder="(automático) o F-9001"
          value={form.Folio_Factura}
          onChange={set('Folio_Factura')}
          error={errors.Folio_Factura}
        />
        <TextField
          label="ID Cliente"
          placeholder="CLI-001"
          value={form.ID_Cliente}
          onChange={set('ID_Cliente')}
          error={errors.ID_Cliente}
        />
        <TextField
          label="Fecha de emisión"
          type="date"
          value={form.Fecha_Emision}
          onChange={set('Fecha_Emision')}
          error={errors.Fecha_Emision}
        />
        <TextField
          label="Fecha de vencimiento"
          type="date"
          value={form.Fecha_Vencimiento}
          onChange={set('Fecha_Vencimiento')}
          error={errors.Fecha_Vencimiento}
        />
        <TextField
          label="Subtotal (MXN)"
          inputMode="decimal"
          placeholder="60344.83"
          value={form.Monto_Subtotal}
          onChange={set('Monto_Subtotal')}
          error={errors.Monto_Subtotal}
        />
        <TextField
          label="Total con IVA (MXN)"
          inputMode="decimal"
          placeholder="70000.00"
          value={form.Monto_Total}
          onChange={set('Monto_Total')}
          error={errors.Monto_Total}
        />
        <div className="sm:col-span-2">
          <TextField
            label="Capturas de devengado (IDs separados por coma)"
            placeholder="BIT-0001, BIT-0002"
            value={form.capturas}
            onChange={set('capturas')}
            error={errors.capturas}
          />
        </div>
      </div>
    </Modal>
  )
}
