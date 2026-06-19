import { api } from './api'
import type { ApiCollectionEnvelope, ApiEnvelope, Devengado, PaginationMeta } from './types'

export interface ListaDevengado {
  devengado: Devengado[]
  meta: PaginationMeta
}

/** Campos de alta de una captura de devengado (RF-DEV-01). */
export interface DevengadoPayload {
  ID_Captura: string
  Fecha: string
  Horas_Trabajadas: string
  Piezas_Sorteadas: string | null
  Monto_Devengado: string
}

export async function listarDevengado(
  idCotizacion: string,
  estatus?: string,
  page?: number,
): Promise<ListaDevengado> {
  const resp = await api.get<ApiCollectionEnvelope<Devengado>>(
    `/v1/cotizaciones/${encodeURIComponent(idCotizacion)}/devengado`,
    {
      params: {
        estatus: estatus !== undefined && estatus !== '' ? estatus : undefined,
        page,
      },
    },
  )
  return { devengado: resp.data.data, meta: resp.data.meta }
}

export async function crearDevengado(
  idCotizacion: string,
  datos: DevengadoPayload,
): Promise<Devengado> {
  const resp = await api.post<ApiEnvelope<Devengado>>(
    `/v1/cotizaciones/${encodeURIComponent(idCotizacion)}/devengado`,
    datos,
  )
  return resp.data.data
}
