/* =====================================================================
 * query.ts — Helper mínimo de consulta sobre db.json (Demo-First v2 §5).
 * Filtrar + paginar + clonar. Sin dependencias. NO se usa fuera del mock.
 * ===================================================================== */
import dbRaw from "./db.json";
import type { PageMeta } from "../types";

// Clon profundo por lectura: nunca mutamos el JSON importado (inmutable en runtime).
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

type Db = typeof dbRaw;

/** Devuelve una COPIA del arreglo de una "tabla" del db.json. */
export function tabla<T>(nombre: keyof Db): T[] {
  return clone(dbRaw[nombre] as unknown as T[]);
}

/** Metadatos del demo (today fijo, periodo actual). */
export const demoMeta = clone(dbRaw._demo);

/** Pagina un arreglo ya filtrado/ordenado y arma el `meta` del doc 05 §1.6. */
export function paginar<T>(
  rows: T[],
  page = 1,
  perPage = 20,
): { data: T[]; meta: PageMeta } {
  const per_page = Math.min(Math.max(perPage, 1), 100);
  const total = rows.length;
  const total_pages = Math.max(Math.ceil(total / per_page), 1);
  const p = Math.max(page, 1);
  const start = (p - 1) * per_page;
  return {
    data: rows.slice(start, start + per_page),
    meta: { page: p, per_page, total, total_pages },
  };
}

/** Búsqueda consolidada simple (case/acento-insensible básico). */
export function coincide(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack) return false;
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  return norm(haystack).includes(norm(needle));
}
