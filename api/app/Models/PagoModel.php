<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * PAGOS — abonos aplicados a una factura (RF-PAG-01). Monto siempre > 0; la
 * prevencion de sobrepago y la reevaluacion de Estatus_Pago viven en
 * PagoService (transaccion ACID). PK alfanumerica de negocio.
 */
class PagoModel extends Model
{
    protected $table = 'PAGOS';
    protected $primaryKey = 'ID_Pago';
    protected $useAutoIncrement = false;
    protected $returnType = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = ['ID_Pago', 'Folio_Factura', 'Fecha_Pago', 'Monto_Pagado', 'Referencia'];

    protected $validationRules = [
        'ID_Pago' => 'required|max_length[20]|regex_match[/^[A-Za-z0-9-]+$/]',
        'Folio_Factura' => 'required|max_length[40]|is_not_unique[FACTURAS.Folio_Factura]',
        'Fecha_Pago' => 'required|valid_date[Y-m-d]',
        'Monto_Pagado' => 'required|decimal|greater_than[0]',
        'Referencia' => 'permit_empty|max_length[100]',
    ];

    protected $validationMessages = [
        'Folio_Factura' => [
            'is_not_unique' => 'La factura referenciada no existe.',
        ],
        'Monto_Pagado' => [
            'greater_than' => 'El monto del pago debe ser mayor a cero.',
            'decimal' => 'El monto del pago debe ser numerico.',
        ],
    ];

    /** Suma de abonos aplicados a una factura, como DECIMAL string. */
    public function totalPagado(string $folio): string
    {
        $res = $this->db->table('PAGOS')
            ->select('COALESCE(SUM(Monto_Pagado),0) AS total', false)
            ->where('Folio_Factura', $folio)
            ->get();
        $row = $res === false ? null : $res->getRowArray();

        return number_format((float) ($row['total'] ?? 0), 2, '.', '');
    }
}
