/* Toast + provider (doc 08 §5.8). role=alert (error) / status (resto).
 * Siempre ícono + texto. Auto-cierre salvo error. */
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Tipo = "success" | "warning" | "error" | "info";
interface ToastItem {
  id: number;
  tipo: Tipo;
  titulo: string;
  descripcion?: string;
}

const map: Record<Tipo, { cls: string; icon: ReactNode }> = {
  success: { cls: "bg-success-soft text-secondary-strong", icon: <CheckCircle2 className="h-5 w-5" aria-hidden /> },
  warning: { cls: "bg-warning-soft text-warning-strong", icon: <AlertTriangle className="h-5 w-5" aria-hidden /> },
  error: { cls: "bg-danger-soft text-danger", icon: <AlertOctagon className="h-5 w-5" aria-hidden /> },
  info: { cls: "bg-info-soft text-primary", icon: <Info className="h-5 w-5" aria-hidden /> },
};

interface ToastCtx {
  push: (t: Omit<ToastItem, "id">) => void;
}
const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { ...t, id }]);
      if (t.tipo !== "error") setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
        {items.map((t) => {
          const c = map[t.tipo];
          return (
            <div
              key={t.id}
              role={t.tipo === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 p-4 shadow-lg ${c.cls}`}
            >
              {c.icon}
              <div className="flex-1">
                <p className="text-sm font-semibold">{t.titulo}</p>
                {t.descripcion ? <p className="mt-0.5 text-sm">{t.descripcion}</p> : null}
              </div>
              <button
                onClick={() => remove(t.id)}
                aria-label="Cerrar notificación"
                className="rounded p-0.5 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
