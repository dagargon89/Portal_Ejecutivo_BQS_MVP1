/* Select con label (doc 08 §5.2). Mismos estados de foco/disabled. */
import { useId } from 'react'
import type { SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  children: ReactNode
}

export function Select({ label, hint, className, children, ...props }: SelectProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(
          'h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900',
          'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          'disabled:bg-slate-100 disabled:text-slate-400',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
