<?php

declare(strict_types=1);

namespace App\Services;

use CodeIgniter\I18n\Time;
use CodeIgniter\Shield\Models\UserIdentityModel;

/**
 * Gestion del refresh token (ADR-003, D1-A del plan).
 *
 * El refresh se guarda como una identidad de Shield de tipo propio
 * `refresh_token` (NO `access_token`), por lo que el autenticador Bearer de
 * Shield jamas lo acepta como access token. El valor en claro viaja unicamente
 * por la cookie HttpOnly; en BD se almacena su hash SHA-256.
 */
class RefreshTokenService
{
    public const TYPE = 'refresh_token';
    public const NAME = 'spa_refresh';

    private UserIdentityModel $identities;

    public function __construct()
    {
        $this->identities = model(UserIdentityModel::class);
    }

    /**
     * Emite un refresh token nuevo y devuelve el valor en claro (para la cookie).
     */
    public function issue(int $userId, int $ttlSeconds): string
    {
        $raw = bin2hex(random_bytes(32));

        $this->identities->insert([
            'user_id' => $userId,
            'type' => self::TYPE,
            'name' => self::NAME,
            'secret' => hash('sha256', $raw),
            'expires' => Time::now()->addSeconds($ttlSeconds),
        ]);

        return $raw;
    }

    /**
     * Valida un refresh token en claro; devuelve el user_id o null si es
     * invalido / expirado / inexistente.
     */
    public function userIdFromRaw(string $raw): ?int
    {
        $raw = trim($raw);
        if ($raw === '') {
            return null;
        }

        $row = $this->identities
            ->where('type', self::TYPE)
            ->where('secret', hash('sha256', $raw))
            ->first();

        if ($row === null) {
            return null;
        }

        $expires = $row->expires ?? null;
        if ($expires !== null) {
            $exp = $expires instanceof Time ? $expires : Time::parse((string) $expires);
            if (Time::now()->isAfter($exp)) {
                return null;
            }
        }

        return (int) $row->user_id;
    }

    /**
     * Revoca todos los refresh tokens de un usuario (logout / rotacion).
     */
    public function revokeAllForUser(int $userId): void
    {
        $this->identities
            ->where('user_id', $userId)
            ->where('type', self::TYPE)
            ->delete();
    }
}
