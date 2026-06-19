<?php

declare(strict_types=1);

use App\Models\ClienteModel;
use Tests\Support\AuthTestCase;

/**
 * CRUD de cotizaciones + RBAC + consumo (RF-COT-01/02).
 *
 * @internal
 */
final class CotizacionesCrudTest extends AuthTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        model(ClienteModel::class)->insert([
            'ID_Cliente' => 'CLI-001',
            'Nombre_Fiscal' => 'NIDEC Mobility Mexico S.A. de C.V.',
            'Estatus' => 'Activo',
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function cotizacion(string $id = 'COT-0500'): array
    {
        return [
            'ID_Cotizacion' => $id,
            'ID_Cliente' => 'CLI-001',
            'PO_Referencia' => 'PO-1',
            'Monto_Autorizado' => '180000.00',
            'Piezas_Autorizadas' => 9000,
            'Estatus' => 'Aprobada',
        ];
    }

    public function testFacturacionCreaCotizacion(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/cotizaciones', $token, $this->cotizacion());

        $this->assertHttp($resp, 201);
        $this->assertSame('COT-0500', $this->jsonBody($resp)['data']['ID_Cotizacion']);
    }

    public function testClienteInexistenteDevuelve404(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $datos = $this->cotizacion();
        $datos['ID_Cliente'] = 'CLI-999';

        $this->postAuth('api/v1/cotizaciones', $token, $datos)->assertStatus(404);
    }

    public function testMontoNegativoDevuelve422(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $datos = $this->cotizacion();
        $datos['Monto_Autorizado'] = '-1';

        $resp = $this->postAuth('api/v1/cotizaciones', $token, $datos);
        $this->assertHttp($resp, 422);
        $this->assertSame('VALIDATION', $this->jsonBody($resp)['error']['code']);
    }

    public function testCapturistaNoPuedeCrear403(): void
    {
        $token = $this->loginToken('capturista@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/cotizaciones', $token, $this->cotizacion());

        $this->assertHttp($resp, 403);
        $this->assertSame('FORBIDDEN', $this->jsonBody($resp)['error']['code']);
    }

    public function testDetalleExponeConsumo(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $this->postAuth('api/v1/cotizaciones', $token, $this->cotizacion())->assertStatus(201);

        $resp = $this->getAuth('api/v1/cotizaciones/COT-0500', $token);
        $resp->assertStatus(200);
        $consumo = $this->jsonBody($resp)['data']['consumo'];
        $this->assertSame('180000.00', $consumo['disponible']);
        $this->assertSame('0.00', $consumo['devengado_acumulado']);
    }
}
