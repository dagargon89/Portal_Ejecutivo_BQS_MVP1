/* AppShell — esqueleto del panel administrativo: nav lateral + barra superior
 * + área de contenido. Protege rutas: sin sesión redirige a /login. */
import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useSession } from "@/auth/session";

export function AppShell() {
  const { usuario } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
