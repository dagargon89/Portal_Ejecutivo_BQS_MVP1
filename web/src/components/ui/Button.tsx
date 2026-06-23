/* Botón (doc 08 §5.1). Altura táctil 44px (h-11). Estados: default/hover/
 * focus-visible/disabled/loading. Una sola acción primaria por vista. */
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
}

const styles: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary',
  secondary: 'bg-secondary text-white hover:bg-secondary-strong focus-visible:ring-secondary',
  danger: 'bg-danger text-white hover:bg-red-800 focus-visible:ring-danger',
  ghost: 'bg-transparent text-primary hover:bg-primary-soft focus-visible:ring-primary',
}

export function Button({
  variant = 'primary',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold',
        'transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children ? <span>{children}</span> : null}
    </button>
  )
}
