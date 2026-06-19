<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Cabeceras de seguridad para la API JSON (Plan de Seguridad 04 §3, RNF-03).
 * La SPA se sirve aparte con su propia CSP; esta API no devuelve HTML, por lo
 * que su CSP es maximamente restrictiva (`default-src 'none'`).
 * HSTS solo se emite sobre HTTPS.
 */
class SecurityHeadersFilter implements FilterInterface
{
    /**
     * @param list<string>|null $arguments
     */
    public function before(RequestInterface $request, $arguments = null): ?ResponseInterface
    {
        return null; // las cabeceras se aplican en `after`.
    }

    /**
     * @param list<string>|null $arguments
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): ?ResponseInterface
    {
        $response->setHeader('X-Content-Type-Options', 'nosniff');
        $response->setHeader('X-Frame-Options', 'DENY');
        $response->setHeader('Referrer-Policy', 'no-referrer');
        $response->setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

        if ($request instanceof IncomingRequest && $request->isSecure()) {
            $response->setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return null;
    }
}
