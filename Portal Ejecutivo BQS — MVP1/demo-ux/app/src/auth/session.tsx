/* =====================================================================
 * session.tsx — Sesión simulada del demo (stand-in de Shield, doc 04/ADR-003).
 * Guarda el Usuario activo en memoria (nunca localStorage), expone helpers de
 * rol y el candado de solo-lectura para `direccion` (RF-AUTH-04). En Fase 2
 * esto se reemplaza por el flujo real de tokens; las pantallas no cambian.
 * ===================================================================== */
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Rol, Usuario } from "@/lib";

interface SessionCtx {
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  hasRole: (...roles: Rol[]) => boolean;
  isReadOnly: boolean;
  /** ¿Puede escribir (mutar)? `direccion` nunca puede (solo lectura). */
  canWrite: boolean;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const value = useMemo<SessionCtx>(() => {
    const hasRole = (...roles: Rol[]) => !!usuario && roles.some((r) => usuario.roles.includes(r));
    const isReadOnly = !!usuario?.solo_lectura;
    return { usuario, setUsuario, hasRole, isReadOnly, canWrite: !!usuario && !isReadOnly };
  }, [usuario]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
