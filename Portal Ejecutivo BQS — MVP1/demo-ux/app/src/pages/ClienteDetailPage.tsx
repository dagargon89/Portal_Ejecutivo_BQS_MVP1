/* Detalle de cliente + cartera consolidada (RF-CLI-03 / QA1). */
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Ban } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { StatusBadge, badgeDePago } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/auth/session";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib";
import type { CarteraCliente } from "@/lib";
import { money } from "@/lib/format";

type FacturaRow = CarteraCliente["facturas"][number];
type CotRow = CarteraCliente["cotizaciones"][number];

const cotCols: Column<CotRow>[] = [
  { key: "id", header: "Cotización", mono: true, render: (r) => r.ID_Cotizacion },
  { key: "monto", header: "Autorizado", num: true, render: (r) => money(r.Monto_Autorizado) },
  { key: "estatus", header: "Estatus", render: (r) => r.Estatus },
];

const facCols: Column<FacturaRow>[] = [
  { key: "folio", header: "Folio", mono: true, render: (r) => r.Folio_Factura },
  { key: "total", header: "Total", num: true, render: (r) => money(r.Monto_Total) },
  { key: "pagado", header: "Pagado", num: true, render: (r) => money(r.pagado) },
  { key: "saldo", header: "Saldo", num: true, render: (r) => money(r.saldo) },
  { key: "estado", header: "Estado", render: (r) => <StatusBadge estado={badgeDePago(r.Estatus_Pago)} /> },
];

export function ClienteDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useSession();
  const { data, loading, error, reload } = useAsync(() => api.obtenerCliente(id), [id]);

  async function darBaja() {
    try {
      await api.bajaCliente(id);
      toast.push({ tipo: "success", titulo: "Cliente dado de baja", descripcion: "Baja lógica (demo)." });
      reload();
    } catch (e) {
      toast.push({ tipo: "error", titulo: "No se pudo dar de baja", descripcion: e instanceof Error ? e.message : "" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/clientes" className="inline-flex w-fit items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Clientes
      </Link>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <>
          <PageHeader
            title={data.Nombre_Comercial ?? data.Nombre_Fiscal}
            description={`${data.ID_Cliente} · ${data.Nombre_Fiscal} · RFC ${data.RFC ?? "—"}`}
            actions={
              hasRole("admin") && data.Estatus === "Activo" ? (
                <Button variant="danger" icon={<Ban className="h-4 w-4" aria-hidden />} onClick={darBaja}>
                  Dar de baja
                </Button>
              ) : undefined
            }
          />

          <Card className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Saldo por cobrar</p>
              <p className="num mt-1 text-3xl font-bold text-slate-900">{money(data.cartera.saldo_por_cobrar)}</p>
            </div>
            {data.Estatus === "Activo" ? (
              <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-secondary-strong">
                Cliente activo
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Cliente inactivo
              </span>
            )}
          </Card>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Cotizaciones</h2>
            {data.cartera.cotizaciones.length ? (
              <DataTable
                columns={cotCols}
                rows={data.cartera.cotizaciones}
                rowKey={(r) => r.ID_Cotizacion}
                onRowClick={(r) => navigate(`/cotizaciones/${r.ID_Cotizacion}`)}
                caption="Cotizaciones del cliente"
              />
            ) : (
              <EmptyState title="Sin cotizaciones" message="Este cliente no tiene cotizaciones registradas." />
            )}
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Facturas</h2>
            {data.cartera.facturas.length ? (
              <DataTable
                columns={facCols}
                rows={data.cartera.facturas}
                rowKey={(r) => r.Folio_Factura}
                onRowClick={(r) => navigate(`/facturas/${r.Folio_Factura}`)}
                caption="Facturas del cliente"
              />
            ) : (
              <EmptyState title="Sin facturas" message="Este cliente no tiene facturas emitidas." />
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
