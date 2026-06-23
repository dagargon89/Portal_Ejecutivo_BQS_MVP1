/* =====================================================================
 * api.mock.ts — Implementación MOCK del contrato ApiClient.
 * Lee db.json (espejo del DDL) y calcula las 3 preguntas y los saldos
 * EXACTAMENTE como lo hará el backend (doc 05 §3). Las pantallas no saben
 * que existe este archivo. En Fase 2 se borra y se usa api.real.ts.
 * ===================================================================== */
import type { ApiClient, PageParams } from "./api";
import { ApiError } from "./types";
import type {
  AuthWhitelist,
  Auditoria,
  BitacoraSorteo,
  CatCliente,
  ClienteDetalle,
  ClienteEditInput,
  ClienteInput,
  Cotizacion,
  CotizacionDetalle,
  CotizacionEditInput,
  CotizacionInput,
  DesgloseCotizacion,
  DevengadoInput,
  EmitirFacturaInput,
  Factura,
  FacturaDetalle,
  LoginInput,
  Pago,
  PagoInput,
  PorCobrar,
  PorFacturar,
  ResumenEjecutivo,
  SesionResp,
  Usuario,
  WhitelistInput,
} from "./types";
import { coincide, demoMeta, paginar, tabla } from "./mock/query";

/* ---------- utilidades ---------- */
const delay = (ms = 320) => new Promise((r) => setTimeout(r, ms));
const PERIODO: string = demoMeta.periodo_actual; // "2026-06"
const CALCULADO_EN: string = demoMeta.demo_now;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = (xs: number[]) => round2(xs.reduce((a, b) => a + b, 0));

const clientesAll = () => tabla<CatCliente>("CAT_CLIENTES");
const cotizacionesAll = () => tabla<Cotizacion>("COTIZACIONES");
const devengadoAll = () => tabla<BitacoraSorteo>("BITACORA_SORTEO");
const facturasAll = () => tabla<Factura>("FACTURAS");
const pagosAll = () => tabla<Pago>("PAGOS");

const pagadoDe = (folio: string) =>
  sum(pagosAll().filter((p) => p.Folio_Factura === folio).map((p) => p.Monto_Pagado));

const comercialDe = (idCliente: string) =>
  clientesAll().find((c) => c.ID_Cliente === idCliente)?.Nombre_Comercial ?? null;

function noEncontrado(msg: string): never {
  throw new ApiError(404, { code: "NOT_FOUND", message: msg });
}

/* ---------- implementación ---------- */
export const apiMock: ApiClient = {
  /* ===== Auth / sesión ===== */
  async login({ correo }: LoginInput): Promise<SesionResp> {
    await delay();
    const wl = tabla<AuthWhitelist>("AUTH_WHITELIST").find(
      (w) => w.correo.toLowerCase() === correo.toLowerCase(),
    );
    // QA5: correo fuera de whitelist o revocado -> 403 NOT_WHITELISTED
    if (!wl || wl.activo !== 1) {
      throw new ApiError(403, {
        code: "NOT_WHITELISTED",
        message: "Acceso denegado: el correo no está autorizado para este portal.",
      });
    }
    const usuario = tabla<Usuario>("usuarios").find(
      (u) => u.correo.toLowerCase() === correo.toLowerCase(),
    );
    if (!usuario) {
      // En whitelist pero sin identidad Shield: en el demo lo tratamos como credenciales inválidas.
      throw new ApiError(401, {
        code: "BAD_CREDENTIALS",
        message: "Correo o contraseña incorrectos.",
      });
    }
    return {
      access_token: `demo.${btoa(usuario.correo)}.token`,
      token_type: "Bearer",
      expires_in: 900,
      usuario,
    };
  },

  async refresh() {
    await delay(120);
    return { access_token: "demo.refreshed.token", token_type: "Bearer", expires_in: 900 };
  },

  async logout() {
    await delay(120);
    return { message: "Sesión cerrada. Token revocado." };
  },

  async me(): Promise<Usuario> {
    await delay(120);
    // En el demo el usuario activo lo gestiona el contexto de sesión del cliente.
    return tabla<Usuario>("usuarios")[3]; // admin por defecto
  },

  /* ===== Dashboard: las 3 preguntas (calculadas en "servidor") ===== */
  async dashResumen(): Promise<ResumenEjecutivo> {
    await delay();
    // P1: Σ FACTURAS.Monto_Total con Fecha_Emision en mes actual y Estatus ∈ {Pagada, Vigente}
    const facturado_mes = sum(
      facturasAll()
        .filter(
          (f) =>
            f.Fecha_Emision.slice(0, 7) === PERIODO &&
            (f.Estatus_Pago === "Pagada" || f.Estatus_Pago === "Vigente"),
        )
        .map((f) => f.Monto_Total),
    );
    // P2: Σ BITACORA_SORTEO.Monto_Devengado con Estatus_Facturacion = Pendiente
    const por_facturar = sum(
      devengadoAll()
        .filter((b) => b.Estatus_Facturacion === "Pendiente")
        .map((b) => b.Monto_Devengado),
    );
    // P3: Σ (Monto_Total − Σ pagos) de facturas activas (Vigente|Vencida)
    const por_cobrar = sum(
      facturasAll()
        .filter((f) => f.Estatus_Pago === "Vigente" || f.Estatus_Pago === "Vencida")
        .map((f) => f.Monto_Total - pagadoDe(f.Folio_Factura)),
    );
    return {
      periodo: PERIODO,
      moneda: "MXN",
      facturado_mes,
      por_facturar,
      por_cobrar,
      calculado_en: CALCULADO_EN,
    };
  },

  async dashPorFacturar(p: PageParams = {}) {
    await delay();
    const pendientes = devengadoAll().filter((b) => b.Estatus_Facturacion === "Pendiente");
    const porCot = new Map<string, DesgloseCotizacion>();
    for (const b of pendientes) {
      const cot = cotizacionesAll().find((c) => c.ID_Cotizacion === b.ID_Cotizacion);
      if (!cot) continue;
      const prev = porCot.get(cot.ID_Cotizacion);
      if (prev) {
        prev.monto_devengado_pendiente = round2(prev.monto_devengado_pendiente + b.Monto_Devengado);
        prev.capturas += 1;
      } else {
        porCot.set(cot.ID_Cotizacion, {
          ID_Cotizacion: cot.ID_Cotizacion,
          ID_Cliente: cot.ID_Cliente,
          Nombre_Comercial: comercialDe(cot.ID_Cliente),
          PO_Referencia: cot.PO_Referencia,
          Monto_Autorizado: cot.Monto_Autorizado,
          monto_devengado_pendiente: b.Monto_Devengado,
          capturas: 1,
        });
      }
    }
    const desglose = [...porCot.values()].sort(
      (a, b) => b.monto_devengado_pendiente - a.monto_devengado_pendiente,
    );
    const { data, meta } = paginar(desglose, p.page, p.per_page);
    const payload: PorFacturar = {
      total_por_facturar: sum(desglose.map((d) => d.monto_devengado_pendiente)),
      moneda: "MXN",
      desglose: data,
    };
    return { data: [payload], meta };
  },

  async dashPorCobrar(p: PageParams = {}) {
    await delay();
    const activas = facturasAll().filter(
      (f) => f.Estatus_Pago === "Vigente" || f.Estatus_Pago === "Vencida",
    );
    const porCliente = new Map<string, PorCobrar["clientes"][number]>();
    for (const f of activas) {
      const pagado = pagadoDe(f.Folio_Factura);
      const saldo = round2(f.Monto_Total - pagado);
      if (saldo <= 0) continue;
      const entry =
        porCliente.get(f.ID_Cliente) ??
        ({
          ID_Cliente: f.ID_Cliente,
          Nombre_Comercial: comercialDe(f.ID_Cliente),
          saldo_cliente: 0,
          facturas: [],
        } as PorCobrar["clientes"][number]);
      entry.facturas.push({
        Folio_Factura: f.Folio_Factura,
        Fecha_Emision: f.Fecha_Emision,
        Fecha_Vencimiento: f.Fecha_Vencimiento,
        Estatus_Pago: f.Estatus_Pago,
        Monto_Total: f.Monto_Total,
        pagado,
        saldo,
      });
      entry.saldo_cliente = round2(entry.saldo_cliente + saldo);
      porCliente.set(f.ID_Cliente, entry);
    }
    const clientes = [...porCliente.values()].sort((a, b) => b.saldo_cliente - a.saldo_cliente);
    const { data, meta } = paginar(clientes, p.page, p.per_page);
    const payload: PorCobrar = {
      total_por_cobrar: sum(clientes.map((c) => c.saldo_cliente)),
      moneda: "MXN",
      clientes: data,
    };
    return { data: [payload], meta };
  },

  /* ===== Clientes ===== */
  async listarClientes(p = {}) {
    await delay();
    let rows = clientesAll();
    if (p.q) {
      rows = rows.filter(
        (c) =>
          coincide(c.Nombre_Fiscal, p.q!) ||
          coincide(c.Nombre_Comercial, p.q!) ||
          coincide(c.RFC, p.q!) ||
          coincide(c.ID_Cliente, p.q!),
      );
    }
    if (p.estatus) rows = rows.filter((c) => c.Estatus === p.estatus);
    rows.sort((a, b) => a.ID_Cliente.localeCompare(b.ID_Cliente));
    return paginar(rows, p.page, p.per_page);
  },

  async obtenerCliente(idCliente: string): Promise<ClienteDetalle> {
    await delay();
    const cli = clientesAll().find((c) => c.ID_Cliente === idCliente);
    if (!cli) noEncontrado(`No existe el cliente ${idCliente}.`);
    const cots = cotizacionesAll().filter((c) => c.ID_Cliente === idCliente);
    const facts = facturasAll().filter((f) => f.ID_Cliente === idCliente);
    const facturas = facts.map((f) => {
      const pagado = pagadoDe(f.Folio_Factura);
      return {
        Folio_Factura: f.Folio_Factura,
        Monto_Total: f.Monto_Total,
        Estatus_Pago: f.Estatus_Pago,
        pagado,
        saldo: round2(f.Monto_Total - pagado),
      };
    });
    const saldo_por_cobrar = sum(
      facts
        .filter((f) => f.Estatus_Pago === "Vigente" || f.Estatus_Pago === "Vencida")
        .map((f) => f.Monto_Total - pagadoDe(f.Folio_Factura)),
    );
    return {
      ...cli,
      cartera: {
        moneda: "MXN",
        saldo_por_cobrar,
        cotizaciones: cots.map((c) => ({
          ID_Cotizacion: c.ID_Cotizacion,
          Monto_Autorizado: c.Monto_Autorizado,
          Estatus: c.Estatus,
        })),
        facturas,
      },
    };
  },

  async crearCliente(input: ClienteInput): Promise<CatCliente> {
    await delay();
    const existe = clientesAll().some((c) => c.ID_Cliente === input.ID_Cliente);
    if (existe)
      throw new ApiError(409, { code: "CONFLICT", message: `El cliente ${input.ID_Cliente} ya existe.` });
    return {
      ID_Cliente: input.ID_Cliente,
      Nombre_Fiscal: input.Nombre_Fiscal,
      Nombre_Comercial: input.Nombre_Comercial ?? null,
      RFC: input.RFC ?? null,
      Estatus: input.Estatus,
    };
    // (demo) no persiste: el InitialSeeder real consumirá db.json en Fase 2.
  },

  async editarCliente(idCliente: string, input: ClienteEditInput): Promise<CatCliente> {
    await delay();
    const cli = clientesAll().find((c) => c.ID_Cliente === idCliente);
    if (!cli) noEncontrado(`No existe el cliente ${idCliente}.`);
    return { ...cli, ...input, Nombre_Comercial: input.Nombre_Comercial ?? null, RFC: input.RFC ?? null };
  },

  async bajaCliente(idCliente: string) {
    await delay();
    const cli = clientesAll().find((c) => c.ID_Cliente === idCliente);
    if (!cli) noEncontrado(`No existe el cliente ${idCliente}.`);
    return { ID_Cliente: idCliente, Estatus: "Inactivo" as const, message: "Cliente dado de baja lógicamente." };
  },

  /* ===== Cotizaciones ===== */
  async listarCotizaciones(p = {}) {
    await delay();
    let rows = cotizacionesAll();
    if (p.id_cliente) rows = rows.filter((c) => c.ID_Cliente === p.id_cliente);
    if (p.estatus) rows = rows.filter((c) => c.Estatus === p.estatus);
    rows.sort((a, b) => a.ID_Cotizacion.localeCompare(b.ID_Cotizacion));
    return paginar(rows, p.page, p.per_page);
  },

  async obtenerCotizacion(idCotizacion: string): Promise<CotizacionDetalle> {
    await delay();
    const cot = cotizacionesAll().find((c) => c.ID_Cotizacion === idCotizacion);
    if (!cot) noEncontrado(`No existe la cotización ${idCotizacion}.`);
    const devs = devengadoAll().filter((d) => d.ID_Cotizacion === idCotizacion);
    const devengado_acumulado = sum(devs.map((d) => d.Monto_Devengado));
    const devengado_pendiente = sum(
      devs.filter((d) => d.Estatus_Facturacion === "Pendiente").map((d) => d.Monto_Devengado),
    );
    const devengado_facturado = round2(devengado_acumulado - devengado_pendiente);
    return {
      ...cot,
      Nombre_Comercial: comercialDe(cot.ID_Cliente),
      consumo: {
        devengado_acumulado,
        devengado_pendiente,
        devengado_facturado,
        disponible: round2(cot.Monto_Autorizado - devengado_acumulado),
      },
    };
  },

  async crearCotizacion(input: CotizacionInput): Promise<Cotizacion> {
    await delay();
    if (cotizacionesAll().some((c) => c.ID_Cotizacion === input.ID_Cotizacion))
      throw new ApiError(409, { code: "CONFLICT", message: `La cotización ${input.ID_Cotizacion} ya existe.` });
    if (!clientesAll().some((c) => c.ID_Cliente === input.ID_Cliente))
      noEncontrado(`El cliente ${input.ID_Cliente} no existe.`);
    return {
      ID_Cotizacion: input.ID_Cotizacion,
      ID_Cliente: input.ID_Cliente,
      PO_Referencia: input.PO_Referencia ?? null,
      Monto_Autorizado: input.Monto_Autorizado,
      Piezas_Autorizadas: input.Piezas_Autorizadas ?? null,
      Estatus: input.Estatus,
    };
  },

  async editarCotizacion(idCotizacion: string, input: CotizacionEditInput): Promise<Cotizacion> {
    await delay();
    const cot = cotizacionesAll().find((c) => c.ID_Cotizacion === idCotizacion);
    if (!cot) noEncontrado(`No existe la cotización ${idCotizacion}.`);
    return { ...cot, ...input, PO_Referencia: input.PO_Referencia ?? null, Piezas_Autorizadas: input.Piezas_Autorizadas ?? null };
  },

  /* ===== Devengado (BITACORA_SORTEO) ===== */
  async listarDevengado(idCotizacion: string, p = {}) {
    await delay();
    if (!cotizacionesAll().some((c) => c.ID_Cotizacion === idCotizacion))
      noEncontrado(`No existe la cotización ${idCotizacion}.`);
    let rows = devengadoAll().filter((d) => d.ID_Cotizacion === idCotizacion);
    if (p.estatus) rows = rows.filter((d) => d.Estatus_Facturacion === p.estatus);
    rows.sort((a, b) => b.Fecha.localeCompare(a.Fecha));
    return paginar(rows, p.page, p.per_page);
  },

  async crearDevengado(idCotizacion: string, input: DevengadoInput): Promise<BitacoraSorteo> {
    await delay();
    if (!cotizacionesAll().some((c) => c.ID_Cotizacion === idCotizacion))
      noEncontrado(`No existe la cotización ${idCotizacion}.`);
    // Validación numérica estricta (RF-DEV-02)
    const fields: Record<string, string> = {};
    if (!(input.Horas_Trabajadas >= 0)) fields.Horas_Trabajadas = "Las horas deben ser un número ≥ 0.";
    if (!(input.Monto_Devengado >= 0)) fields.Monto_Devengado = "El monto debe ser un número ≥ 0.";
    if (Object.keys(fields).length)
      throw new ApiError(422, { code: "VALIDATION", message: "La solicitud contiene campos inválidos.", fields });
    return {
      ID_Captura: input.ID_Captura,
      Fecha: input.Fecha,
      ID_Cotizacion: idCotizacion,
      Horas_Trabajadas: input.Horas_Trabajadas,
      Piezas_Sorteadas: input.Piezas_Sorteadas ?? null,
      Monto_Devengado: input.Monto_Devengado,
      Estatus_Facturacion: "Pendiente",
    };
  },

  /* ===== Facturas ===== */
  async listarFacturas(p = {}) {
    await delay();
    let rows = facturasAll();
    if (p.id_cliente) rows = rows.filter((f) => f.ID_Cliente === p.id_cliente);
    if (p.estatus) rows = rows.filter((f) => f.Estatus_Pago === p.estatus);
    if (p.desde) rows = rows.filter((f) => f.Fecha_Emision >= p.desde!);
    if (p.hasta) rows = rows.filter((f) => f.Fecha_Emision <= p.hasta!);
    rows.sort((a, b) => b.Fecha_Emision.localeCompare(a.Fecha_Emision));
    return paginar(rows, p.page, p.per_page);
  },

  async obtenerFactura(folio: string): Promise<FacturaDetalle> {
    await delay();
    const f = facturasAll().find((x) => x.Folio_Factura === folio);
    if (!f) noEncontrado(`No existe la factura ${folio}.`);
    const pagos = pagosAll().filter((p) => p.Folio_Factura === folio).sort((a, b) => a.Fecha_Pago.localeCompare(b.Fecha_Pago));
    const pagado = sum(pagos.map((p) => p.Monto_Pagado));
    return {
      ...f,
      Nombre_Comercial: comercialDe(f.ID_Cliente),
      pagado,
      saldo: round2(f.Monto_Total - pagado),
      pagos,
    };
  },

  async emitirFactura(input: EmitirFacturaInput): Promise<FacturaDetalle> {
    await delay(450);
    if (facturasAll().some((f) => f.Folio_Factura === input.Folio_Factura))
      throw new ApiError(409, { code: "ILLEGAL_TRANSITION", message: `El folio ${input.Folio_Factura} ya existe.` });
    if (input.Monto_Total < input.Monto_Subtotal)
      throw new ApiError(422, {
        code: "VALIDATION",
        message: "La solicitud contiene campos inválidos.",
        fields: { Monto_Total: "El total no puede ser menor que el subtotal." },
      });
    if (input.Fecha_Vencimiento < input.Fecha_Emision)
      throw new ApiError(422, {
        code: "VALIDATION",
        message: "La solicitud contiene campos inválidos.",
        fields: { Fecha_Vencimiento: "El vencimiento no puede ser anterior a la emisión." },
      });
    if (!input.capturas.length)
      throw new ApiError(422, {
        code: "VALIDATION",
        message: "Selecciona al menos un devengado a facturar.",
        fields: { capturas: "Selecciona al menos una captura pendiente." },
      });
    // (demo) Devuelve la factura recién "emitida" como Vigente, sin pagos.
    return {
      Folio_Factura: input.Folio_Factura,
      ID_Cliente: input.ID_Cliente,
      Fecha_Emision: input.Fecha_Emision,
      Monto_Subtotal: input.Monto_Subtotal,
      Monto_Total: input.Monto_Total,
      Fecha_Vencimiento: input.Fecha_Vencimiento,
      Estatus_Pago: "Vigente",
      Nombre_Comercial: comercialDe(input.ID_Cliente),
      pagado: 0,
      saldo: input.Monto_Total,
      pagos: [],
    };
  },

  async registrarPago(folio: string, input: PagoInput): Promise<FacturaDetalle> {
    await delay(450);
    const f = facturasAll().find((x) => x.Folio_Factura === folio);
    if (!f) noEncontrado(`No existe la factura ${folio}.`);
    if (f.Estatus_Pago === "Pagada")
      throw new ApiError(409, {
        code: "ILLEGAL_TRANSITION",
        message: "La factura ya está pagada; no admite nuevos abonos.",
      });
    const pagosPrev = pagosAll().filter((p) => p.Folio_Factura === folio);
    const pagadoPrev = sum(pagosPrev.map((p) => p.Monto_Pagado));
    const saldoPrev = round2(f.Monto_Total - pagadoPrev);
    // Prevención de sobrepago (RF-PAG-02)
    if (input.Monto_Pagado > saldoPrev)
      throw new ApiError(422, {
        code: "OVERPAYMENT",
        message: `El abono excede el saldo pendiente (${saldoPrev.toFixed(2)}).`,
        fields: { Monto_Pagado: "El abono no puede exceder el saldo." },
      });
    const nuevoPago: Pago = {
      ID_Pago: input.ID_Pago,
      Folio_Factura: folio,
      Fecha_Pago: input.Fecha_Pago,
      Monto_Pagado: input.Monto_Pagado,
      Referencia: input.Referencia ?? null,
    };
    const pagado = round2(pagadoPrev + input.Monto_Pagado);
    const saldo = round2(f.Monto_Total - pagado);
    const Estatus_Pago = saldo <= 0 ? "Pagada" : f.Estatus_Pago;
    return {
      ...f,
      Estatus_Pago,
      Nombre_Comercial: comercialDe(f.ID_Cliente),
      pagado,
      saldo,
      pagos: [...pagosPrev, nuevoPago].sort((a, b) => a.Fecha_Pago.localeCompare(b.Fecha_Pago)),
    };
  },

  /* ===== Admin: whitelist + auditoría ===== */
  async listarWhitelist(p = {}) {
    await delay();
    const rows = tabla<AuthWhitelist>("AUTH_WHITELIST").sort((a, b) => a.id - b.id);
    return paginar(rows, p.page, p.per_page);
  },

  async agregarWhitelist(input: WhitelistInput): Promise<AuthWhitelist> {
    await delay();
    const rows = tabla<AuthWhitelist>("AUTH_WHITELIST");
    if (rows.some((w) => w.correo.toLowerCase() === input.correo.toLowerCase()))
      throw new ApiError(409, { code: "CONFLICT", message: "El correo ya está en la lista." });
    const id = Math.max(0, ...rows.map((w) => w.id)) + 1;
    return { id, correo: input.correo, activo: 1, creado_por: 4, creado_en: CALCULADO_EN.slice(0, 19).replace("T", " ") };
  },

  async revocarWhitelist(id: number) {
    await delay();
    const w = tabla<AuthWhitelist>("AUTH_WHITELIST").find((x) => x.id === id);
    if (!w) noEncontrado(`No existe el registro de whitelist ${id}.`);
    return { id, activo: 0 as const, message: "Correo revocado." };
  },

  async listarAuditoria(p = {}) {
    await delay();
    let rows = tabla<Auditoria>("AUDITORIA");
    if (p.entidad) rows = rows.filter((a) => a.entidad === p.entidad);
    rows.sort((a, b) => b.creado_en.localeCompare(a.creado_en));
    return paginar(rows, p.page, p.per_page);
  },
};
