/* Estado de error con reintento (Demo-First v2 §7). role=alert. */
import { AlertOctagon, RotateCcw } from 'lucide-react'
import { Button } from './Button'
import { errorMessage } from '@/lib/api'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = errorMessage(error)
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger-soft bg-danger-soft px-6 py-12 text-center"
    >
      <AlertOctagon className="h-8 w-8 text-danger" aria-hidden />
      <div>
        <p className="text-base font-semibold text-danger">No se pudieron cargar los datos</p>
        <p className="mt-1 text-sm text-slate-600">{msg}</p>
      </div>
      {onRetry ? (
        <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}
