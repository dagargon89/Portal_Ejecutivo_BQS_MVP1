<?php

declare(strict_types=1);

use Tests\Support\AuthTestCase;

/**
 * CRUD de whitelist + RBAC (RF-CTA-01).
 *
 * @internal
 */
final class WhitelistAdminTest extends AuthTestCase
{
    public function testAdminCreaYLista(): void
    {
        $token = $this->loginToken('admin@bestqualitysolutions.com');

        $this->postAuth('api/v1/admin/whitelist', $token, ['correo' => 'cliente.nuevo@bqs.com'])
            ->assertStatus(201);

        $list = $this->getAuth('api/v1/admin/whitelist', $token);
        $list->assertStatus(200);
        $this->assertArrayHasKey('meta', $this->jsonBody($list));
    }

    public function testAdminRevoca(): void
    {
        $token = $this->loginToken('admin@bestqualitysolutions.com');

        $create = $this->postAuth('api/v1/admin/whitelist', $token, ['correo' => 'baja@bqs.com']);
        $create->assertStatus(201);
        $id = (int) $this->jsonBody($create)['data']['id'];

        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->delete("api/v1/admin/whitelist/{$id}")
            ->assertStatus(204);
    }

    public function testCorreoDuplicadoDevuelve409(): void
    {
        $token = $this->loginToken('admin@bestqualitysolutions.com');

        $this->postAuth('api/v1/admin/whitelist', $token, ['correo' => 'dup@bqs.com'])->assertStatus(201);
        $this->postAuth('api/v1/admin/whitelist', $token, ['correo' => 'dup@bqs.com'])->assertStatus(409);
    }

    public function testFacturacionNoAccedeARutasAdmin(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $response = $this->getAuth('api/v1/admin/whitelist', $token);

        $response->assertStatus(403);
        $this->assertSame('FORBIDDEN', $this->jsonBody($response)['error']['code']);
    }
}
