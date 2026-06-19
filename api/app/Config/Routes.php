<?php

declare(strict_types=1);

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */

// Salud del servicio (publico) — usado por smoke tests y CI.
$routes->get('api/v1/health', static function () {
    return service('response')->setJSON([
        'data' => ['status' => 'ok', 'service' => 'Portal Ejecutivo BQS API', 'version' => 'v1'],
    ]);
});

// =====================================================================
// API v1 — Portal Ejecutivo BQS
// Orden de barreras en rutas protegidas: tokens -> whitelist -> readonly
//   tokens   : Shield valida firma/hash/revocacion del Bearer (-> auth user)
//   whitelist: re-cruza AUTH_WHITELIST + expiracion 15 min del access token
//   readonly : el rol `direccion` solo puede GET (RF-AUTH-04)
// =====================================================================
$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1'], static function (RouteCollection $routes): void {
    // --- Sesion publica (con rate limit anti fuerza bruta) ---
    $routes->post('auth/login', 'AuthController::login', ['filter' => 'loginThrottle']);
    $routes->post('auth/refresh', 'AuthController::refresh', ['filter' => 'loginThrottle']);

    // --- Ciclo de vida de sesion (autenticado, SIN readonly) ---
    // logout es POST pero debe permitirse a todos los roles, incluido
    // `direccion`; por eso queda fuera del candado de solo lectura.
    $routes->group('', ['filter' => ['tokens', 'whitelist']], static function (RouteCollection $routes): void {
        $routes->post('auth/logout', 'AuthController::logout');
        $routes->get('auth/me', 'AuthController::me');
    });

    // --- Rutas de datos/negocio (autenticado + readonly para direccion) ---
    $routes->group('', ['filter' => ['tokens', 'whitelist', 'readonly']], static function (RouteCollection $routes): void {
        // CRUD de whitelist (rol admin) — RF-CTA-01
        $routes->get('admin/whitelist', 'Admin\WhitelistController::index');
        $routes->post('admin/whitelist', 'Admin\WhitelistController::create');
        $routes->delete('admin/whitelist/(:num)', 'Admin\WhitelistController::delete/$1');

        // Gestion de usuarios y roles (rol admin) — RF-CTA-02
        $routes->get('admin/usuarios', 'Admin\UsuariosController::index');
        $routes->put('admin/usuarios/(:num)/roles', 'Admin\UsuariosController::updateRoles/$1');

        // --- Sprint 2: Tier 0 ---
        // Clientes (lectura abierta; escritura solo admin via Policy) — RF-CLI
        $routes->get('clientes', 'Clientes\ClienteController::index');
        $routes->post('clientes', 'Clientes\ClienteController::create');
        $routes->get('clientes/(:segment)', 'Clientes\ClienteController::show/$1');
        $routes->put('clientes/(:segment)', 'Clientes\ClienteController::update/$1');
        $routes->delete('clientes/(:segment)', 'Clientes\ClienteController::delete/$1');

        // Cotizaciones (escritura facturacion/admin via Policy) — RF-COT
        $routes->get('cotizaciones', 'Cotizaciones\CotizacionController::index');
        $routes->post('cotizaciones', 'Cotizaciones\CotizacionController::create');
        $routes->get('cotizaciones/(:segment)', 'Cotizaciones\CotizacionController::show/$1');
        $routes->put('cotizaciones/(:segment)', 'Cotizaciones\CotizacionController::update/$1');

        // Importacion inicial asincrona (rol admin) — RF-ADM-02
        $routes->post('admin/import', 'Admin\ImportController::create');
        $routes->get('admin/jobs/(:num)', 'Admin\ImportController::jobShow/$1');

        // --- Sprint 3: Ciclo de Cobro (devengado -> factura -> pago) ---
        // Devengado por cotizacion (escritura solo capturista via Policy) — RF-DEV
        $routes->get('cotizaciones/(:segment)/devengado', 'Cotizaciones\DevengadoController::index/$1');
        $routes->post('cotizaciones/(:segment)/devengado', 'Cotizaciones\DevengadoController::create/$1');

        // Facturas (emision facturacion/admin via Policy) — RF-FAC
        $routes->get('facturas', 'Facturas\FacturaController::index');
        $routes->post('facturas', 'Facturas\FacturaController::create');
        $routes->get('facturas/(:segment)', 'Facturas\FacturaController::show/$1');

        // Pagos de una factura (registro facturacion/admin via Policy) — RF-PAG
        $routes->get('facturas/(:segment)/pagos', 'Facturas\PagoController::index/$1');
        $routes->post('facturas/(:segment)/pagos', 'Facturas\PagoController::create/$1');
    });
});
