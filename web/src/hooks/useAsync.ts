/* =====================================================================
 * useAsync — hook mínimo de carga de datos (loading/empty/error/reload).
 * Convive con la capa Axios real: `fn` suele envolver una llamada de un
 * módulo de `@/lib` que ya desempaqueta el envelope `{data}`/`{meta}`.
 * El error se propaga como `unknown` y se formatea con `errorMessage`
 * (ver `<ErrorState>`).
 * ===================================================================== */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: unknown
  reload: () => void
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fnRef
      .current()
      .then((res) => {
        if (alive) setData(res)
      })
      .catch((e: unknown) => {
        if (alive) setError(e)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, loading, error, reload }
}
