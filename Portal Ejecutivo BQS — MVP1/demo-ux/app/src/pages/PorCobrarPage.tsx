/* Pregunta 3 con desglose por cliente y factura (RF-DASH-03). */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { KpiSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge, badgeDePago } from "@/components/ui/StatusBadge";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib";
import type { FacturaSaldo } from "@/lib";
import { money, fecha } from "@/lib/format";

export function PorCobrarPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.dashPorCobrar({ page }), [page]);
  const payload = data?.data[0];

  const cols: Column<FacturaSaldo>[] = [
    { key: "folio", header: "Folio", mono: true, render: (r) => r.Folio_Factura },
    { key: "emision", header: "Emisión", render: (r) => fecha(r.Fecha_Emision) },
    { key: "venc", header: "Vence", render: (r) => fecha(r.Fecha_Vencimiento) },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge estado={badgeDePago(r.Estatus_Pago)} /> },
    { key: "total", header: "Total", num: true, render: (r) => money(r.Monto_Total) },
    { key: "pagado", header: "Pagado", num: true, render: (r) => money(r.pagado) },
    { key: "saldo", header: "Saldo", num: true, render: (r) => <strong>{money(r.saldo)}</strong> },
    { key: "ir", header: "", render: () => <span className="text-xs text-primary">Ver →</span>, thClassName: "w-10" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Por cobrar" description="Saldo de cuentas por cobrar, neto de abonos, por cliente." />

      {loading ? (
        <>
          <div className="max-w-sm">
            <KpiSkeleton />
          </div>
          <TableSkeleton cols={6} />
        </>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : payload ? (
        <>
          <div className="max-w-sm">
            <KpiCard
              label="Total por cobrar"
              value={money(payload.total_por_cobrar)}
              note="Suma de saldos activos"
              accent="primary"
              icon={<Wallet className="h-5 w-5" aria-hidden />}
            />
          </div>

          {payload.clientes.length === 0 ? (
            <EmptyState title="Sin saldos por cobrar" message="No hay facturas activas con saldo pendiente." />
          ) : (
            <div className="flex flex-col gap-5">
              {payload.clientes.map((c) => (
                <Card key={c.ID_Cliente}>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        {c.Nombre_Comercial ?? c.ID_Cliente}
                      </h2>
                      <p className="font-mono text-xs text-slate-500">{c.ID_Cliente}</p>
                    </div>
                    <p className="num text-lg font-bold text-slate-900">{money(c.saldo_cliente)}</p>
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
              {data ? <Pagination meta={data.meta} onPage={setPage} /> : null}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
