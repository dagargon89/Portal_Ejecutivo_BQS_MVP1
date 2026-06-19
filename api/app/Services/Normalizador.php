<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Normalizacion canonica de nombres para el mapeo de alias (M-08).
 * La misma funcion se usa al registrar alias y al resolver filas de la
 * importacion, garantizando coincidencias deterministas.
 */
final class Normalizador
{
    public static function nombre(string $texto): string
    {
        $t = mb_strtolower(trim($texto), 'UTF-8');

        // Quitar acentos comunes del espanol.
        $t = strtr($t, [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'ü' => 'u', 'ñ' => 'n',
        ]);

        // Quitar sufijos societarios frecuentes (S.A. de C.V., S. de R.L., etc.).
        $t = preg_replace('/\b(s\.?a\.?\s*de\s*c\.?v\.?|s\.?\s*de\s*r\.?l\.?(\s*de\s*c\.?v\.?)?|s\.?a\.?p\.?i\.?(\s*de\s*c\.?v\.?)?|s\.?c\.?)\b/u', ' ', $t) ?? $t;

        // Reemplazar puntuacion por espacio y colapsar espacios.
        $t = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $t) ?? $t;
        $t = preg_replace('/\s+/u', ' ', $t) ?? $t;

        return trim($t);
    }
}
