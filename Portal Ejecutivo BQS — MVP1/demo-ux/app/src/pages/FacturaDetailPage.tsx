/* Detalle de factura con saldo y pagos (RF-PAG-01). Registro de abono con
 * prevención de sobrepago (RF-PAG-02) e inmutabilidad de Pagada (RF-FAC-03). */
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { StatusBadge, badgeDePago } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/auth/session";
import { useAsync } from "@/hooks/useAsync";
import { api, ApiError } from "@/lib";
import type { Pago } from "@/lib";
import { money, fecha } from "@/lib/format";

const pagoCols: Column<Pago>[] = [
  { key: "id", header: "Recibo", mono: true, render: (r) => r.ID_Pago },
  { key: "fecha", header: "Fecha", render: (r) => fecha(r.Fecha_Pago) },
  { key: "monto", header: "Monto", num: true, render: (r) => money(r.Monto_Pagado) },
  { key: "ref", header: "Referencia", render: (r) => r.Referencia ?? "—" },
];

export function FacturaDetailPage() {
  const { folio = "" } = useParams();
  const toast = useToast();
  const { hasRole } = useSession();
  const [openPago, setOpenPago] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api.obtenerFactura(folio), [folio]);

  return (
    <div className="flex flex-col gap-6">
      <Link to="/facturas" className="inline-flex w-fit items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Facturas
      </Link>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <>
          <PageHeader
            title={data.Folio_Factura}
            description={`${data.Nombre_Comercial ?? data.ID_Cliente} · Emisión ${fecha(data.Fecha_Emision)} · Vence ${fecha(data.Fecha_Vencimiento)}`}
            actions={
              hasRole("facturacion", "admin") && data.Estatus_Pago !== "Pagada" ? (
                <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setOpenPago(true)}>
                  Registrar abono
                </Button>
              ) : undefined
            }
          />

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Resumen label="Total" value={money(data.Monto_Total)} />
            <Resumen label="Subtotal" value={money(data.Monto_Subtotal)} />
            <Resumen label="Pagado" value={money(data.pagado)} />
            <Resumen label="Saldo" value={money(data.saldo)} strong />
          </section>

          <div>
            <StatusBadge estado={badgeDePago(data.Estatus_Pago)} />
          </div>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Pagos aplicados</h2>
            {data.pagos.length ? (
              <DataTable columns={pagoCols} rows={data.pagos} rowKey={(r) => r.ID_Pago} caption="Pagos de la factura" />
            ) : (
              <EmptyState title="Sin pagos" message="Esta factura no tiene abonos registrados." />
            )}
          </section>
        </>
      ) : null}

      {data ? (
        <PagoModal
          open={openPago}
          folio={folio}
          saldo={data.saldo}
          onClose={() => setOpenPago(false)}
          onSaved={(pagada) => {
            setOpenPago(false);
            toast.push({
              tipo: "success",
              titulo: pagada ? "Factura liquidada" : "Abono registrado",
              descripcion: pagada ? "Saldo en cero: pasó a Pagada (demo)." : "El saldo disminuyó (demo).",
            });
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function Resumen({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`num mt-1 text-xl font-bold ${strong ? "text-primary" : "text-slate-900"}`}>{value}</p>
    </Card>
  );
}

function PagoModal({
  open,
  folio,
  saldo,
  onClose,
  onSaved,
}: {
  open: boolean;
  folio: string;
  saldo: number;
  onClose: () => void;
  onSaved: (pagada: boolean) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ ID_Pago: "", Fecha_Pago: "", Monto_Pagado: "", Referencia: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function guardar() {
    setSaving(true);
    setErrors({});
    try {
      const f = await api.registrarPago(folio, {
        ID_Pago: form.ID_Pago.trim(),
        Fecha_Pago: form.Fecha_Pago,
        Monto_Pagado: Number(form.Monto_Pagado),
        Referencia: form.Referencia.trim() || null,
      });
      setForm({ ID_Pago: "", Fecha_Pago: "", Monto_Pagado: "", Referencia: "" });
      onSaved(f.Estatus_Pago === "Pagada");
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast.push({ tipo: "error", titulo: "No se pudo registrar", descripcion: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Registrar abono"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} loading={saving}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="rounded-lg bg-info-soft px-3 py-2 text-sm text-primary">
          Saldo actual: <span className="num font-semibold">{money(saldo)}</span>
        </p>
        <TextField label="ID Pago" placeholder="PAG-0307" value={form.ID_Pago} onChange={set("ID_Pago")} error={errors.ID_Pago} />
        <TextField label="Fecha de pago" type="date" value={form.Fecha_Pago} onChange={set("Fecha_Pago")} />
        <TextField
          label="Monto del abono (MXN)"
          type="number"
          inputMode="decimal"
          value={form.Monto_Pagado}
          onChange={set("Monto_Pagado")}
          error={errors.Monto_Pagado}
          hint="No puede exceder el saldo (se rechaza el sobrepago)."
        />
        <TextField label="Referencia" placeholder="SPEI BANORTE 9122" value={form.Referencia} onChange={set("Referencia")} />
      </div>
    </Modal>
  );
}
