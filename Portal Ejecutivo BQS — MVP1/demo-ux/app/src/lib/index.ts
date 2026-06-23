/* =====================================================================
 * index.ts — Interruptor único de origen de datos (Demo-First v2 §5).
 * Las pantallas importan SIEMPRE desde aquí:  import { api } from "@/lib";
 *
 * VITE_USE_MOCK !== "false"  ->  mock (db.json)   [default del demo]
 * VITE_USE_MOCK === "false"  ->  real (API CI4)   [Fase 2]
 * ===================================================================== */
import type { ApiClient } from "./api";
import { apiMock } from "./api.mock";
import { apiReal } from "./api.real";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

export const api: ApiClient = useMock ? apiMock : apiReal;
export const USING_MOCK = useMock;

export * from "./types";
export type { ApiClient, PageParams } from "./api";
