/* Detalle de cotización: consumo vs autorizado (RF-COT-02), bitácora de
 * devengado, captura de devengado (RF-DEV-01/02) y emisión de factura
 * (RF-FAC-01, transacción ACID en el backend). */
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, FileUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { StatusBadge, badgeDeFacturacion } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/auth/session";
import { useAsync } from "@/hooks/useAsync";
import { api, ApiError } from "@/lib";
import type { BitacoraSorteo } from "@/lib";
import { money, num, fecha } from "@/lib/format";

export function CotizacionDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useSession();
  const [openCap, setOpenCap] = useState(false);
  const [openFac, setOpenFac] = useState(false);

  const cot = useAsync(() => api.obtenerCotizacion(id), [id]);
  const dev = useAsync(() => api.listarDevengado(id), [id]);

  const pendientes = (dev.data?.data ?? []).filter((d) => d.Estatus_Facturacion === "Pendiente");

  const cols: Column<BitacoraSorteo>[] = [
    { key: "cap", header: "Captura", mono: true, render: (r) => r.ID_Captura },
    { key: "fecha", header: "Fecha", render: (r) => fecha(r.Fecha) },
    { key: "horas", header: "Horas", num: true, render: (r) => num(r.Horas_Trabajadas) },
    { key: "pzs", header: "Piezas", num: true, render: (r) => (r.Piezas_Sorteadas != null ? num(r.Piezas_Sorteadas) : "—") },
    { key: "monto", header: "Devengado", num: true, render: (r) => money(r.Monto_Devengado) },
    { key: "estado", header: "Estatus", render: (r) => <StatusBadge estado={badgeDeFacturacion(r.Estatus_Facturacion)} /> },
  ];

  function refresh() {
    cot.reload();
    dev.reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/cotizaciones" className="inline-flex w-fit items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Cotizaciones
      </Link>

      {cot.loading ? (
        <Skeleton className="h-40 w-full" />
      ) : cot.error ? (
        <ErrorState error={cot.error} onRetry={cot.reload} />
      ) : cot.data ? (
        <>
          <PageHeader
            title={cot.data.ID_Cotizacion}
            description={`${cot.data.Nombre_Comercial ?? cot.data.ID_Cliente} · PO ${cot.data.PO_Referencia ?? "—"} · ${cot.data.Estatus}`}
            actions={
              <div className="flex flex-wrap gap-2">
                {hasRole("capturista", "admin") ? (
                  <Button variant="secondary" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setOpenCap(true)}>
                    Capturar devengado
                  </Button>
                ) : null}
                {hasRole("facturacion", "admin") ? (
                  <Button
                    icon={<FileUp className="h-4 w-4" aria-hidden />}
                    onClick={() => setOpenFac(true)}
                    disabled={pendientes.length === 0}
                  >
                    Emitir factura
                  </Button>
                ) : null}
              </div>
            }
          />

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Consumo label="Autorizado" value={money(cot.data.Monto_Autorizado)} />
            <Consumo label="Devengado acumulado" value={money(cot.data.consumo.devengado_acumulado)} />
            <Consumo label="Pendiente por facturar" value={money(cot.data.consumo.devengado_pendiente)} accent="warning" />
            <Consumo label="Disponible" value={money(cot.data.consumo.disponible)} accent="primary" />
          </section>
        </>
      ) : null}

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Bitácora de devengado</h2>
        {dev.loading ? (
          <Skeleton className="h-40 w-full" />
        ) : dev.error ? (
          <ErrorState error={dev.error} onRetry={dev.reload} />
        ) : dev.data && dev.data.data.length === 0 ? (
          <EmptyState title="Sin devengado" message="Aún no se registra trabajo ejecutado en esta cotización." />
        ) : dev.data ? (
          <DataTable columns={cols} rows={dev.data.data} rowKey={(r) => r.ID_Captura} caption="Devengado de la cotización" />
        ) : null}
      </section>

      <CapturaModal
        open={openCap}
        cotizacion={id}
        onClose={() => setOpenCap(false)}
        onSaved={() => {
          setOpenCap(false);
          toast.push({ tipo: "success", titulo: "Devengado capturado", descripcion: "Nace como Pendiente (demo)." });
          refresh();
        }}
      />

      <EmitirModal
        open={openFac}
        idCliente={cot.data?.ID_Cliente ?? ""}
        pendientes={pendientes}
        onClose={() => setOpenFac(false)}
        onEmitted={(folio) => {
          setOpenFac(false);
          toast.push({ tipo: "success", titulo: "Factura emitida", descripcion: `${folio} creada como Vigente (demo).` });
          navigate(`/facturas/${folio}`);
        }}
      />
    </div>
  );
}

function Consumo({ label, value, accent }: { label: string; value: string; accent?: "warning" | "primary" }) {
  const color = accent === "warning" ? "text-warning-strong" : accent === "primary" ? "text-primary" : "text-slate-900";
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`num mt-1 text-xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function CapturaModal({
  open,
  cotizacion,
  onClose,
  onSaved,
}: {
  open: boolean;
  cotizacion: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ ID_Captura: "", Fecha: "", Horas_Trabajadas: "", Piezas_Sorteadas: "", Monto_Devengado: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function guardar() {
    setSaving(true);
    setErrors({});
    try {
      await api.crearDevengado(cotizacion, {
        ID_Captura: form.ID_Captura.trim(),
        Fecha: form.Fecha,
        Horas_Trabajadas: Number(form.Horas_Trabajadas),
        Piezas_Sorteadas: form.Piezas_Sorteadas ? Number(form.Piezas_Sorteadas) : null,
        Monto_Devengado: Number(form.Monto_Devengado),
      });
      setForm({ ID_Captura: "", Fecha: "", Horas_Trabajadas: "", Piezas_Sorteadas: "", Monto_Devengado: "" });
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast.push({ tipo: "error", titulo: "No se pudo capturar", descripcion: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Capturar devengado"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={guardar} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField label="ID Captura" placeholder="CAP-00231" value={form.ID_Captura} onChange={set("ID_Captura")} error={errors.ID_Captura} />
        <TextField label="Fecha" type="date" value={form.Fecha} onChange={set("Fecha")} />
        <TextField label="Horas trabajadas" type="number" inputMode="decimal" value={form.Horas_Trabajadas} onChange={set("Horas_Trabajadas")} error={errors.Horas_Trabajadas} />
        <TextField label="Piezas sorteadas" type="number" inputMode="numeric" value={form.Piezas_Sorteadas} onChange={set("Piezas_Sorteadas")} />
        <TextField label="Monto devengado (MXN)" type="number" inputMode="decimal" value={form.Monto_Devengado} onChange={set("Monto_Devengado")} error={errors.Monto_Devengado} hint="Validación numérica estricta: sin texto ni negativos." />
      </div>
    </Modal>
  );
}

function EmitirModal({
  open,
  idCliente,
  pendientes,
  onClose,
  onEmitted,
}: {
  open: boolean;
  idCliente: string;
  pendientes: BitacoraSorteo[];
  onClose: () => void;
  onEmitted: (folio: string) => void;
}) {
  const toast = useToast();
  const [sel, setSel] = useState<string[]>([]);
  const [folio, setFolio] = useState("");
  const [emision, setEmision] = useState("");
  const [venc, setVenc] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [total, setTotal] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const toggle = (cap: string) => setSel((s) => (s.includes(cap) ? s.filter((x) => x !== cap) : [...s, cap]));
  const sumaSel = pendientes.filter((p) => sel.includes(p.ID_Captura)).reduce((a, b) => a + b.Monto_Devengado, 0);

  async function emitir() {
    setSaving(true);
    setErrors({});
    try {
      const f = await api.emitirFactura({
        Folio_Factura: folio.trim(),
        ID_Cliente: idCliente,
        Fecha_Emision: emision,
        Fecha_Vencimiento: venc,
        Monto_Subtotal: Number(subtotal),
        Monto_Total: Number(total),
        capturas: sel,
      });
      onEmitted(f.Folio_Factura);
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast.push({ tipo: "error", titulo: "No se pudo emitir", descripcion: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Emitir factura desde devengado"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={emitir} loading={saving} disabled={sel.length === 0}>
            Emitir
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-700">Devengado pendiente</legend>
          <div className="flex flex-col gap-1">
            {pendientes.map((p) => (
              <label key={p.ID_Captura} className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sel.includes(p.ID_Captura)}
                    onChange={() => toggle(p.ID_Captura)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="font-mono text-sm text-slate-700">{p.ID_Captura}</span>
                </span>
                <span className="num text-sm text-slate-900">{money(p.Monto_Devengado)}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Seleccionado: <span className="num font-semibold text-slate-900">{money(sumaSel)}</span>
          </p>
        </fieldset>
        <TextField label="Folio" placeholder="F-9902" value={folio} onChange={(e) => setFolio(e.target.value)} error={errors.Folio_Factura} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Emisión" type="date" value={emision} onChange={(e) => setEmision(e.target.value)} />
          <TextField label="Vencimiento" type="date" value={venc} onChange={(e) => setVenc(e.target.value)} error={errors.Fecha_Vencimiento} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Subtotal" type="number" inputMode="decimal" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} />
          <TextField label="Total (con IVA)" type="number" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} error={errors.Monto_Total} />
        </div>
      </div>
    </Modal>
  );
}
