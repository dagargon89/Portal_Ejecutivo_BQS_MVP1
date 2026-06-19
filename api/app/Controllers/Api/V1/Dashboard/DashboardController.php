<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Dashboard;

use App\Controllers\BaseApiController;
use App\Models\DashboardModel;
use App\Policies\DashboardPolicy;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Dashboard ejecutivo — las tres preguntas (RF-DASH-01/02/03). Solo lectura
 * para `direccion`/`facturacion`/`admin`. Todo el calculo ocurre en servidor
 * (RF-DASH-04); el cliente nunca recibe valores manipulables.
 */
class DashboardController extends BaseApiController
{
    private const PER_PAGE_DEFAULT = 20;
    private const PER_PAGE_MAX = 100;

    public function resumen(): ResponseInterface
    {
        if (! DashboardPolicy::canRead(auth()->user())) {
            return $this->forbidden('No tiene permiso para leer el dashboard.');
        }

        return $this->ok(model(DashboardModel::class)->resumen());
    }

    public function porFacturar(): ResponseInterface
    {
        if (! DashboardPolicy::canRead(auth()->user())) {
            return $this->forbidden('No tiene permiso para leer el dashboard.');
        }

        [$page, $perPage] = $this->paginacion();
        $r = model(DashboardModel::class)->porFacturar($page, $perPage);

        return $this->ok(
            ['total_por_facturar' => $r['total_monto'], 'moneda' => 'MXN', 'desglose' => $r['rows']],
            ResponseInterface::HTTP_OK,
            $this->meta($page, $perPage, $r['total']),
        );
    }

    public function porCobrar(): ResponseInterface
    {
        if (! DashboardPolicy::canRead(auth()->user())) {
            return $this->forbidden('No tiene permiso para leer el dashboard.');
        }

        [$page, $perPage] = $this->paginacion();
        $r = model(DashboardModel::class)->porCobrar($page, $perPage);

        return $this->ok(
            ['total_por_cobrar' => $r['total_monto'], 'moneda' => 'MXN', 'clientes' => $r['rows']],
            ResponseInterface::HTTP_OK,
            $this->meta($page, $perPage, $r['total']),
        );
    }

    /**
     * @return array{0:int,1:int}
     */
    private function paginacion(): array
    {
        $page = max(1, $this->queryInt('page', 1));
        $perPage = min(self::PER_PAGE_MAX, max(1, $this->queryInt('per_page', self::PER_PAGE_DEFAULT)));

        return [$page, $perPage];
    }

    /**
     * @return array<string,int>
     */
    private function meta(int $page, int $perPage, int $total): array
    {
        return [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => (int) ceil(max(1, $total) / $perPage),
        ];
    }
}
