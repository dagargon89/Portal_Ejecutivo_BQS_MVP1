<?php

declare(strict_types=1);

use App\Models\BitacoraModel;
use App\Models\ClienteModel;
use App\Models\CotizacionModel;
use App\Models\FacturaModel;
use Tests\Support\AuthTestCase;

/**
 * Emision de facturas: transaccion ACID, marcado de devengado, rollback y
 * transiciones ilegales (RF-FAC-01, SRS §4).
 *
 * @internal
 */
final class FacturaEmisionTest extends AuthTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        model(ClienteModel::class)->insert(['ID_Cliente' => 'CLI-001', 'Nombre_Fiscal' => 'NIDEC', 'Estatus' => 'Activo']);
        model(ClienteModel::class)->insert(['ID_Cliente' => 'CLI-002', 'Nombre_Fiscal' => 'Bocar', 'Estatus' => 'Activo']);
        model(CotizacionModel::class)->insert(['ID_Cotizacion' => 'COT-0001', 'ID_Cliente' => 'CLI-001', 'Monto_Autorizado' => '100000.00', 'Estatus' => 'Aprobada']);
        $this->captura('BIT-0001', '40000.00');
        $this->captura('BIT-0002', '30000.00');
    }

    private function captura(string $id, string $monto, string $estatus = 'Pendiente'): void
    {
        model(BitacoraModel::class)->insert([
            'ID_Captura' => $id,
            'Fecha' => '2026-06-10',
            'ID_Cotizacion' => 'COT-0001',
            'Horas_Trabajadas' => '10.00',
            'Piezas_Sorteadas' => 100,
            'Monto_Devengado' => $monto,
            'Estatus_Facturacion' => $estatus,
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function factura(string $folio = 'F-9001'): array
    {
        return [
            'Folio_Factura' => $folio,
            'ID_Cliente' => 'CLI-001',
            'Fecha_Emision' => '2026-06-15',
            'Fecha_Vencimiento' => '2026-07-15',
            'Monto_Subtotal' => '60344.83',
            'Monto_Total' => '70000.00',
            'capturas' => ['BIT-0001', 'BIT-0002'],
        ];
    }

    public function testFacturacionEmiteFacturaYMarcaDevengado(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/facturas', $token, $this->factura());

        $this->assertHttp($resp, 201);
        $data = $this->jsonBody($resp)['data'];
        $this->assertSame('Vigente', $data['Estatus_Pago']);
        $this->assertSame('70000.00', $data['saldo']);

        $bit = model(BitacoraModel::class);
        $cap1 = $bit->find('BIT-0001');
        $cap2 = $bit->find('BIT-0002');
        $this->assertNotNull($cap1);
        $this->assertNotNull($cap2);
        $this->assertSame('Facturado', $cap1['Estatus_Facturacion']);
        $this->assertSame('Facturado', $cap2['Estatus_Facturacion']);
    }

    public function testRollbackEnFolioDuplicadoNoMarcaDevengado(): void
    {
        // Pre-existe una factura del CLI-002 con el folio que vamos a reutilizar.
        model(FacturaModel::class)->insert([
            'Folio_Factura' => 'F-DUP',
            'ID_Cliente' => 'CLI-002',
            'Fecha_Emision' => '2026-06-01',
            'Monto_Subtotal' => '100.00',
            'Monto_Total' => '116.00',
            'Fecha_Vencimiento' => '2026-07-01',
            'Estatus_Pago' => 'Vigente',
        ]);

        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/facturas', $token, $this->factura('F-DUP'));

        $this->assertHttp($resp, 409);

        // Rollback: las capturas siguen Pendiente (el marcado se revirtio).
        $bit = model(BitacoraModel::class);
        $cap1 = $bit->find('BIT-0001');
        $cap2 = $bit->find('BIT-0002');
        $this->assertNotNull($cap1);
        $this->assertNotNull($cap2);
        $this->assertSame('Pendiente', $cap1['Estatus_Facturacion']);
        $this->assertSame('Pendiente', $cap2['Estatus_Facturacion']);

        // La factura F-DUP sigue siendo la original del CLI-002 (no se sobreescribio).
        $fac = model(FacturaModel::class)->find('F-DUP');
        $this->assertNotNull($fac);
        $this->assertSame('CLI-002', $fac['ID_Cliente']);
    }

    public function testCapturaYaFacturadaDevuelve409(): void
    {
        $this->captura('BIT-0003', '5000.00', 'Facturado');
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $datos = $this->factura('F-9002');
        $datos['capturas'] = ['BIT-0003'];

        $resp = $this->postAuth('api/v1/facturas', $token, $datos);
        $this->assertHttp($resp, 409);
        $this->assertSame('ILLEGAL_TRANSITION', $this->jsonBody($resp)['error']['code']);
    }

    public function testCapturaDeOtroClienteDevuelve422(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $datos = $this->factura('F-9003');
        $datos['ID_Cliente'] = 'CLI-002'; // capturas son de COT-0001 (CLI-001)

        $this->postAuth('api/v1/facturas', $token, $datos)->assertStatus(422);
    }

    public function testCapturistaNoPuedeEmitir403(): void
    {
        $token = $this->loginToken('capturista@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/facturas', $token, $this->factura());

        $this->assertHttp($resp, 403);
        $this->assertSame('FORBIDDEN', $this->jsonBody($resp)['error']['code']);
    }

    public function testDireccionNoPuedeEmitir403ReadOnly(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/facturas', $token, $this->factura());

        $this->assertHttp($resp, 403);
        $this->assertSame('READ_ONLY', $this->jsonBody($resp)['error']['code']);
    }
}
