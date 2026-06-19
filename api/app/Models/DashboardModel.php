<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * Calculo en servidor de las tres preguntas del dashboard (RF-DASH-01/02/03,
 * RF-MET-02). Agregaciones con Query Builder usando los indices del Modelo de
 * Datos (03): idx_fac_estatus_emision (P1), idx_bit_estatus_fact (P2),
 * idx_pag_factura (P3). El cliente nunca recalcula (CLAUDE.md #1, RF-DASH-04).
 *
 * Los montos se serializan como string DECIMAL (number_format) igual que el
 * resto del backend (carteraDe/consumoDe/detalleDe) y como esperan las pruebas.
 */
class DashboardModel extends Model
{
    protected $table = 'FACTURAS';
    protected $primaryKey = 'Folio_Factura';
    protected $useAutoIncrement = false;
    protected $returnType = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = [];

    /**
     * Las tres cifras consolidadas (GET /v1/dashboard/resumen).
     *
     * @return array<string,string>
     */
    public function resumen(): array
    {
        $db = $this->db;

        // P1 — facturado del mes: Σ Monto_Total con Fecha_Emision en el mes en
        // curso y Estatus_Pago ∈ {Pagada, Vigente}. Rango sargable (no MONTH())
        // para aprovechar idx_fac_estatus_emision (Estatus_Pago, Fecha_Emision).
        $resP1 = $db->table('FACTURAS')
            ->selectSum('Monto_Total', 'total')
            ->whereIn('Estatus_Pago', ['Pagada', 'Vigente'])
            ->where('Fecha_Emision >=', date('Y-m-01'))
            ->where('Fecha_Emision <=', date('Y-m-t'))
            ->get();
        $rowP1 = $resP1 === false ? [] : ($resP1->getRowArray() ?? []);
        $facturadoMes = (float) ($rowP1['total'] ?? 0);

        // P2 — por facturar: Σ Monto_Devengado de devengado Pendiente.
        $resP2 = $db->table('BITACORA_SORTEO')
            ->selectSum('Monto_Devengado', 'total')
            ->where('Estatus_Facturacion', 'Pendiente')
            ->get();
        $rowP2 = $resP2 === false ? [] : ($resP2->getRowArray() ?? []);
        $porFacturar = (float) ($rowP2['total'] ?? 0);

        // P3 — por cobrar: Σ (Monto_Total − Σ pagos) de facturas activas. Se
        // agrupa por folio para no duplicar Monto_Total cuando hay varios pagos
        // (mismo patron de saldo que ClienteModel::carteraDe).
        $resP3 = $db->table('FACTURAS f')
            ->select('f.Monto_Total')
            ->selectSum('p.Monto_Pagado', 'pagado')
            ->join('PAGOS p', 'p.Folio_Factura = f.Folio_Factura', 'left')
            ->whereIn('f.Estatus_Pago', ['Vigente', 'Vencida'])
            ->groupBy('f.Folio_Factura, f.Monto_Total')
            ->get();
        $facturasActivas = $resP3 === false ? [] : $resP3->getResultArray();
        $porCobrar = 0.0;
        foreach ($facturasActivas as $f) {
            $porCobrar += (float) $f['Monto_Total'] - (float) ($f['pagado'] ?? 0);
        }

        return [
            'periodo' => date('Y-m'),
            'moneda' => 'MXN',
            'facturado_mes' => number_format($facturadoMes, 2, '.', ''),
            'por_facturar' => number_format($porFacturar, 2, '.', ''),
            'por_cobrar' => number_format($porCobrar, 2, '.', ''),
            'calculado_en' => date('c'),
        ];
    }

    /**
     * Desglose del devengado pendiente por ID_Cotizacion (RF-DASH-02). El total
     * global (suma de todo lo pendiente) es independiente de la pagina.
     *
     * @return array{rows: list<array<string,mixed>>, total: int, total_monto: string}
     */
    public function porFacturar(int $page, int $perPage): array
    {
        $db = $this->db;

        $resSum = $db->table('BITACORA_SORTEO')
            ->selectSum('Monto_Devengado', 'total')
            ->where('Estatus_Facturacion', 'Pendiente')
            ->get();
        $rowSum = $resSum === false ? [] : ($resSum->getRowArray() ?? []);
        $totalMonto = (float) ($rowSum['total'] ?? 0);

        $resCount = $db->table('BITACORA_SORTEO')
            ->select('COUNT(DISTINCT ID_Cotizacion) AS total', false)
            ->where('Estatus_Facturacion', 'Pendiente')
            ->get();
        $rowCount = $resCount === false ? [] : ($resCount->getRowArray() ?? []);
        $total = (int) ($rowCount['total'] ?? 0);

        $res = $db->table('BITACORA_SORTEO b')
            ->select('b.ID_Cotizacion, c.ID_Cliente, cl.Nombre_Comercial, c.PO_Referencia, c.Monto_Autorizado')
            ->selectSum('b.Monto_Devengado', 'monto_devengado_pendiente')
            ->select('COUNT(*) AS capturas', false)
            ->join('COTIZACIONES c', 'c.ID_Cotizacion = b.ID_Cotizacion', 'left')
            ->join('CAT_CLIENTES cl', 'cl.ID_Cliente = c.ID_Cliente', 'left')
            ->where('b.Estatus_Facturacion', 'Pendiente')
            ->groupBy('b.ID_Cotizacion, c.ID_Cliente, cl.Nombre_Comercial, c.PO_Referencia, c.Monto_Autorizado')
            ->orderBy('b.ID_Cotizacion', 'ASC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get();
        $rows = $res === false ? [] : $res->getResultArray();

        $rows = array_map(static function (array $r): array {
            $autorizado = $r['Monto_Autorizado'] ?? null;
            $r['Monto_Autorizado'] = $autorizado === null ? null : number_format((float) $autorizado, 2, '.', '');
            $r['monto_devengado_pendiente'] = number_format((float) ($r['monto_devengado_pendiente'] ?? 0), 2, '.', '');
            $r['capturas'] = (int) ($r['capturas'] ?? 0);

            return $r;
        }, $rows);

        return ['rows' => array_values($rows), 'total' => $total, 'total_monto' => number_format($totalMonto, 2, '.', '')];
    }

    /**
     * Saldo por cobrar por cliente/factura (RF-DASH-03). Cada factura activa
     * aporta saldo = Monto_Total − Σ pagos; se agrupa por cliente. El total
     * global = suma de saldo_cliente (RF-MET-02). Pagina por cliente.
     *
     * @return array{rows: list<array<string,mixed>>, total: int, total_monto: string}
     */
    public function porCobrar(int $page, int $perPage): array
    {
        $db = $this->db;

        $res = $db->table('FACTURAS f')
            ->select('f.Folio_Factura, f.ID_Cliente, cl.Nombre_Comercial, f.Fecha_Emision, f.Fecha_Vencimiento, f.Estatus_Pago, f.Monto_Total')
            ->selectSum('p.Monto_Pagado', 'pagado')
            ->join('CAT_CLIENTES cl', 'cl.ID_Cliente = f.ID_Cliente', 'left')
            ->join('PAGOS p', 'p.Folio_Factura = f.Folio_Factura', 'left')
            ->whereIn('f.Estatus_Pago', ['Vigente', 'Vencida'])
            ->groupBy('f.Folio_Factura, f.ID_Cliente, cl.Nombre_Comercial, f.Fecha_Emision, f.Fecha_Vencimiento, f.Estatus_Pago, f.Monto_Total')
            ->orderBy('f.ID_Cliente', 'ASC')
            ->orderBy('f.Fecha_Emision', 'DESC')
            ->get();
        $facturas = $res === false ? [] : $res->getResultArray();

        /** @var array<string,array{ID_Cliente:string,Nombre_Comercial:mixed,_saldo:float,facturas:list<array<string,mixed>>}> $porCliente */
        $porCliente = [];
        $totalGlobal = 0.0;
        foreach ($facturas as $f) {
            $idCliente = (string) $f['ID_Cliente'];
            $total = (float) $f['Monto_Total'];
            $pagado = (float) ($f['pagado'] ?? 0);
            $saldo = $total - $pagado;

            if (! isset($porCliente[$idCliente])) {
                $porCliente[$idCliente] = [
                    'ID_Cliente' => $idCliente,
                    'Nombre_Comercial' => $f['Nombre_Comercial'] ?? null,
                    '_saldo' => 0.0,
                    'facturas' => [],
                ];
            }
            $porCliente[$idCliente]['facturas'][] = [
                'Folio_Factura' => $f['Folio_Factura'],
                'Fecha_Emision' => $f['Fecha_Emision'],
                'Fecha_Vencimiento' => $f['Fecha_Vencimiento'],
                'Estatus_Pago' => $f['Estatus_Pago'],
                'Monto_Total' => number_format($total, 2, '.', ''),
                'pagado' => number_format($pagado, 2, '.', ''),
                'saldo' => number_format($saldo, 2, '.', ''),
            ];
            $porCliente[$idCliente]['_saldo'] += $saldo;
            $totalGlobal += $saldo;
        }

        $clientes = [];
        foreach ($porCliente as $c) {
            $clientes[] = [
                'ID_Cliente' => $c['ID_Cliente'],
                'Nombre_Comercial' => $c['Nombre_Comercial'],
                'saldo_cliente' => number_format($c['_saldo'], 2, '.', ''),
                'facturas' => $c['facturas'],
            ];
        }

        $total = count($clientes);
        $paged = array_slice($clientes, ($page - 1) * $perPage, $perPage);

        return ['rows' => $paged, 'total' => $total, 'total_monto' => number_format($totalGlobal, 2, '.', '')];
    }
}
