<?php

declare(strict_types=1);

namespace App\Policies;

use CodeIgniter\Shield\Entities\User;

/**
 * Captura de devengado (BITACORA_SORTEO, RF-DEV-01). Roles `capturista` y `admin`.
 */
class BitacoraPolicy extends Policy
{
    public static function canManage(?User $user): bool
    {
        return self::inAnyGroup($user, 'capturista', 'admin');
    }
}
