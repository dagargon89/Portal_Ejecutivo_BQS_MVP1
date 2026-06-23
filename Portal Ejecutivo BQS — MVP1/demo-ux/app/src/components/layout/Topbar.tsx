/* Barra superior del panel. Toggle de menú (móvil), indicador de datos
 * simulados, candado de solo-lectura (Dirección) y menú de usuario. */
import { Menu, LogOut, Lock, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSession } from "@/auth/session";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { api, USING_MOCK } from "@/lib";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { usuario, setUsuario, isReadOnly } = useSession();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);

  async function logout() {
    await api.logout().catch(() => undefined);
    setUsuario(null);
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Abrir menú"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <div className="flex flex-1 items-center gap-2">
        {USING_MOCK ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-xs font-medium text-primary">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Datos simulados
          </span>
        ) : null}
        {isReadOnly ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning-strong">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Solo lectura
          </span>
        ) : null}
      </div>

      {usuario ? (
        <div className="relative">
          <button
            onClick={() => setOpenMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={openMenu}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {usuario.nombre.slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-slate-900">{usuario.nombre}</span>
              <span className="block text-xs leading-tight text-slate-500">{usuario.correo}</span>
            </span>
          </button>

          {openMenu ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
            >
              <p className="text-sm font-medium text-slate-900">{usuario.nombre}</p>
              <p className="mb-2 text-xs text-slate-500">{usuario.correo}</p>
              <div className="mb-3 flex flex-wrap gap-1">
                {usuario.roles.map((r) => (
                  <RoleBadge key={r} rol={r} />
                ))}
              </div>
              <button
                onClick={logout}
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
