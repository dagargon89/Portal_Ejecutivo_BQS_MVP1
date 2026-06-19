<?php

declare(strict_types=1);

namespace App\Policies;

use CodeIgniter\Shield\Entities\User;

/**
 * Disparo de la importacion inicial (RF-ADM-02). Solo `admin`.
 */
class ImportPolicy extends Policy
{
    public static function canRun(?User $user): bool
    {
        return self::inAnyGroup($user, 'admin');
    }
}
