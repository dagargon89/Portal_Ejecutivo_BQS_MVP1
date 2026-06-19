<?php

declare(strict_types=1);

use CodeIgniter\Shield\Models\UserModel;
use Tests\Support\AuthTestCase;

/**
 * Refresh token: endpoint sin cookie y logica del RefreshTokenService.
 * (El roundtrip completo de la cookie HttpOnly se valida ademas por curl/e2e.)
 *
 * @internal
 */
final class RefreshTest extends AuthTestCase
{
    public function testRefreshSinCookieDevuelve401(): void
    {
        $response = $this->withBodyFormat('json')->post('api/v1/auth/refresh');

        $response->assertStatus(401);
        $this->assertSame('TOKEN_INVALID', $this->jsonBody($response)['error']['code']);
    }

    public function testServicioEmiteYValidaRefreshToken(): void
    {
        $user = model(UserModel::class)->findByCredentials(['email' => 'eric@bestqualitysolutions.com']);
        $this->assertNotNull($user);

        $service = service('refreshTokenService');
        $raw = $service->issue((int) $user->id, 3600);

        $this->assertSame((int) $user->id, $service->userIdFromRaw($raw));

        // Tras revocar, el mismo token ya no valida.
        $service->revokeAllForUser((int) $user->id);
        $this->assertNull($service->userIdFromRaw($raw));
    }
}
