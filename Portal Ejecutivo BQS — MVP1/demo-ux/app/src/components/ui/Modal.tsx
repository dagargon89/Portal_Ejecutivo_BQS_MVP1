/* Modal accesible (doc 08): foco inicial, cierre con Esc, overlay, role=dialog.
 * Sin trampas de foco complejas (demo "lo más simple posible"). */
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-t-xl bg-white shadow-lg outline-none sm:rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
