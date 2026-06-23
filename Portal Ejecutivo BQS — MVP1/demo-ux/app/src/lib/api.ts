/* =====================================================================
 * api.ts — LA INTERFAZ ÚNICA (contrato del doc 05). ES LO QUE SE CONGELA.
 *
 * Las pantallas y hooks consumen `api.*` y NO saben si detrás hay db.json
 * (mock) o la API CI4 real. Un método por endpoint del doc 05. Cambiar de
 * mock a real es cambiar una implementación, no las pantallas (Demo-First v2).
 *
 * Mapa método -> endpoint (doc 05):
 *   login           POST   /v1/auth/login
 *   refresh         POST   /v1/auth/refresh
 *   logout          POST   /v1/auth/logout
 *   me              GET    /v1/auth/me
 *   dashResumen     GET    /v1/dashboard/resumen
 *   dashPorFacturar GET    /v1/dashboard/por-facturar
 *   dashPorCobrar   GET    /v1/dashboard/por-cobrar
 *   listarClientes  GET    /v1/clientes
 *   obtenerCliente  GET    /v1/clientes/{id}
 *   crearCliente    POST   /v1/clientes
 *   editarCliente   PUT    /v1/clientes/{id}
 *   bajaCliente     DELETE /v1/clientes/{id}
 *   listarCotiz.    GET    /v1/cotizaciones
 *   obtenerCotiz.   GET    /v1/cotizaciones/{id}
 *   crearCotiz.     POST   /v1/cotizaciones
 *   editarCotiz.    PUT    /v1/cotizaciones/{id}
 *   listarDevengado GET    /v1/cotizaciones/{id}/devengado
 *   crearDevengado  POST   /v1/cotizaciones/{id}/devengado
 *   listarFacturas  GET    /v1/facturas
 *   obtenerFactura  GET    /v1/facturas/{folio}
 *   emitirFactura   POST   /v1/facturas
 *   registrarPago   POST   /v1/facturas/{folio}/pagos
 *   listarWhitelist GET    /v1/admin/whitelist
 *   agregarWL       POST   /v1/admin/whitelist
 *   revocarWL       DELETE /v1/admin/whitelist/{id}
 *   listarAuditoria GET    /v1/admin/auditoria
 * ===================================================================== */
import type {
  AuthWhitelist,
  Auditoria,
  CatCliente,
  ClienteDetalle,
  ClienteEditInput,
  ClienteInput,
  Cotizacion,
  CotizacionDetalle,
  CotizacionEditInput,
  CotizacionInput,
  BitacoraSorteo,
  DevengadoInput,
  EmitirFacturaInput,
  Factura,
  FacturaDetalle,
  LoginInput,
  Paged,
  PagoInput,
  PorCobrar,
  PorFacturar,
  ResumenEjecutivo,
  SesionResp,
  Usuario,
  WhitelistInput,
} from "./types";

export interface PageParams {
  page?: number;
  per_page?: number;
}

export interface ApiClient {
  /* ---- Auth / sesión ---- */
  login(input: LoginInput): Promise<SesionResp>;
  refresh(): Promise<Pick<SesionResp, "access_token" | "token_type" | "expires_in">>;
  logout(): Promise<{ message: string }>;
  me(): Promise<Usuario>;

  /* ---- Dashboard ejecutivo (3 preguntas) ---- */
  dashResumen(): Promise<ResumenEjecutivo>;
  dashPorFacturar(p?: PageParams): Promise<Paged<PorFacturar>>;
  dashPorCobrar(p?: PageParams): Promise<Paged<PorCobrar>>;

  /* ---- Clientes (CAT_CLIENTES) ---- */
  listarClientes(
    p?: PageParams & { q?: string; estatus?: CatCliente["Estatus"] },
  ): Promise<Paged<CatCliente>>;
  obtenerCliente(idCliente: string): Promise<ClienteDetalle>;
  crearCliente(input: ClienteInput): Promise<CatCliente>;
  editarCliente(idCliente: string, input: ClienteEditInput): Promise<CatCliente>;
  bajaCliente(idCliente: string): Promise<{ ID_Cliente: string; Estatus: "Inactivo"; message: string }>;

  /* ---- Cotizaciones (COTIZACIONES) ---- */
  listarCotizaciones(
    p?: PageParams & { id_cliente?: string; estatus?: Cotizacion["Estatus"] },
  ): Promise<Paged<Cotizacion>>;
  obtenerCotizacion(idCotizacion: string): Promise<CotizacionDetalle>;
  crearCotizacion(input: CotizacionInput): Promise<Cotizacion>;
  editarCotizacion(idCotizacion: string, input: CotizacionEditInput): Promise<Cotizacion>;

  /* ---- Devengado (BITACORA_SORTEO) ---- */
  listarDevengado(
    idCotizacion: string,
    p?: PageParams & { estatus?: BitacoraSorteo["Estatus_Facturacion"] },
  ): Promise<Paged<BitacoraSorteo>>;
  crearDevengado(idCotizacion: string, input: DevengadoInput): Promise<BitacoraSorteo>;

  /* ---- Facturas (FACTURAS) ---- */
  listarFacturas(
    p?: PageParams & {
      id_cliente?: string;
      estatus?: Factura["Estatus_Pago"];
      desde?: string;
      hasta?: string;
    },
  ): Promise<Paged<Factura>>;
  obtenerFactura(folio: string): Promise<FacturaDetalle>;
  emitirFactura(input: EmitirFacturaInput): Promise<FacturaDetalle>;
  registrarPago(folio: string, input: PagoInput): Promise<FacturaDetalle>;

  /* ---- Admin: whitelist + auditoría ---- */
  listarWhitelist(p?: PageParams): Promise<Paged<AuthWhitelist>>;
  agregarWhitelist(input: WhitelistInput): Promise<AuthWhitelist>;
  revocarWhitelist(id: number): Promise<{ id: number; activo: 0; message: string }>;
  listarAuditoria(
    p?: PageParams & { entidad?: string },
  ): Promise<Paged<Auditoria>>;
}
