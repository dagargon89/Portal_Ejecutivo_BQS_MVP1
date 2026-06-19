import { api } from './api'
import type {
  ApiCollectionEnvelope,
  ApiEnvelope,
  Factura,
  FacturaConDetalle,
  PaginationMeta,
  PagoRegistrado,
} from './types'

export interface ListarFacturasParams {
  idCliente?: string
  estatus?: string
  desde?: string
  hasta?: string
  page?: number
  perPage?: number
}

export interface ListaFacturas {
  facturas: Factura[]
  meta: PaginationMeta
}

/** Cuerpo de emision de factura desde devengado (RF-FAC-01). */
export interface EmitirFacturaPayload {
  Folio_Factura: string
  ID_Cliente: string
  Fecha_Emision: string
  Fecha_Vencimiento: string
  Monto_Subtotal: string
  Monto_Total: string
  capturas: string[]
}

/** Cuerpo de registro de un abono (RF-PAG-01). */
export interface PagoPayload {
  ID_Pago: string
  Fecha_Pago: string
  Monto_Pagado: string
  Referencia: string | null
}

export async function listarFacturas(params: ListarFacturasParams = {}): Promise<ListaFacturas> {
  const resp = await api.get<ApiCollectionEnvelope<Factura>>('/v1/facturas', {
    params: {
      id_cliente: params.idCliente !== undefined && params.idCliente !== '' ? params.idCliente : undefined,
      estatus: params.estatus !== undefined && params.estatus !== '' ? params.estatus : undefined,
      desde: params.desde !== undefined && params.desde !== '' ? params.desde : undefined,
      hasta: params.hasta !== undefined && params.hasta !== '' ? params.hasta : undefined,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return { facturas: resp.data.data, meta: resp.data.meta }
}

export async function obtenerFactura(folio: string): Promise<FacturaConDetalle> {
  const resp = await api.get<ApiEnvelope<FacturaConDetalle>>(`/v1/facturas/${encodeURIComponent(folio)}`)
  return resp.data.data
}

export async function emitirFactura(datos: EmitirFacturaPayload): Promise<FacturaConDetalle> {
  const resp = await api.post<ApiEnvelope<FacturaConDetalle>>('/v1/facturas', datos)
  return resp.data.data
}

export async function registrarPago(folio: string, datos: PagoPayload): Promise<PagoRegistrado> {
  const resp = await api.post<ApiEnvelope<PagoRegistrado>>(
    `/v1/facturas/${encodeURIComponent(folio)}/pagos`,
    datos,
  )
  return resp.data.data
}
