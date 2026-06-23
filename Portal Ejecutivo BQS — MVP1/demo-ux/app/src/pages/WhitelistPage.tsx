/* Whitelist de acceso (RF-CTA-01). Listar, agregar y revocar correos. Admin. */
import { useState } from "react";
import { Plus, ShieldX } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { api, ApiError } from "@/lib";
import type { AuthWhitelist } from "@/lib";
import { fecha } from "@/lib/format";

export function WhitelistPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [openNew, setOpenNew] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api.listarWhitelist({ page }), [page]);

  async function revocar(id: number) {
    try {
      await api.revocarWhitelist(id);
      toast.push({ tipo: "success", titulo: "Correo revocado", descripcion: "Ya no podrá iniciar sesión (demo)." });
      reload();
    } catch (e) {
      toast.push({ tipo: "error", titulo: "No se pudo revocar", descripcion: e instanceof Error ? e.message : "" });
    }
  }

  const columns: Column<AuthWhitelist>[] = [
    { key: "correo", header: "Correo", render: (r) => r.correo },
    {
      key: "estatus",
      header: "Estatus",
      render: (r) =>
        r.activo === 1 ? (
          <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-secondary-strong">
            Autorizado
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            Revocado
          </span>
        ),
    },
    { key: "creado", header: "Alta", render: (r) => fecha(r.creado_en) },
    {
      key: "acc",
      header: "",
      align: "right",
      render: (r) =>
        r.activo === 1 ? (
          <button
            onClick={() => revocar(r.id)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <ShieldX className="h-4 w-4" aria-hidden /> Revocar
          </button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Whitelist de acceso"
        description="Segunda barrera de seguridad: solo estos correos pueden iniciar sesión."
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setOpenNew(true)}>
            Agregar correo
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton cols={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <Card className="p-2 sm:p-4">
          <DataTable columns={columns} rows={data.data} rowKey={(r) => String(r.id)} caption="Correos autorizados" />
          <Pagination meta={data.meta} onPage={setPage} />
        </Card>
      ) : null}

      <NuevoCorreoModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={() => {
          setOpenNew(false);
          toast.push({ tipo: "success", titulo: "Correo agregado", descripcion: "Ya puede iniciar sesión (demo)." });
          reload();
        }}
      />
    </div>
  );
}

function NuevoCorreoModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setSaving(true);
    setError(undefined);
    try {
      await api.agregarWhitelist({ correo: correo.trim() });
      setCorreo("");
      onCreated();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Error";
      setError(msg);
      toast.push({ tipo: "error", titulo: "No se pudo agregar", descripcion: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Agregar correo autorizado"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving}>
            Agregar
          </Button>
        </>
      }
    >
      <TextField
        label="Correo"
        type="email"
        placeholder="persona@bestqualitysolutions.com"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        error={error}
      />
    </Modal>
  );
}
