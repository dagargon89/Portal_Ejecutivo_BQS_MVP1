<?php

declare(strict_types=1);

namespace App\Policies;

use CodeIgniter\Shield\Entities\User;

/**
 * Emision de facturas y registro de pagos (RF-FAC-01, RF-PAG-01).
 * Roles `facturacion` y `admin`.
 */
class FacturaPolicy extends Policy
{
    public static function canManage(?User $user): bool
    {
        return self::inAnyGroup($user, 'facturacion', 'admin');
    }
}
