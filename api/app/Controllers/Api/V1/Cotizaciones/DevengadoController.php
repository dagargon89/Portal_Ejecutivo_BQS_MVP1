<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Cotizaciones;

use App\Controllers\BaseApiController;
use App\Models\BitacoraModel;
use App\Models\CotizacionModel;
use App\Policies\BitacoraPolicy;
use App\Services\AuditoriaTrait;
use App\Services\IdSecuencial;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Captura de devengado por cotizacion (BITACORA_SORTEO, RF-DEV-01/02).
 * Lectura abierta a cualquier rol autenticado; escritura solo `capturista`.
 */
class DevengadoController extends BaseApiController
{
    use AuditoriaTrait;

    private const PER_PAGE_DEFAULT = 20;
    private const PER_PAGE_MAX = 100;

    public function index(string $idCot): ResponseInterface
    {
        if (model(CotizacionModel::class)->find($idCot) === null) {
            return $this->notFound('La cotizacion no existe.');
        }

        $page = max(1, $this->queryInt('page', 1));
        $perPage = min(self::PER_PAGE_MAX, max(1, $this->queryInt('per_page', self::PER_PAGE_DEFAULT)));
        $estatus = $this->req()->getGet('estatus');

        $res = model(BitacoraModel::class)->porCotizacion(
            $idCot,
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

    public function create(string $idCot): ResponseInterface
    {
        if (! BitacoraPolicy::canManage(auth()->user())) {
            return $this->forbidden();
        }

        if (model(CotizacionModel::class)->find($idCot) === null) {
            return $this->notFound('La cotizacion no existe.');
        }

        $model = model(BitacoraModel::class);
        $idCap = strtoupper(trim((string) $this->input('ID_Captura')));
        if ($idCap === '') {
            $idCap = (new IdSecuencial())->siguienteCaptura();
        }
        if ($model->find($idCap) !== null) {
            return $this->error('CONFLICT', 'El ID_Captura ya existe.', ResponseInterface::HTTP_CONFLICT);
        }

        $horas = $this->input('Horas_Trabajadas');
        $piezas = $this->input('Piezas_Sorteadas');
        $datos = [
            'ID_Captura' => $idCap,
            'Fecha' => trim((string) $this->input('Fecha')),
            'ID_Cotizacion' => $idCot,
            'Horas_Trabajadas' => $horas !== null && trim((string) $horas) !== '' ? trim((string) $horas) : '0.00',
            'Piezas_Sorteadas' => $piezas !== null && trim((string) $piezas) !== '' ? (int) $piezas : null,
            'Monto_Devengado' => trim((string) $this->input('Monto_Devengado')),
            'Estatus_Facturacion' => 'Pendiente', // RF-DEV-01: nace Pendiente
        ];

        $db = db_connect();
        $db->transStart();
        if ($model->insert($datos) === false) {
            $db->transComplete();

            return $this->validationError($model->errors());
        }
        $this->auditar('crear', 'BITACORA_SORTEO', $idCap, null, $datos);
        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->error('SERVER_ERROR', 'No se pudo registrar el devengado.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->created($model->find($idCap));
    }
}
