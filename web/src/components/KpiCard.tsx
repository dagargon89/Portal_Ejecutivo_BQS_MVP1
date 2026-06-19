import type { ReactNode } from 'react'

export type KpiAccent = 'primary' | 'secondary' | 'warning' | 'danger'

interface KpiCardProps {
  /** La pregunta, p. ej. "¿Cuánto te deben?". */
  label: string
  /** Cifra ya formateada por el cliente (el backend la calcula — RF-DASH-04). */
  value: string
  note?: string
  icon: ReactNode
  accent: KpiAccent
}

const accentBar: Record<KpiAccent, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

/**
 * Tarjeta de KPI (Design System §5.4): barra de acento lateral (2.º canal
 * además del ícono), etiqueta en mayúsculas, cifra dominante con `tabular-nums`.
 */
export function KpiCard({ label, value, note, icon, accent }: KpiCardProps) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <span className={`absolute inset-y-0 left-0 w-1 ${accentBar[accent]}`} aria-hidden />
      <div className="flex items-center gap-2 text-slate-500">
        <span aria-hidden>{icon}</span>
        <h2 className="text-xs font-medium uppercase tracking-wide">{label}</h2>
      </div>
      <p className="mt-2 text-4xl font-bold leading-none text-slate-900 tabular-nums">{value}</p>
      {note !== undefined ? <p className="mt-2 text-sm text-slate-500">{note}</p> : null}
    </article>
  )
}

/** Esqueleto con las dimensiones del KPI para evitar salto de layout (§5.7). */
export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-hidden>
      <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-9 w-40 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-3 w-20 animate-pulse rounded bg-slate-100" />
    </div>
  )
}
