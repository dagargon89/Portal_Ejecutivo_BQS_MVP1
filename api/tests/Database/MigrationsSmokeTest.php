<?php

declare(strict_types=1);

use CodeIgniter\Database\Exceptions\DatabaseException;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * Smoke test del esquema (Sprint 0, doc 06): verifica que las migraciones
 * crean las 8 tablas + las de Shield, el indice compuesto de la Pregunta 1 y
 * que los CHECK rechazan datos invalidos.
 *
 * @internal
 */
final class MigrationsSmokeTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $namespace = null; // App + Shield + Settings
    protected $refresh = true;

    public function testTablasDeDominioYSoporteExisten(): void
    {
        $db = db_connect();
        $tablas = ['CAT_CLIENTES', 'COTIZACIONES', 'BITACORA_SORTEO', 'FACTURAS', 'PAGOS', 'AUTH_WHITELIST', 'AUDITORIA', 'JOBS_COLA', 'CLIENTE_ALIAS'];

        foreach ($tablas as $tabla) {
            $this->assertTrue($db->tableExists($tabla), "Falta la tabla: {$tabla}");
        }
    }

    public function testTablasShieldExisten(): void
    {
        $db = db_connect();

        foreach (['users', 'auth_identities', 'auth_groups_users', 'auth_logins'] as $tabla) {
            $this->assertTrue($db->tableExists($tabla), "Falta la tabla Shield: {$tabla}");
        }
    }

    public function testIndiceCompuestoDeLaPregunta1(): void
    {
        $rows = db_connect()
            ->query("SHOW INDEX FROM FACTURAS WHERE Key_name = 'idx_fac_estatus_emision'")
            ->getResultArray();

        $this->assertCount(2, $rows, 'idx_fac_estatus_emision debe indexar (Estatus_Pago, Fecha_Emision).');
    }

    public function testCheckRechazaEstatusClienteInvalido(): void
    {
        $this->expectException(DatabaseException::class);

        db_connect()->query(
            "INSERT INTO CAT_CLIENTES (ID_Cliente, Nombre_Fiscal, Estatus) VALUES ('CLI-XX', 'Prueba', 'Inexistente')"
        );
    }

    public function testCheckRechazaPagoNoPositivo(): void
    {
        $db = db_connect();
        $db->query("INSERT INTO CAT_CLIENTES (ID_Cliente, Nombre_Fiscal, Estatus) VALUES ('CLI-01', 'ACME', 'Activo')");
        $db->query(
            "INSERT INTO FACTURAS (Folio_Factura, ID_Cliente, Fecha_Emision, Monto_Subtotal, Monto_Total, Fecha_Vencimiento, Estatus_Pago)
             VALUES ('F-1', 'CLI-01', '2026-06-01', 100.00, 116.00, '2026-07-01', 'Vigente')"
        );

        $this->expectException(DatabaseException::class);
        // chk_pag_monto: Monto_Pagado > 0
        $db->query("INSERT INTO PAGOS (ID_Pago, Folio_Factura, Fecha_Pago, Monto_Pagado) VALUES ('PAG-1', 'F-1', '2026-06-10', 0)");
    }
}
