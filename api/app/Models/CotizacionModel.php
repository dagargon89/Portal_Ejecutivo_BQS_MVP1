<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * COTIZACIONES (Tier 0). PK alfanumerica (COT-XXXX). Liga a CAT_CLIENTES.
 */
class CotizacionModel extends Model
{
    protected $table = 'COTIZACIONES';
    protected $primaryKey = 'ID_Cotizacion';
    protected $useAutoIncrement = false;
    protected $returnType = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = ['ID_Cotizacion', 'ID_Cliente', 'PO_Referencia', 'Monto_Autorizado', 'Piezas_Autorizadas', 'Estatus'];

    protected $validationRules = [
        'ID_Cotizacion' => 'required|max_length[20]|regex_match[/^COT-[A-Za-z0-9]+$/]',
        'ID_Cliente' => 'required|max_length[20]|is_not_unique[CAT_CLIENTES.ID_Cliente]',
        'PO_Referencia' => 'permit_empty|max_length[50]',
        'Monto_Autorizado' => 'required|decimal|greater_than_equal_to[0]',
        'Piezas_Autorizadas' => 'permit_empty|is_natural',
        'Estatus' => 'permit_empty|in_list[Aprobada,Pendiente PO,Cerrada]',
    ];

    protected $validationMessages = [
        'ID_Cliente' => [
            'is_not_unique' => 'El ID_Cliente referenciado no existe.',
        ],
        'Monto_Autorizado' => [
            'greater_than_equal_to' => 'El monto autorizado no puede ser negativo.',
            'decimal' => 'El monto autorizado debe ser numerico.',
        ],
    ];

    /**
     * Consumo de la cotizacion: devengado acumulado/pendiente/facturado vs el
     * Monto_Autorizado y el disponible (RF-COT-02). El devengado proviene de
     * BITACORA_SORTEO (0 hasta el Sprint 3).
     *
     * @return array<string,mixed>|null
     */
    public function consumoDe(string $idCotizacion): ?array
    {
        $cotizacion = $this->find($idCotizacion);
        if ($cotizacion === null) {
            return null;
        }

        $res = $this->db->table('BITACORA_SORTEO')
            ->select('COALESCE(SUM(Monto_Devengado),0) AS total', false)
            ->selectSum("CASE WHEN Estatus_Facturacion = 'Pendiente' THEN Monto_Devengado ELSE 0 END", 'pendiente')
            ->selectSum("CASE WHEN Estatus_Facturacion = 'Facturado' THEN Monto_Devengado ELSE 0 END", 'facturado')
            ->where('ID_Cotizacion', $idCotizacion)
            ->get();
        $fila = $res === false ? null : $res->getRowArray();

        $autorizado = (float) $cotizacion['Monto_Autorizado'];
        $acumulado = (float) ($fila['total'] ?? 0);
        $pendiente = (float) ($fila['pendiente'] ?? 0);
        $facturado = (float) ($fila['facturado'] ?? 0);

        $cotizacion['consumo'] = [
            'moneda' => 'MXN',
            'devengado_acumulado' => number_format($acumulado, 2, '.', ''),
            'devengado_pendiente' => number_format($pendiente, 2, '.', ''),
            'devengado_facturado' => number_format($facturado, 2, '.', ''),
            'disponible' => number_format($autorizado - $acumulado, 2, '.', ''),
        ];

        return $cotizacion;
    }
}
