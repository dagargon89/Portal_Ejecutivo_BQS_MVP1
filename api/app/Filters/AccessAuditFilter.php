<?php

declare(strict_types=1);

namespace App\Filters;

use App\Models\AuditoriaModel;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Auditoria de accesos de lectura de la Direccion General (RF-MET-01, roadmap
 * Sprint 5, CLAUDE.md #7): cada GET exitoso de un usuario del grupo `direccion`
 * sobre una ruta sensible (dashboard) se registra en AUDITORIA con accion
 * `acceso`, para trazabilidad forense (TC-MET-02 / TC-SEC-10).
 *
 * Se ejecuta como filtro `after` y DESPUES de `tokens`/`whitelist` (auth()->user()
 * ya esta poblado). Solo registra lecturas exitosas (status < 400) de `direccion`,
 * no las de otros roles ni los accesos denegados.
 */
class AccessAuditFilter implements FilterInterface
{
    /**
     * @param list<string>|null $arguments
     */
    public function before(RequestInterface $request, $arguments = null): ?ResponseInterface
    {
        return null; // el registro se hace en `after`, con el status ya conocido.
    }

    /**
     * @param list<string>|null $arguments
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): ?ResponseInterface
    {
        $method = strtoupper($request->getMethod());
        if (! in_array($method, ['GET', 'HEAD'], true)) {
            return null;
        }

        if ($response->getStatusCode() >= 400) {
            return null; // solo accesos exitosos
        }

        $user = auth()->user();
        if ($user === null || ! $user->inGroup('direccion')) {
            return null; // solo la Direccion General se audita a nivel de acceso
        }

        $ruta = $request instanceof IncomingRequest ? $request->getPath() : '';
        $id = auth()->id();

        model(AuditoriaModel::class)->registrar(
            $id !== null ? (int) $id : null,
            'acceso',
            $ruta,
            null,
            null,
            null,
            $request->getIPAddress()
        );

        return null;
    }
}
