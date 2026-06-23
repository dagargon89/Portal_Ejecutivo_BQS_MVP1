/* Facturas (FACTURAS): lista con filtros por cliente, estatus y rango. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge, badgeDePago } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib";
import type { Factura, EstatusPago } from "@/lib";
import { money, fecha } from "@/lib/format";

const columns: Column<Factura>[] = [
  { key: "folio", header: "Folio", mono: true, render: (r) => r.Folio_Factura },
  { key: "cli", header: "Cliente", mono: true, render: (r) => r.ID_Cliente },
  { key: "emision", header: "Emisión", render: (r) => fecha(r.Fecha_Emision) },
  { key: "venc", header: "Vence", render: (r) => fecha(r.Fecha_Vencimiento) },
  { key: "total", header: "Total", num: true, render: (r) => money(r.Monto_Total) },
  { key: "estado", header: "Estado", render: (r) => <StatusBadge estado={badgeDePago(r.Estatus_Pago)} /> },
];

export function FacturasPage() {
  const navigate = useNavigate();
  const [estatus, setEstatus] = useState<EstatusPago | "">("");
  const [idCliente, setIdCliente] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useAsync(
    () => api.listarFacturas({ estatus: estatus || undefined, id_cliente: idCliente || undefined, page }),
    [estatus, idCliente, page],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Facturas" description="Folios emitidos y su estado de cobranza." />

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Filtrar por cliente (ID)"
            placeholder="CLI-001"
            value={idCliente}
            onChange={(e) => {
              setIdCliente(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Estatus de pago"
            value={estatus}
            onChange={(e) => {
              setEstatus(e.target.value as EstatusPago | "");
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="Vigente">Vigente</option>
            <option value="Vencida">Vencida</option>
            <option value="Pagada">Pagada</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <TableSkeleton cols={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="Sin facturas" message="No hay facturas que coincidan con los filtros." />
      ) : data ? (
        <>
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey={(r) => r.Folio_Factura}
            onRowClick={(r) => navigate(`/facturas/${r.Folio_Factura}`)}
            caption="Lista de facturas"
          />
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      ) : null}
    </div>
  );
}
