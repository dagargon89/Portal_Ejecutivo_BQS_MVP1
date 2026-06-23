/* Detalle de cotización: consumo devengado vs autorizado (RF-COT-02). UI
 * re-estilizada del demo, cableada a lib/cotizaciones real. */
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { KpiSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAsync } from '@/hooks/useAsync'
import { obtenerCotizacion } from '@/lib/cotizaciones'
import { formatEntero, formatMoneda } from '@/lib/format'

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{etiqueta}</p>
      <p className="num mt-1 text-lg font-semibold text-slate-800">{valor}</p>
    </Card>
  )
}

export function CotizacionDetallePage() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: coti, loading, error, reload } = useAsync(() => obtenerCotizacion(id), [id])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Detalle de cotización"
        description={coti ? coti.ID_Cotizacion : undefined}
        actions={
          <Link to="/cotizaciones">
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
              Cotizaciones
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : coti ? (
        <>
          <Card className="p-6">
            <p className="font-mono text-xs text-slate-500">{coti.ID_Cotizacion}</p>
            <h2 className="num text-2xl font-bold text-slate-900">
              {formatMoneda(coti.Monto_Autorizado)}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <Link
                to={`/clientes/${encodeURIComponent(coti.ID_Cliente)}`}
                className="font-mono text-primary hover:underline"
              >
                {coti.ID_Cliente}
              </Link>
              {coti.PO_Referencia ? <span>PO: {coti.PO_Referencia}</span> : null}
              {coti.Piezas_Autorizadas ? (
                <span>{formatEntero(coti.Piezas_Autorizadas)} pzas</span>
              ) : null}
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                {coti.Estatus}
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard
              label="Monto autorizado"
              value={formatMoneda(coti.Monto_Autorizado)}
              accent="primary"
              icon={<FileSpreadsheet className="h-5 w-5" aria-hidden />}
            />
            <KpiCard
              label="Disponible"
              value={formatMoneda(coti.consumo.disponible)}
              note="Autorizado menos devengado"
              accent="secondary"
              icon={<Wallet className="h-5 w-5" aria-hidden />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Metrica
              etiqueta="Devengado acumulado"
              valor={formatMoneda(coti.consumo.devengado_acumulado)}
            />
            <Metrica
              etiqueta="Devengado pendiente"
              valor={formatMoneda(coti.consumo.devengado_pendiente)}
            />
            <Metrica
              etiqueta="Devengado facturado"
              valor={formatMoneda(coti.consumo.devengado_facturado)}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
