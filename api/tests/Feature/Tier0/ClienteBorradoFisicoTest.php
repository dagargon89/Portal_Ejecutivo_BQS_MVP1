<?php

declare(strict_types=1);

use App\Models\ClienteModel;
use App\Models\CotizacionModel;
use CodeIgniter\Database\Exceptions\DatabaseException;
use Tests\Support\AuthTestCase;

/**
 * RF-CLI-02 / roadmap Sprint 2: el borrado FISICO de un cliente con
 * movimientos esta bloqueado por la FK ON DELETE RESTRICT (la app solo hace
 * baja logica). Esta prueba ejerce la red de seguridad a nivel de BD.
 *
 * @internal
 */
final class ClienteBorradoFisicoTest extends AuthTestCase
{
    public function testBorrarFisicamenteClienteConCotizacionesEstaBloqueado(): void
    {
        model(ClienteModel::class)->insert([
            'ID_Cliente' => 'CLI-001',
            'Nombre_Fiscal' => 'NIDEC Mobility Mexico S.A. de C.V.',
            'Estatus' => 'Activo',
        ]);
        model(CotizacionModel::class)->insert([
            'ID_Cotizacion' => 'COT-0001',
            'ID_Cliente' => 'CLI-001',
            'Monto_Autorizado' => '100000.00',
            'Estatus' => 'Aprobada',
        ]);

        $this->expectException(DatabaseException::class);
        db_connect()->table('CAT_CLIENTES')->where('ID_Cliente', 'CLI-001')->delete();
    }
}
