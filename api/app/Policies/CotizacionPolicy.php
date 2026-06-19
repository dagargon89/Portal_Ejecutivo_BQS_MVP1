<?php

declare(strict_types=1);

namespace App\Policies;

use CodeIgniter\Shield\Entities\User;

/**
 * Gestion de cotizaciones (RF-COT-01). Roles `facturacion` y `admin`.
 */
class CotizacionPolicy extends Policy
{
    public static function canManage(?User $user): bool
    {
        return self::inAnyGroup($user, 'facturacion', 'admin');
    }
}
