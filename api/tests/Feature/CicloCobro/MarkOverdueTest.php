<?php

declare(strict_types=1);

use App\Models\ClienteModel;
use App\Models\FacturaModel;
use App\Services\MarkOverdueService;
use Tests\Support\AuthTestCase;

/**
 * Marcado de facturas Vencida por el sistema (cron), idempotente (RF-FAC-02,
 * SRS §4.2 regla 5). Solo `Vigente` pasada de fecha transita a `Vencida`.
 *
 * @internal
 */
final class MarkOverdueTest extends AuthTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        model(ClienteModel::class)->insert(['ID_Cliente' => 'CLI-001', 'Nombre_Fiscal' => 'NIDEC', 'Estatus' => 'Activo']);
    }

    private function factura(string $folio, string $estatus, string $vencimiento): void
    {
        model(FacturaModel::class)->insert([
            'Folio_Factura' => $folio,
            'ID_Cliente' => 'CLI-001',
            'Fecha_Emision' => '2019-01-01', // anterior a cualquier vencimiento usado (CHECK Vto>=Emision)
            'Monto_Subtotal' => '100.00',
            'Monto_Total' => '116.00',
            'Fecha_Vencimiento' => $vencimiento,
            'Estatus_Pago' => $estatus,
        ]);
    }

    private function estatusDe(string $folio): string
    {
        $f = model(FacturaModel::class)->find($folio);
        $this->assertNotNull($f);

        return (string) $f['Estatus_Pago'];
    }

    public function testMarcaVencidaLaVigentePasadaDeFecha(): void
    {
        $this->factura('F-OLD', 'Vigente', '2020-01-01');

        $r = (new MarkOverdueService())->marcar();

        $this->assertSame(1, $r['marcadas']);
        $this->assertSame('Vencida', $this->estatusDe('F-OLD'));
    }

    public function testNoTocaVigenteFutura(): void
    {
        $this->factura('F-FUT', 'Vigente', '2999-01-01');

        (new MarkOverdueService())->marcar();

        $this->assertSame('Vigente', $this->estatusDe('F-FUT'));
    }

    public function testNoTocaPagadaVencida(): void
    {
        $this->factura('F-PAID', 'Pagada', '2020-01-01');

        (new MarkOverdueService())->marcar();

        $this->assertSame('Pagada', $this->estatusDe('F-PAID'));
    }

    public function testEsIdempotente(): void
    {
        $this->factura('F-OLD', 'Vigente', '2020-01-01');

        (new MarkOverdueService())->marcar();
        $segunda = (new MarkOverdueService())->marcar();

        $this->assertSame(0, $segunda['marcadas']);
        $this->assertSame('Vencida', $this->estatusDe('F-OLD'));
    }
}
