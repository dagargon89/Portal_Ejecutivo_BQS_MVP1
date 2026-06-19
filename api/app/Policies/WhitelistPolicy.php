<?php

declare(strict_types=1);

namespace App\Policies;

use CodeIgniter\Shield\Entities\User;

/**
 * Autorizacion del CRUD de whitelist (RF-CTA-01). Solo `admin`.
 */
class WhitelistPolicy extends Policy
{
    public static function canManage(?User $user): bool
    {
        return self::inAnyGroup($user, 'admin');
    }
}
