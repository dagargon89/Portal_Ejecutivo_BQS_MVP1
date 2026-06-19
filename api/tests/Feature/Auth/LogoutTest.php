<?php

declare(strict_types=1);

use Tests\Support\AuthTestCase;

/**
 * Logout: revoca el access token activo (RF-AUTH-03).
 *
 * @internal
 */
final class LogoutTest extends AuthTestCase
{
    public function testLogoutRevocaElAccessToken(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $this->assertNotSame('', $token, 'El login deberia devolver un access token.');

        // Antes del logout el token funciona.
        $this->getAuth('api/v1/auth/me', $token)->assertStatus(200);

        // Logout (permitido tambien para direccion: no pasa por readonly).
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->post('api/v1/auth/logout')
            ->assertStatus(200);

        // Tras el logout el mismo token queda revocado.
        $this->getAuth('api/v1/auth/me', $token)->assertStatus(401);
    }
}
