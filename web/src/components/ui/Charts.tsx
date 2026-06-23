/* =====================================================================
 * Charts.tsx — Gráficas ligeras (SVG/CSS, sin dependencias). El cliente solo
 * grafica datos ya calculados por el backend; los formatea con los helpers de
 * `@/lib/format`. Colores desde los tokens de marca (doc 08) vía var(--color-*).
 * Cada gráfica incluye texto alterno para accesibilidad.
 *
 * Los tipos de datos son locales (number para los cálculos): las páginas
 * convierten los DECIMAL-string del backend a number antes de pasarlos.
 * ===================================================================== */
import type { EstatusFactura } from '@/lib/types'
import { formatMoneda, moneyCompact, mesCorto, formatEntero } from '@/lib/format'

/** Serie mensual facturado vs cobrado. */
export interface SerieMes {
  periodo: string
  facturado: number
  cobrado: number
}

/** Distribución de facturas por estatus de pago. */
export interface DistribEstatus {
  estatus: EstatusFactura
  monto: number
  cantidad: number
}

/** Cliente con su saldo por cobrar (para el top de cartera). */
export interface TopClienteCartera {
  ID_Cliente: string
  Nombre_Comercial: string | null
  saldo: number
}

/** Etapas del ciclo de cobro (embudo). */
export interface EmbudoCiclo {
  autorizado: number
  devengado: number
  facturado: number
  cobrado: number
}

const ESTATUS_COLOR: Record<EstatusFactura, string> = {
  Pagada: 'var(--color-secondary)',
  Vigente: 'var(--color-primary)',
  Vencida: 'var(--color-danger)',
}

/* ---------- Barras mensuales: facturado vs cobrado ---------- */
export function BarrasMensuales({ data }: { data: SerieMes[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.facturado, d.cobrado)))
  return (
    <figure className="m-0">
      <div
        className="flex h-44 items-end gap-2 sm:gap-4"
        role="img"
        aria-label="Facturado contra cobrado por mes (últimos 6 meses)"
      >
        {data.map((d) => (
          <div key={d.periodo} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-3 rounded-t bg-primary/80 transition-all sm:w-4"
                style={{ height: `${(d.facturado / max) * 100}%` }}
                title={`Facturado ${mesCorto(d.periodo)}: ${formatMoneda(d.facturado)}`}
              />
              <div
                className="w-3 rounded-t bg-secondary transition-all sm:w-4"
                style={{ height: `${(d.cobrado / max) * 100}%` }}
                title={`Cobrado ${mesCorto(d.periodo)}: ${formatMoneda(d.cobrado)}`}
              />
            </div>
            <span className="text-xs capitalize text-slate-500">{mesCorto(d.periodo)}</span>
          </div>
        ))}
      </div>
      <figcaption className="mt-4 flex items-center justify-center gap-5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/80" aria-hidden /> Facturado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-secondary" aria-hidden /> Cobrado
        </span>
      </figcaption>
    </figure>
  )
}

/* ---------- Dona: distribución de facturas por estatus ---------- */
export function DonaEstatus({ data }: { data: DistribEstatus[] }) {
  const total = data.reduce((a, d) => a + d.monto, 0) || 1
  const totalCant = data.reduce((a, d) => a + d.cantidad, 0)
  const R = 60
  const C = 2 * Math.PI * R

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
      <svg
        viewBox="0 0 160 160"
        className="h-40 w-40 shrink-0 -rotate-90"
        role="img"
        aria-label="Distribución de facturas por estatus"
      >
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--color-surface-2, #f1f5f9)" strokeWidth="18" />
        {data.map((d, i) => {
          // Arco del segmento y desplazamiento acumulado (suma de los previos),
          // calculados sin mutar estado durante el render.
          const dash = (d.monto / total) * C
          const offset = data.slice(0, i).reduce((a, x) => a + (x.monto / total) * C, 0)
          return (
            <circle
              key={d.estatus}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={ESTATUS_COLOR[d.estatus]}
              strokeWidth="18"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
            >
              <title>{`${d.estatus}: ${formatMoneda(d.monto)} (${d.cantidad})`}</title>
            </circle>
          )
        })}
      </svg>
      <ul className="flex flex-col gap-2 text-sm">
        {data.map((d) => (
          <li key={d.estatus} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: ESTATUS_COLOR[d.estatus] }}
              aria-hidden
            />
            <span className="font-medium text-slate-700">{d.estatus}</span>
            <span className="text-slate-400">·</span>
            <span className="num text-slate-500">{formatMoneda(d.monto)}</span>
            <span className="num text-xs text-slate-400">({d.cantidad})</span>
          </li>
        ))}
        <li className="mt-1 border-t border-slate-100 pt-2 text-xs text-slate-400">
          {formatEntero(totalCant)} facturas en total
        </li>
      </ul>
    </div>
  )
}

/* ---------- Barras horizontales: top clientes por cartera ---------- */
export function BarrasClientes({ data }: { data: TopClienteCartera[] }) {
  const max = Math.max(1, ...data.map((d) => d.saldo))
  if (!data.length) return <p className="text-sm text-slate-500">Sin cartera por cobrar.</p>
  return (
    <ul className="flex flex-col gap-3">
      {data.map((d) => (
        <li key={d.ID_Cliente}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium text-slate-700">
              {d.Nombre_Comercial ?? d.ID_Cliente}
            </span>
            <span className="num shrink-0 text-slate-500">{formatMoneda(d.saldo)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(d.saldo / max) * 100}%` }}
              aria-hidden
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ---------- Embudo del ciclo de cobro ---------- */
const ETAPAS: { key: keyof EmbudoCiclo; label: string; color: string }[] = [
  { key: 'autorizado', label: 'Autorizado', color: 'var(--color-primary)' },
  { key: 'devengado', label: 'Devengado', color: '#3b82a6' },
  { key: 'facturado', label: 'Facturado', color: 'var(--color-warning)' },
  { key: 'cobrado', label: 'Cobrado', color: 'var(--color-secondary)' },
]

export function EmbudoCobro({ data }: { data: EmbudoCiclo }) {
  const max = Math.max(1, data.autorizado)
  return (
    <ul className="flex flex-col gap-2.5">
      {ETAPAS.map(({ key, label, color }) => {
        const valor = data[key]
        const ancho = (valor / max) * 100
        const conv = data.autorizado > 0 ? Math.round((valor / data.autorizado) * 100) : 0
        return (
          <li key={key} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-medium text-slate-500">{label}</span>
            <div className="flex h-8 flex-1 items-center rounded-md bg-slate-100">
              <div
                className="flex h-full min-w-fit items-center rounded-md px-2"
                style={{ width: `${Math.max(ancho, 16)}%`, backgroundColor: color }}
              >
                <span className="num whitespace-nowrap text-xs font-semibold text-white">
                  {moneyCompact(valor)}
                </span>
              </div>
            </div>
            <span className="num w-10 shrink-0 text-right text-xs text-slate-400">{conv}%</span>
          </li>
        )
      })}
    </ul>
  )
}
