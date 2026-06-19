<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Facturas;

use App\Controllers\BaseApiController;
use App\Models\FacturaModel;
use App\Policies\FacturaPolicy;
use App\Services\FacturaService;
use App\Services\IdSecuencial;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * FACTURAS (RF-FAC). Lectura abierta a cualquier rol autenticado; emision solo
 * `facturacion`/`admin`. La emision es una transaccion ACID en FacturaService.
 */
class FacturaController extends BaseApiController
{
    private const PER_PAGE_DEFAULT = 20;
    private const PER_PAGE_MAX = 100;

    public function index(): ResponseInterface
    {
        $page = max(1, $this->queryInt('page', 1));
        $perPage = min(self::PER_PAGE_MAX, max(1, $this->queryInt('per_page', self::PER_PAGE_DEFAULT)));

        $model = model(FacturaModel::class);
        $idCliente = $this->req()->getGet('id_cliente');
        $estatus = $this->req()->getGet('estatus');
        $desde = $this->req()->getGet('desde');
        $hasta = $this->req()->getGet('hasta');
        if (is_string($idCliente) && $idCliente !== '') {
            $model->where('ID_Cliente', $idCliente);
        }
        if (is_string($estatus) && $estatus !== '') {
            $model->where('Estatus_Pago', $estatus);
        }
        if (is_string($desde) && $desde !== '') {
            $model->where('Fecha_Emision >=', $desde);
        }
        if (is_string($hasta) && $hasta !== '') {
            $model->where('Fecha_Emision <=', $hasta);
        }

        $total = (int) $model->countAllResults(false);
        $rows = $model->orderBy('Fecha_Emision', 'DESC')
            ->orderBy('Folio_Factura', 'ASC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->findAll();

        return $this->ok($rows, ResponseInterface::HTTP_OK, [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => (int) ceil(max(1, $total) / $perPage),
        ]);
    }

    public function show(string $folio): ResponseInterface
    {
        $factura = model(FacturaModel::class)->detalleDe($folio);
        if ($factura === null) {
            return $this->notFound('La factura no existe.');
        }

        return $this->ok($factura);
    }

    public function create(): ResponseInterface
    {
        if (! FacturaPolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $folio = strtoupper(trim((string) $this->input('Folio_Factura')));
        if ($folio === '') {
            $folio = (new IdSecuencial())->siguienteFactura();
        }
        $capturas = $this->input('capturas');

        $resultado = (new FacturaService())->emitir([
            'Folio_Factura' => $folio,
            'ID_Cliente' => $this->input('ID_Cliente'),
            'Fecha_Emision' => $this->input('Fecha_Emision'),
            'Fecha_Vencimiento' => $this->input('Fecha_Vencimiento'),
            'Monto_Subtotal' => $this->input('Monto_Subtotal'),
            'Monto_Total' => $this->input('Monto_Total'),
            'capturas' => is_array($capturas) ? $capturas : [],
        ]);

        if ($resultado['ok'] !== true) {
            return $this->error($resultado['code'], $resultado['message'], $resultado['status'], $resultado['fields']);
        }

        return $this->created($resultado['data']);
    }
}
