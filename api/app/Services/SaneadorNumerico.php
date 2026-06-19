<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DatoInvalidoException;

/**
 * Saneo numerico estricto de la importacion (RF-ADM-02 / RF-DEV-02): rechaza
 * texto, "N/A", vacios y negativos; normaliza separadores de miles/decimales.
 */
final class SaneadorNumerico
{
    private const NO_APLICA = ['', 'n/a', 'na', 'n.a.', 'nan', 'null', 'pendiente', 'pendientes', '-', '--'];

    /**
     * Convierte un valor a DECIMAL(14,2) como string. Lanza DatoInvalidoException
     * si no es un numero valido o es negativo.
     *
     * @param mixed $valor
     */
    public static function aDecimal($valor): string
    {
        $num = self::aFloat($valor);

        return number_format($num, 2, '.', '');
    }

    /**
     * Convierte un valor a entero no negativo. Lanza DatoInvalidoException si
     * no es valido, es negativo o tiene parte decimal.
     *
     * @param mixed $valor
     */
    public static function aEntero($valor): int
    {
        $num = self::aFloat($valor);
        if (floor($num) !== $num) {
            throw new DatoInvalidoException("Se esperaba un entero, se recibio: '{$num}'.");
        }

        return (int) $num;
    }

    /**
     * @param mixed $valor
     */
    private static function aFloat($valor): float
    {
        if (is_int($valor) || is_float($valor)) {
            $num = (float) $valor;
        } else {
            $s = trim((string) $valor);
            if (in_array(mb_strtolower($s), self::NO_APLICA, true)) {
                throw new DatoInvalidoException("Valor numerico vacio o no aplicable: '{$s}'.");
            }

            // Quitar simbolos de moneda y espacios; conservar digitos, signo y separadores.
            $s = preg_replace('/[^\d.,\-]/u', '', $s) ?? $s;

            // Resolver separadores: si hay coma y punto, la coma es de miles.
            if (str_contains($s, ',') && str_contains($s, '.')) {
                $s = str_replace(',', '', $s);
            } elseif (str_contains($s, ',')) {
                $s = str_replace(',', '.', $s); // coma decimal
            }

            if ($s === '' || ! is_numeric($s)) {
                throw new DatoInvalidoException("Valor numerico invalido: '{$valor}'.");
            }
            $num = (float) $s;
        }

        if ($num < 0) {
            throw new DatoInvalidoException("Valor numerico negativo no permitido: '{$valor}'.");
        }

        return $num;
    }
}
