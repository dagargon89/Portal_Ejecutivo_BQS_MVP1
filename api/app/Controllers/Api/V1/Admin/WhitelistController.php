<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Controllers\BaseApiController;
use App\Models\WhitelistModel;
use App\Policies\WhitelistPolicy;
use App\Services\AuditoriaTrait;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * CRUD de la whitelist de correos (RF-CTA-01). Solo rol `admin`.
 * Las escrituras se auditan dentro de su transaccion (CLAUDE.md #7).
 */
class WhitelistController extends BaseApiController
{
    use AuditoriaTrait;

    private const PER_PAGE_DEFAULT = 20;
    private const PER_PAGE_MAX = 100;

    public function index(): ResponseInterface
    {
        if (! WhitelistPolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $page = max(1, $this->queryInt('page', 1));
        $perPage = min(self::PER_PAGE_MAX, max(1, $this->queryInt('per_page', self::PER_PAGE_DEFAULT)));

        $model = model(WhitelistModel::class);
        $total = (int) $model->countAllResults(false);
        $rows = $model->orderBy('creado_en', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->findAll();

        return $this->ok($rows, ResponseInterface::HTTP_OK, [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => (int) ceil(max(1, $total) / $perPage),
        ]);
    }

    public function create(): ResponseInterface
    {
        if (! WhitelistPolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $correo = strtolower(trim((string) $this->input('correo')));
        if ($correo === '' || ! filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            return $this->validationError(['correo' => 'El correo es obligatorio y debe ser valido.']);
        }

        $model = model(WhitelistModel::class);
        if ($model->where('correo', $correo)->countAllResults() > 0) {
            return $this->error('CONFLICT', 'El correo ya existe en la whitelist.', ResponseInterface::HTTP_CONFLICT);
        }

        $db = db_connect();
        $db->transStart();

        $id = $model->insert([
            'correo' => $correo,
            'activo' => 1,
            'creado_por' => auth()->id(),
        ], true);

        $this->auditar('crear', 'AUTH_WHITELIST', (string) $id, null, ['correo' => $correo, 'activo' => 1]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->error('SERVER_ERROR', 'No se pudo registrar el correo.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->created($model->find((int) $id));
    }

    public function delete(int $id): ResponseInterface
    {
        if (! WhitelistPolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $model = model(WhitelistModel::class);
        $row = $model->find($id);
        if ($row === null) {
            return $this->notFound('El registro de whitelist no existe.');
        }

        $db = db_connect();
        $db->transStart();

        // Revocacion logica (preserva la trazabilidad), no borrado fisico.
        $model->update($id, ['activo' => 0]);
        $this->auditar('actualizar', 'AUTH_WHITELIST', (string) $id, ['activo' => (int) $row['activo']], ['activo' => 0]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->error('SERVER_ERROR', 'No se pudo revocar el correo.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->noContent();
    }
}
