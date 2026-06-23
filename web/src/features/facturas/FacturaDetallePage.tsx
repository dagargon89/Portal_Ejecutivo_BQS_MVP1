/* Detalle de factura: totales, estado, abonos y registro de pago (RF-PAG-01).
 * El backend valida sobrepago / factura pagada. UI re-estilizada del demo. */
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { StatusBadge, badgeDePago } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { KpiSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useSession } from '@/auth/session'
import { useAsync } from '@/hooks/useAsync'
import { errorFields, errorMessage } from '@/lib/api'
import { obtenerFactura, registrarPago } from '@/lib/facturas'
import { formatMoneda, fecha } from '@/lib/format'
import type { Pago } from '@/lib/types'

interface FormPago {
  ID_Pago: string
  Fecha_Pago: string
  Monto_Pagado: string
  Referencia: string
}

const colsPagos: Column<Pago>[] = [
  { key: 'pago', header: 'Pago', mono: true, render: (r) => r.ID_Pago },
  { key: 'fecha', header: 'Fecha', render: (r) => fecha(r.Fecha_Pago) },
  { key: 'ref', header: 'Referencia', render: (r) => r.Referencia ?? '—' },
  { key: 'monto', header: 'Monto', num: true, render: (r) => formatMoneda(r.Monto_Pagado) },
]

export function FacturaDetallePage() {
  const { folio = '' } = useParams<{ folio: string }>()
  const toast = useToast()
  const { hasRole } = useSession()
  const puedeEscribir = hasRole('facturacion', 'admin')

  const { data: factura, loading, error, reload } = useAsync(() => obtenerFactura(folio), [folio])
  const [openPago, setOpenPago] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factura"
        description={factura ? factura.Folio_Factura : undefined}
        actions={
          <Link to="/facturas">
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
              Facturas
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : factura ? (
        <>
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-slate-500">{factura.Folio_Factura}</p>
                <Link
                  to={`/clientes/${encodeURIComponent(factura.ID_Cliente)}`}
                  className="font-mono text-sm text-primary hover:underline"
                >
                  {factura.ID_Cliente}
                </Link>
                <p className="mt-1 text-sm text-slate-600">
                  Emisión {fecha(factura.Fecha_Emision)} · Vence {fecha(factura.Fecha_Vencimiento)}
                </p>
              </div>
              <StatusBadge estado={badgeDePago(factura.Estatus_Pago)} />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Total"
              value={formatMoneda(factura.Monto_Total)}
              accent="primary"
              icon={<span aria-hidden>Σ</span>}
            />
            <KpiCard
              label="Pagado"
              value={formatMoneda(factura.pagado)}
              accent="secondary"
              icon={<span aria-hidden>✓</span>}
            />
            <KpiCard
              label="Saldo por cobrar"
              value={formatMoneda(factura.saldo)}
              accent="warning"
              icon={<span aria-hidden>•</span>}
            />
          </div>

          <Card>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">Abonos registrados</h2>
              {puedeEscribir && factura.Estatus_Pago !== 'Pagada' ? (
                <Button
                  variant="secondary"
                  icon={<Plus className="h-4 w-4" aria-hidden />}
                  onClick={() => setOpenPago(true)}
                >
                  Registrar pago
                </Button>
              ) : null}
            </div>
            <div className="p-2 sm:p-4">
              {factura.pagos.length === 0 ? (
                <EmptyState title="Sin pagos registrados" />
              ) : (
                <DataTable
                  columns={colsPagos}
                  rows={factura.pagos}
                  rowKey={(r) => r.ID_Pago}
                  caption="Abonos de la factura"
                />
              )}
            </div>
          </Card>

          <RegistrarPagoModal
            open={openPago}
            folio={folio}
            onClose={() => setOpenPago(false)}
            onRegistrado={() => {
              setOpenPago(false)
              toast.push({ tipo: 'success', titulo: 'Pago registrado' })
              reload()
            }}
          />
        </>
      ) : null}
    </div>
  )
}

function RegistrarPagoModal({
  open,
  folio,
  onClose,
  onRegistrado,
}: {
  open: boolean
  folio: string
  onClose: () => void
  onRegistrado: () => void
}) {
  const toast = useToast()
  const vacio: FormPago = {
    ID_Pago: '',
    Fecha_Pago: new Date().toISOString().slice(0, 10),
    Monto_Pagado: '',
    Referencia: '',
  }
  const [form, setForm] = useState<FormPago>(vacio)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [wasOpen, setWasOpen] = useState(false)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setForm({ ...vacio, Fecha_Pago: new Date().toISOString().slice(0, 10) })
      setErrors({})
    }
  }

  const set =
    (k: keyof FormPago) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function pagar() {
    setSaving(true)
    setErrors({})
    try {
      await registrarPago(folio, {
        ID_Pago: form.ID_Pago.trim().toUpperCase(),
        Fecha_Pago: form.Fecha_Pago,
        Monto_Pagado: form.Monto_Pagado.trim(),
        Referencia: form.Referencia.trim() !== '' ? form.Referencia.trim() : null,
      })
      onRegistrado()
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
      title="Registrar abono"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={pagar} loading={saving}>
            Registrar pago
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="ID de pago (opcional)" placeholder="(automático)" value={form.ID_Pago} onChange={set('ID_Pago')} error={errors.ID_Pago} />
        <TextField label="Fecha de pago" type="date" value={form.Fecha_Pago} onChange={set('Fecha_Pago')} error={errors.Fecha_Pago} />
        <TextField label="Monto del abono (MXN)" inputMode="decimal" placeholder="20000.00" value={form.Monto_Pagado} onChange={set('Monto_Pagado')} error={errors.Monto_Pagado} />
        <TextField label="Referencia" placeholder="SPEI / cheque…" value={form.Referencia} onChange={set('Referencia')} error={errors.Referencia} />
      </div>
    </Modal>
  )
}
