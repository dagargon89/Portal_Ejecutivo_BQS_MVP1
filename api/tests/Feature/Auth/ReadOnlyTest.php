<?php

declare(strict_types=1);

use App\Models\WhitelistModel;
use Tests\Support\AuthTestCase;

/**
 * ReadOnlyGuard (RF-AUTH-04): `direccion` no puede escribir y la BD no cambia.
 *
 * @internal
 */
final class ReadOnlyTest extends AuthTestCase
{
    public function testDireccionNoEscribeYLaBaseNoSeAltera(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');

        $antes = model(WhitelistModel::class)->countAllResults();
        $response = $this->postAuth('api/v1/admin/whitelist', $token, ['correo' => 'nuevo@bqs.com']);
        $despues = model(WhitelistModel::class)->countAllResults();

        $response->assertStatus(403);
        $this->assertSame('READ_ONLY', $this->jsonBody($response)['error']['code']);
        $this->assertSame($antes, $despues, 'La BD no debe cambiar ante una escritura de direccion.');
    }

    public function testDireccionTampocoPuedeBorrar(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');

        // DELETE es otro metodo no-GET: el candado readonly tambien lo corta.
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->delete('api/v1/admin/whitelist/1');

        $response->assertStatus(403);
        $this->assertSame('READ_ONLY', $this->jsonBody($response)['error']['code']);
    }
}
