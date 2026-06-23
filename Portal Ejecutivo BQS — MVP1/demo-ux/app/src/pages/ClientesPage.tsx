/* Clientes (CAT_CLIENTES): lista con búsqueda consolidada (RF-CLI-01) y
 * filtro por estatus; alta (rol admin, RF-CLI-02) en modal. */
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
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
import type { CatCliente, EstatusCliente } from "@/lib";

const columns: Column<CatCliente>[] = [
  { key: "id", header: "ID", mono: true, render: (r) => r.ID_Cliente },
  { key: "comercial", header: "Comercial", render: (r) => r.Nombre_Comercial ?? "—" },
  { key: "fiscal", header: "Razón social", render: (r) => r.Nombre_Fiscal },
  { key: "rfc", header: "RFC", mono: true, render: (r) => r.RFC ?? "—" },
  {
    key: "estatus",
    header: "Estatus",
    render: (r) =>
      r.Estatus === "Activo" ? (
        <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-secondary-strong">
          Activo
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          Inactivo
        </span>
      ),
  },
];

export function ClientesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useSession();
  const [q, setQ] = useState("");
  const [estatus, setEstatus] = useState<EstatusCliente | "">("");
  const [page, setPage] = useState(1);
  const [openNew, setOpenNew] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => api.listarClientes({ q: q || undefined, estatus: estatus || undefined, page }),
    [q, estatus, page],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Catálogo maestro con ID único (consolida nombres variantes)."
        actions={
          hasRole("admin") ? (
            <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setOpenNew(true)}>
              Nuevo cliente
            </Button>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, RFC o ID…"
              aria-label="Buscar clientes"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Select
            label=""
            aria-label="Filtrar por estatus"
            value={estatus}
            onChange={(e) => {
              setEstatus(e.target.value as EstatusCliente | "");
              setPage(1);
            }}
          >
            <option value="">Todos los estatus</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <TableSkeleton cols={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Sin clientes"
          message="No hay clientes que coincidan con la búsqueda."
        />
      ) : data ? (
        <>
          <DataTable
            columns={columns}
            rows={data.data}
            rowKey={(r) => r.ID_Cliente}
            onRowClick={(r) => navigate(`/clientes/${r.ID_Cliente}`)}
            caption="Lista de clientes"
          />
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      ) : null}

      <NuevoClienteModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={() => {
          setOpenNew(false);
          toast.push({ tipo: "success", titulo: "Cliente creado", descripcion: "El alta se registró (demo)." });
          reload();
        }}
      />
    </div>
  );
}

function NuevoClienteModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ ID_Cliente: "", Nombre_Fiscal: "", Nombre_Comercial: "", RFC: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function guardar() {
    setSaving(true);
    setErrors({});
    try {
      await api.crearCliente({
        ID_Cliente: form.ID_Cliente.trim(),
        Nombre_Fiscal: form.Nombre_Fiscal.trim(),
        Nombre_Comercial: form.Nombre_Comercial.trim() || null,
        RFC: form.RFC.trim() || null,
        Estatus: "Activo",
      });
      setForm({ ID_Cliente: "", Nombre_Fiscal: "", Nombre_Comercial: "", RFC: "" });
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
      title="Nuevo cliente"
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
        <TextField label="ID Cliente" placeholder="CLI-014" value={form.ID_Cliente} onChange={set("ID_Cliente")} error={errors.ID_Cliente} />
        <TextField label="Razón social" placeholder="Bocar Group S.A. de C.V." value={form.Nombre_Fiscal} onChange={set("Nombre_Fiscal")} error={errors.Nombre_Fiscal} />
        <TextField label="Nombre comercial" placeholder="Bocar" value={form.Nombre_Comercial} onChange={set("Nombre_Comercial")} />
        <TextField label="RFC" placeholder="BGR990817AB2" value={form.RFC} onChange={set("RFC")} error={errors.RFC} hint="12–13 caracteres." />
      </div>
    </Modal>
  );
}
