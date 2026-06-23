/* Input con label, ayuda y error (doc 08 §5.2). El error siempre lleva
 * ícono + texto; aria-invalid / aria-describedby obligatorios. */
import { AlertCircle } from "lucide-react";
import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, className, ...props }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cn(
          "h-11 rounded-lg border bg-white px-3 text-base text-slate-900",
          "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1",
          "disabled:bg-slate-100 disabled:text-slate-400",
          error
            ? "border-danger focus:ring-danger"
            : "border-slate-300 focus:border-primary focus:ring-primary",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-err`} className="flex items-center gap-1 text-sm text-danger">
          <AlertCircle className="h-4 w-4" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
