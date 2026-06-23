/* Detalle de cliente: cartera consolidada (RF-CLI-03) — totales, cotizaciones
 * y facturas. UI re-estilizada del demo, cableada a lib/clientes real. */
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Wallet, FileSpreadsheet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { KpiSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { StatusBadge, badgeDePago } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { obtenerCliente } from '@/lib/clientes'
import { formatEntero, formatMoneda, fecha } from '@/lib/format'
import type { CarteraCotizacion, CarteraFactura, EstatusFactura } from '@/lib/types'

export function ClienteDetallePage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cliente, loading, error, reload } = useAsync(() => obtenerCliente(id), [id])

  const colsCot: Column<CarteraCotizacion>[] = [
    { key: 'cot', header: 'Cotización', mono: true, render: (r) => r.ID_Cotizacion },
    { key: 'po', header: 'PO', mono: true, render: (r) => r.PO_Referencia ?? '—' },
    {
      key: 'piezas',
      header: 'Piezas',
      num: true,
      render: (r) => (r.Piezas_Autorizadas ? formatEntero(r.Piezas_Autorizadas) : '—'),
    },
    { key: 'aut', header: 'Autorizado', num: true, render: (r) => formatMoneda(r.Monto_Autorizado) },
    { key: 'dev', header: 'Devengado', num: true, render: (r) => formatMoneda(r.devengado) },
    { key: 'disp', header: 'Disponible', num: true, render: (r) => formatMoneda(r.disponible) },
    { key: 'estatus', header: 'Estatus', render: (r) => r.Estatus },
  ]

  const colsFac: Column<CarteraFactura>[] = [
    { key: 'folio', header: 'Folio', mono: true, render: (r) => r.Folio_Factura },
    { key: 'emision', header: 'Emisión', render: (r) => fecha(r.Fecha_Emision) },
    { key: 'venc', header: 'Vence', render: (r) => fecha(r.Fecha_Vencimiento) },
    {
      key: 'estado',
      header: 'Estado',
      render: (r) => <StatusBadge estado={badgeDePago(r.Estatus_Pago as EstatusFactura)} />,
    },
    { key: 'total', header: 'Total', num: true, render: (r) => formatMoneda(r.Monto_Total) },
    { key: 'pagado', header: 'Pagado', num: true, render: (r) => formatMoneda(r.pagado) },
    { key: 'saldo', header: 'Saldo', num: true, render: (r) => <strong>{formatMoneda(r.saldo)}</strong> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Detalle de cliente"
        description={cliente ? cliente.ID_Cliente : undefined}
        actions={
          <Link to="/clientes">
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
              Clientes
            </Button>
          </Link>
        }
      />

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
          <TableSkeleton cols={6} />
        </>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : cliente ? (
        <>
          <Card className="p-6">
            <p className="font-mono text-xs text-slate-500">{cliente.ID_Cliente}</p>
            <h2 className="text-xl font-bold text-slate-900">{cliente.Nombre_Fiscal}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              {cliente.Nombre_Comercial ? <span>{cliente.Nombre_Comercial}</span> : null}
              {cliente.RFC ? <span>RFC: {cliente.RFC}</span> : null}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  cliente.Estatus === 'Activo'
                    ? 'bg-success-soft text-secondary-strong'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cliente.Estatus}
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard
              label="Total autorizado"
              value={formatMoneda(cliente.cartera.total_autorizado)}
              note="Suma de cotizaciones"
              accent="primary"
              icon={<FileSpreadsheet className="h-5 w-5" aria-hidden />}
            />
            <KpiCard
              label="Saldo por cobrar"
              value={formatMoneda(cliente.cartera.saldo_por_cobrar)}
              note="Neto de abonos"
              accent="warning"
              icon={<Wallet className="h-5 w-5" aria-hidden />}
            />
          </div>

          <Card>
            <CardHeader title="Cartera de cotizaciones" />
            <div className="p-2 sm:p-4">
              {cliente.cartera.cotizaciones.length === 0 ? (
                <EmptyState title="Sin cotizaciones registradas" />
              ) : (
                <DataTable
                  columns={colsCot}
                  rows={cliente.cartera.cotizaciones}
                  rowKey={(r) => r.ID_Cotizacion}
                  onRowClick={(r) => navigate(`/cotizaciones/${encodeURIComponent(r.ID_Cotizacion)}`)}
                  caption="Cotizaciones del cliente"
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Facturas" />
            <div className="p-2 sm:p-4">
              {cliente.cartera.facturas.length === 0 ? (
                <EmptyState title="Sin facturas registradas" />
              ) : (
                <DataTable
                  columns={colsFac}
                  rows={cliente.cartera.facturas}
                  rowKey={(r) => r.Folio_Factura}
                  onRowClick={(r) => navigate(`/facturas/${encodeURIComponent(r.Folio_Factura)}`)}
                  caption="Facturas del cliente"
                />
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
