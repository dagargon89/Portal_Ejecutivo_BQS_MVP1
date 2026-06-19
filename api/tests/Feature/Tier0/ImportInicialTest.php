<?php

declare(strict_types=1);

use App\Models\ClienteAliasModel;
use App\Models\ClienteModel;
use App\Models\CotizacionModel;
use App\Models\JobModel;
use App\Services\ColaService;
use App\Services\Import\ImportInicialHandler;
use App\Services\Normalizador;
use Tests\Support\AuthTestCase;

/**
 * Importacion inicial: Caso QA 1 (consolidacion), saneo numerico (RF-ADM-02),
 * idempotencia y ciclo de la cola (ADR-004).
 *
 * @internal
 */
final class ImportInicialTest extends AuthTestCase
{
    private function importarClientes(): void
    {
        (new ImportInicialHandler())->handle([
            'ruta' => SUPPORTPATH . 'import/clientes.csv',
            'entidad' => 'clientes',
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function importarCotizaciones(string $archivo = 'cotizaciones.csv'): array
    {
        return (new ImportInicialHandler())->handle([
            'ruta' => SUPPORTPATH . 'import/' . $archivo,
            'entidad' => 'cotizaciones',
        ]);
    }

    public function testConsolidacionCasoQA1(): void
    {
        $this->importarClientes();
        $this->importarCotizaciones();

        // Un solo cliente CLI-001 con ambos nombres variantes resueltos.
        $this->assertNotNull(model(ClienteModel::class)->find('CLI-001'));
        $this->assertSame('CLI-001', model(ClienteAliasModel::class)->resolver(Normalizador::nombre('NIDEC Mobility')));
        $this->assertSame('CLI-001', model(ClienteAliasModel::class)->resolver(Normalizador::nombre('Nidec México')));

        // Cartera sumada: 100,000 + 150,000 = 250,000 bajo CLI-001.
        $cotis = model(CotizacionModel::class)->where('ID_Cliente', 'CLI-001')->findAll();
        $this->assertCount(2, $cotis);
        $suma = array_sum(array_map(static fn (array $c): float => (float) $c['Monto_Autorizado'], $cotis));
        $this->assertSame(250000.0, $suma);
    }

    public function testSaneoNumericoRechazaYNoResueltoVaARevision(): void
    {
        $this->importarClientes();
        $resumen = $this->importarCotizaciones('cotizaciones_sucias.csv');

        // "N/A" y negativo se rechazan; el cliente desconocido va a revision.
        $this->assertCount(2, $resumen['cotizaciones']['rechazadas']);
        $this->assertCount(1, $resumen['cotizaciones']['revision']);

        // Ninguna de las filas sucias se inserto.
        $this->assertNull(model(CotizacionModel::class)->find('COT-0010'));
        $this->assertNull(model(CotizacionModel::class)->find('COT-0011'));
        $this->assertNull(model(CotizacionModel::class)->find('COT-0012'));
    }

    public function testImportacionEsIdempotente(): void
    {
        $this->importarClientes();
        $this->importarCotizaciones();
        $this->importarCotizaciones(); // segunda corrida

        $this->assertSame(3, model(CotizacionModel::class)->countAllResults());
        $this->assertSame(2, model(ClienteModel::class)->countAllResults());
    }

    public function testColaServiceProcesaImportInicial(): void
    {
        $cola = new ColaService();
        $jobId = $cola->encolar('import_inicial', [
            'ruta' => SUPPORTPATH . 'import/clientes.csv',
            'entidad' => 'clientes',
        ]);

        $cola->procesar(10);

        $job = model(JobModel::class)->find($jobId);
        $this->assertNotNull($job);
        $this->assertSame('completado', $job['estado']);
        $this->assertNotNull(model(ClienteModel::class)->find('CLI-001'));
    }

    public function testJobConArchivoInexistenteFalla(): void
    {
        $cola = new ColaService();
        $jobId = $cola->encolar('import_inicial', ['ruta' => '/no/existe.csv', 'entidad' => 'clientes'], 1);

        $cola->procesar(10);

        $job = model(JobModel::class)->find($jobId);
        $this->assertNotNull($job);
        $this->assertSame('fallido', $job['estado']); // agoto el unico intento
        $this->assertNotNull($job['ultimo_error']);
    }
}
