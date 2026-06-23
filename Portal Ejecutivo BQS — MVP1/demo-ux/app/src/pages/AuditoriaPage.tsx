/* Auditoría inmutable de mutaciones financieras y accesos (RF-MET-01). Admin. */
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib";
import type { Auditoria } from "@/lib";
import { horaIso } from "@/lib/format";

const accionCls: Record<string, string> = {
  crear: "bg-success-soft text-secondary-strong",
  actualizar: "bg-info-soft text-primary",
  eliminar: "bg-danger-soft text-danger",
  acceso: "bg-slate-100 text-slate-600",
};

const columns: Column<Auditoria>[] = [
  { key: "fecha", header: "Fecha", render: (r) => horaIso(r.creado_en) },
  { key: "user", header: "Usuario", num: true, render: (r) => (r.usuario_id != null ? `#${r.usuario_id}` : "—") },
  {
    key: "accion",
    header: "Acción",
    render: (r) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${accionCls[r.accion] ?? "bg-slate-100 text-slate-600"}`}>
        {r.accion}
      </span>
    ),
  },
  { key: "entidad", header: "Entidad", render: (r) => r.entidad },
  { key: "eid", header: "ID", mono: true, render: (r) => r.entidad_id ?? "—" },
  { key: "ip", header: "IP", mono: true, render: (r) => r.ip ?? "—" },
];

export function AuditoriaPage() {
  const [entidad, setEntidad] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(
    () => api.listarAuditoria({ entidad: entidad || undefined, page }),
    [entidad, page],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Auditoría" description="Bitácora inmutable de mutaciones financieras y accesos." />

      <Card className="p-4">
        <div className="max-w-xs">
          <Select
            label="Filtrar por entidad"
            value={entidad}
            onChange={(e) => {
              setEntidad(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas</option>
            <option value="FACTURAS">FACTURAS</option>
            <option value="PAGOS">PAGOS</option>
            <option value="CAT_CLIENTES">CAT_CLIENTES</option>
            <option value="BITACORA_SORTEO">BITACORA_SORTEO</option>
            <option value="dashboard">dashboard</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <TableSkeleton cols={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="Sin registros" message="No hay eventos de auditoría para el filtro." />
      ) : data ? (
        <>
          <DataTable columns={columns} rows={data.data} rowKey={(r) => String(r.id)} caption="Eventos de auditoría" />
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      ) : null}
    </div>
  );
}
