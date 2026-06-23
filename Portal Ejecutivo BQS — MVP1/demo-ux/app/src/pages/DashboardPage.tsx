/* Resumen ejecutivo: las 3 preguntas (RF-DASH-01/02/03) + analítica del ciclo
 * de cobro (api.dashMetricas, calculada en el "servidor" mock). Grid responsivo
 * 1->2->3 columnas sin scroll horizontal a 360px. */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  CircleDashed,
  Wallet,
  ArrowRight,
  Coins,
  Percent,
  AlertTriangle,
  ReceiptText,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";
import { KpiSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { BarrasMensuales, DonaEstatus, BarrasClientes, EmbudoCobro } from "@/components/ui/Charts";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib";
import { money, pct, periodoLargo, horaIso } from "@/lib/format";

type Accent = "primary" | "secondary" | "warning" | "danger";
const accentText: Record<Accent, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  warning: "text-warning",
  danger: "text-danger",
};

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent: Accent;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className={accentText[accent]} aria-hidden>
          {icon}
        </span>
      </div>
      <p className="num mt-2 text-2xl font-bold leading-none text-slate-900">{value}</p>
      {sub ? <p className="mt-1.5 text-xs text-slate-400">{sub}</p> : null}
    </div>
  );
}

export function DashboardPage() {
  const resumen = useAsync(() => api.dashResumen(), []);
  const metricas = useAsync(() => api.dashMetricas(), []);

  const data = resumen.data;
  const m = metricas.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resumen ejecutivo"
        description={
          data ? `Periodo: ${periodoLargo(data.periodo)} · ${data.moneda}` : "Las tres preguntas del negocio"
        }
      />

      {/* ===== Las 3 preguntas ===== */}
      {resumen.loading ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </section>
      ) : resumen.error ? (
        <ErrorState error={resumen.error} onRetry={resumen.reload} />
      ) : data ? (
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
      ) : null}

      {/* ===== Métricas secundarias + gráficas ===== */}
      {metricas.loading ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-7 w-28" />
              </div>
            ))}
          </section>
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </section>
        </>
      ) : metricas.error ? (
        <ErrorState error={metricas.error} onRetry={metricas.reload} />
      ) : m ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Cobrado del mes"
              value={money(m.cobrado_mes)}
              sub={`${m.facturas_emitidas_mes} facturas emitidas`}
              icon={<Coins className="h-5 w-5" aria-hidden />}
              accent="secondary"
            />
            <StatCard
              label="Tasa de cobro"
              value={pct(m.tasa_cobro)}
              sub="Cobrado ÷ facturado del mes"
              icon={<Percent className="h-5 w-5" aria-hidden />}
              accent="primary"
            />
            <StatCard
              label="Cartera vencida"
              value={money(m.cartera_vencida)}
              sub={`${pct(m.pct_vencida)} de lo por cobrar`}
              icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
              accent="danger"
            />
            <StatCard
              label="Ticket promedio"
              value={money(m.ticket_promedio)}
              sub={`${m.clientes_activos}/${m.clientes_total} clientes activos`}
              icon={<ReceiptText className="h-5 w-5" aria-hidden />}
              accent="warning"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Facturación vs cobranza" subtitle="Últimos 6 meses" />
              <div className="p-4 sm:p-6">
                <BarrasMensuales data={m.serie_mensual} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Estatus de facturas" subtitle="Distribución del monto emitido" />
              <div className="p-4 sm:p-6">
                <DonaEstatus data={m.distribucion_estatus} />
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Ciclo de cobro" subtitle="Autorizado → devengado → facturado → cobrado" />
              <div className="p-4 sm:p-6">
                <EmbudoCobro data={m.embudo} />
              </div>
            </Card>
            <Card>
              <CardHeader
                title="Top clientes por cartera"
                subtitle="Mayor saldo por cobrar"
                action={
                  <Link
                    to="/por-cobrar"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Ver todo <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                }
              />
              <div className="p-4 sm:p-6">
                <BarrasClientes data={m.top_clientes} />
              </div>
            </Card>
          </section>
        </>
      ) : null}

      {/* ===== Accesos a desgloses ===== */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/por-facturar"
          className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <CircleDashed className="h-4 w-4 text-warning" aria-hidden />
            Ver desglose por facturar (por cotización)
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" aria-hidden />
        </Link>
        <Link
          to="/por-cobrar"
          className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4 text-primary" aria-hidden />
            Ver cartera por cobrar (por cliente)
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" aria-hidden />
        </Link>
      </section>

      {data ? (
        <p className="text-xs text-slate-400">Calculado en {horaIso(data.calculado_en)} (servidor)</p>
      ) : null}
    </div>
  );
}
