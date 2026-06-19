<?php

declare(strict_types=1);

namespace App\Policies;

use CodeIgniter\Shield\Entities\User;

/**
 * Lectura del dashboard ejecutivo (RF-DASH, RF-MET-02). Lo consumen los roles
 * `direccion`, `facturacion` y `admin`; `capturista` no (API 05 §3). Es de solo
 * lectura: el filtro `readonly` ya impide cualquier escritura de `direccion`.
 */
class DashboardPolicy extends Policy
{
    public static function canRead(?User $user): bool
    {
        return self::inAnyGroup($user, 'direccion', 'facturacion', 'admin');
    }
}
