<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use App\Models\ClienteAliasModel;
use App\Services\Normalizador;
use CodeIgniter\CLI\CLI;
use CodeIgniter\Database\Seeder;

/**
 * Datos de demostracion COHERENTES para toda la app — SOLO dev/staging.
 *
 * Puebla el Tier 0 (clientes con alias, cotizaciones) y la cadena financiera
 * (bitacora de sorteo = devengado, facturas y pagos) con cifras consistentes:
 *   - devengado por cotizacion <= Monto_Autorizado;
 *   - IVA 16% (Monto_Total = Subtotal * 1.16);
 *   - pagos <= Monto_Total; vencidas/vigentes segun la fecha (hoy ~2026-06).
 * Incluye el Caso QA 1: "NIDEC Mobility" + "Nidec Mexico" -> CLI-001 (cartera
 * 250,000) via el catalogo de alias (M-08).
 *
 * NO se usa en pruebas (esas parten de un Tier 0 vacio via InitialSeeder).
 *   php spark db:seed DemoDataSeeder
 *
 * RESETEA los datos de demo (vacia las 6 tablas de dominio). Nunca en prod.
 */
class DemoDataSeeder extends Seeder
{
    /** Tablas de dominio en orden hijo -> padre (para vaciar con FK). */
    private const TABLAS = ['PAGOS', 'FACTURAS', 'BITACORA_SORTEO', 'COTIZACIONES', 'CLIENTE_ALIAS', 'CAT_CLIENTES'];

    public function run(): void
    {
        if (ENVIRONMENT === 'production') {
            return; // jamas sembrar datos de demo en produccion
        }

        $this->vaciar();
        $this->sembrarClientes();
        $this->sembrarCotizaciones();
        $this->sembrarDevengado();
        $this->sembrarFacturas();
        $this->sembrarPagos();

        if (is_cli()) {
            CLI::write('Demo coherente: 8 clientes, 13 cotizaciones, 13 capturas, 7 facturas, 4 pagos.', 'green');
            CLI::write('Caso QA 1: CLI-001 (NIDEC) con cartera de $250,000.', 'green');
        }
    }

    private function vaciar(): void
    {
        $this->db->disableForeignKeyChecks();
        foreach (self::TABLAS as $tabla) {
            $this->db->table($tabla)->truncate();
        }
        $this->db->enableForeignKeyChecks();
    }

    private function sembrarClientes(): void
    {
        // [ID, Nombre_Fiscal, Nombre_Comercial, RFC, Estatus, alias adicionales]
        $clientes = [
            ['CLI-001', 'NIDEC Mobility Mexico S.A. de C.V.', 'NIDEC Mobility', 'NMO140101AA1', 'Activo', ['NIDEC Mobility', 'Nidec Mexico']],
            ['CLI-002', 'Bocar Group S.A. de C.V.', 'Bocar', 'BGR990817AB2', 'Activo', ['Bocar']],
            ['CLI-003', 'Nemak S.A.B. de C.V.', 'Nemak', 'NEM790521C34', 'Activo', ['Nemak', 'Nemak Aluminio']],
            ['CLI-004', 'Metalsa S.A. de C.V.', 'Metalsa', 'MET850612D58', 'Activo', ['Metalsa']],
            ['CLI-005', 'Rassini S.A.B. de C.V.', 'Rassini', 'RAS760310E21', 'Activo', ['Rassini', 'Rassini Frenos']],
            ['CLI-006', 'Kostal Mexicana S.A. de C.V.', 'Kostal', 'KME031118F09', 'Activo', ['Kostal', 'Kostal Mexico']],
            ['CLI-007', 'Grupo Industrial Saltillo S.A.B. de C.V.', 'GIS', 'GIS680425G77', 'Activo', ['GIS', 'Grupo Industrial Saltillo']],
            ['CLI-008', 'Katcon Global S.A. de C.V.', 'Katcon', 'KAT930204H45', 'Inactivo', ['Katcon']],
        ];

        $filas = [];
        foreach ($clientes as [$id, $fiscal, $comercial, $rfc, $estatus, $alias]) {
            $filas[] = [
                'ID_Cliente' => $id,
                'Nombre_Fiscal' => $fiscal,
                'Nombre_Comercial' => $comercial,
                'RFC' => $rfc,
                'Estatus' => $estatus,
            ];
        }
        $this->db->table('CAT_CLIENTES')->insertBatch($filas);

        // Alias deterministas: ID, nombres y variantes -> ID_Cliente (M-08).
        $aliasModel = model(ClienteAliasModel::class);
        foreach ($clientes as [$id, $fiscal, $comercial, , , $alias]) {
            $textos = array_merge([$id, $fiscal, $comercial], $alias);
            foreach ($textos as $texto) {
                $aliasModel->registrar(Normalizador::nombre($texto), $texto, $id);
            }
        }
    }

    private function sembrarCotizaciones(): void
    {
        // [ID, ID_Cliente, PO, Monto_Autorizado, Piezas, Estatus]
        $cot = [
            ['COT-0001', 'CLI-001', 'PO-NIDEC-1001', '100000.00', 5000, 'Aprobada'],
            ['COT-0002', 'CLI-001', 'PO-NIDEC-1002', '150000.00', 7500, 'Aprobada'],
            ['COT-0003', 'CLI-002', 'PO-BOCAR-2001', '320000.00', 16000, 'Aprobada'],
            ['COT-0004', 'CLI-002', 'PO-BOCAR-2002', '90000.00', 4500, 'Pendiente PO'],
            ['COT-0005', 'CLI-003', 'PO-NEMAK-3001', '540000.00', 27000, 'Aprobada'],
            ['COT-0006', 'CLI-003', 'PO-NEMAK-3002', '210000.00', 10500, 'Cerrada'],
            ['COT-0007', 'CLI-004', 'PO-METAL-4001', '410000.00', 20500, 'Aprobada'],
            ['COT-0008', 'CLI-005', 'PO-RASS-5001', '175000.00', 8750, 'Aprobada'],
            ['COT-0009', 'CLI-005', 'PO-RASS-5002', '60000.00', 3000, 'Pendiente PO'],
            ['COT-0010', 'CLI-006', 'PO-KOST-6001', '280000.00', 14000, 'Aprobada'],
            ['COT-0011', 'CLI-007', 'PO-GIS-7001', '720000.00', 36000, 'Aprobada'],
            ['COT-0012', 'CLI-007', 'PO-GIS-7002', '130000.00', 6500, 'Cerrada'],
            ['COT-0013', 'CLI-008', 'PO-KAT-8001', '95000.00', 4750, 'Cerrada'],
        ];

        $filas = [];
        foreach ($cot as [$id, $cliente, $po, $monto, $piezas, $estatus]) {
            $filas[] = [
                'ID_Cotizacion' => $id,
                'ID_Cliente' => $cliente,
                'PO_Referencia' => $po,
                'Monto_Autorizado' => $monto,
                'Piezas_Autorizadas' => $piezas,
                'Estatus' => $estatus,
            ];
        }
        $this->db->table('COTIZACIONES')->insertBatch($filas);
    }

    private function sembrarDevengado(): void
    {
        // [ID_Captura, Fecha, ID_Cotizacion, Horas, Piezas, Monto_Devengado, Estatus_Facturacion]
        // Por cotizacion: sum(devengado) <= Monto_Autorizado (coherente).
        $bitacora = [
            ['BIT-0001', '2026-05-10', 'COT-0001', '120.00', 2000, '40000.00', 'Facturado'],
            ['BIT-0002', '2026-05-25', 'COT-0001', '90.00', 1500, '30000.00', 'Pendiente'],
            ['BIT-0003', '2026-05-15', 'COT-0002', '150.00', 3000, '60000.00', 'Facturado'],
            ['BIT-0004', '2026-06-01', 'COT-0002', '100.00', 2000, '45000.00', 'Pendiente'],
            ['BIT-0005', '2026-05-20', 'COT-0003', '200.00', 8000, '180000.00', 'Facturado'],
            ['BIT-0006', '2026-06-05', 'COT-0003', '120.00', 5000, '90000.00', 'Pendiente'],
            ['BIT-0007', '2026-04-28', 'COT-0005', '300.00', 15000, '300000.00', 'Facturado'],
            ['BIT-0008', '2026-05-30', 'COT-0005', '150.00', 7500, '150000.00', 'Pendiente'],
            ['BIT-0009', '2026-03-15', 'COT-0006', '180.00', 9000, '210000.00', 'Facturado'],
            ['BIT-0010', '2026-05-12', 'COT-0007', '220.00', 11000, '220000.00', 'Facturado'],
            ['BIT-0011', '2026-06-10', 'COT-0007', '95.00', 4500, '95000.00', 'Pendiente'],
            ['BIT-0012', '2026-05-08', 'COT-0011', '400.00', 20000, '400000.00', 'Facturado'],
            ['BIT-0013', '2026-06-12', 'COT-0011', '180.00', 9000, '180000.00', 'Pendiente'],
        ];

        $filas = [];
        foreach ($bitacora as [$id, $fecha, $cot, $horas, $piezas, $monto, $estatus]) {
            $filas[] = [
                'ID_Captura' => $id,
                'Fecha' => $fecha,
                'ID_Cotizacion' => $cot,
                'Horas_Trabajadas' => $horas,
                'Piezas_Sorteadas' => $piezas,
                'Monto_Devengado' => $monto,
                'Estatus_Facturacion' => $estatus,
            ];
        }
        $this->db->table('BITACORA_SORTEO')->insertBatch($filas);
    }

    private function sembrarFacturas(): void
    {
        // [Folio, ID_Cliente, Emision, Subtotal, Total(=Sub*1.16), Vencimiento, Estatus_Pago]
        // Vencida: vencimiento < hoy (~2026-06-19). Vigente: vencimiento >= hoy.
        $facturas = [
            ['FAC-2026-0001', 'CLI-001', '2026-05-31', '100000.00', '116000.00', '2026-06-30', 'Vigente'],
            ['FAC-2026-0002', 'CLI-002', '2026-05-16', '180000.00', '208800.00', '2026-06-15', 'Vencida'],
            ['FAC-2026-0003', 'CLI-003', '2026-04-30', '300000.00', '348000.00', '2026-05-30', 'Pagada'],
            ['FAC-2026-0004', 'CLI-003', '2026-03-31', '210000.00', '243600.00', '2026-04-30', 'Pagada'],
            ['FAC-2026-0005', 'CLI-004', '2026-05-31', '220000.00', '255200.00', '2026-06-30', 'Vigente'],
            ['FAC-2026-0006', 'CLI-007', '2026-05-11', '400000.00', '464000.00', '2026-06-10', 'Vencida'],
            ['FAC-2026-0007', 'CLI-005', '2026-06-01', '90000.00', '104400.00', '2026-07-01', 'Vigente'],
        ];

        $filas = [];
        foreach ($facturas as [$folio, $cliente, $emision, $subtotal, $total, $vencimiento, $estatus]) {
            $filas[] = [
                'Folio_Factura' => $folio,
                'ID_Cliente' => $cliente,
                'Fecha_Emision' => $emision,
                'Monto_Subtotal' => $subtotal,
                'Monto_Total' => $total,
                'Fecha_Vencimiento' => $vencimiento,
                'Estatus_Pago' => $estatus,
            ];
        }
        $this->db->table('FACTURAS')->insertBatch($filas);
    }

    private function sembrarPagos(): void
    {
        // [ID_Pago, Folio, Fecha_Pago, Monto_Pagado, Referencia]
        // Pagadas: pago == total. Vigente/Vencida: abono parcial (deja saldo).
        $pagos = [
            ['PAG-0001', 'FAC-2026-0003', '2026-05-25', '348000.00', 'Transferencia SPEI 0525'],
            ['PAG-0002', 'FAC-2026-0004', '2026-04-20', '243600.00', 'Transferencia SPEI 0420'],
            ['PAG-0003', 'FAC-2026-0001', '2026-06-10', '50000.00', 'Abono parcial 1/2'],
            ['PAG-0004', 'FAC-2026-0002', '2026-06-05', '100000.00', 'Abono parcial 1/2'],
        ];

        $filas = [];
        foreach ($pagos as [$id, $folio, $fecha, $monto, $referencia]) {
            $filas[] = [
                'ID_Pago' => $id,
                'Folio_Factura' => $folio,
                'Fecha_Pago' => $fecha,
                'Monto_Pagado' => $monto,
                'Referencia' => $referencia,
            ];
        }
        $this->db->table('PAGOS')->insertBatch($filas);
    }
}
