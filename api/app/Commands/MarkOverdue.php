<?php

declare(strict_types=1);

namespace App\Commands;

use App\Services\MarkOverdueService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

/**
 * Marca `Vencida` las facturas vencidas (RF-FAC-02, ADR-004). Lo invoca el cron
 * diario de Site5 a las 00:15:
 *   php spark bqs:mark-overdue
 * Es idempotente: re-ejecutarlo no produce cambios adicionales.
 */
class MarkOverdue extends BaseCommand
{
    protected $group = 'BQS';
    protected $name = 'bqs:mark-overdue';
    protected $description = 'Marca Vencida las facturas Vigente cuyo vencimiento ya paso (cron diario 00:15).';
    protected $usage = 'bqs:mark-overdue';

    /**
     * @param list<string> $params
     */
    public function run(array $params): int
    {
        $r = (new MarkOverdueService())->marcar();

        CLI::write(
            'Facturas marcadas Vencida: ' . (string) $r['marcadas'] . ' (corte ' . (string) $r['fecha'] . ').',
            'green'
        );

        return EXIT_SUCCESS;
    }
}
