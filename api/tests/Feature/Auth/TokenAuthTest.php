<?php

declare(strict_types=1);

use CodeIgniter\I18n\Time;
use CodeIgniter\Shield\Models\UserIdentityModel;
use Tests\Support\AuthTestCase;

/**
 * Filtro de token + whitelist sobre rutas protegidas (ADR-003 §4).
 *
 * @internal
 */
final class TokenAuthTest extends AuthTestCase
{
    public function testMeConTokenValidoDevuelvePerfil(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $this->assertNotSame('', $token, 'El login deberia devolver un access token.');

        $response = $this->getAuth('api/v1/auth/me', $token);
        $this->assertHttp($response, 200);
        $body = $this->jsonBody($response);

        $this->assertSame('eric@bestqualitysolutions.com', $body['data']['correo']);
        $this->assertTrue($body['data']['solo_lectura']);
    }

    public function testSinTokenDevuelve401(): void
    {
        $this->get('api/v1/auth/me')->assertStatus(401);
    }

    public function testTokenInvalidoDevuelve401(): void
    {
        $this->getAuth('api/v1/auth/me', 'token-corrupto-xxx')->assertStatus(401);
    }

    public function testTokenExpiradoDevuelve401(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');

        // Forzar la expiracion del access token (ventana de 15 min, D1-A).
        model(UserIdentityModel::class)
            ->where('type', 'access_token')
            ->set('expires', Time::now()->subMinutes(30)->toDateTimeString())
            ->update();

        $this->getAuth('api/v1/auth/me', $token)->assertStatus(401);
    }
}
