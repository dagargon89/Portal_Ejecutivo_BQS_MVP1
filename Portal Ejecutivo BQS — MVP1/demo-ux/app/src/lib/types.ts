/* =====================================================================
 * types.ts — Espejo de tipos del Modelo de Datos (doc 03) + envolturas de
 * respuesta de la API (doc 05). Esta es la nomenclatura Tier 0 EXACTA: los
 * nombres de columna se conservan tal cual el DDL (no se renombran).
 * Si cambia el doc 03, cambia aquí, en db.json y en el InitialSeeder (Fase 2).
 * ===================================================================== */

/* ---------- Enums del dominio (CHECK del DDL) ---------- */
export type EstatusCliente = "Activo" | "Inactivo";
export type EstatusCotizacion = "Aprobada" | "Pendiente PO" | "Cerrada";
export type EstatusFacturacion = "Pendiente" | "Facturado";
export type EstatusPago = "Pagada" | "Vigente" | "Vencida";
export type TipoJob =
  | "import_inicial"
  | "recalculo_saldos"
  | "marcar_vencidas"
  | "notificacion";
export type EstadoJob = "pendiente" | "procesando" | "completado" | "fallido";

/* ---------- Roles (SRS §2.2) ---------- */
export type Rol = "direccion" | "capturista" | "facturacion" | "admin";

/* ---------- 5 tablas de dominio Tier 0 ---------- */
export interface CatCliente {
  ID_Cliente: string; // CLI-XXX
  Nombre_Fiscal: string;
  Nombre_Comercial: string | null;
  RFC: string | null;
  Estatus: EstatusCliente;
}

export interface Cotizacion {
  ID_Cotizacion: string; // COT-XXXX
  ID_Cliente: string; // FK -> CAT_CLIENTES
  PO_Referencia: string | null;
  Monto_Autorizado: number; // DECIMAL(14,2)
  Piezas_Autorizadas: number | null;
  Estatus: EstatusCotizacion;
}

export interface BitacoraSorteo {
  ID_Captura: string; // CAP-XXXXX
  Fecha: string; // DATE YYYY-MM-DD
  ID_Cotizacion: string; // FK -> COTIZACIONES
  Horas_Trabajadas: number; // DECIMAL(8,2)
  Piezas_Sorteadas: number | null;
  Monto_Devengado: number; // DECIMAL(14,2)
  Estatus_Facturacion: EstatusFacturacion;
}

export interface Factura {
  Folio_Factura: string; // F-XXXXX | UUID
  ID_Cliente: string; // FK -> CAT_CLIENTES
  Fecha_Emision: string; // DATE
  Monto_Subtotal: number;
  Monto_Total: number;
  Fecha_Vencimiento: string; // DATE
  Estatus_Pago: EstatusPago;
}

export interface Pago {
  ID_Pago: string; // PAG-XXXX
  Folio_Factura: string; // FK -> FACTURAS
  Fecha_Pago: string; // DATE
  Monto_Pagado: number;
  Referencia: string | null;
}

/* ---------- Tablas de soporte / infraestructura ---------- */
export interface AuthWhitelist {
  id: number;
  correo: string;
  activo: 0 | 1;
  creado_por: number | null;
  creado_en: string; // TIMESTAMP
}

export interface Auditoria {
  id: number;
  usuario_id: number | null;
  accion: string; // crear|actualizar|eliminar|acceso
  entidad: string;
  entidad_id: string | null;
  valores_antes: Record<string, unknown> | null;
  valores_despues: Record<string, unknown> | null;
  ip: string | null;
  creado_en: string;
}

export interface JobCola {
  id: number;
  tipo: TipoJob;
  payload: Record<string, unknown> | null;
  estado: EstadoJob;
  intentos: number;
  max_intentos: number;
  ultimo_error: string | null;
  creado_en: string;
  actualizado_en: string;
}

/* ---------- Stand-in de Shield (solo demo): usuarios + roles ----------
 * En Fase 2, la identidad la maneja CodeIgniter Shield (tablas users,
 * auth_identities, auth_groups_users…). Para el demo simulamos lo mínimo. */
export interface Usuario {
  id: number;
  correo: string;
  nombre: string;
  roles: Rol[];
  solo_lectura: boolean;
}

/* ---------- Envolturas de respuesta (doc 05 §1.4–1.6) ---------- */
export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface Paged<T> {
  data: T[];
  meta: PageMeta;
}

export interface ApiErrorBody {
  code: string; // VALIDATION | NOT_FOUND | FORBIDDEN | READ_ONLY | ...
  message: string;
  fields?: Record<string, string>;
}

/** Error normalizado que el mock y el adaptador real lanzan por igual. */
export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}

/* ---------- DTOs de las tres preguntas (doc 05 §3) ---------- */
export interface ResumenEjecutivo {
  periodo: string; // "2026-06"
  moneda: "MXN";
  facturado_mes: number;
  por_facturar: number;
  por_cobrar: number;
  calculado_en: string; // ISO
}

export interface DesgloseCotizacion {
  ID_Cotizacion: string;
  ID_Cliente: string;
  Nombre_Comercial: string | null;
  PO_Referencia: string | null;
  Monto_Autorizado: number;
  monto_devengado_pendiente: number;
  capturas: number;
}

export interface PorFacturar {
  total_por_facturar: number;
  moneda: "MXN";
  desglose: DesgloseCotizacion[];
}

export interface FacturaSaldo {
  Folio_Factura: string;
  Fecha_Emision: string;
  Fecha_Vencimiento: string;
  Estatus_Pago: EstatusPago;
  Monto_Total: number;
  pagado: number;
  saldo: number;
}

export interface ClientePorCobrar {
  ID_Cliente: string;
  Nombre_Comercial: string | null;
  saldo_cliente: number;
  facturas: FacturaSaldo[];
}

export interface PorCobrar {
  total_por_cobrar: number;
  moneda: "MXN";
  clientes: ClientePorCobrar[];
}

/* ---------- DTOs de detalle ---------- */
export interface CarteraCliente {
  moneda: "MXN";
  saldo_por_cobrar: number;
  cotizaciones: Array<Pick<Cotizacion, "ID_Cotizacion" | "Monto_Autorizado" | "Estatus">>;
  facturas: Array<
    Pick<Factura, "Folio_Factura" | "Monto_Total" | "Estatus_Pago"> & {
      pagado: number;
      saldo: number;
    }
  >;
}

export interface ClienteDetalle extends CatCliente {
  cartera: CarteraCliente;
}

export interface ConsumoCotizacion {
  devengado_acumulado: number;
  devengado_pendiente: number;
  devengado_facturado: number;
  disponible: number;
}

export interface CotizacionDetalle extends Cotizacion {
  Nombre_Comercial: string | null;
  consumo: ConsumoCotizacion;
}

export interface FacturaDetalle extends Factura {
  Nombre_Comercial: string | null;
  pagado: number;
  saldo: number;
  pagos: Pago[];
}

/* ---------- Inputs de mutación ---------- */
export interface LoginInput {
  correo: string;
  password: string;
}
export interface SesionResp {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  usuario: Usuario;
}

export interface ClienteInput {
  ID_Cliente: string;
  Nombre_Fiscal: string;
  Nombre_Comercial?: string | null;
  RFC?: string | null;
  Estatus: EstatusCliente;
}
export type ClienteEditInput = Omit<ClienteInput, "ID_Cliente">;

export interface CotizacionInput {
  ID_Cotizacion: string;
  ID_Cliente: string;
  PO_Referencia?: string | null;
  Monto_Autorizado: number;
  Piezas_Autorizadas?: number | null;
  Estatus: EstatusCotizacion;
}
export type CotizacionEditInput = Omit<CotizacionInput, "ID_Cotizacion" | "ID_Cliente">;

export interface DevengadoInput {
  ID_Captura: string;
  Fecha: string;
  Horas_Trabajadas: number;
  Piezas_Sorteadas?: number | null;
  Monto_Devengado: number;
}

export interface EmitirFacturaInput {
  Folio_Factura: string;
  ID_Cliente: string;
  Fecha_Emision: string;
  Fecha_Vencimiento: string;
  Monto_Subtotal: number;
  Monto_Total: number;
  capturas: string[]; // IDs de BITACORA_SORTEO pendientes
}

export interface PagoInput {
  ID_Pago: string;
  Fecha_Pago: string;
  Monto_Pagado: number;
  Referencia?: string | null;
}

export interface WhitelistInput {
  correo: string;
}
