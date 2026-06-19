<?php

declare(strict_types=1);

namespace App\Commands;

use App\Services\ColaService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

/**
 * Worker de la cola asincrona (ADR-004). Lo invoca el cron de Site5 cada 5 min:
 *   php spark bqs:process-queue
 */
class ProcessQueue extends BaseCommand
{
    protected $group = 'BQS';
    protected $name = 'bqs:process-queue';
    protected $description = 'Procesa los jobs pendientes de JOBS_COLA (import_inicial, etc.).';
    protected $usage = 'bqs:process-queue [--batch N]';

    /** @var array<string,string> */
    protected $options = ['--batch' => 'Maximo de jobs a procesar por corrida (default 10).'];

    /**
     * @param list<string> $params
     */
    public function run(array $params): int
    {
        $batchOpt = CLI::getOption('batch');
        $batch = is_numeric($batchOpt) ? (int) $batchOpt : 10;
        $batch = $batch > 0 ? $batch : 10;

        $resultados = (new ColaService())->procesar($batch);

        CLI::write('Jobs procesados: ' . count($resultados), 'green');
        foreach ($resultados as $r) {
            $id = (int) $r['id'];
            $estado = (string) $r['estado'];
            $extra = isset($r['error']) && is_string($r['error']) ? ' - ' . $r['error'] : '';
            CLI::write("  job #{$id}: {$estado}{$extra}", $estado === 'completado' ? 'green' : 'red');
        }

        return EXIT_SUCCESS;
    }
}
