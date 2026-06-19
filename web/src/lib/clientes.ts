import { api } from './api'
import type {
  ApiCollectionEnvelope,
  ApiEnvelope,
  Cliente,
  ClienteConCartera,
  PaginationMeta,
} from './types'

export interface ListarClientesParams {
  q?: string
  estatus?: string
  page?: number
  perPage?: number
}

export interface ListaClientes {
  clientes: Cliente[]
  meta: PaginationMeta
}

/** Campos editables de un cliente (la API ignora ID en update). */
export interface ClientePayload {
  ID_Cliente: string
  Nombre_Fiscal: string
  Nombre_Comercial: string | null
  RFC: string | null
  Estatus: string
}

export async function listarClientes(params: ListarClientesParams = {}): Promise<ListaClientes> {
  const resp = await api.get<ApiCollectionEnvelope<Cliente>>('/v1/clientes', {
    params: {
      q: params.q !== undefined && params.q !== '' ? params.q : undefined,
      estatus: params.estatus !== undefined && params.estatus !== '' ? params.estatus : undefined,
      page: params.page,
      per_page: params.perPage,
    },
  })
  return { clientes: resp.data.data, meta: resp.data.meta }
}

export async function obtenerCliente(id: string): Promise<ClienteConCartera> {
  const resp = await api.get<ApiEnvelope<ClienteConCartera>>(`/v1/clientes/${encodeURIComponent(id)}`)
  return resp.data.data
}

export async function crearCliente(datos: ClientePayload): Promise<Cliente> {
  const resp = await api.post<ApiEnvelope<Cliente>>('/v1/clientes', datos)
  return resp.data.data
}

export async function actualizarCliente(id: string, datos: Omit<ClientePayload, 'ID_Cliente'>): Promise<Cliente> {
  const resp = await api.put<ApiEnvelope<Cliente>>(`/v1/clientes/${encodeURIComponent(id)}`, datos)
  return resp.data.data
}

export async function darDeBajaCliente(id: string): Promise<void> {
  await api.delete(`/v1/clientes/${encodeURIComponent(id)}`)
}
