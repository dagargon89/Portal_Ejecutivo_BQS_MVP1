<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * CAT_CLIENTES (Tier 0). PK alfanumerica de negocio (CLI-XXX), inalterable.
 * La baja es logica (Estatus=Inactivo); la fisica la bloquea la FK RESTRICT.
 */
class ClienteModel extends Model
{
    protected $table = 'CAT_CLIENTES';
    protected $primaryKey = 'ID_Cliente';
    protected $useAutoIncrement = false;
    protected $returnType = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = ['ID_Cliente', 'Nombre_Fiscal', 'Nombre_Comercial', 'RFC', 'Estatus'];

    protected $validationRules = [
        'ID_Cliente' => 'required|max_length[20]|regex_match[/^CLI-[A-Za-z0-9]+$/]',
        'Nombre_Fiscal' => 'required|max_length[255]',
        'Nombre_Comercial' => 'permit_empty|max_length[150]',
        'RFC' => 'permit_empty|min_length[12]|max_length[13]',
        'Estatus' => 'permit_empty|in_list[Activo,Inactivo]',
    ];

    protected $validationMessages = [
        'ID_Cliente' => [
            'regex_match' => 'El ID_Cliente debe tener el formato CLI-XXX.',
        ],
    ];

    /** @var list<string> */
    protected $beforeInsert = ['normalizar'];
    /** @var list<string> */
    protected $beforeUpdate = ['normalizar'];

    /**
     * @param array<string,mixed> $data
     *
     * @return array<string,mixed>
     */
    protected function normalizar(array $data): array
    {
        if (isset($data['data']['RFC']) && is_string($data['data']['RFC'])) {
            $rfc = strtoupper(trim($data['data']['RFC']));
            $data['data']['RFC'] = $rfc === '' ? null : $rfc;
        }
        if (isset($data['data']['ID_Cliente']) && is_string($data['data']['ID_Cliente'])) {
            $data['data']['ID_Cliente'] = strtoupper(trim($data['data']['ID_Cliente']));
        }

        return $data;
    }

    /**
     * Busqueda consolidada paginada (RF-CLI search).
     *
     * @return array{rows: array<array-key, mixed>, total: int}
     */
    public function buscar(?string $q, ?string $estatus, int $page, int $perPage): array
    {
        $builder = $this->builder();

        if ($q !== null && $q !== '') {
            $builder->groupStart()
                ->like('ID_Cliente', $q)
                ->orLike('Nombre_Fiscal', $q)
                ->orLike('Nombre_Comercial', $q)
                ->orLike('RFC', $q)
                ->groupEnd();
        }
        if ($estatus !== null && $estatus !== '') {
            $builder->where('Estatus', $estatus);
        }

        $total = $builder->countAllResults(false);
        $result = $builder->orderBy('ID_Cliente', 'ASC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get();
        $rows = $result === false ? [] : $result->getResultArray();

        return ['rows' => $rows, 'total' => (int) $total];
    }

    /**
     * Detalle financiero del cliente: cotizaciones (con devengado), facturas
     * (con pagado/saldo) y saldo por cobrar (RF-CLI-03). El devengado y las
     * facturas estan en 0 hasta que el Sprint 3 alimente esas tablas.
     *
     * @return array<string,mixed>|null
     */
    public function carteraDe(string $idCliente): ?array
    {
        $cliente = $this->find($idCliente);
        if ($cliente === null) {
            return null;
        }

        $db = $this->db;

        $resCot = $db->table('COTIZACIONES c')
            ->select('c.ID_Cotizacion, c.PO_Referencia, c.Monto_Autorizado, c.Piezas_Autorizadas, c.Estatus')
            ->selectSum('b.Monto_Devengado', 'devengado')
            ->join('BITACORA_SORTEO b', 'b.ID_Cotizacion = c.ID_Cotizacion', 'left')
            ->where('c.ID_Cliente', $idCliente)
            ->groupBy('c.ID_Cotizacion, c.PO_Referencia, c.Monto_Autorizado, c.Piezas_Autorizadas, c.Estatus')
            ->orderBy('c.ID_Cotizacion', 'ASC')
            ->get();
        $cotizaciones = $resCot === false ? [] : $resCot->getResultArray();

        $cotizaciones = array_map(static function (array $row): array {
            $autorizado = (float) $row['Monto_Autorizado'];
            $devengado = (float) ($row['devengado'] ?? 0);
            $row['devengado'] = number_format($devengado, 2, '.', '');
            $row['disponible'] = number_format($autorizado - $devengado, 2, '.', '');

            return $row;
        }, $cotizaciones);

        $resFac = $db->table('FACTURAS f')
            ->select('f.Folio_Factura, f.Fecha_Emision, f.Monto_Total, f.Fecha_Vencimiento, f.Estatus_Pago')
            ->selectSum('p.Monto_Pagado', 'pagado')
            ->join('PAGOS p', 'p.Folio_Factura = f.Folio_Factura', 'left')
            ->where('f.ID_Cliente', $idCliente)
            ->groupBy('f.Folio_Factura, f.Fecha_Emision, f.Monto_Total, f.Fecha_Vencimiento, f.Estatus_Pago')
            ->orderBy('f.Fecha_Emision', 'DESC')
            ->get();
        $facturas = $resFac === false ? [] : $resFac->getResultArray();

        $saldoPorCobrar = 0.0;
        $totalAutorizado = 0.0;
        foreach ($cotizaciones as $c) {
            $totalAutorizado += (float) $c['Monto_Autorizado'];
        }
        $facturas = array_map(static function (array $row) use (&$saldoPorCobrar): array {
            $total = (float) $row['Monto_Total'];
            $pagado = (float) ($row['pagado'] ?? 0);
            $saldo = $total - $pagado;
            $row['pagado'] = number_format($pagado, 2, '.', '');
            $row['saldo'] = number_format($saldo, 2, '.', '');
            if (in_array($row['Estatus_Pago'], ['Vigente', 'Vencida'], true)) {
                $saldoPorCobrar += $saldo;
            }

            return $row;
        }, $facturas);

        $cliente['cartera'] = [
            'moneda' => 'MXN',
            'total_autorizado' => number_format($totalAutorizado, 2, '.', ''),
            'saldo_por_cobrar' => number_format($saldoPorCobrar, 2, '.', ''),
            'cotizaciones' => $cotizaciones,
            'facturas' => $facturas,
        ];

        return $cliente;
    }
}
