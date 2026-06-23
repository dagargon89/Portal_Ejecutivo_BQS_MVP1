/* =====================================================================
 * format.ts — Formato de presentación (el cliente solo formatea lo que el
 * backend ya calculó, doc 08 §5.4 / RF-DASH-04). MXN, fechas, periodo.
 * ===================================================================== */

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$50,000.00" — siempre 2 decimales, con `tabular-nums` en la vista. */
export function money(n: number): string {
  return mxn.format(n);
}

/** Número con separadores de miles, sin símbolo (piezas, horas). */
export function num(n: number): string {
  return new Intl.NumberFormat("es-MX").format(n);
}

/** "2026-06-15" -> "15 jun 2026". */
export function fecha(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** "2026-06" -> "junio 2026". */
export function periodoLargo(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number);
  if (!y || !m) return periodo;
  const d = new Date(y, m - 1, 1);
  const s = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Hora local legible de un ISO ("calculado_en"). */
export function horaIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
