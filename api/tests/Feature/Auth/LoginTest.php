<?php

declare(strict_types=1);

use Tests\Support\AuthTestCase;

/**
 * Login: doble barrera (credenciales + whitelist). Caso QA 5 y ADR-003 §4.
 *
 * @internal
 */
final class LoginTest extends AuthTestCase
{
    public function testLoginWhitelistedDevuelveTokenYRoles(): void
    {
        $response = $this->withBodyFormat('json')->post('api/v1/auth/login', [
            'correo' => 'eric@bestqualitysolutions.com',
            'password' => $this->devPassword(),
        ]);

        $response->assertStatus(200);
        $body = $this->jsonBody($response);

        $this->assertNotEmpty($body['data']['access_token']);
        $this->assertSame('Bearer', $body['data']['token_type']);
        $this->assertSame(['direccion'], $body['data']['usuario']['roles']);
    }

    public function testCredencialesIncorrectasDevuelve401(): void
    {
        $response = $this->withBodyFormat('json')->post('api/v1/auth/login', [
            'correo' => 'eric@bestqualitysolutions.com',
            'password' => 'password-incorrecta',
        ]);

        $response->assertStatus(401);
        $this->assertSame('BAD_CREDENTIALS', $this->jsonBody($response)['error']['code']);
    }

    public function testIntrusoFueraDeWhitelistDevuelve403(): void
    {
        // Caso QA 5: credenciales validas en Shield pero correo NO autorizado.
        $response = $this->withBodyFormat('json')->post('api/v1/auth/login', [
            'correo' => 'intruso@competidor.com',
            'password' => $this->devPassword(),
        ]);

        $response->assertStatus(403);
        $this->assertSame('NOT_WHITELISTED', $this->jsonBody($response)['error']['code']);
    }

    public function testCuerpoIncompletoDevuelve400(): void
    {
        $response = $this->withBodyFormat('json')->post('api/v1/auth/login', [
            'correo' => 'eric@bestqualitysolutions.com',
        ]);

        $response->assertStatus(400);
    }
}
