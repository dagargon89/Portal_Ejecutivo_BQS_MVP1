<?php

declare(strict_types=1);

namespace App\Filters;

use App\Models\WhitelistModel;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\I18n\Time;
use Config\Services;

/**
 * Segunda barrera de acceso (CLAUDE.md regla #4, ADR-003): en CADA peticion,
 * re-cruza el correo del usuario autenticado contra AUTH_WHITELIST (activo=1)
 * y aplica la expiracion corta (15 min) del access token (D1-A del plan).
 *
 * Debe ejecutarse DESPUES del filtro `tokens` de Shield.
 */
class WhitelistFilter implements FilterInterface
{
    /**
     * @param list<string>|null $arguments
     */
    public function before(RequestInterface $request, $arguments = null): ?ResponseInterface
    {
        $user = auth()->user();

        if ($user === null) {
            return $this->deny('TOKEN_INVALID', 'Token ausente o invalido.', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        // Expiracion corta del access token (Shield no la impone por tipo).
        $token = $user->currentAccessToken();
        if ($token !== null && $token->expires !== null && Time::now()->isAfter($token->expires)) {
            return $this->deny('TOKEN_EXPIRED', 'El access token expiro. Renueve la sesion.', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        // Whitelist: un correo revocado tras emitir el token pierde acceso de inmediato.
        $correo = (string) $user->getEmail();
        if ($correo === '' || ! model(WhitelistModel::class)->estaAutorizado($correo)) {
            return $this->deny('NOT_WHITELISTED', 'El correo no esta autorizado para acceder.', ResponseInterface::HTTP_FORBIDDEN);
        }

        return null;
    }

    /**
     * @param list<string>|null $arguments
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): ?ResponseInterface
    {
        return null;
    }

    private function deny(string $code, string $message, int $status): ResponseInterface
    {
        return Services::response()
            ->setStatusCode($status)
            ->setJSON(['error' => ['code' => $code, 'message' => $message]]);
    }
}
