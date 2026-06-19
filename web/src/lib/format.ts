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
