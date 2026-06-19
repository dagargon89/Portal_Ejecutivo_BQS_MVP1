<?php

declare(strict_types=1);

namespace App\Policies;

use CodeIgniter\Shield\Entities\User;

/**
 * Base de autorizacion del lado servidor (Arquitectura §3.5, CLAUDE.md #1).
 * Las Policies son la autoridad: el cliente nunca decide permisos.
 */
abstract class Policy
{
    protected static function inAnyGroup(?User $user, string ...$groups): bool
    {
        if ($user === null) {
            return false;
        }

        foreach ($groups as $group) {
            if ($user->inGroup($group)) {
                return true;
            }
        }

        return false;
    }
}
