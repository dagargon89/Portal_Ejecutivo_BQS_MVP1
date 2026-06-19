<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Genera identificadores de negocio secuenciales (p. ej. COT-0001) para las
 * filas de la importacion que no traen ID. Los IDs creados manualmente vienen
 * en el cuerpo de la peticion (la fuente es la autoridad).
 */
final class IdSecuencial
{
    public function siguienteCotizacion(): string
    {
        $res = db_connect()->table('COTIZACIONES')
            ->select('MAX(CAST(SUBSTRING(ID_Cotizacion, 5) AS UNSIGNED)) AS maxnum', false)
            ->like('ID_Cotizacion', 'COT-', 'after')
            ->get();
        $row = $res === false ? null : $res->getRowArray();

        $next = (int) ($row['maxnum'] ?? 0) + 1;

        return 'COT-' . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
