/* Skeletons (doc 08 §5.7). Replican la silueta para evitar salto de layout. */
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-slate-100", className)} aria-hidden />;
}

export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-hidden>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-40" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200" aria-hidden>
      <div className="h-11 bg-slate-100" />
      <div className="divide-y divide-slate-200 bg-white">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
