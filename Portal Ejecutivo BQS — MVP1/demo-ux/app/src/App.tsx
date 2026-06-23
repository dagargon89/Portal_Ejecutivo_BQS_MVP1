/* Ruteo del demo (mapa de navegación = doc 09 §3). Rutas privadas bajo
 * AppShell (exige sesión). Login y Acceso denegado son públicas. */
import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { AccesoDenegadoPage } from "@/pages/AccesoDenegadoPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PorFacturarPage } from "@/pages/PorFacturarPage";
import { PorCobrarPage } from "@/pages/PorCobrarPage";
import { ClientesPage } from "@/pages/ClientesPage";
import { ClienteDetailPage } from "@/pages/ClienteDetailPage";
import { CotizacionesPage } from "@/pages/CotizacionesPage";
import { CotizacionDetailPage } from "@/pages/CotizacionDetailPage";
import { FacturasPage } from "@/pages/FacturasPage";
import { FacturaDetailPage } from "@/pages/FacturaDetailPage";
import { WhitelistPage } from "@/pages/WhitelistPage";
import { AuditoriaPage } from "@/pages/AuditoriaPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />

      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="por-facturar" element={<PorFacturarPage />} />
        <Route path="por-cobrar" element={<PorCobrarPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="clientes/:id" element={<ClienteDetailPage />} />
        <Route path="cotizaciones" element={<CotizacionesPage />} />
        <Route path="cotizaciones/:id" element={<CotizacionDetailPage />} />
        <Route path="facturas" element={<FacturasPage />} />
        <Route path="facturas/:folio" element={<FacturaDetailPage />} />
        <Route path="admin/whitelist" element={<WhitelistPage />} />
        <Route path="admin/auditoria" element={<AuditoriaPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
