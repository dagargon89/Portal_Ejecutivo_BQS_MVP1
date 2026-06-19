<?php

declare(strict_types=1);

namespace App\Policies;

use CodeIgniter\Shield\Entities\User;

/**
 * Autorizacion de la gestion de usuarios y roles (RF-CTA-02). Solo `admin`.
 */
class UsuarioPolicy extends Policy
{
    public static function canManageRoles(?User $user): bool
    {
        return self::inAnyGroup($user, 'admin');
    }
}
