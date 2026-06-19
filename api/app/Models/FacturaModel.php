<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * FACTURAS — folios emitidos y estado de cobranza (RF-FAC). Nace 'Vigente';
 * el cron la marca 'Vencida' y un pago total la marca 'Pagada' (SRS §4). PK
 * alfanumerica (folio fiscal). Los CHECK de BD (Total>=Subtotal, Vto>=Emision)
 * son la red de seguridad final.
 */
class FacturaModel extends Model
{
    protected $table = 'FACTURAS';
    protected $primaryKey = 'Folio_Factura';
    protected $useAutoIncrement = false;
    protected $returnType = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = ['Folio_Factura', 'ID_Cliente', 'Fecha_Emision', 'Monto_Subtotal', 'Monto_Total', 'Fecha_Vencimiento', 'Estatus_Pago'];

    protected $validationRules = [
        'Folio_Factura' => 'required|max_length[40]|regex_match[/^[A-Za-z0-9-]+$/]',
        'ID_Cliente' => 'required|max_length[20]|is_not_unique[CAT_CLIENTES.ID_Cliente]',
        'Fecha_Emision' => 'required|valid_date[Y-m-d]',
        'Fecha_Vencimiento' => 'required|valid_date[Y-m-d]',
        'Monto_Subtotal' => 'required|decimal|greater_than_equal_to[0]',
        'Monto_Total' => 'required|decimal|greater_than_equal_to[0]',
        'Estatus_Pago' => 'permit_empty|in_list[Pagada,Vigente,Vencida]',
    ];

    protected $validationMessages = [
        'ID_Cliente' => [
            'is_not_unique' => 'El cliente referenciado no existe.',
        ],
    ];

    /**
     * Detalle de la factura con sus pagos, total pagado y saldo (RF-PAG-01, §4).
     * El saldo se calcula en servidor; nunca llega del cliente (CLAUDE.md #1).
     *
     * @return array<string,mixed>|null
     */
    public function detalleDe(string $folio): ?array
    {
        $factura = $this->find($folio);
        if ($factura === null) {
            return null;
        }

        $res = $this->db->table('PAGOS')
            ->select('ID_Pago, Fecha_Pago, Monto_Pagado, Referencia')
            ->where('Folio_Factura', $folio)
            ->orderBy('Fecha_Pago', 'ASC')
            ->orderBy('ID_Pago', 'ASC')
            ->get();
        $pagos = $res === false ? [] : $res->getResultArray();

        $total = (float) $factura['Monto_Total'];
        $pagado = 0.0;
        foreach ($pagos as $p) {
            $pagado += (float) $p['Monto_Pagado'];
        }

        $factura['pagado'] = number_format($pagado, 2, '.', '');
        $factura['saldo'] = number_format($total - $pagado, 2, '.', '');
        $factura['pagos'] = $pagos;

        return $factura;
    }
}
