<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Clientes;

use App\Controllers\BaseApiController;
use App\Models\ClienteModel;
use App\Policies\ClientePolicy;
use App\Services\AuditoriaTrait;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * CRUD de CAT_CLIENTES (RF-CLI). Lectura abierta a cualquier rol autenticado;
 * escritura solo `admin`. La baja es logica (Estatus=Inactivo).
 */
class ClienteController extends BaseApiController
{
    use AuditoriaTrait;

    private const PER_PAGE_DEFAULT = 20;
    private const PER_PAGE_MAX = 100;

    public function index(): ResponseInterface
    {
        $page = max(1, $this->queryInt('page', 1));
        $perPage = min(self::PER_PAGE_MAX, max(1, $this->queryInt('per_page', self::PER_PAGE_DEFAULT)));
        $q = $this->req()->getGet('q');
        $estatus = $this->req()->getGet('estatus');

        $res = model(ClienteModel::class)->buscar(
            is_string($q) ? $q : null,
            is_string($estatus) ? $estatus : null,
            $page,
            $perPage,
        );

        return $this->ok($res['rows'], ResponseInterface::HTTP_OK, [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $res['total'],
            'total_pages' => (int) ceil(max(1, $res['total']) / $perPage),
        ]);
    }

    public function show(string $id): ResponseInterface
    {
        $cliente = model(ClienteModel::class)->carteraDe($id);
        if ($cliente === null) {
            return $this->notFound('El cliente no existe.');
        }

        return $this->ok($cliente);
    }

    public function create(): ResponseInterface
    {
        if (! ClientePolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $datos = $this->datosDesdeEntrada();
        $model = model(ClienteModel::class);

        if ($datos['ID_Cliente'] !== '' && $model->find($datos['ID_Cliente']) !== null) {
            return $this->error('CONFLICT', 'El ID_Cliente ya existe.', ResponseInterface::HTTP_CONFLICT);
        }
        if ($datos['RFC'] !== null && $model->where('RFC', $datos['RFC'])->countAllResults() > 0) {
            return $this->error('CONFLICT', 'El RFC ya esta registrado en otro cliente.', ResponseInterface::HTTP_CONFLICT);
        }

        $db = db_connect();
        $db->transStart();
        if ($model->insert($datos) === false) {
            $db->transComplete();

            return $this->validationError($model->errors());
        }
        $this->auditar('crear', 'CAT_CLIENTES', $datos['ID_Cliente'], null, $datos);
        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->error('SERVER_ERROR', 'No se pudo crear el cliente.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->created($model->find($datos['ID_Cliente']));
    }

    public function update(string $id): ResponseInterface
    {
        if (! ClientePolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $model = model(ClienteModel::class);
        $antes = $model->find($id);
        if ($antes === null) {
            return $this->notFound('El cliente no existe.');
        }

        $datos = $this->datosDesdeEntrada();
        unset($datos['ID_Cliente']); // PK inmutable

        if ($datos['RFC'] !== null
            && $model->where('RFC', $datos['RFC'])->where('ID_Cliente !=', $id)->countAllResults() > 0) {
            return $this->error('CONFLICT', 'El RFC ya esta registrado en otro cliente.', ResponseInterface::HTTP_CONFLICT);
        }

        $db = db_connect();
        $db->transStart();
        if ($model->update($id, $datos) === false) {
            $db->transComplete();

            return $this->validationError($model->errors());
        }
        $this->auditar('actualizar', 'CAT_CLIENTES', $id, $antes, $datos);
        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->error('SERVER_ERROR', 'No se pudo actualizar el cliente.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->ok($model->find($id));
    }

    public function delete(string $id): ResponseInterface
    {
        if (! ClientePolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $model = model(ClienteModel::class);
        $antes = $model->find($id);
        if ($antes === null) {
            return $this->notFound('El cliente no existe.');
        }

        $db = db_connect();
        $db->transStart();
        // Baja LOGICA, nunca fisica (la fisica la bloquea la FK RESTRICT).
        $model->update($id, ['Estatus' => 'Inactivo']);
        $this->auditar('actualizar', 'CAT_CLIENTES', $id, ['Estatus' => $antes['Estatus']], ['Estatus' => 'Inactivo']);
        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->error('SERVER_ERROR', 'No se pudo dar de baja al cliente.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->ok([
            'ID_Cliente' => $id,
            'Estatus' => 'Inactivo',
            'message' => 'Cliente dado de baja logicamente.',
        ]);
    }

    /**
     * @return array{ID_Cliente: string, Nombre_Fiscal: string, Nombre_Comercial: ?string, RFC: ?string, Estatus: string}
     */
    private function datosDesdeEntrada(): array
    {
        $comercial = $this->input('Nombre_Comercial');
        $rfc = $this->input('RFC');
        $estatus = trim((string) $this->input('Estatus'));

        return [
            'ID_Cliente' => strtoupper(trim((string) $this->input('ID_Cliente'))),
            'Nombre_Fiscal' => trim((string) $this->input('Nombre_Fiscal')),
            'Nombre_Comercial' => $comercial !== null && trim((string) $comercial) !== '' ? trim((string) $comercial) : null,
            'RFC' => $rfc !== null && trim((string) $rfc) !== '' ? strtoupper(trim((string) $rfc)) : null,
            'Estatus' => $estatus !== '' ? $estatus : 'Activo',
        ];
    }
}
