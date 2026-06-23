/* Spinner accesible (doc 08 §5.7). role=status + texto sr-only. */
import { Loader2 } from 'lucide-react'

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}
