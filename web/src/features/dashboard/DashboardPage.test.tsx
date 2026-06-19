import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { obtenerPorFacturar, obtenerResumen } from '../../lib/dashboard'

// Se mockea la capa de datos: la prueba verifica que el cliente MUESTRA lo que
// el servidor calculó y NO recalcula (RF-DASH-04). Nunca golpea el backend.
vi.mock('../../lib/dashboard', () => ({
  obtenerResumen: vi.fn(),
  obtenerPorFacturar: vi.fn(),
  obtenerPorCobrar: vi.fn(),
}))

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(obtenerResumen).mockResolvedValue({
      periodo: '2026-06',
      moneda: 'MXN',
      facturado_mes: '100000.00',
      por_facturar: '10000.00',
      por_cobrar: '30000.00',
      calculado_en: '2026-06-18T14:32:05-06:00',
    })
    vi.mocked(obtenerPorFacturar).mockResolvedValue({
      total_por_facturar: '10000.00',
      moneda: 'MXN',
      desglose: [],
    })
  })

  it('muestra las 3 cifras calculadas por el servidor', async () => {
    renderDashboard()

    // Pregunta 1, 2 y 3 — exactamente las cifras de los Casos QA 2, 3 y 4.
    expect(await screen.findByText('$100,000.00')).toBeInTheDocument()
    expect(screen.getByText('$10,000.00')).toBeInTheDocument()
    expect(screen.getByText('$30,000.00')).toBeInTheDocument()

    // Las tres preguntas se rotulan como etiquetas de KPI.
    expect(screen.getByText('¿Qué ya se facturó?')).toBeInTheDocument()
    expect(screen.getByText('¿Qué falta por facturar?')).toBeInTheDocument()
    expect(screen.getByText('¿Cuánto te deben?')).toBeInTheDocument()
  })

  it('muestra el desglose por cotización de la Pregunta 2', async () => {
    vi.mocked(obtenerPorFacturar).mockResolvedValue({
      total_por_facturar: '14000.00',
      moneda: 'MXN',
      desglose: [
        {
          ID_Cotizacion: 'COT-0042',
          ID_Cliente: 'CLI-001',
          Nombre_Comercial: 'NIDEC',
          PO_Referencia: 'PO-1',
          Monto_Autorizado: '250000.00',
          monto_devengado_pendiente: '10000.00',
          capturas: 1,
        },
      ],
    })

    renderDashboard()

    expect(await screen.findByText('COT-0042')).toBeInTheDocument()
    expect(screen.getByText('NIDEC')).toBeInTheDocument()
  })
})
