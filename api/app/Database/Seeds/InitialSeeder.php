<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use App\Models\WhitelistModel;
use CodeIgniter\Database\Seeder;
use CodeIgniter\Shield\Entities\User;
use CodeIgniter\Shield\Models\UserModel;

/**
 * Seeder inicial (Sprint 0).
 *
 * Produccion: solo inserta el correo semilla de la whitelist (SRS §2.3).
 * Dev/staging: ademas crea usuarios Shield por rol para poder ejercer el
 * flujo de auth/RBAC de punta a punta, incluido un "intruso" con credenciales
 * validas pero FUERA de la whitelist (Caso QA 5).
 *
 * Es idempotente: re-ejecutarlo no duplica registros.
 */
class InitialSeeder extends Seeder
{
    public function run(): void
    {
        $ericEmailEnv = env('bqs.seed.ericEmail');
        $ericEmail = strtolower(is_string($ericEmailEnv) && $ericEmailEnv !== '' ? $ericEmailEnv : 'eric@bestqualitysolutions.com');

        $pwdEnv = env('bqs.seed.ericPassword');
        $devPassword = is_string($pwdEnv) && $pwdEnv !== '' ? $pwdEnv : 'Bqs.Dev.2026!';

        // 1) Whitelist semilla — produccion-safe.
        $this->seedWhitelist($ericEmail);

        // 2) Usuarios Shield — solo dev/staging (nunca en produccion).
        if (ENVIRONMENT === 'production') {
            return;
        }

        // Direccion General (Eric): solo lectura, en whitelist.
        $this->seedUser($ericEmail, 'Eric - Direccion General', 'direccion', $devPassword, true);

        // Usuarios operativos para probar RBAC.
        $this->seedUser('admin@bestqualitysolutions.com', 'Administrador BQS', 'admin', $devPassword, true);
        $this->seedUser('facturacion@bestqualitysolutions.com', 'Cobranza BQS', 'facturacion', $devPassword, true);
        $this->seedUser('capturista@bestqualitysolutions.com', 'Captura Planta', 'capturista', $devPassword, true);

        // Caso QA 5: credenciales validas en Shield pero correo NO autorizado.
        $this->seedUser('intruso@competidor.com', 'Intruso', 'direccion', $devPassword, false);
    }

    private function seedWhitelist(string $correo): void
    {
        $model = model(WhitelistModel::class);
        if ($model->where('correo', $correo)->countAllResults() === 0) {
            $model->insert(['correo' => $correo, 'activo' => 1, 'creado_por' => null]);
        }
    }

    private function seedUser(string $email, string $nombre, string $group, string $password, bool $whitelist): void
    {
        $email = strtolower($email);
        $users = model(UserModel::class);

        if ($users->findByCredentials(['email' => $email]) === null) {
            $entity = new User(['active' => true]);
            $users->save($entity);

            /** @var User $user */
            $user = $users->findById($users->getInsertID());
            $user->createEmailIdentity(['email' => $email, 'password' => $password]);
            $user->addGroup($group);

            // `nombre` es columna propia (fuera de allowedFields de Shield).
            db_connect()->table('users')->where('id', $user->id)->update(['nombre' => $nombre]);
        }

        if ($whitelist) {
            $this->seedWhitelist($email);
        }
    }
}
