/* Cotizaciones (COTIZACIONES): lista con filtros; alta (facturacion/admin). */
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/auth/session";
import { useAsync } from "@/hooks/useAsync";
import { api, ApiError } from "@/lib";
import type { Cotizacion, EstatusCotizacion } from "@/lib";
import { money, num } from "@/lib/format";

const columns: Column<Cotizacion>[] = [
  { key: "id", header: "Cotización", mono: true, render: (r) => r.ID_Cotizacion },
  { key: "cli", header: "Cliente", mono: true, render: (r) => r.ID_Cliente },
  { key: "po", header: "PO", mono: true, render: (r) => r.PO_Referencia ?? "—" },
  { key: "monto", header: "Autorizado", num: true, render: (r) => money(r.Monto_Autorizado) },
  { key: "pzs", header: "Piezas", num: true, render: (r) => (r.Piezas_Autorizadas != null ? num(r.Piezas_Autorizadas) : "—") },
  { key: "estatus", header: "Estatus", render: (r) => r.Estatus },
];

export function CotizacionesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useSession();
  const [estatus, setEstatus] = useState<EstatusCotizacion | "">("");
  const [idCliente, setIdCliente] = useState("");
  const [page, setPage] = useState(1);
  const [openNew, setOpenNew] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => api.listarCotizaciones({ estatus: estatus || undefined, id_cliente: idCliente || undefined, page }),
    [estatus, idCliente, page],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cotizaciones"
        description="Servicios autorizados: límite financiero y enlace a la PO."
        actions={
          hasRole("facturacion", "admin") ? (
            <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setOpenNew(true)}>
              Nueva cotización
            </Button>
          ) : undefined
        }
      />

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
            label="Estatus"
            value={estatus}
            onChange={(e) => {
              setEstatus(e.target.value as EstatusCotizacion | "");
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Pendiente PO">Pendiente PO</option>
            <option value="Cerrada">Cerrada</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <TableSkeleton cols={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="Sin cotizaciones" message="No hay cotizaciones que coincidan con los filtros." />
      ) : data ? (
        <>
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey={(r) => r.ID_Cotizacion}
            onRowClick={(r) => navigate(`/cotizaciones/${r.ID_Cotizacion}`)}
            caption="Lista de cotizaciones"
          />
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      ) : null}

      <NuevaCotizacionModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={() => {
          setOpenNew(false);
          toast.push({ tipo: "success", titulo: "Cotización creada", descripcion: "El alta se registró (demo)." });
          reload();
        }}
      />
    </div>
  );
}

function NuevaCotizacionModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ ID_Cotizacion: "", ID_Cliente: "", PO_Referencia: "", Monto_Autorizado: "", Piezas_Autorizadas: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function guardar() {
    setSaving(true);
    setErrors({});
    try {
      await api.crearCotizacion({
        ID_Cotizacion: form.ID_Cotizacion.trim(),
        ID_Cliente: form.ID_Cliente.trim(),
        PO_Referencia: form.PO_Referencia.trim() || null,
        Monto_Autorizado: Number(form.Monto_Autorizado || 0),
        Piezas_Autorizadas: form.Piezas_Autorizadas ? Number(form.Piezas_Autorizadas) : null,
        Estatus: "Aprobada",
      });
      onCreated();
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast.push({ tipo: "error", titulo: "No se pudo crear", descripcion: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Nueva cotización"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField label="ID Cotización" placeholder="COT-0051" value={form.ID_Cotizacion} onChange={set("ID_Cotizacion")} error={errors.ID_Cotizacion} />
        <TextField label="ID Cliente" placeholder="CLI-001" value={form.ID_Cliente} onChange={set("ID_Cliente")} error={errors.ID_Cliente} />
        <TextField label="PO Referencia" placeholder="PO-78002" value={form.PO_Referencia} onChange={set("PO_Referencia")} />
        <TextField label="Monto autorizado (MXN)" type="number" inputMode="decimal" placeholder="180000.00" value={form.Monto_Autorizado} onChange={set("Monto_Autorizado")} error={errors.Monto_Autorizado} />
        <TextField label="Piezas autorizadas" type="number" inputMode="numeric" placeholder="90000" value={form.Piezas_Autorizadas} onChange={set("Piezas_Autorizadas")} />
      </div>
    </Modal>
  );
}
