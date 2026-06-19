<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

/**
 * Rate limiting anti fuerza bruta para los endpoints de sesion
 * (login/refresh), grupo `auth` del 05 §1.5: 10 peticiones por minuto por IP.
 */
class LoginThrottleFilter implements FilterInterface
{
    private const CAPACITY = 10;

    /**
     * @param list<string>|null $arguments
     */
    public function before(RequestInterface $request, $arguments = null): ?ResponseInterface
    {
        // El rate limiting es una preocupacion de integracion (se verifica en
        // vivo). Se omite en el entorno de pruebas para no interferir entre
        // tests; en development/production sigue activo.
        if (ENVIRONMENT === 'testing') {
            return null;
        }

        $throttler = Services::throttler();
        $key = 'auth_' . md5($request->getIPAddress());

        if ($throttler->check($key, self::CAPACITY, MINUTE) === false) {
            return Services::response()
                ->setStatusCode(ResponseInterface::HTTP_TOO_MANY_REQUESTS)
                ->setHeader('Retry-After', (string) $throttler->getTokenTime())
                ->setJSON([
                    'error' => [
                        'code' => 'RATE_LIMITED',
                        'message' => 'Demasiadas solicitudes. Intente de nuevo en unos segundos.',
                    ],
                ]);
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
}
