/* =====================================================================
 * api.real.ts — Implementación REAL del contrato ApiClient (Fase 2).
 * Misma firma que api.mock.ts: conectar el backend = activar este archivo
 * (VITE_USE_MOCK=false). Las pantallas no cambian (Demo-First v2 §6).
 *
 * Usa `fetch` (sin dependencias). El access token vive EN MEMORIA (nunca
 * localStorage, doc 04 / ADR-003). El refresh va por cookie HttpOnly que el
 * navegador adjunta solo. Aquí solo queda el esqueleto de transporte +
 * desempaquetado de envolturas {data}/{meta}/{error} del doc 05.
 * ===================================================================== */
import type { ApiClient, PageParams } from "./api";
import { ApiError } from "./types";
import type * as T from "./types";

const BASE = `${import.meta.env.VITE_API_URL ?? ""}/v1`;

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

function qs(params: Record<string, unknown> = {}): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function request<R>(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include", // cookie de refresh HttpOnly
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json as { error?: T.ApiErrorBody })?.error;
    throw new ApiError(res.status, err ?? { code: "SERVER_ERROR", message: "Error del servidor." });
  }
  return json as R;
}

const data = async <R>(method: string, path: string, body?: unknown): Promise<R> =>
  ((await request<{ data: R }>(method, path, body)) as { data: R }).data;

const paged = async <R>(method: string, path: string): Promise<T.Paged<R>> =>
  (await request<T.Paged<R>>(method, path)) as T.Paged<R>;

export const apiReal: ApiClient = {
  /* Auth */
  async login(input) {
    const r = await data<T.SesionResp>("POST", "/auth/login", input);
    setAccessToken(r.access_token);
    return r;
  },
  async refresh() {
    const r = await data<Pick<T.SesionResp, "access_token" | "token_type" | "expires_in">>(
      "POST",
      "/auth/refresh",
    );
    setAccessToken(r.access_token);
    return r;
  },
  async logout() {
    const r = await data<{ message: string }>("POST", "/auth/logout");
    setAccessToken(null);
    return r;
  },
  me: () => data<T.Usuario>("GET", "/auth/me"),

  /* Dashboard */
  dashResumen: () => data<T.ResumenEjecutivo>("GET", "/dashboard/resumen"),
  dashPorFacturar: (p: PageParams = {}) => paged<T.PorFacturar>("GET", `/dashboard/por-facturar${qs(p)}`),
  dashPorCobrar: (p: PageParams = {}) => paged<T.PorCobrar>("GET", `/dashboard/por-cobrar${qs(p)}`),

  /* Clientes */
  listarClientes: (p = {}) => paged<T.CatCliente>("GET", `/clientes${qs(p)}`),
  obtenerCliente: (id) => data<T.ClienteDetalle>("GET", `/clientes/${encodeURIComponent(id)}`),
  crearCliente: (input) => data<T.CatCliente>("POST", "/clientes", input),
  editarCliente: (id, input) => data<T.CatCliente>("PUT", `/clientes/${encodeURIComponent(id)}`, input),
  bajaCliente: (id) =>
    data<{ ID_Cliente: string; Estatus: "Inactivo"; message: string }>(
      "DELETE",
      `/clientes/${encodeURIComponent(id)}`,
    ),

  /* Cotizaciones */
  listarCotizaciones: (p = {}) => paged<T.Cotizacion>("GET", `/cotizaciones${qs(p)}`),
  obtenerCotizacion: (id) => data<T.CotizacionDetalle>("GET", `/cotizaciones/${encodeURIComponent(id)}`),
  crearCotizacion: (input) => data<T.Cotizacion>("POST", "/cotizaciones", input),
  editarCotizacion: (id, input) => data<T.Cotizacion>("PUT", `/cotizaciones/${encodeURIComponent(id)}`, input),

  /* Devengado */
  listarDevengado: (id, p = {}) =>
    paged<T.BitacoraSorteo>("GET", `/cotizaciones/${encodeURIComponent(id)}/devengado${qs(p)}`),
  crearDevengado: (id, input) =>
    data<T.BitacoraSorteo>("POST", `/cotizaciones/${encodeURIComponent(id)}/devengado`, input),

  /* Facturas */
  listarFacturas: (p = {}) => paged<T.Factura>("GET", `/facturas${qs(p)}`),
  obtenerFactura: (folio) => data<T.FacturaDetalle>("GET", `/facturas/${encodeURIComponent(folio)}`),
  emitirFactura: (input) => data<T.FacturaDetalle>("POST", "/facturas", input),
  registrarPago: (folio, input) =>
    data<T.FacturaDetalle>("POST", `/facturas/${encodeURIComponent(folio)}/pagos`, input),

  /* Admin */
  listarWhitelist: (p = {}) => paged<T.AuthWhitelist>("GET", `/admin/whitelist${qs(p)}`),
  agregarWhitelist: (input) => data<T.AuthWhitelist>("POST", "/admin/whitelist", input),
  revocarWhitelist: (id) =>
    data<{ id: number; activo: 0; message: string }>("DELETE", `/admin/whitelist/${id}`),
  listarAuditoria: (p = {}) => paged<T.Auditoria>("GET", `/admin/auditoria${qs(p)}`),
};
