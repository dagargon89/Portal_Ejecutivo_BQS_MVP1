<?php

declare(strict_types=1);

use App\Models\AuditoriaModel;
use CodeIgniter\Shield\Models\UserModel;
use Tests\Support\AuthTestCase;

/**
 * Auditoría de accesos GET de la Dirección General (RF-MET-01, roadmap Sprint 5
 * L177). Cada lectura exitosa del rol `direccion` sobre una ruta sensible del
 * dashboard se registra en AUDITORIA con accion='acceso', para trazabilidad
 * forense — Casos TC-MET-02 y TC-SEC-10.
 *
 * El dashboard responde 200 con $0.00 aun sin facturas (TC-DASH-04), por lo que
 * estas pruebas no necesitan sembrar datos financieros.
 *
 * @internal
 */
final class AccessAuditTest extends AuthTestCase
{
    private const ERIC = 'eric@bestqualitysolutions.com';

    /**
     * Filas registradas como acceso de lectura en la bitácora.
     */
    private function accesos(): int
    {
        return model(AuditoriaModel::class)->where('accion', 'acceso')->countAllResults();
    }

    // ---- TC-MET-02: el GET de dirección se registra con sus metadatos --------

    public function testAccesoGetDeDireccionSeRegistra(): void
    {
        $token = $this->loginToken(self::ERIC);
        $resp = $this->getAuth('api/v1/dashboard/resumen', $token);

        $this->assertHttp($resp, 200);
        $this->assertSame(1, $this->accesos(), 'El GET de dirección debe generar una entrada de auditoría.');

        /** @var array<string,mixed> $row */
        $row = model(AuditoriaModel::class)->where('accion', 'acceso')->first();
        $ericId = model(UserModel::class)->findByCredentials(['email' => self::ERIC])?->id;

        $this->assertSame((int) $ericId, (int) $row['usuario_id'], 'La auditoría debe atribuirse a Eric (dirección).');
        $this->assertStringContainsString('dashboard/resumen', (string) $row['entidad']);
        $this->assertNotNull($row['ip'], 'Se registra la IP de origen para trazabilidad forense.');
        $this->assertNotSame('', (string) $row['ip']);
        $this->assertNull($row['valores_antes'], 'Una lectura no lleva snapshot previo.');
        $this->assertNull($row['valores_despues'], 'Una lectura no lleva snapshot posterior.');
    }

    // ---- TC-SEC-10: trazabilidad de las tres rutas del dashboard -------------

    public function testLasTresRutasDelDashboardSeAuditan(): void
    {
        $token = $this->loginToken(self::ERIC);

        $this->assertHttp($this->getAuth('api/v1/dashboard/resumen', $token), 200);
        $this->assertHttp($this->getAuth('api/v1/dashboard/por-facturar', $token), 200);
        $this->assertHttp($this->getAuth('api/v1/dashboard/por-cobrar', $token), 200);

        $this->assertSame(3, $this->accesos(), 'Cada una de las tres preguntas auditadas deja su rastro.');
    }

    // ---- Gate por rol: un lector NO-dirección no se audita --------------------

    public function testRolNoDireccionNoSeAudita(): void
    {
        // `facturacion` también puede leer el dashboard (200), pero no es dirección.
        $token = $this->loginToken('facturacion@bestqualitysolutions.com');
        $resp = $this->getAuth('api/v1/dashboard/resumen', $token);

        $this->assertHttp($resp, 200);
        $this->assertSame(0, $this->accesos(), 'La auditoría de acceso es exclusiva del rol dirección.');
    }

    // ---- Corto-circuito por status: un acceso denegado no se audita -----------

    public function testAccesoNoAutenticadoNoSeAudita(): void
    {
        $resp = $this->get('api/v1/dashboard/resumen');

        $this->assertHttp($resp, 401);
        $this->assertSame(0, $this->accesos(), 'Solo se auditan lecturas exitosas (status < 400).');
    }
}
