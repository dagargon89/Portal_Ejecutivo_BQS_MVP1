<?php

declare(strict_types=1);

use App\Models\ClienteModel;
use App\Models\FacturaModel;
use Tests\Support\AuthTestCase;

/**
 * Registro de pagos: Caso QA 4 (saldo), transicion a Pagada, sobrepago e
 * inmutabilidad (RF-PAG-01/02, RF-FAC-03, SRS §4).
 *
 * @internal
 */
final class PagoRegistroTest extends AuthTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        model(ClienteModel::class)->insert(['ID_Cliente' => 'CLI-001', 'Nombre_Fiscal' => 'NIDEC', 'Estatus' => 'Activo']);
        model(FacturaModel::class)->insert([
            'Folio_Factura' => 'F-9901',
            'ID_Cliente' => 'CLI-001',
            'Fecha_Emision' => '2026-06-01',
            'Monto_Subtotal' => '43103.45',
            'Monto_Total' => '50000.00',
            'Fecha_Vencimiento' => '2026-07-01',
            'Estatus_Pago' => 'Vigente',
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function pago(string $id, string $monto): array
    {
        return ['ID_Pago' => $id, 'Fecha_Pago' => '2026-06-10', 'Monto_Pagado' => $monto, 'Referencia' => 'SPEI'];
    }

    public function testPagoParcialDejaSaldoYFacturaVigente(): void
    {
        // Caso QA 4: F-9901 $50,000 + abono $20,000 => saldo $30,000.
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/facturas/F-9901/pagos', $token, $this->pago('PAG-9001', '20000.00'));

        $this->assertHttp($resp, 201);
        $factura = $this->jsonBody($resp)['data']['factura'];
        $this->assertSame('30000.00', $factura['saldo']);
        $this->assertSame('Vigente', $factura['Estatus_Pago']);
    }

    public function testPagoTotalMarcaPagada(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $this->postAuth('api/v1/facturas/F-9901/pagos', $token, $this->pago('PAG-9001', '20000.00'))->assertStatus(201);
        $resp = $this->postAuth('api/v1/facturas/F-9901/pagos', $token, $this->pago('PAG-9002', '30000.00'));

        $this->assertHttp($resp, 201);
        $factura = $this->jsonBody($resp)['data']['factura'];
        $this->assertSame('0.00', $factura['saldo']);
        $this->assertSame('Pagada', $factura['Estatus_Pago']);
    }

    public function testSobrepagoDevuelve422Overpayment(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/facturas/F-9901/pagos', $token, $this->pago('PAG-9003', '50001.00'));

        $this->assertHttp($resp, 422);
        $this->assertSame('OVERPAYMENT', $this->jsonBody($resp)['error']['code']);
    }

    public function testPagoSobreFacturaPagadaDevuelve409(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $this->postAuth('api/v1/facturas/F-9901/pagos', $token, $this->pago('PAG-9001', '50000.00'))->assertStatus(201);

        $resp = $this->postAuth('api/v1/facturas/F-9901/pagos', $token, $this->pago('PAG-9004', '100.00'));
        $this->assertHttp($resp, 409);
        $this->assertSame('ILLEGAL_TRANSITION', $this->jsonBody($resp)['error']['code']);
    }

    public function testMontoNoPositivoDevuelve422(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $this->postAuth('api/v1/facturas/F-9901/pagos', $token, $this->pago('PAG-9005', '0'))->assertStatus(422);
    }

    public function testFacturaInexistenteDevuelve404(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $this->postAuth('api/v1/facturas/F-0000/pagos', $token, $this->pago('PAG-9006', '100.00'))->assertStatus(404);
    }

    public function testCapturistaNoPuedePagar403(): void
    {
        $token = $this->loginToken('capturista@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/facturas/F-9901/pagos', $token, $this->pago('PAG-9007', '100.00'));

        $this->assertHttp($resp, 403);
        $this->assertSame('FORBIDDEN', $this->jsonBody($resp)['error']['code']);
    }

    public function testDireccionNoPuedePagar403ReadOnly(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/facturas/F-9901/pagos', $token, $this->pago('PAG-9008', '100.00'));

        $this->assertHttp($resp, 403);
        $this->assertSame('READ_ONLY', $this->jsonBody($resp)['error']['code']);
    }
}
