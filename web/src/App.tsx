import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './features/auth/LoginPage'
import { AccessDeniedPage } from './features/auth/AccessDeniedPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { PorFacturarPage } from './features/dashboard/PorFacturarPage'
import { PorCobrarPage } from './features/dashboard/PorCobrarPage'
import { WhitelistPage } from './features/admin/whitelist/WhitelistPage'
import { ImportPage } from './features/admin/import/ImportPage'
import { ClientesPage } from './features/clientes/ClientesPage'
import { ClienteDetallePage } from './features/clientes/ClienteDetallePage'
import { CotizacionesPage } from './features/cotizaciones/CotizacionesPage'
import { CotizacionDetallePage } from './features/cotizaciones/CotizacionDetallePage'
import { DevengadoPage } from './features/devengado/DevengadoPage'
import { FacturasPage } from './features/facturas/FacturasPage'
import { FacturaDetallePage } from './features/facturas/FacturaDetallePage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/acceso-denegado" element={<AccessDeniedPage />} />

          {/* Privadas: AppShell protege la sesión y aporta nav lateral + topbar.
              El gating por rol vive en <ProtectedRoute> sobre rutas concretas. */}
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/por-facturar" element={<PorFacturarPage />} />
            <Route path="/por-cobrar" element={<PorCobrarPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/:id" element={<ClienteDetallePage />} />
            <Route path="/cotizaciones" element={<CotizacionesPage />} />
            <Route path="/cotizaciones/:id" element={<CotizacionDetallePage />} />
            <Route path="/devengado" element={<DevengadoPage />} />
            <Route path="/facturas" element={<FacturasPage />} />
            <Route path="/facturas/:folio" element={<FacturaDetallePage />} />
            <Route
              path="/admin/whitelist"
              element={
                <ProtectedRoute rol="admin">
                  <WhitelistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/import"
              element={
                <ProtectedRoute rol="admin">
                  <ImportPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
