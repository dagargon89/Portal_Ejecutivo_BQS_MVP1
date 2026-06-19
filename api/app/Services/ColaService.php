<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\JobModel;
use App\Services\Import\ImportInicialHandler;
use RuntimeException;
use Throwable;

/**
 * Servicio de cola asincrona (ADR-004). Encola jobs y los procesa por lote
 * (invocado por `php spark bqs:process-queue` vía cron). Idempotente y con
 * reintentos: reclama cada job de forma atomica antes de ejecutarlo.
 */
class ColaService
{
    private JobModel $jobs;

    public function __construct()
    {
        $this->jobs = model(JobModel::class);
    }

    /**
     * @param array<string,mixed> $payload
     */
    public function encolar(string $tipo, array $payload = [], int $maxIntentos = 3): int
    {
        return $this->jobs->encolar($tipo, $payload, $maxIntentos);
    }

    /**
     * Procesa hasta $batch jobs pendientes.
     *
     * @return list<array<string,mixed>>
     */
    public function procesar(int $batch = 10): array
    {
        $resultados = [];

        foreach ($this->jobs->siguientesPendientes($batch) as $job) {
            $id = (int) $job['id'];

            // Claim atomico: si otro worker ya lo tomo, saltar.
            if (! $this->jobs->reclamar($id)) {
                continue;
            }

            try {
                $resultado = $this->despachar((string) $job['tipo'], $this->jobs->payloadDe($job));
                $this->jobs->completar($id);
                $resultados[] = ['id' => $id, 'estado' => 'completado', 'resultado' => $resultado];
            } catch (Throwable $e) {
                $this->jobs->fallarOReintentar($id, $e->getMessage());
                $resultados[] = ['id' => $id, 'estado' => 'error', 'error' => $e->getMessage()];
            }
        }

        return $resultados;
    }

    /**
     * @param array<string,mixed> $payload
     *
     * @return array<string,mixed>
     */
    private function despachar(string $tipo, array $payload): array
    {
        return match ($tipo) {
            'import_inicial' => (new ImportInicialHandler())->handle($payload),
            default => throw new RuntimeException("Tipo de job no soportado: {$tipo}"),
        };
    }
}
