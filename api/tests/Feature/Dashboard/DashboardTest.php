<?php

declare(strict_types=1);

use App\Models\BitacoraModel;
use App\Models\ClienteModel;
use App\Models\CotizacionModel;
use App\Models\FacturaModel;
use App\Models\PagoModel;
use Tests\Support\AuthTestCase;

/**
 * Dashboard — las 3 preguntas (RF-DASH-01/02/03/04, RF-MET-02). Casos QA 2, 3 y
 * 4 reflejados en P1/P2/P3, desgloses y RBAC. Las cifras se calculan en
 * servidor; el cliente no puede manipularlas.
 *
 * @internal
 */
final class DashboardTest extends AuthTestCase
{
    private string $emisionEsteMes;
    private string $vencimientoEsteMes;
    private string $emisionMesPrevio;
    private string $vencimientoMesPrevio;

    protected function setUp(): void
    {
        parent::setUp();

        $hoy = new DateTimeImmutable();
        $previo = $hoy->modify('first day of last month');
        $this->emisionEsteMes = $hoy->format('Y-m') . '-15';
        $this->vencimientoEsteMes = $hoy->format('Y-m') . '-28';
        $this->emisionMesPrevio = $previo->format('Y-m') . '-15';
        $this->vencimientoMesPrevio = $previo->format('Y-m') . '-28';

        model(ClienteModel::class)->insert(['ID_Cliente' => 'CLI-001', 'Nombre_Fiscal' => 'NIDEC Mobility', 'Nombre_Comercial' => 'NIDEC', 'Estatus' => 'Activo']);
        model(ClienteModel::class)->insert(['ID_Cliente' => 'CLI-002', 'Nombre_Fiscal' => 'Bocar Group', 'Nombre_Comercial' => 'Bocar', 'Estatus' => 'Activo']);
        model(CotizacionModel::class)->insert(['ID_Cotizacion' => 'COT-0001', 'ID_Cliente' => 'CLI-001', 'PO_Referencia' => 'PO-1', 'Monto_Autorizado' => '250000.00', 'Estatus' => 'Aprobada']);
        model(CotizacionModel::class)->insert(['ID_Cotizacion' => 'COT-0002', 'ID_Cliente' => 'CLI-002', 'PO_Referencia' => 'PO-2', 'Monto_Autorizado' => '100000.00', 'Estatus' => 'Aprobada']);
    }

    private function factura(string $folio, string $total, string $emision, string $vencimiento, string $estatus, string $cliente = 'CLI-001'): void
    {
        model(FacturaModel::class)->insert([
            'Folio_Factura' => $folio,
            'ID_Cliente' => $cliente,
            'Fecha_Emision' => $emision,
            'Monto_Subtotal' => $total,
            'Monto_Total' => $total,
            'Fecha_Vencimiento' => $vencimiento,
            'Estatus_Pago' => $estatus,
        ]);
    }

    private function devengado(string $id, string $cotizacion, string $monto, string $estatus): void
    {
        model(BitacoraModel::class)->insert([
            'ID_Captura' => $id,
            'Fecha' => $this->emisionEsteMes,
            'ID_Cotizacion' => $cotizacion,
            'Horas_Trabajadas' => '8.00',
            'Monto_Devengado' => $monto,
            'Estatus_Facturacion' => $estatus,
        ]);
    }

    private function pago(string $id, string $folio, string $monto): void
    {
        model(PagoModel::class)->insert(['ID_Pago' => $id, 'Folio_Factura' => $folio, 'Fecha_Pago' => $this->emisionEsteMes, 'Monto_Pagado' => $monto, 'Referencia' => 'SPEI']);
    }

    // ---- P1: facturado del mes (Caso QA 2) -------------------------------

    public function testResumenFacturadoDelMesExcluyeMesPrevioYVencida(): void
    {
        // $100,000 este mes (Vigente) + $50,000 mes previo (Vigente, excluido)
        // + $7,000 este mes pero Vencida (no cuenta para P1: solo Pagada/Vigente).
        $this->factura('F-MES', '100000.00', $this->emisionEsteMes, $this->vencimientoEsteMes, 'Vigente');
        $this->factura('F-PREV', '50000.00', $this->emisionMesPrevio, $this->vencimientoMesPrevio, 'Vigente');
        $this->factura('F-VEN', '7000.00', $this->emisionEsteMes, $this->vencimientoEsteMes, 'Vencida');

        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->getAuth('api/v1/dashboard/resumen', $token);

        $this->assertHttp($resp, 200);
        $this->assertSame('100000.00', $this->jsonBody($resp)['data']['facturado_mes']);
    }

    // ---- P2: por facturar (Caso QA 3) ------------------------------------

    public function testResumenPorFacturarSoloCuentaDevengadoPendiente(): void
    {
        $this->devengado('BIT-0001', 'COT-0001', '10000.00', 'Pendiente');
        $this->devengado('BIT-0002', 'COT-0001', '5000.00', 'Facturado'); // no suma

        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->getAuth('api/v1/dashboard/resumen', $token);

        $this->assertHttp($resp, 200);
        $this->assertSame('10000.00', $this->jsonBody($resp)['data']['por_facturar']);
    }

    // ---- P3: por cobrar (Caso QA 4) --------------------------------------

    public function testResumenPorCobrarEsNetoDeAbonosYExcluyePagada(): void
    {
        // F-9901 $50,000 Vigente con abono $20,000 => saldo $30,000.
        $this->factura('F-9901', '50000.00', $this->emisionEsteMes, $this->vencimientoEsteMes, 'Vigente');
        $this->pago('PAG-0001', 'F-9901', '20000.00');
        // Una factura Pagada no aporta al por cobrar.
        $this->factura('F-PAID', '30000.00', $this->emisionEsteMes, $this->vencimientoEsteMes, 'Pagada');
        $this->pago('PAG-0002', 'F-PAID', '30000.00');

        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->getAuth('api/v1/dashboard/resumen', $token);

        $this->assertHttp($resp, 200);
        $this->assertSame('30000.00', $this->jsonBody($resp)['data']['por_cobrar']);
    }

    // ---- Desglose P2 por cotizacion (TC-DASH-06) -------------------------

    public function testPorFacturarDesglosaPorCotizacion(): void
    {
        $this->devengado('BIT-0001', 'COT-0001', '10000.00', 'Pendiente');
        $this->devengado('BIT-0002', 'COT-0002', '4000.00', 'Pendiente');

        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->getAuth('api/v1/dashboard/por-facturar', $token);

        $this->assertHttp($resp, 200);
        $data = $this->jsonBody($resp)['data'];
        $this->assertSame('14000.00', $data['total_por_facturar']);

        $porCotizacion = [];
        foreach ($data['desglose'] as $fila) {
            $porCotizacion[$fila['ID_Cotizacion']] = $fila;
        }
        $this->assertArrayHasKey('COT-0001', $porCotizacion);
        $this->assertArrayHasKey('COT-0002', $porCotizacion);
        $this->assertSame('10000.00', $porCotizacion['COT-0001']['monto_devengado_pendiente']);
        $this->assertSame('4000.00', $porCotizacion['COT-0002']['monto_devengado_pendiente']);
    }

    // ---- Desglose P3 por cliente; global = suma por cliente (RF-MET-02) --

    public function testPorCobrarGlobalEsSumaDeSaldosPorCliente(): void
    {
        $this->factura('F-9901', '50000.00', $this->emisionEsteMes, $this->vencimientoEsteMes, 'Vigente', 'CLI-001');
        $this->pago('PAG-0001', 'F-9901', '20000.00'); // saldo 30,000
        $this->factura('F-2', '10000.00', $this->emisionEsteMes, $this->vencimientoEsteMes, 'Vencida', 'CLI-002'); // saldo 10,000

        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->getAuth('api/v1/dashboard/por-cobrar', $token);

        $this->assertHttp($resp, 200);
        $data = $this->jsonBody($resp)['data'];
        $this->assertSame('40000.00', $data['total_por_cobrar']);

        $suma = 0.0;
        foreach ($data['clientes'] as $cliente) {
            $suma += (float) $cliente['saldo_cliente'];
        }
        $this->assertSame(40000.00, $suma);
    }

    // ---- RF-DASH-04: el cliente no puede manipular las cifras ------------

    public function testResumenIgnoraValoresEnviadosPorElCliente(): void
    {
        $this->factura('F-MES', '100000.00', $this->emisionEsteMes, $this->vencimientoEsteMes, 'Vigente');

        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->getAuth('api/v1/dashboard/resumen?facturado_mes=999999&por_cobrar=0&por_facturar=123', $token);

        // El servidor IGNORA los valores del query y calcula los reales:
        // facturado_mes=100,000 (no 999999), por_facturar=0 (no 123),
        // por_cobrar=100,000 (la factura Vigente sin abonos; no 0).
        $this->assertHttp($resp, 200);
        $data = $this->jsonBody($resp)['data'];
        $this->assertSame('100000.00', $data['facturado_mes']);
        $this->assertSame('0.00', $data['por_facturar']);
        $this->assertSame('100000.00', $data['por_cobrar']);
    }

    // ---- RBAC -------------------------------------------------------------

    public function testRolesAutorizadosLeenElDashboard(): void
    {
        foreach (['eric@bestqualitysolutions.com', 'facturacion@bestqualitysolutions.com', 'admin@bestqualitysolutions.com'] as $correo) {
            $token = $this->loginToken($correo);
            $this->assertHttp($this->getAuth('api/v1/dashboard/resumen', $token), 200);
        }
    }

    public function testCapturistaNoLeeElDashboard403(): void
    {
        $token = $this->loginToken('capturista@bestqualitysolutions.com');
        $resp = $this->getAuth('api/v1/dashboard/resumen', $token);

        $this->assertHttp($resp, 403);
        $this->assertSame('FORBIDDEN', $this->jsonBody($resp)['error']['code']);
    }

    public function testSinTokenDevuelve401(): void
    {
        $this->get('api/v1/dashboard/resumen')->assertStatus(401);
    }
}
