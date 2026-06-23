/* Nav lateral del panel (doc 08 §5.6). Marca BQS arriba; ítems agrupados;
 * estado activo con color + indicador (no solo color); aria-current. */
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { navGroups } from './nav'
import { useSession } from '@/auth/session'
import { cn } from '@/lib/cn'

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hasRole } = useSession()

  return (
    <>
      {/* Overlay móvil */}
      {open ? (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} aria-hidden />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navegación principal"
      >
        {/* Marca */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              BQS
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Portal Ejecutivo</p>
              <p className="text-xs text-slate-500">by Dataholics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((g) => {
            const items = g.items.filter((i) => hasRole(...i.roles))
            if (!items.length) return null
            return (
              <div key={g.titulo} className="mb-5">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {g.titulo}
                </p>
                <ul className="space-y-0.5">
                  {items.map(({ to, label, icon: Icon, end }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                            isActive
                              ? 'bg-primary-soft text-primary'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-slate-400')}
                              aria-hidden
                            />
                            {label}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-400">
          Best Quality Solutions · Dataholics
        </p>
      </aside>
    </>
  )
}
