<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Controllers\BaseApiController;
use App\Models\WhitelistModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\I18n\Time;
use CodeIgniter\Shield\Entities\User;
use CodeIgniter\Shield\Models\UserIdentityModel;
use CodeIgniter\Shield\Models\UserModel;

/**
 * Ciclo de vida de la sesion (RF-AUTH-01..04, 05 §2).
 * Doble barrera: credenciales validas (Shield) + correo en whitelist.
 * Access token Bearer de vida corta (15 min) + refresh en cookie HttpOnly.
 */
class AuthController extends BaseApiController
{
    private const ACCESS_TOKEN_NAME = 'spa_access';

    /**
     * POST /v1/auth/login — publico (con rate limit `loginThrottle`).
     */
    public function login(): ResponseInterface
    {
        $rules = [
            'correo' => 'required|valid_email',
            'password' => 'required|string',
        ];
        if (! $this->validate($rules)) {
            return $this->error(
                'BAD_REQUEST',
                'Cuerpo ausente o malformado.',
                ResponseInterface::HTTP_BAD_REQUEST,
                $this->validator !== null ? $this->validator->getErrors() : []
            );
        }

        $correo = strtolower(trim((string) $this->input('correo')));
        $password = (string) $this->input('password');

        // Barrera 1: credenciales. Se usa EXPLICITAMENTE el autenticador de
        // sesion (no el por defecto, que en un proceso de larga vida puede
        // quedar fijado en 'tokens' tras una ruta protegida). check() valida
        // sin crear sesion: la API es stateless y emite su propio token.
        $result = auth('session')->check(['email' => $correo, 'password' => $password]);
        if (! $result->isOK()) {
            return $this->error('BAD_CREDENTIALS', 'Credenciales incorrectas.', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $user = $result->extraInfo();
        if (! $user instanceof User) {
            return $this->error('SERVER_ERROR', 'No se pudo resolver el usuario autenticado.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        // Barrera 2: whitelist (RF-AUTH-01, Caso QA 5).
        if (! model(WhitelistModel::class)->estaAutorizado($correo)) {
            return $this->error('NOT_WHITELISTED', 'El correo no esta autorizado para acceder.', ResponseInterface::HTTP_FORBIDDEN);
        }

        $accessTTL = $this->accessTtl();
        $token = $this->issueAccessToken($user, $accessTTL);
        $this->setRefreshCookie((int) $user->id);

        return $this->ok([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $accessTTL,
            'usuario' => $this->usuarioPayload($user),
        ]);
    }

    /**
     * POST /v1/auth/refresh — sin Bearer; usa la cookie HttpOnly de refresh.
     */
    public function refresh(): ResponseInterface
    {
        $cookie = $this->req()->getCookie('refresh_token');
        $raw = is_string($cookie) ? $cookie : '';

        $refresh = service('refreshTokenService');
        $userId = $refresh->userIdFromRaw($raw);
        if ($userId === null) {
            return $this->error('TOKEN_INVALID', 'Refresh token ausente, invalido o expirado.', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        /** @var User|null $user */
        $user = model(UserModel::class)->findById($userId);
        if ($user === null) {
            return $this->error('TOKEN_INVALID', 'Refresh token invalido.', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        // Revalida whitelist en cada refresh (un revocado no obtiene nuevo token).
        if (! model(WhitelistModel::class)->estaAutorizado((string) $user->getEmail())) {
            return $this->error('NOT_WHITELISTED', 'El correo ya no esta autorizado.', ResponseInterface::HTTP_FORBIDDEN);
        }

        $accessTTL = $this->accessTtl();
        $token = $this->issueAccessToken($user, $accessTTL);
        // Rotacion del refresh.
        $this->setRefreshCookie((int) $user->id);

        return $this->ok([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $accessTTL,
        ]);
    }

    /**
     * POST /v1/auth/logout — Bearer. Revoca access token activo y refresh.
     */
    public function logout(): ResponseInterface
    {
        /** @var User|null $user */
        $user = auth()->user();
        if ($user !== null) {
            $current = $user->currentAccessToken();
            if ($current !== null) {
                model(UserIdentityModel::class)->delete($current->id);
            }
            service('refreshTokenService')->revokeAllForUser((int) $user->id);
            auth()->logout();
        }

        $this->clearRefreshCookie();

        return $this->ok(['message' => 'Sesion cerrada. Token revocado.']);
    }

    /**
     * GET /v1/auth/me — Bearer. Perfil y roles efectivos.
     */
    public function me(): ResponseInterface
    {
        /** @var User $user */
        $user = auth()->user();

        return $this->ok($this->usuarioPayload($user, true));
    }

    // ----------------------------------------------------------------- helpers

    private function issueAccessToken(User $user, int $ttlSeconds): string
    {
        $token = $user->generateAccessToken(self::ACCESS_TOKEN_NAME);

        // Shield no impone expiracion por tipo: la fijamos explicitamente (D1-A).
        model(UserIdentityModel::class)->update($token->id, [
            'expires' => Time::now()->addSeconds($ttlSeconds),
        ]);

        return $token->raw_token;
    }

    private function setRefreshCookie(int $userId): void
    {
        $refresh = service('refreshTokenService');
        $refresh->revokeAllForUser($userId); // rotacion: un solo refresh activo
        $raw = $refresh->issue($userId, $this->refreshTtl());

        $this->response->setCookie([
            'name' => 'refresh_token',
            'value' => $raw,
            'expire' => $this->refreshTtl(),
            'path' => '/api/v1/auth',
            'secure' => $this->cookieSecure(),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }

    private function clearRefreshCookie(): void
    {
        $this->response->setCookie([
            'name' => 'refresh_token',
            'value' => '',
            'expire' => -1,
            'path' => '/api/v1/auth',
            'secure' => $this->cookieSecure(),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function usuarioPayload(User $user, bool $conSoloLectura = false): array
    {
        $roles = $user->getGroups() ?? [];
        $correo = (string) $user->getEmail();

        $payload = [
            'id' => (int) $user->id,
            'correo' => $correo,
            'nombre' => $this->resolveNombre($user, $correo),
            'roles' => array_values($roles),
        ];

        if ($conSoloLectura) {
            $payload['solo_lectura'] = in_array('direccion', $roles, true);
        }

        return $payload;
    }

    private function resolveNombre(User $user, string $correo): string
    {
        if (is_string($user->nombre) && $user->nombre !== '') {
            return $user->nombre;
        }
        if (is_string($user->username) && $user->username !== '') {
            return $user->username;
        }

        return explode('@', $correo)[0];
    }

    private function accessTtl(): int
    {
        $value = env('bqs.token.accessTTL');

        return is_numeric($value) ? (int) $value : 900;
    }

    private function refreshTtl(): int
    {
        $value = env('bqs.token.refreshTTL');

        return is_numeric($value) ? (int) $value : 2592000;
    }

    private function cookieSecure(): bool
    {
        return filter_var(env('bqs.cookie.secure') ?? false, FILTER_VALIDATE_BOOLEAN);
    }
}
