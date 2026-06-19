import { api } from './api'
import type {
  ApiCollectionEnvelope,
  ApiEnvelope,
  Cotizacion,
  CotizacionConConsumo,
  PaginationMeta,
} from './types'

export interface ListarCotizacionesParams {
  idCliente?: string
  estatus?: string
  page?: number
  perPage?: number
}

export interface ListaCotizaciones {
  cotizaciones: Cotizacion[]
  meta: PaginationMeta
}

export interface CotizacionPayload {
  ID_Cotizacion: string
  ID_Cliente: string
  PO_Referencia: string | null
  Monto_Autorizado: string
  Piezas_Autorizadas: string | null
  Estatus: string
}

export async function listarCotizaciones(
  params: ListarCotizacionesParams = {},
): Promise<ListaCotizaciones> {
  const resp = await api.get<ApiCollectionEnvelope<Cotizacion>>('/v1/cotizaciones', {
    params: {
      id_cliente: params.idCliente !== undefined && params.idCliente !== '' ? params.idCliente : undefined,
      estatus: params.estatus !== undefined && params.estatus !== '' ? params.estatus : undefined,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return { cotizaciones: resp.data.data, meta: resp.data.meta }
}

export async function obtenerCotizacion(id: string): Promise<CotizacionConConsumo> {
  const resp = await api.get<ApiEnvelope<CotizacionConConsumo>>(
    `/v1/cotizaciones/${encodeURIComponent(id)}`,
  )
  return resp.data.data
}

export async function crearCotizacion(datos: CotizacionPayload): Promise<Cotizacion> {
  const resp = await api.post<ApiEnvelope<Cotizacion>>('/v1/cotizaciones', datos)
  return resp.data.data
}

export async function actualizarCotizacion(
  id: string,
  datos: Omit<CotizacionPayload, 'ID_Cotizacion' | 'ID_Cliente'>,
): Promise<Cotizacion> {
  const resp = await api.put<ApiEnvelope<Cotizacion>>(
    `/v1/cotizaciones/${encodeURIComponent(id)}`,
    datos,
  )
  return resp.data.data
}
