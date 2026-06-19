import { useEffect, useState } from 'react'
import { obtenerResumen } from '../lib/dashboard'
import type { ResumenEjecutivo } from '../lib/types'

export interface UseResumenEjecutivo {
  resumen: ResumenEjecutivo | null
  cargando: boolean
  error: boolean
  revalidar: () => void
}

/**
 * Carga el resumen ejecutivo (/dashboard/resumen) con revalidacion controlada.
 * El token vive en memoria (lo adjunta el interceptor de Axios). El estado solo
 * se actualiza tras el `await`, con guarda `active` (regla React 19 del repo).
 */
export function useResumenEjecutivo(): UseResumenEjecutivo {
  const [resumen, setResumen] = useState<ResumenEjecutivo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [recargar, setRecargar] = useState(0)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await obtenerResumen()
        if (active) {
          setResumen(data)
          setError(false)
        }
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setCargando(false)
      }
    })()
    return () => {
      active = false
    }
  }, [recargar])

  return { resumen, cargando, error, revalidar: () => setRecargar((n) => n + 1) }
}
