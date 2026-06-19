<?php

declare(strict_types=1);

use App\Models\ClienteModel;
use Tests\Support\AuthTestCase;

/**
 * CRUD de clientes + RBAC + baja logica (RF-CLI-01/02).
 *
 * @internal
 */
final class ClientesCrudTest extends AuthTestCase
{
    private const NUEVO = [
        'ID_Cliente' => 'CLI-100',
        'Nombre_Fiscal' => 'Bocar Group S.A. de C.V.',
        'Nombre_Comercial' => 'Bocar',
        'RFC' => 'BGR990817AB2',
        'Estatus' => 'Activo',
    ];

    public function testAdminCreaCliente(): void
    {
        $token = $this->loginToken('admin@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/clientes', $token, self::NUEVO);

        $this->assertHttp($resp, 201);
        $this->assertSame('CLI-100', $this->jsonBody($resp)['data']['ID_Cliente']);
    }

    public function testIdDuplicadoDevuelve409(): void
    {
        $token = $this->loginToken('admin@bestqualitysolutions.com');
        $this->postAuth('api/v1/clientes', $token, self::NUEVO)->assertStatus(201);
        $this->postAuth('api/v1/clientes', $token, self::NUEVO)->assertStatus(409);
    }

    public function testRfcInvalidoDevuelve422(): void
    {
        $token = $this->loginToken('admin@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/clientes', $token, ['ID_Cliente' => 'CLI-101', 'Nombre_Fiscal' => 'X', 'RFC' => 'CORTO']);

        $this->assertHttp($resp, 422);
        $this->assertSame('VALIDATION', $this->jsonBody($resp)['error']['code']);
    }

    public function testFacturacionNoPuedeCrear403(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/clientes', $token, self::NUEVO);

        $this->assertHttp($resp, 403);
        $this->assertSame('FORBIDDEN', $this->jsonBody($resp)['error']['code']);
    }

    public function testDireccionNoPuedeCrear403ReadOnly(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/clientes', $token, self::NUEVO);

        $this->assertHttp($resp, 403);
        $this->assertSame('READ_ONLY', $this->jsonBody($resp)['error']['code']);
    }

    public function testBajaLogicaMarcaInactivo(): void
    {
        $token = $this->loginToken('admin@bestqualitysolutions.com');
        $this->postAuth('api/v1/clientes', $token, self::NUEVO)->assertStatus(201);

        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->delete('api/v1/clientes/CLI-100')
            ->assertStatus(200);

        $cliente = model(ClienteModel::class)->find('CLI-100');
        $this->assertNotNull($cliente);
        $this->assertSame('Inactivo', $cliente['Estatus']);
    }

    public function testBusquedaPorTexto(): void
    {
        $token = $this->loginToken('admin@bestqualitysolutions.com');
        $this->postAuth('api/v1/clientes', $token, self::NUEVO)->assertStatus(201);

        $resp = $this->getAuth('api/v1/clientes?q=Bocar', $token);
        $resp->assertStatus(200);
        $body = $this->jsonBody($resp);
        $this->assertGreaterThanOrEqual(1, $body['meta']['total']);
    }
}
