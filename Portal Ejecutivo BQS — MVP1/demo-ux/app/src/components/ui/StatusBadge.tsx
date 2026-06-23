/* Badge de estado del Ciclo de Cobro (doc 08 §5.3).
 * REGLA DURA: el estado nunca se comunica solo con color -> ícono + texto. */
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  CircleDashed,
  AlertOctagon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { EstatusPago, EstatusFacturacion } from "@/lib";

type Estado = "vigente" | "vencida" | "pagada" | "pendiente" | "facturado" | "critico";

const config: Record<Estado, { label: string; cls: string; icon: ReactNode }> = {
  vigente: { label: "Vigente", cls: "bg-info-soft text-primary", icon: <FileText className="h-3.5 w-3.5" aria-hidden /> },
  vencida: { label: "Vencida", cls: "bg-warning-soft text-warning-strong", icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> },
  pagada: { label: "Pagada", cls: "bg-success-soft text-secondary-strong", icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> },
  pendiente: { label: "Por facturar", cls: "bg-slate-100 text-warning-strong", icon: <CircleDashed className="h-3.5 w-3.5" aria-hidden /> },
  facturado: { label: "Facturado", cls: "bg-success-soft text-secondary-strong", icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> },
  critico: { label: "Saldo crítico", cls: "bg-danger-soft text-danger", icon: <AlertOctagon className="h-3.5 w-3.5" aria-hidden /> },
};

export function StatusBadge({ estado, label }: { estado: Estado; label?: string }) {
  const c = config[estado];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${c.cls}`}>
      {c.icon}
      {label ?? c.label}
    </span>
  );
}

/* Helpers para mapear los enums Tier 0 al badge correspondiente. */
export function badgeDePago(estatus: EstatusPago): Estado {
  return estatus.toLowerCase() as Estado;
}
export function badgeDeFacturacion(estatus: EstatusFacturacion): Estado {
  return estatus === "Pendiente" ? "pendiente" : "facturado";
}
