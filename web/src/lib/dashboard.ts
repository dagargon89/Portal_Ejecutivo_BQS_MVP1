import { api } from './api'
import type { ApiEnvelope, PorCobrar, PorFacturar, ResumenEjecutivo } from './types'

/** Las 3 cifras consolidadas calculadas en servidor (RF-DASH-01/02/03). */
export async function obtenerResumen(): Promise<ResumenEjecutivo> {
  const resp = await api.get<ApiEnvelope<ResumenEjecutivo>>('/v1/dashboard/resumen')
  return resp.data.data
}

/** Desglose del devengado pendiente por cotizacion (RF-DASH-02). */
export async function obtenerPorFacturar(): Promise<PorFacturar> {
  const resp = await api.get<ApiEnvelope<PorFacturar>>('/v1/dashboard/por-facturar')
  return resp.data.data
}

/** Desglose del saldo por cobrar por cliente/factura (RF-DASH-03). */
export async function obtenerPorCobrar(): Promise<PorCobrar> {
  const resp = await api.get<ApiEnvelope<PorCobrar>>('/v1/dashboard/por-cobrar')
  return resp.data.data
}
