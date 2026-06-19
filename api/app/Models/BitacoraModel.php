<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * BITACORA_SORTEO — devengado (trabajo ejecutado) por cotizacion (RF-DEV-01).
 * Nace con Estatus_Facturacion='Pendiente'; pasa a 'Facturado' al emitir una
 * factura (en la transaccion de FacturaService). PK alfanumerica de negocio.
 */
class BitacoraModel extends Model
{
    protected $table = 'BITACORA_SORTEO';
    protected $primaryKey = 'ID_Captura';
    protected $useAutoIncrement = false;
    protected $returnType = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = ['ID_Captura', 'Fecha', 'ID_Cotizacion', 'Horas_Trabajadas', 'Piezas_Sorteadas', 'Monto_Devengado', 'Estatus_Facturacion'];

    // Validacion numerica estricta del devengado (RF-DEV-02): rechaza texto,
    // negativos y nulos no permitidos antes de tocar la BD.
    protected $validationRules = [
        'ID_Captura' => 'required|max_length[20]|regex_match[/^[A-Za-z0-9-]+$/]',
        'Fecha' => 'required|valid_date[Y-m-d]',
        'ID_Cotizacion' => 'required|max_length[20]|is_not_unique[COTIZACIONES.ID_Cotizacion]',
        'Horas_Trabajadas' => 'permit_empty|decimal|greater_than_equal_to[0]',
        'Piezas_Sorteadas' => 'permit_empty|is_natural',
        'Monto_Devengado' => 'required|decimal|greater_than_equal_to[0]',
        'Estatus_Facturacion' => 'permit_empty|in_list[Pendiente,Facturado]',
    ];

    protected $validationMessages = [
        'ID_Cotizacion' => [
            'is_not_unique' => 'La cotizacion referenciada no existe.',
        ],
        'Monto_Devengado' => [
            'greater_than_equal_to' => 'El monto devengado no puede ser negativo.',
            'decimal' => 'El monto devengado debe ser numerico.',
        ],
    ];

    /**
     * Devengado de una cotizacion, paginado y filtrable por estatus (RF-DEV-01).
     *
     * @return array{rows: array<array-key, mixed>, total: int}
     */
    public function porCotizacion(string $idCotizacion, ?string $estatus, int $page, int $perPage): array
    {
        $builder = $this->builder()->where('ID_Cotizacion', $idCotizacion);
        if ($estatus !== null && $estatus !== '') {
            $builder->where('Estatus_Facturacion', $estatus);
        }

        $total = $builder->countAllResults(false);
        $res = $builder->orderBy('Fecha', 'ASC')
            ->orderBy('ID_Captura', 'ASC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get();
        $rows = $res === false ? [] : $res->getResultArray();

        return ['rows' => $rows, 'total' => (int) $total];
    }
}
