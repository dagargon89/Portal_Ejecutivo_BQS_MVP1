/* Tarjeta de KPI — las 3 preguntas (doc 08 §5.4). Una cifra dominante con
 * tabular-nums + barra de acento lateral (2º canal además del ícono). */
import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: string
  note?: string
  icon: ReactNode
  accent: 'primary' | 'secondary' | 'warning' | 'danger'
}

const accentBar: Record<KpiCardProps['accent'], string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function KpiCard({ label, value, note, icon, accent }: KpiCardProps) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <span className={`absolute inset-y-0 left-0 w-1 ${accentBar[accent]}`} aria-hidden />
      <div className="flex items-center gap-2 text-slate-500">
        <span aria-hidden>{icon}</span>
        <h2 className="text-xs font-medium uppercase tracking-wide">{label}</h2>
      </div>
      <p className="num mt-2 text-4xl font-bold leading-none text-slate-900">{value}</p>
      {note ? <p className="mt-2 text-sm text-slate-500">{note}</p> : null}
    </article>
  )
}
