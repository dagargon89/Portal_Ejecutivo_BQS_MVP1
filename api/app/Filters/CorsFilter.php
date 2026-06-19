<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

/**
 * CORS para la SPA en desarrollo (Vite en otro puerto). En produccion la SPA
 * y la API comparten origen (Apache), por lo que este filtro es transparente.
 *
 * Resuelve el preflight OPTIONS en la fase `before` (global, antes que los
 * filtros de auth) porque un preflight no incluye cabecera Authorization y
 * no debe recibir 401 del filtro `tokens`.
 */
class CorsFilter implements FilterInterface
{
    /**
     * @param list<string>|null $arguments
     */
    public function before(RequestInterface $request, $arguments = null): ?ResponseInterface
    {
        $origin = $request->getHeaderLine('Origin');

        if ($origin === '' || ! $this->isAllowed($origin)) {
            return null; // mismo origen o no permitido: sin cabeceras CORS
        }

        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            $response = Services::response();
            $this->applyHeaders($response, $origin);

            return $response->setStatusCode(ResponseInterface::HTTP_NO_CONTENT);
        }

        return null;
    }

    /**
     * @param list<string>|null $arguments
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): ?ResponseInterface
    {
        $origin = $request->getHeaderLine('Origin');

        if ($origin !== '' && $this->isAllowed($origin)) {
            $this->applyHeaders($response, $origin);
        }

        return null;
    }

    private function isAllowed(string $origin): bool
    {
        $rawEnv = env('bqs.cors.allowedOrigins');
        $raw = is_string($rawEnv) ? $rawEnv : '';
        $allowed = array_filter(array_map('trim', explode(',', $raw)));

        return in_array($origin, $allowed, true);
    }

    private function applyHeaders(ResponseInterface $response, string $origin): void
    {
        $response->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Vary', 'Origin')
            ->setHeader('Access-Control-Allow-Credentials', 'true')
            ->setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With')
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->setHeader('Access-Control-Max-Age', '3600');
    }
}
