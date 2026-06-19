<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

/**
 * ReadOnlyGuard (RF-AUTH-04, CLAUDE.md regla #3): el rol `direccion` (Eric)
 * es estrictamente de SOLO LECTURA. Cualquier metodo distinto de GET/HEAD/
 * OPTIONS se rechaza con 403 antes de tocar el controlador o la BD.
 *
 * Debe ejecutarse DESPUES del filtro `tokens` (que puebla auth()->user()).
 */
class ReadOnlyFilter implements FilterInterface
{
    /**
     * @param list<string>|null $arguments
     */
    public function before(RequestInterface $request, $arguments = null): ?ResponseInterface
    {
        $method = strtoupper($request->getMethod());
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return null; // lectura permitida
        }

        $user = auth()->user();
        if ($user !== null && $user->inGroup('direccion')) {
            return Services::response()
                ->setStatusCode(ResponseInterface::HTTP_FORBIDDEN)
                ->setJSON([
                    'error' => [
                        'code' => 'READ_ONLY',
                        'message' => 'El perfil de Direccion General es de solo lectura.',
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
