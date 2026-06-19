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
        return $this->siguiente('COTIZACIONES', 'ID_Cotizacion', 'COT-');
    }

    public function siguienteCaptura(): string
    {
        return $this->siguiente('BITACORA_SORTEO', 'ID_Captura', 'BIT-');
    }

    public function siguienteFactura(): string
    {
        return $this->siguiente('FACTURAS', 'Folio_Factura', 'FAC-');
    }

    public function siguientePago(): string
    {
        return $this->siguiente('PAGOS', 'ID_Pago', 'PAG-');
    }

    /**
     * Siguiente ID con formato `<prefijo>####` a partir del maximo existente con
     * ese prefijo. El prefijo de 4 caracteres ("COT-", "BIT-", ...) implica que
     * la parte numerica arranca en la posicion 5.
     */
    private function siguiente(string $tabla, string $columna, string $prefijo): string
    {
        $res = db_connect()->table($tabla)
            ->select("MAX(CAST(SUBSTRING({$columna}, 5) AS UNSIGNED)) AS maxnum", false)
            ->like($columna, $prefijo, 'after')
            ->get();
        $row = $res === false ? null : $res->getRowArray();

        $next = (int) ($row['maxnum'] ?? 0) + 1;

        return $prefijo . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
