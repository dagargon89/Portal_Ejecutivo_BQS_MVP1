/* Pregunta 2 con desglose por cotización (RF-DASH-02). */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleDashed } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { KpiSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib";
import type { DesgloseCotizacion } from "@/lib";
import { money, num } from "@/lib/format";

const columns: Column<DesgloseCotizacion>[] = [
  { key: "cot", header: "Cotización", mono: true, render: (r) => r.ID_Cotizacion },
  { key: "cliente", header: "Cliente", render: (r) => r.Nombre_Comercial ?? r.ID_Cliente },
  { key: "po", header: "PO", mono: true, render: (r) => r.PO_Referencia ?? "—" },
  { key: "cap", header: "Capturas", num: true, render: (r) => num(r.capturas) },
  { key: "monto", header: "Pendiente", num: true, render: (r) => money(r.monto_devengado_pendiente) },
];

export function PorFacturarPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.dashPorFacturar({ page }), [page]);
  const payload = data?.data[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Por facturar" description="Devengado ejecutado aún no facturado, por cotización." />

      {loading ? (
        <>
          <div className="max-w-sm">
            <KpiSkeleton />
          </div>
          <TableSkeleton cols={5} />
        </>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : payload ? (
        <>
          <div className="max-w-sm">
            <KpiCard
              label="Total por facturar"
              value={money(payload.total_por_facturar)}
              note="Suma del devengado pendiente"
              accent="warning"
              icon={<CircleDashed className="h-5 w-5" aria-hidden />}
            />
          </div>

          {payload.desglose.length === 0 ? (
            <EmptyState title="Sin devengado pendiente" message="Todo el trabajo ejecutado ya fue facturado." />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={payload.desglose}
                rowKey={(r) => r.ID_Cotizacion}
                onRowClick={(r) => navigate(`/cotizaciones/${r.ID_Cotizacion}`)}
                caption="Desglose del devengado pendiente por cotización"
              />
              {data ? <Pagination meta={data.meta} onPage={setPage} /> : null}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
