<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Database\Seeds\InitialSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;
use CodeIgniter\Test\TestResponse;

/**
 * Base para las pruebas de autenticacion/RBAC.
 *
 * Migra TODOS los namespaces (App + Shield + Settings) contra la BD de
 * pruebas y siembra el InitialSeeder, que en entorno != produccion crea los
 * usuarios dev por rol y el "intruso" fuera de whitelist (Caso QA 5).
 */
abstract class AuthTestCase extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $namespace = null;            // migra App + Shield + Settings
    protected $refresh = true;            // BD limpia por test
    protected $seed = InitialSeeder::class;

    protected function setUp(): void
    {
        parent::setUp();
        cache()->clean(); // resetea el throttler entre pruebas (evita 429)
    }

    protected function devPassword(): string
    {
        $pwd = env('bqs.seed.ericPassword');

        return is_string($pwd) && $pwd !== '' ? $pwd : 'Bqs.Dev.2026!';
    }

    /**
     * @return array<string,mixed>
     */
    protected function jsonBody(TestResponse $response): array
    {
        $decoded = json_decode((string) $response->getJSON(), true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Hace login por el endpoint y devuelve el access token (o '' si falla).
     */
    protected function loginToken(string $correo): string
    {
        $response = $this->withBodyFormat('json')->post('api/v1/auth/login', [
            'correo' => $correo,
            'password' => $this->devPassword(),
        ]);

        $body = $this->jsonBody($response);

        return isset($body['data']['access_token']) ? (string) $body['data']['access_token'] : '';
    }

    /**
     * Asercion de estado HTTP que incluye el cuerpo en el mensaje de fallo
     * (facilita el diagnostico cuando la respuesta no es la esperada).
     */
    protected function assertHttp(TestResponse $response, int $expected): void
    {
        $actual = $response->response()->getStatusCode();
        $this->assertSame($expected, $actual, 'Cuerpo de la respuesta: ' . (string) $response->getJSON());
    }

    protected function getAuth(string $uri, string $token): TestResponse
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . $token])->get($uri);
    }

    /**
     * @param array<string,mixed> $data
     */
    protected function postAuth(string $uri, string $token, array $data): TestResponse
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->withBodyFormat('json')
            ->post($uri, $data);
    }
}
