<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Controllers\BaseApiController;
use App\Models\JobModel;
use App\Policies\ImportPolicy;
use App\Services\ColaService;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Importacion inicial (RF-ADM-02). Solo `admin`. Sube el archivo, lo encola
 * como job `import_inicial` y responde 202 de inmediato; el procesamiento real
 * lo hace el cron (`php spark bqs:process-queue`).
 */
class ImportController extends BaseApiController
{
    private const EXT_PERMITIDAS = ['csv', 'xlsx', 'xls'];

    public function create(): ResponseInterface
    {
        if (! ImportPolicy::canRun(auth()->user())) {
            return $this->forbidden();
        }

        $archivo = $this->req()->getFile('archivo');
        if ($archivo === null || ! $archivo->isValid()) {
            return $this->validationError(['archivo' => 'Debe subir un archivo CSV o XLSX valido.']);
        }

        $ext = strtolower($archivo->getClientExtension());
        if (! in_array($ext, self::EXT_PERMITIDAS, true)) {
            return $this->validationError(['archivo' => 'Formato no soportado. Use CSV o XLSX.']);
        }

        $entidadRaw = $this->req()->getPost('entidad');
        $entidad = is_string($entidadRaw) && in_array(strtolower($entidadRaw), ['clientes', 'cotizaciones'], true)
            ? strtolower($entidadRaw)
            : null;
        if ($ext === 'csv' && $entidad === null) {
            return $this->validationError(['entidad' => "Para CSV indique 'entidad' (clientes o cotizaciones)."]);
        }

        $dir = WRITEPATH . 'imports';
        if (! is_dir($dir) && ! mkdir($dir, 0775, true) && ! is_dir($dir)) {
            return $this->error('SERVER_ERROR', 'No se pudo preparar el almacenamiento.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }
        $nombre = bin2hex(random_bytes(8)) . '.' . $ext;
        $archivo->move($dir, $nombre);

        $usuarioId = auth()->id();
        $jobId = (new ColaService())->encolar('import_inicial', [
            'ruta' => $dir . DIRECTORY_SEPARATOR . $nombre,
            'entidad' => $entidad,
            'usuario_id' => $usuarioId !== null ? (int) $usuarioId : null,
            'original_name' => $archivo->getClientName(),
        ]);

        return $this->ok([
            'job_id' => $jobId,
            'tipo' => 'import_inicial',
            'estado' => 'pendiente',
            'message' => 'Importacion encolada. Consulte el estado en GET /api/v1/admin/jobs/' . $jobId,
        ], ResponseInterface::HTTP_ACCEPTED);
    }

    public function jobShow(int $id): ResponseInterface
    {
        if (! ImportPolicy::canRun(auth()->user())) {
            return $this->forbidden();
        }

        $job = model(JobModel::class)->find($id);
        if ($job === null) {
            return $this->notFound('El job no existe.');
        }

        return $this->ok([
            'id' => (int) $job['id'],
            'tipo' => $job['tipo'],
            'estado' => $job['estado'],
            'intentos' => (int) $job['intentos'],
            'max_intentos' => (int) $job['max_intentos'],
            'ultimo_error' => $job['ultimo_error'],
            'creado_en' => $job['creado_en'],
            'actualizado_en' => $job['actualizado_en'],
        ]);
    }
}
