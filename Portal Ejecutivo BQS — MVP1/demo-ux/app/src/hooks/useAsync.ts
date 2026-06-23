/* =====================================================================
 * useAsync — hook mínimo de carga de datos (loading/empty/error/reload).
 * Reemplaza a TanStack Query para mantener el demo sin dependencias extra
 * ("lo más simple posible", Demo-First v2 §1). En Fase 2 puede migrarse a
 * @tanstack/react-query sin tocar las pantallas (consumen el mismo estado).
 * ===================================================================== */
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | Error | null;
  reload: () => void;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload };
}
