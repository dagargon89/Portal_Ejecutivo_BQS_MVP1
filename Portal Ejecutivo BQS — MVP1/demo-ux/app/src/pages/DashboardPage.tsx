/* Resumen ejecutivo: las 3 preguntas (RF-DASH-01/02/03). Calculadas en el
 * "servidor" (mock). Grid 1->2->3 columnas sin scroll horizontal a 360px. */
import { Link } from "react-router-dom";
import { TrendingUp, CircleDashed, Wallet, ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";
import { KpiSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib";
import { money, periodoLargo, horaIso } from "@/lib/format";

export function DashboardPage() {
  const { data, loading, error, reload } = useAsync(() => api.dashResumen(), []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resumen ejecutivo"
        description={data ? `Periodo: ${periodoLargo(data.periodo)} · ${data.moneda}` : "Las tres preguntas del negocio"}
      />

      {loading ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </section>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="¿Qué ya se facturó?"
              value={money(data.facturado_mes)}
              note="Mes en curso (Pagada + Vigente)"
              accent="secondary"
              icon={<TrendingUp className="h-5 w-5" aria-hidden />}
            />
            <KpiCard
              label="¿Qué falta por facturar?"
              value={money(data.por_facturar)}
              note="Devengado pendiente"
              accent="warning"
              icon={<CircleDashed className="h-5 w-5" aria-hidden />}
            />
            <KpiCard
              label="¿Cuánto te deben?"
              value={money(data.por_cobrar)}
              note="Neto de abonos (Vigente + Vencida)"
              accent="primary"
              icon={<Wallet className="h-5 w-5" aria-hidden />}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="/por-facturar"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="text-sm font-medium text-slate-700">Ver desglose por facturar (por cotización)</span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" aria-hidden />
            </Link>
            <Link
              to="/por-cobrar"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="text-sm font-medium text-slate-700">Ver cartera por cobrar (por cliente)</span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" aria-hidden />
            </Link>
          </section>

          <p className="text-xs text-slate-400">Calculado en {horaIso(data.calculado_en)} (servidor)</p>
        </>
      ) : null}
    </div>
  );
}
