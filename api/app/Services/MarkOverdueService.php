<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditoriaModel;

/**
 * Marca `Vencida` las facturas `Vigente` cuyo vencimiento ya paso (RF-FAC-02,
 * §4.2 regla 5). Solo el sistema (cron `bqs:mark-overdue`) dispara esta
 * transicion. Idempotente: re-ejecutarlo no produce cambios adicionales.
 */
final class MarkOverdueService
{
    /**
     * @return array{marcadas: int, fecha: string}
     */
    public function marcar(): array
    {
        $db = db_connect();
        $hoy = date('Y-m-d');

        // "hoy > Fecha_Vencimiento" => vencimiento estrictamente anterior a hoy.
        // Solo `Vigente`: las pagadas ya son terminales; las ya `Vencida` no cambian.
        $afectadas = (int) $db->table('FACTURAS')
            ->where('Estatus_Pago', 'Vigente')
            ->where('Fecha_Vencimiento <', $hoy)
            ->countAllResults();

        if ($afectadas > 0) {
            $db->table('FACTURAS')
                ->where('Estatus_Pago', 'Vigente')
                ->where('Fecha_Vencimiento <', $hoy)
                ->update(['Estatus_Pago' => 'Vencida']);

            model(AuditoriaModel::class)->registrar(
                null, // accion del sistema (cron), sin usuario
                'actualizar',
                'FACTURAS',
                null,
                null,
                ['marcadas_vencida' => $afectadas, 'fecha' => $hoy],
                null
            );
        }

        return ['marcadas' => $afectadas, 'fecha' => $hoy];
    }
}
