<?php

declare(strict_types=1);

/**
 * This file is part of CodeIgniter Shield.
 *
 * (c) CodeIgniter Foundation <admin@codeigniter.com>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

namespace Config;

use CodeIgniter\Shield\Config\AuthGroups as ShieldAuthGroups;

class AuthGroups extends ShieldAuthGroups
{
    /**
     * --------------------------------------------------------------------
     * Default Group
     * --------------------------------------------------------------------
     * Grupo por defecto. Se fija en `direccion` (solo lectura) como valor
     * seguro: un usuario creado sin rol explicito queda incapaz de escribir
     * y, ademas, sigue requiriendo whitelist para acceder. La asignacion de
     * roles reales es explicita (seeder / CRUD de admin, RF-CTA-02).
     */
    public string $defaultGroup = 'direccion';

    /**
     * --------------------------------------------------------------------
     * Groups
     * --------------------------------------------------------------------
     * An associative array of the available groups in the system, where the keys
     * are the group names and the values are arrays of the group info.
     *
     * Whatever value you assign as the key will be used to refer to the group
     * when using functions such as:
     *      $user->addGroup('superadmin');
     *
     * @var array<string, array<string, string>>
     *
     * @see https://codeigniter4.github.io/shield/quick_start_guide/using_authorization/#change-available-groups for more info
     */
    public array $groups = [
        'direccion' => [
            'title'       => 'Direccion General',
            'description' => 'Perfil ejecutivo (Eric). SOLO LECTURA: sus tokens solo permiten GET.',
        ],
        'capturista' => [
            'title'       => 'Capturista',
            'description' => 'Captura de devengado (BITACORA_SORTEO).',
        ],
        'facturacion' => [
            'title'       => 'Facturacion',
            'description' => 'Cotizaciones, emision de facturas y registro de pagos.',
        ],
        'admin' => [
            'title'       => 'Administrador',
            'description' => 'Gestion de whitelist, usuarios y catalogos. Importacion inicial.',
        ],
    ];

    /**
     * --------------------------------------------------------------------
     * Permissions
     * --------------------------------------------------------------------
     * The available permissions in the system.
     *
     * If a permission is not listed here it cannot be used.
     */
    public array $permissions = [
        'whitelist.manage'   => 'Gestionar la lista blanca de correos (RF-CTA-01)',
        'usuarios.manage'    => 'Crear usuarios y asignar roles (RF-CTA-02)',
        'clientes.manage'    => 'Alta/edicion de clientes Tier 0 (Sprint 2)',
        'cotizaciones.manage' => 'Alta/edicion de cotizaciones (Sprint 2)',
        'devengado.capture'  => 'Captura de devengado / BITACORA_SORTEO (Sprint 3)',
        'facturas.manage'    => 'Emision de facturas (Sprint 3)',
        'pagos.manage'       => 'Registro de pagos (Sprint 3)',
        'dashboard.read'     => 'Lectura del dashboard ejecutivo (Sprint 4)',
    ];

    /**
     * --------------------------------------------------------------------
     * Permissions Matrix
     * --------------------------------------------------------------------
     * Maps permissions to groups.
     *
     * This defines group-level permissions.
     */
    public array $matrix = [
        // Direccion: estrictamente SOLO LECTURA (ademas lo refuerza el filtro readonly).
        'direccion' => [
            'dashboard.read',
        ],
        'capturista' => [
            'devengado.capture',
        ],
        'facturacion' => [
            'cotizaciones.manage',
            'facturas.manage',
            'pagos.manage',
            'dashboard.read',
        ],
        'admin' => [
            'whitelist.manage',
            'usuarios.manage',
            'clientes.manage',
            'cotizaciones.manage',
            'dashboard.read',
        ],
    ];
}
