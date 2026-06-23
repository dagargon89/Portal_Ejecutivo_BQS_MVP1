/* Pregunta 2 con desglose por cotización (RF-DASH-02). Cableada al endpoint
 * real GET /v1/dashboard/por-facturar (desglose completo, sin paginar). */
import { useNavigate } from 'react-router-dom'
import { CircleDashed } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { KpiSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { obtenerPorFacturar } from '@/lib/dashboard'
import type { PorFacturarItem } from '@/lib/types'
import { formatMoneda, formatEntero } from '@/lib/format'

const columns: Column<PorFacturarItem>[] = [
  { key: 'cot', header: 'Cotización', mono: true, render: (r) => r.ID_Cotizacion },
  { key: 'cliente', header: 'Cliente', render: (r) => r.Nombre_Comercial ?? r.ID_Cliente },
  { key: 'po', header: 'PO', mono: true, render: (r) => r.PO_Referencia ?? '—' },
  { key: 'cap', header: 'Capturas', num: true, render: (r) => formatEntero(r.capturas) },
  {
    key: 'monto',
    header: 'Pendiente',
    num: true,
    render: (r) => formatMoneda(r.monto_devengado_pendiente),
  },
]

export function PorFacturarPage() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => obtenerPorFacturar(), [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Por facturar"
        description="Devengado ejecutado aún no facturado, por cotización."
      />

      {loading ? (
        <>
          <div className="max-w-sm">
            <KpiSkeleton />
          </div>
          <TableSkeleton cols={5} />
        </>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <>
          <div className="max-w-sm">
            <KpiCard
              label="Total por facturar"
              value={formatMoneda(data.total_por_facturar)}
              note="Suma del devengado pendiente"
              accent="warning"
              icon={<CircleDashed className="h-5 w-5" aria-hidden />}
            />
          </div>

          {data.desglose.length === 0 ? (
            <EmptyState
              title="Sin devengado pendiente"
              message="Todo el trabajo ejecutado ya fue facturado."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={data.desglose}
              rowKey={(r) => r.ID_Cotizacion}
              onRowClick={(r) => navigate(`/cotizaciones/${r.ID_Cotizacion}`)}
              caption="Desglose del devengado pendiente por cotización"
            />
          )}
        </>
      ) : null}
    </div>
  )
}
