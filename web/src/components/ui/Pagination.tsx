/* Paginación (doc 05 §1.6). Navegación por teclado; aria-label en controles. */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '@/lib/types'
import { cn } from '@/lib/cn'

export function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta
  onPage: (page: number) => void
}) {
  const { page, total_pages, total, per_page } = meta
  if (total === 0) return null
  const from = (page - 1) * per_page + 1
  const to = Math.min(page * per_page, total)
  const btn =
    'inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <nav className="flex items-center justify-between gap-4 pt-3" aria-label="Paginación">
      <p className="text-sm text-slate-500">
        <span className="num">{from}</span>–<span className="num">{to}</span> de{' '}
        <span className="num">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          className={cn(btn)}
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Anterior
        </button>
        <span className="text-sm text-slate-600">
          <span className="num">{page}</span> / <span className="num">{total_pages}</span>
        </span>
        <button
          className={cn(btn)}
          onClick={() => onPage(page + 1)}
          disabled={page >= total_pages}
          aria-label="Página siguiente"
        >
          Siguiente <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  )
}
