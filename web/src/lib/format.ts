/** Formateadores de presentacion. La API entrega numericos como strings. */

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const ENTERO = new Intl.NumberFormat('es-MX')

/** Formatea un monto (string|number) como moneda MXN; vacio/invalido -> "—". */
export function formatMoneda(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') {
    return '—'
  }
  const n = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(n) ? MXN.format(n) : '—'
}

/** Formatea un entero (piezas); nulo/invalido -> "—". */
export function formatEntero(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') {
    return '—'
  }
  const n = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(n) ? ENTERO.format(n) : '—'
}

/** Normaliza un numérico (string|number) de la API a number, o null si inválido. */
function toNumber(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const n = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(n) ? n : null
}

/** "$780.0k" — moneda compacta para etiquetas de gráficas; inválido -> "—". */
export function moneyCompact(valor: string | number | null | undefined): string {
  const n = toNumber(valor)
  if (n === null) return '—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

/** 0.85 -> "85%"; inválido -> "—". */
export function pct(valor: string | number | null | undefined): string {
  const n = toNumber(valor)
  if (n === null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 0 }).format(n)
}

/** "2026-06" -> "jun" (etiqueta corta de mes para series). */
export function mesCorto(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number)
  if (!y || !m) return periodo
  const d = new Date(y, m - 1, 1)
  return new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(d).replace('.', '')
}

/** "2026-06-15" -> "15 jun 2026"; vacío/ inválido -> "—". */
export function fecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** "2026-06" -> "junio 2026". */
export function periodoLargo(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number)
  if (!y || !m) return periodo
  const d = new Date(y, m - 1, 1)
  const s = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Hora local legible de un ISO ("calculado_en"). */
export function horaIso(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}
