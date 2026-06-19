/**
 * API contract types — Portal Ejecutivo BQS (base path /api/v1).
 *
 * Success envelope:   { "data": ... }  (+ "meta" on collections)
 * Error envelope:     { "error": { "code", "message", "fields"? } }
 */

/** Standard success envelope for a single resource. */
export interface ApiEnvelope<T> {
  data: T
}

/** Pagination metadata returned on collection endpoints. */
export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

/** Standard success envelope for a paginated collection. */
export interface ApiCollectionEnvelope<T> {
  data: T[]
  meta: PaginationMeta
}

/** Standard error envelope. */
export interface ApiError {
  code: string
  message: string
  fields?: Record<string, string>
}

export interface ApiErrorEnvelope {
  error: ApiError
}

/** Known backend error codes (05-api §3). */
export type ApiErrorCode =
  | 'BAD_CREDENTIALS'
  | 'NOT_WHITELISTED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'READ_ONLY'
  | 'NOT_FOUND'
  | 'OVERPAYMENT'
  | 'ILLEGAL_TRANSITION'
  | 'SERVER_ERROR'

/** Roles defined in the system. */
export type Rol = 'direccion' | 'capturista' | 'facturacion' | 'admin'

/** User shape returned by POST /auth/login. */
export interface UsuarioLogin {
  id: number
  correo: string
  nombre: string
  roles: string[]
}

/** Full user shape returned by GET /auth/me. */
export interface Usuario {
  id: number
  correo: string
  nombre: string
  roles: string[]
  solo_lectura: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  usuario: UsuarioLogin
}

export interface RefreshResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

/** A whitelist entry (GET /admin/whitelist). */
export interface WhitelistEntry {
  id: number
  correo: string
  activo: boolean
  creado_en: string
}

// =====================================================================
// Sprint 2 — Tier 0 (clientes, cotizaciones, importacion)
// La API serializa los numericos de BD como strings; se formatean en UI.
// =====================================================================

export type EstatusCliente = 'Activo' | 'Inactivo'
export type EstatusCotizacion = 'Aprobada' | 'Pendiente PO' | 'Cerrada'

/** Cliente consolidado del Tier 0 (CAT_CLIENTES). */
export interface Cliente {
  ID_Cliente: string
  Nombre_Fiscal: string
  Nombre_Comercial: string | null
  RFC: string | null
  Estatus: EstatusCliente
}

/** Cotizacion del Tier 0 (COTIZACIONES). */
export interface Cotizacion {
  ID_Cotizacion: string
  ID_Cliente: string
  PO_Referencia: string | null
  Monto_Autorizado: string
  Piezas_Autorizadas: string | null
  Estatus: EstatusCotizacion
}

/** Fila de cotizacion dentro de la cartera (incluye devengado/disponible). */
export interface CarteraCotizacion {
  ID_Cotizacion: string
  PO_Referencia: string | null
  Monto_Autorizado: string
  Piezas_Autorizadas: string | null
  Estatus: string
  devengado: string
  disponible: string
}

/** Fila de factura dentro de la cartera (vacia hasta el Sprint 3). */
export interface CarteraFactura {
  Folio_Factura: string
  Fecha_Emision: string
  Monto_Total: string
  Fecha_Vencimiento: string
  Estatus_Pago: string
  pagado: string
  saldo: string
}

/** Cartera consolidada del cliente (RF-CLI-03). */
export interface Cartera {
  moneda: string
  total_autorizado: string
  saldo_por_cobrar: string
  cotizaciones: CarteraCotizacion[]
  facturas: CarteraFactura[]
}

/** Detalle de cliente con su cartera (GET /clientes/{id}). */
export type ClienteConCartera = Cliente & { cartera: Cartera }

/** Consumo devengado vs autorizado de una cotizacion (RF-COT-02). */
export interface Consumo {
  moneda: string
  devengado_acumulado: string
  devengado_pendiente: string
  devengado_facturado: string
  disponible: string
}

/** Detalle de cotizacion con su consumo (GET /cotizaciones/{id}). */
export type CotizacionConConsumo = Cotizacion & { consumo: Consumo }

export type EstadoJob = 'pendiente' | 'procesando' | 'completado' | 'fallido'

/** Estado de un job de la cola asincrona (GET /admin/jobs/{id}). */
export interface Job {
  id: number
  tipo: string
  estado: EstadoJob
  intentos: number
  max_intentos: number
  ultimo_error: string | null
  creado_en: string
  actualizado_en: string
}

/** Respuesta 202 al encolar una importacion (POST /admin/import). */
export interface ImportEncolado {
  job_id: number
  tipo: string
  estado: string
  message: string
}

// =====================================================================
// Sprint 3 — Ciclo de Cobro (devengado, facturas, pagos)
// Numericos como strings (DECIMAL serializado); se formatean en UI.
// =====================================================================

export type EstatusFacturacion = 'Pendiente' | 'Facturado'
export type EstatusFactura = 'Vigente' | 'Vencida' | 'Pagada'

/** Captura de devengado (BITACORA_SORTEO). */
export interface Devengado {
  ID_Captura: string
  Fecha: string
  ID_Cotizacion: string
  Horas_Trabajadas: string
  Piezas_Sorteadas: string | null
  Monto_Devengado: string
  Estatus_Facturacion: EstatusFacturacion
}

/** Factura (FACTURAS). */
export interface Factura {
  Folio_Factura: string
  ID_Cliente: string
  Fecha_Emision: string
  Monto_Subtotal: string
  Monto_Total: string
  Fecha_Vencimiento: string
  Estatus_Pago: EstatusFactura
}

/** Abono aplicado a una factura (PAGOS). */
export interface Pago {
  ID_Pago: string
  Fecha_Pago: string
  Monto_Pagado: string
  Referencia: string | null
}

/** Detalle de factura con saldo y pagos (GET /facturas/{folio}). */
export type FacturaConDetalle = Factura & {
  pagado: string
  saldo: string
  pagos: Pago[]
}

/** Resumen de factura devuelto al registrar un pago. */
export interface PagoFacturaResumen {
  Folio_Factura: string
  Monto_Total: string
  pagado: string
  saldo: string
  Estatus_Pago: EstatusFactura
}

/** Respuesta 201 al registrar un pago (POST /facturas/{folio}/pagos). */
export interface PagoRegistrado {
  ID_Pago: string
  Folio_Factura: string
  Fecha_Pago: string
  Monto_Pagado: string
  Referencia: string | null
  factura: PagoFacturaResumen
}

// =====================================================================
// Sprint 4 — Dashboard ejecutivo (las 3 preguntas)
// Numericos como strings (DECIMAL serializado); se formatean en UI.
// =====================================================================

/** Resumen ejecutivo: las 3 cifras (GET /dashboard/resumen). */
export interface ResumenEjecutivo {
  periodo: string
  moneda: string
  facturado_mes: string
  por_facturar: string
  por_cobrar: string
  calculado_en: string
}

/** Fila del desglose "por facturar", agrupada por cotizacion (RF-DASH-02). */
export interface PorFacturarItem {
  ID_Cotizacion: string
  ID_Cliente: string
  Nombre_Comercial: string | null
  PO_Referencia: string | null
  Monto_Autorizado: string | null
  monto_devengado_pendiente: string
  capturas: number
}

/** Desglose del devengado pendiente (GET /dashboard/por-facturar). */
export interface PorFacturar {
  total_por_facturar: string
  moneda: string
  desglose: PorFacturarItem[]
}

/** Factura activa dentro del desglose "por cobrar". */
export interface PorCobrarFactura {
  Folio_Factura: string
  Fecha_Emision: string
  Fecha_Vencimiento: string
  Estatus_Pago: string
  Monto_Total: string
  pagado: string
  saldo: string
}

/** Cliente con sus facturas activas y saldo (RF-DASH-03, RF-MET-02). */
export interface PorCobrarCliente {
  ID_Cliente: string
  Nombre_Comercial: string | null
  saldo_cliente: string
  facturas: PorCobrarFactura[]
}

/** Desglose del saldo por cobrar (GET /dashboard/por-cobrar). */
export interface PorCobrar {
  total_por_cobrar: string
  moneda: string
  clientes: PorCobrarCliente[]
}
