<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use App\Models\ClienteAliasModel;
use App\Models\ClienteModel;
use App\Models\CotizacionModel;
use App\Services\Normalizador;
use CodeIgniter\Database\Seeder;

/**
 * Seeder de demostracion del Tier 0 (Sprint 2) — SOLO dev/staging.
 *
 * Siembra el Caso QA 1 ya consolidado para que la pantalla de Clientes muestre
 * datos sin necesidad de importar: "NIDEC Mobility" y "Nidec Mexico" quedan bajo
 * un unico CLI-001 con su cartera sumada (100,000 + 150,000 = 250,000).
 *
 * NO se usa en las pruebas (esas parten de un Tier 0 vacio via InitialSeeder).
 * Ejecutar manualmente:  php spark db:seed DemoTier0Seeder
 *
 * Es idempotente: re-ejecutarlo no duplica registros.
 */
class DemoTier0Seeder extends Seeder
{
    public function run(): void
    {
        if (ENVIRONMENT === 'production') {
            return; // nunca sembrar datos de demo en produccion
        }

        $clientes = model(ClienteModel::class);
        $alias = model(ClienteAliasModel::class);
        $cotizaciones = model(CotizacionModel::class);

        // --- CLI-001: NIDEC (clientes variantes consolidados) ---
        $this->upsertCliente($clientes, [
            'ID_Cliente' => 'CLI-001',
            'Nombre_Fiscal' => 'NIDEC Mobility Mexico S.A. de C.V.',
            'Nombre_Comercial' => 'NIDEC Mobility',
            'RFC' => 'NMO140101AA1',
            'Estatus' => 'Activo',
        ]);
        foreach (['CLI-001', 'NIDEC Mobility Mexico S.A. de C.V.', 'NIDEC Mobility', 'Nidec Mexico'] as $texto) {
            $alias->registrar(Normalizador::nombre($texto), $texto, 'CLI-001');
        }

        // --- CLI-002: Bocar (segundo cliente para variedad) ---
        $this->upsertCliente($clientes, [
            'ID_Cliente' => 'CLI-002',
            'Nombre_Fiscal' => 'Bocar Group S.A. de C.V.',
            'Nombre_Comercial' => 'Bocar',
            'RFC' => 'BGR990817AB2',
            'Estatus' => 'Activo',
        ]);
        foreach (['CLI-002', 'Bocar Group S.A. de C.V.', 'Bocar'] as $texto) {
            $alias->registrar(Normalizador::nombre($texto), $texto, 'CLI-002');
        }

        // --- Cotizaciones: cartera de CLI-001 = 250,000 (Caso QA 1) ---
        $this->upsertCotizacion($cotizaciones, [
            'ID_Cotizacion' => 'COT-0001',
            'ID_Cliente' => 'CLI-001',
            'PO_Referencia' => 'PO-NIDEC-1001',
            'Monto_Autorizado' => '100000.00',
            'Piezas_Autorizadas' => 5000,
            'Estatus' => 'Aprobada',
        ]);
        $this->upsertCotizacion($cotizaciones, [
            'ID_Cotizacion' => 'COT-0002',
            'ID_Cliente' => 'CLI-001',
            'PO_Referencia' => 'PO-NIDEC-1002',
            'Monto_Autorizado' => '150000.00',
            'Piezas_Autorizadas' => 7500,
            'Estatus' => 'Aprobada',
        ]);
        $this->upsertCotizacion($cotizaciones, [
            'ID_Cotizacion' => 'COT-0003',
            'ID_Cliente' => 'CLI-002',
            'PO_Referencia' => 'PO-BOCAR-2001',
            'Monto_Autorizado' => '80000.00',
            'Piezas_Autorizadas' => 4000,
            'Estatus' => 'Pendiente PO',
        ]);
    }

    /**
     * @param array{ID_Cliente: string, Nombre_Fiscal: string, Nombre_Comercial: string, RFC: string, Estatus: string} $datos
     */
    private function upsertCliente(ClienteModel $model, array $datos): void
    {
        $model->find($datos['ID_Cliente']) === null
            ? $model->insert($datos)
            : $model->update($datos['ID_Cliente'], $datos);
    }

    /**
     * @param array{ID_Cotizacion: string, ID_Cliente: string, PO_Referencia: string, Monto_Autorizado: string, Piezas_Autorizadas: int, Estatus: string} $datos
     */
    private function upsertCotizacion(CotizacionModel $model, array $datos): void
    {
        $model->find($datos['ID_Cotizacion']) === null
            ? $model->insert($datos)
            : $model->update($datos['ID_Cotizacion'], $datos);
    }
}
