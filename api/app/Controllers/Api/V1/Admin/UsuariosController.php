<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Controllers\BaseApiController;
use App\Policies\UsuarioPolicy;
use App\Services\AuditoriaTrait;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Shield\Entities\User;
use CodeIgniter\Shield\Models\UserModel;

/**
 * Gestion de usuarios y asignacion de roles (RF-CTA-02). Solo rol `admin`.
 * El catalogo de roles es cerrado; un rol fuera de el se rechaza con 422.
 * Nota: asignar `direccion` no habilita escritura — el filtro readonly la
 * bloquea igual (RF-AUTH-04).
 */
class UsuariosController extends BaseApiController
{
    use AuditoriaTrait;

    private const ROLES_VALIDOS = ['direccion', 'capturista', 'facturacion', 'admin'];

    public function index(): ResponseInterface
    {
        if (! UsuarioPolicy::canManageRoles(auth()->user())) {
            return $this->forbidden();
        }

        $users = model(UserModel::class)->orderBy('id', 'ASC')->findAll();

        $data = array_map(static function (User $u): array {
            return [
                'id' => (int) $u->id,
                'correo' => (string) $u->getEmail(),
                'nombre' => $u->nombre ?? (string) $u->username,
                'roles' => array_values($u->getGroups() ?? []),
            ];
        }, $users);

        return $this->ok($data);
    }

    public function updateRoles(int $id): ResponseInterface
    {
        if (! UsuarioPolicy::canManageRoles(auth()->user())) {
            return $this->forbidden();
        }

        $input = $this->req()->getJSON(true);
        $roles = is_array($input) ? ($input['roles'] ?? null) : null;

        if (! is_array($roles) || $roles === []) {
            return $this->validationError(['roles' => 'Debe enviar al menos un rol.']);
        }

        foreach ($roles as $rol) {
            if (! in_array($rol, self::ROLES_VALIDOS, true)) {
                return $this->validationError([
                    'roles' => 'Rol no permitido: ' . (string) $rol . '. Validos: ' . implode(', ', self::ROLES_VALIDOS) . '.',
                ]);
            }
        }

        /** @var User|null $user */
        $user = model(UserModel::class)->findById($id);
        if ($user === null) {
            return $this->notFound('El usuario no existe.');
        }

        $rolesAntes = array_values($user->getGroups() ?? []);

        $db = db_connect();
        $db->transStart();

        $user->syncGroups(...$roles);
        $this->auditar('actualizar', 'users', (string) $id, ['roles' => $rolesAntes], ['roles' => array_values($roles)]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->error('SERVER_ERROR', 'No se pudieron actualizar los roles.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->ok([
            'id' => $id,
            'correo' => (string) $user->getEmail(),
            'roles' => array_values($roles),
        ]);
    }
}
