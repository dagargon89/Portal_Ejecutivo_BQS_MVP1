import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { AccessDeniedPage } from './features/auth/AccessDeniedPage'
import { HomePage } from './features/home/HomePage'
import { WhitelistPage } from './features/admin/whitelist/WhitelistPage'
import { ClientesPage } from './features/clientes/ClientesPage'
import { ClienteDetallePage } from './features/clientes/ClienteDetallePage'
import { CotizacionesPage } from './features/cotizaciones/CotizacionesPage'
import { CotizacionDetallePage } from './features/cotizaciones/CotizacionDetallePage'
import { DevengadoPage } from './features/devengado/DevengadoPage'
import { FacturasPage } from './features/facturas/FacturasPage'
import { FacturaDetallePage } from './features/facturas/FacturaDetallePage'
import { ImportPage } from './features/admin/import/ImportPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/acceso-denegado" element={<AccessDeniedPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <ClientesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes/:id"
            element={
              <ProtectedRoute>
                <ClienteDetallePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cotizaciones"
            element={
              <ProtectedRoute>
                <CotizacionesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cotizaciones/:id"
            element={
              <ProtectedRoute>
                <CotizacionDetallePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/devengado"
            element={
              <ProtectedRoute>
                <DevengadoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas"
            element={
              <ProtectedRoute>
                <FacturasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas/:folio"
            element={
              <ProtectedRoute>
                <FacturaDetallePage />
              </ProtectedRoute>
            }
          />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
