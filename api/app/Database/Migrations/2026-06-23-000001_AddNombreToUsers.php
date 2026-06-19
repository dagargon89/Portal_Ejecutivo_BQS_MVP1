<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Agrega la columna `nombre` (display) a la tabla `users` de Shield.
 * El contrato de la API (05 §2: /auth/login y /auth/me) devuelve un
 * nombre legible para la UI; Shield no provee un campo de nombre.
 */
class AddNombreToUsers extends Migration
{
    public function up(): void
    {
        $usersTable = config('Auth')->tables['users'] ?? 'users';
        $this->forge->addColumn($usersTable, [
            'nombre' => [
                'type' => 'VARCHAR',
                'constraint' => 150,
                'null' => true,
                'after' => 'username',
            ],
        ]);
    }

    public function down(): void
    {
        $usersTable = config('Auth')->tables['users'] ?? 'users';
        $this->forge->dropColumn($usersTable, 'nombre');
    }
}
