/* Tabla de datos genérica (doc 08 §5.5). Encabezado slate-100, divisores,
 * montos a la derecha con tabular-nums, scope=col, scroll horizontal interno,
 * fila hover/seleccionable con teclado. */
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  mono?: boolean // folios, IDs, RFC -> font-mono
  num?: boolean // montos/cantidades -> tabular-nums + alineado derecha
  render: (row: T) => ReactNode
  thClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  caption?: string
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, caption }: DataTableProps<T>) {
  const align = (c: Column<T>) =>
    c.align === 'right' || c.num
      ? 'text-right'
      : c.align === 'center'
        ? 'text-center'
        : 'text-left'

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-slate-100">
          <tr className="text-xs font-medium uppercase tracking-wide text-slate-700">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn('px-4 py-3', align(c), c.thClassName)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row) => {
            const clickable = !!onRowClick
            return (
              <tr
                key={rowKey(row)}
                onClick={clickable ? () => onRowClick!(row) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick!(row)
                        }
                      }
                    : undefined
                }
                tabIndex={clickable ? 0 : undefined}
                className={cn(
                  'transition-colors',
                  clickable &&
                    'cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:bg-primary-soft focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 py-3 text-slate-900',
                      align(c),
                      c.mono && 'font-mono text-slate-700',
                      c.num && 'num',
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
