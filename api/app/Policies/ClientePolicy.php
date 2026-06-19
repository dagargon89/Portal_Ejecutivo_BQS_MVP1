<?php

declare(strict_types=1);

namespace App\Policies;

use CodeIgniter\Shield\Entities\User;

/**
 * Gestion de clientes (RF-CLI-02). Solo `admin`. La lectura es abierta a
 * cualquier rol autenticado (la maneja el filtro readonly para GET).
 */
class ClientePolicy extends Policy
{
    public static function canManage(?User $user): bool
    {
        return self::inAnyGroup($user, 'admin');
    }
}
