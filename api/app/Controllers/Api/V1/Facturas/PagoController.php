<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Facturas;

use App\Controllers\BaseApiController;
use App\Models\FacturaModel;
use App\Policies\FacturaPolicy;
use App\Services\PagoService;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * PAGOS de una factura (RF-PAG-01/02). Lectura abierta a cualquier rol
 * autenticado; registro solo `facturacion`/`admin`. El abono y la reevaluacion
 * del Estatus_Pago son una transaccion ACID en PagoService.
 */
class PagoController extends BaseApiController
{
    public function index(string $folio): ResponseInterface
    {
        $factura = model(FacturaModel::class)->detalleDe($folio);
        if ($factura === null) {
            return $this->notFound('La factura no existe.');
        }

        return $this->ok([
            'Folio_Factura' => $factura['Folio_Factura'],
            'Monto_Total' => $factura['Monto_Total'],
            'pagado' => $factura['pagado'],
            'saldo' => $factura['saldo'],
            'Estatus_Pago' => $factura['Estatus_Pago'],
            'pagos' => $factura['pagos'],
        ]);
    }

    public function create(string $folio): ResponseInterface
    {
        if (! FacturaPolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        $resultado = (new PagoService())->registrar($folio, [
            'ID_Pago' => $this->input('ID_Pago'),
            'Fecha_Pago' => $this->input('Fecha_Pago'),
            'Monto_Pagado' => $this->input('Monto_Pagado'),
            'Referencia' => $this->input('Referencia'),
        ]);

        if ($resultado['ok'] !== true) {
            return $this->error($resultado['code'], $resultado['message'], $resultado['status'], $resultado['fields']);
        }

        return $this->created($resultado['data']);
    }
}
