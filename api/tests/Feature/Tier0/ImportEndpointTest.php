<?php

declare(strict_types=1);

use App\Services\ColaService;
use Tests\Support\AuthTestCase;

/**
 * Endpoints de importacion: autorizacion (solo admin) y estado del job.
 * El happy-path de subida de archivo se cubre por ImportInicialTest (handler)
 * y por verificacion en vivo (multipart).
 *
 * @internal
 */
final class ImportEndpointTest extends AuthTestCase
{
    public function testFacturacionNoPuedeImportar403(): void
    {
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/admin/import', $token, []);

        $this->assertHttp($resp, 403);
        $this->assertSame('FORBIDDEN', $this->jsonBody($resp)['error']['code']);
    }

    public function testDireccionNoPuedeImportar403ReadOnly(): void
    {
        $token = $this->loginToken('eric@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/admin/import', $token, []);

        $this->assertHttp($resp, 403);
        $this->assertSame('READ_ONLY', $this->jsonBody($resp)['error']['code']);
    }

    public function testAdminSinArchivoDevuelve422(): void
    {
        $token = $this->loginToken('admin@bestqualitysolutions.com');
        $resp = $this->postAuth('api/v1/admin/import', $token, []);

        $this->assertHttp($resp, 422);
        $this->assertSame('VALIDATION', $this->jsonBody($resp)['error']['code']);
    }

    public function testAdminConsultaEstadoDeJob(): void
    {
        $jobId = (new ColaService())->encolar('import_inicial', ['ruta' => 'x', 'entidad' => 'clientes']);
        $token = $this->loginToken('admin@bestqualitysolutions.com');

        $resp = $this->getAuth('api/v1/admin/jobs/' . $jobId, $token);
        $resp->assertStatus(200);
        $this->assertSame('import_inicial', $this->jsonBody($resp)['data']['tipo']);
        $this->assertSame('pendiente', $this->jsonBody($resp)['data']['estado']);
    }

    public function testFacturacionNoVeJobs403(): void
    {
        $jobId = (new ColaService())->encolar('import_inicial', ['ruta' => 'x']);
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');

        $this->getAuth('api/v1/admin/jobs/' . $jobId, $token)->assertStatus(403);
    }
}
