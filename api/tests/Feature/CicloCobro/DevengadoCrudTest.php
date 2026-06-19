<?php

declare(strict_types=1);

use App\Models\ClienteModel;
use App\Models\CotizacionModel;
use Tests\Support\AuthTestCase;

/**
 * Captura de devengado + RBAC + validacion numerica estricta (RF-DEV-01/02).
 *
 * @internal
 */
final class DevengadoCrudTest extends AuthTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        model(ClienteModel::class)->insert([
            'ID_Cliente' => 'CLI-001',
            'Nombre_Fiscal' => 'NIDEC Mobility Mexico S.A. de C.V.',
            'Estatus' => 'Activo',
        ]);
        model(CotizacionModel::class)->insert([
            'ID_Cotizacion' => 'COT-0001',
            'ID_Cliente' => 'CLI-001',
            'Monto_Autorizado' => '100000.00',
            'Estatus' => 'Aprobada',
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function devengado(string $id = 'BIT-9001'): array
    {
        return [
            'ID_Captura' => $id,
            'Fecha' => '2026-06-15',
            'Horas_Trabajadas' => '40.00',
            'Piezas_Sorteadas' => 2000,
            'Monto_Devengado' => '10000.00',
        ];
    }

    public function testCapturistaRegistraDevengadoPendiente(): void
    {
        $token = $this->loginToken('capturista@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/cotizaciones/COT-0001/devengado', $token, $this->devengado());

        $this->assertHttp($resp, 201);
        $this->assertSame('Pendiente', $this->jsonBody($resp)['data']['Estatus_Facturacion']);
    }

    public function testMontoNegativoDevuelve422(): void
    {
        $token = $this->loginToken('capturista@bestqualitysolutions.com');
        $datos = $this->devengado();
        $datos['Monto_Devengado'] = '-5';

        $resp = $this->postAuth('api/v1/cotizaciones/COT-0001/devengado', $token, $datos);
        $this->assertHttp($resp, 422);
        $this->assertSame('VALIDATION', $this->jsonBody($resp)['error']['code']);
    }

    public function testMontoNoNumericoDevuelve422(): void
    {
        $token = $this->loginToken('capturista@bestqualitysolutions.com');
        $datos = $this->devengado();
        $datos['Monto_Devengado'] = 'N/A';

        $this->postAuth('api/v1/cotizaciones/COT-0001/devengado', $token, $datos)->assertStatus(422);
    }

    public function testCotizacionInexistenteDevuelve404(): void
    {
        $token = $this->loginToken('capturista@bestqualitysolutions.com');
        $this->postAuth('api/v1/cotizaciones/COT-9999/devengado', $token, $this->devengado())->assertStatus(404);
    }

    public function testFacturacionNoPuedeCrear403(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/cotizaciones/COT-0001/devengado', $token, $this->devengado());

        $this->assertHttp($resp, 403);
        $this->assertSame('FORBIDDEN', $this->jsonBody($resp)['error']['code']);
    }

    public function testDireccionNoPuedeCrear403ReadOnly(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/cotizaciones/COT-0001/devengado', $token, $this->devengado());

        $this->assertHttp($resp, 403);
        $this->assertSame('READ_ONLY', $this->jsonBody($resp)['error']['code']);
    }

    public function testListaPorCotizacion(): void
    {
        $token = $this->loginToken('capturista@bestqualitysolutions.com');
        $this->postAuth('api/v1/cotizaciones/COT-0001/devengado', $token, $this->devengado())->assertStatus(201);

        $resp = $this->getAuth('api/v1/cotizaciones/COT-0001/devengado', $token);
        $resp->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $this->jsonBody($resp)['meta']['total']);
    }
}
