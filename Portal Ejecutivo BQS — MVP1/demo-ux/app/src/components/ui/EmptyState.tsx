/* Estado vacío (Demo-First v2 §7: cubrir empty, no solo el camino feliz). */
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title = "Sin resultados",
  message,
  icon,
  action,
}: {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <span className="text-slate-400" aria-hidden>
        {icon ?? <Inbox className="h-8 w-8" />}
      </span>
      <div>
        <p className="text-base font-semibold text-slate-700">{title}</p>
        {message ? <p className="mt-1 text-sm text-slate-500">{message}</p> : null}
      </div>
      {action}
    </div>
  );
}
