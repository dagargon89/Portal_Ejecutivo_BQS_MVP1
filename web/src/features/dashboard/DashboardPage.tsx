import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleDashed, TrendingUp, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { KpiSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { useResumenEjecutivo } from '@/hooks/useResumenEjecutivo'
import { obtenerPorFacturar } from '@/lib/dashboard'
import { formatMoneda, formatEntero, horaIso } from '@/lib/format'
import type { PorFacturarItem } from '@/lib/types'

/**
 * Dashboard ejecutivo — las 3 preguntas (RF-DASH). Las cifras llegan ya
 * calculadas del backend (RF-DASH-04); el cliente solo las formatea y presenta.
 * 3 KPIs legibles a 360px sin scroll horizontal (RNF-07); estado con ícono +
 * texto + barra de acento, contraste AA (RNF-08). Por facturar / por cobrar
 * enlazan a su desglose.
 */
const columns: Column<PorFacturarItem>[] = [
  { key: 'cot', header: 'Cotización', mono: true, render: (r) => r.ID_Cotizacion },
  { key: 'cliente', header: 'Cliente', render: (r) => r.Nombre_Comercial ?? r.ID_Cliente },
  { key: 'cap', header: 'Capturas', num: true, render: (r) => formatEntero(r.capturas) },
  {
    key: 'monto',
    header: 'Pendiente',
    num: true,
    render: (r) => formatMoneda(r.monto_devengado_pendiente),
  },
]

export function DashboardPage() {
  const { resumen, cargando, error, revalidar } = useResumenEjecutivo()
  const [desglose, setDesglose] = useState<PorFacturarItem[]>([])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await obtenerPorFacturar()
        if (active) setDesglose(data.desglose)
      } catch {
        if (active) setDesglose([])
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resumen ejecutivo"
        description={
          resumen
            ? `Periodo ${resumen.periodo} · ${resumen.moneda} · actualizado ${horaIso(resumen.calculado_en)}`
            : 'Las tres preguntas del negocio, calculadas en el servidor.'
        }
      />

      {error ? (
        <ErrorState
          error={new Error('Verifica tu sesión y tus permisos de lectura.')}
          onRetry={revalidar}
        />
      ) : cargando || resumen === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="¿Qué ya se facturó?"
              value={formatMoneda(resumen.facturado_mes)}
              note="Mes en curso"
              accent="secondary"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <Link
              to="/por-facturar"
              className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <KpiCard
                label="¿Qué falta por facturar?"
                value={formatMoneda(resumen.por_facturar)}
                note="Devengado pendiente · ver desglose"
                accent="warning"
                icon={<CircleDashed className="h-5 w-5" />}
              />
            </Link>
            <Link
              to="/por-cobrar"
              className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <KpiCard
                label="¿Cuánto te deben?"
                value={formatMoneda(resumen.por_cobrar)}
                note="Neto de abonos · ver desglose"
                accent="primary"
                icon={<Wallet className="h-5 w-5" />}
              />
            </Link>
          </div>

          {desglose.length > 0 && (
            <Card>
              <CardHeader
                title="Por facturar — desglose por cotización"
                subtitle="Devengado ejecutado aún no facturado"
              />
              <div className="p-2 sm:p-4">
                <DataTable
                  columns={columns}
                  rows={desglose}
                  rowKey={(r) => r.ID_Cotizacion}
                  caption="Desglose del devengado pendiente por cotización"
                />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
