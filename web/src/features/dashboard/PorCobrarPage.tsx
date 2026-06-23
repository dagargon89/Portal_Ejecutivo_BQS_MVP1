/* Pregunta 3 con desglose por cliente y factura (RF-DASH-03). Cableada al
 * endpoint real GET /v1/dashboard/por-cobrar (desglose completo, sin paginar). */
import { useNavigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card } from '@/components/ui/Card'
import { KpiSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { StatusBadge, badgeDePago } from '@/components/ui/StatusBadge'
import { useAsync } from '@/hooks/useAsync'
import { obtenerPorCobrar } from '@/lib/dashboard'
import type { EstatusFactura, PorCobrarFactura } from '@/lib/types'
import { formatMoneda, fecha } from '@/lib/format'

const cols: Column<PorCobrarFactura>[] = [
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
  {
    key: 'saldo',
    header: 'Saldo',
    num: true,
    render: (r) => <strong>{formatMoneda(r.saldo)}</strong>,
  },
  {
    key: 'ir',
    header: '',
    render: () => <span className="text-xs text-primary">Ver →</span>,
    thClassName: 'w-10',
  },
]

export function PorCobrarPage() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => obtenerPorCobrar(), [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Por cobrar"
        description="Saldo de cuentas por cobrar, neto de abonos, por cliente."
      />

      {loading ? (
        <>
          <div className="max-w-sm">
            <KpiSkeleton />
          </div>
          <TableSkeleton cols={6} />
        </>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <>
          <div className="max-w-sm">
            <KpiCard
              label="Total por cobrar"
              value={formatMoneda(data.total_por_cobrar)}
              note="Suma de saldos activos"
              accent="primary"
              icon={<Wallet className="h-5 w-5" aria-hidden />}
            />
          </div>

          {data.clientes.length === 0 ? (
            <EmptyState
              title="Sin saldos por cobrar"
              message="No hay facturas activas con saldo pendiente."
            />
          ) : (
            <div className="flex flex-col gap-5">
              {data.clientes.map((c) => (
                <Card key={c.ID_Cliente}>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        {c.Nombre_Comercial ?? c.ID_Cliente}
                      </h2>
                      <p className="font-mono text-xs text-slate-500">{c.ID_Cliente}</p>
                    </div>
                    <p className="num text-lg font-bold text-slate-900">
                      {formatMoneda(c.saldo_cliente)}
                    </p>
                  </div>
                  <div className="p-2 sm:p-4">
                    <DataTable
                      columns={cols}
                      rows={c.facturas}
                      rowKey={(r) => r.Folio_Factura}
                      onRowClick={(r) => navigate(`/facturas/${r.Folio_Factura}`)}
                      caption={`Facturas con saldo de ${c.Nombre_Comercial ?? c.ID_Cliente}`}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
