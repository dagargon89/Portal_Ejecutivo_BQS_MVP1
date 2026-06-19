<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Cotizaciones;

use App\Controllers\BaseApiController;
use App\Models\ClienteModel;
use App\Models\CotizacionModel;
use App\Policies\CotizacionPolicy;
use App\Services\AuditoriaTrait;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * CRUD de COTIZACIONES (RF-COT). Escritura: roles `facturacion`/`admin`.
 */
class CotizacionController extends BaseApiController
{
    use AuditoriaTrait;

    private const PER_PAGE_DEFAULT = 20;
    private const PER_PAGE_MAX = 100;

    public function index(): ResponseInterface
    {
        $page = max(1, $this->queryInt('page', 1));
        $perPage = min(self::PER_PAGE_MAX, max(1, $this->queryInt('per_page', self::PER_PAGE_DEFAULT)));

        $model = model(CotizacionModel::class);
        $idCliente = $this->req()->getGet('id_cliente');
        $estatus = $this->req()->getGet('estatus');
        if (is_string($idCliente) && $idCliente !== '') {
            $model->where('ID_Cliente', $idCliente);
        }
        if (is_string($estatus) && $estatus !== '') {
            $model->where('Estatus', $estatus);
        }

        $total = (int) $model->countAllResults(false);
        $rows = $model->orderBy('ID_Cotizacion', 'ASC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->findAll();

        return $this->ok($rows, ResponseInterface::HTTP_OK, [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => (int) ceil(max(1, $total) / $perPage),
        ]);
    }

    public function show(string $id): ResponseInterface
    {
        $cotizacion = model(CotizacionModel::class)->consumoDe($id);
        if ($cotizacion === null) {
            return $this->notFound('La cotizacion no existe.');
        }

        return $this->ok($cotizacion);
    }

    public function create(): ResponseInterface
    {
        if (! CotizacionPolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $model = model(CotizacionModel::class);
        $idCot = strtoupper(trim((string) $this->input('ID_Cotizacion')));
        $idCliente = strtoupper(trim((string) $this->input('ID_Cliente')));

        if ($idCot !== '' && $model->find($idCot) !== null) {
            return $this->error('CONFLICT', 'El ID_Cotizacion ya existe.', ResponseInterface::HTTP_CONFLICT);
        }
        if ($idCliente === '' || model(ClienteModel::class)->find($idCliente) === null) {
            return $this->notFound('El cliente referenciado no existe.');
        }

        $datos = $this->datosDesdeEntrada($idCot, $idCliente);

        $db = db_connect();
        $db->transStart();
        if ($model->insert($datos) === false) {
            $db->transComplete();

            return $this->validationError($model->errors());
        }
        $this->auditar('crear', 'COTIZACIONES', $idCot, null, $datos);
        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->error('SERVER_ERROR', 'No se pudo crear la cotizacion.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->created($model->find($idCot));
    }

    public function update(string $id): ResponseInterface
    {
        if (! CotizacionPolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $model = model(CotizacionModel::class);
        $antes = $model->find($id);
        if ($antes === null) {
            return $this->notFound('La cotizacion no existe.');
        }

        // ID_Cotizacion e ID_Cliente son inmutables en la edicion.
        $datos = $this->datosDesdeEntrada($id, (string) $antes['ID_Cliente']);
        unset($datos['ID_Cotizacion'], $datos['ID_Cliente']);

        $db = db_connect();
        $db->transStart();
        if ($model->update($id, $datos) === false) {
            $db->transComplete();

            return $this->validationError($model->errors());
        }
        $this->auditar('actualizar', 'COTIZACIONES', $id, $antes, $datos);
        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->error('SERVER_ERROR', 'No se pudo actualizar la cotizacion.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->ok($model->find($id));
    }

    /**
     * @return array<string,mixed>
     */
    private function datosDesdeEntrada(string $idCot, string $idCliente): array
    {
        $po = $this->input('PO_Referencia');
        $piezas = $this->input('Piezas_Autorizadas');

        return [
            'ID_Cotizacion' => $idCot,
            'ID_Cliente' => $idCliente,
            'PO_Referencia' => $po !== null && trim((string) $po) !== '' ? trim((string) $po) : null,
            'Monto_Autorizado' => trim((string) $this->input('Monto_Autorizado')),
            'Piezas_Autorizadas' => $piezas !== null && trim((string) $piezas) !== '' ? (int) $piezas : null,
            'Estatus' => trim((string) $this->input('Estatus')) !== '' ? trim((string) $this->input('Estatus')) : 'Pendiente PO',
        ];
    }
}
