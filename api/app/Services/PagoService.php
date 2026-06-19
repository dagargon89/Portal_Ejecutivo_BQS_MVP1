<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FacturaModel;
use App\Models\PagoModel;
use Throwable;

/**
 * Registro de pagos con reevaluacion del Estatus_Pago, en transaccion ACID
 * (RF-PAG-01/02, RF-FAC-03, §4). Prohibe sobrepago (422 OVERPAYMENT) y pagos
 * sobre factura Pagada (409 ILLEGAL_TRANSITION). Resultado discriminado.
 */
final class PagoService
{
    use AuditoriaTrait;

    private const EPSILON = 0.005; // tolerancia de redondeo en centavos

    /**
     * @param array<string,mixed> $datos {ID_Pago?, Fecha_Pago, Monto_Pagado, Referencia?}
     *
     * @return array{ok: bool, status: int, code: string, message: string, fields: array<string,string>|null, data: array<string,mixed>|null}
     */
    public function registrar(string $folio, array $datos): array
    {
        $folio = trim($folio);
        $facturaModel = model(FacturaModel::class);
        $pagoModel = model(PagoModel::class);

        $factura = $facturaModel->find($folio);
        if ($factura === null) {
            return $this->fallo(404, 'NOT_FOUND', 'La factura no existe.');
        }
        if ((string) $factura['Estatus_Pago'] === 'Pagada') {
            return $this->fallo(409, 'ILLEGAL_TRANSITION', 'La factura ya esta pagada; no admite mas pagos.');
        }

        $montoRaw = trim((string) ($datos['Monto_Pagado'] ?? ''));
        if (! is_numeric($montoRaw) || (float) $montoRaw <= 0) {
            return $this->fallo(422, 'VALIDATION', 'Datos invalidos.', ['Monto_Pagado' => 'El monto del pago debe ser mayor a cero.']);
        }
        $monto = (float) $montoRaw;

        $total = (float) $factura['Monto_Total'];
        $pagadoPrevio = (float) $pagoModel->totalPagado($folio);
        $saldo = $total - $pagadoPrevio;
        if ($monto > $saldo + self::EPSILON) {
            return $this->fallo(422, 'OVERPAYMENT', 'El abono excede el saldo pendiente de la factura.', ['Monto_Pagado' => 'Saldo maximo: ' . number_format($saldo, 2, '.', '')]);
        }

        $idPago = strtoupper(trim((string) ($datos['ID_Pago'] ?? '')));
        if ($idPago === '') {
            $idPago = (new IdSecuencial())->siguientePago();
        }
        $referencia = trim((string) ($datos['Referencia'] ?? ''));
        $datosPago = [
            'ID_Pago' => $idPago,
            'Folio_Factura' => $folio,
            'Fecha_Pago' => trim((string) ($datos['Fecha_Pago'] ?? '')),
            'Monto_Pagado' => $montoRaw,
            'Referencia' => $referencia !== '' ? $referencia : null,
        ];

        $estatusFinal = (string) $factura['Estatus_Pago'];

        // --- Transaccion ACID: insertar pago y, si liquida, marcar Pagada ---
        $db = db_connect();
        $db->transBegin();
        try {
            if ($pagoModel->insert($datosPago) === false) {
                $db->transRollback();
                $db->resetTransStatus(); // limpia el flag de fallo (strict mode)

                if ($pagoModel->find($idPago) !== null) {
                    return $this->fallo(409, 'CONFLICT', 'El ID de pago ya existe.');
                }

                return $this->fallo(422, 'VALIDATION', 'Datos invalidos.', $pagoModel->errors());
            }
            $this->auditar('crear', 'PAGOS', $idPago, null, $datosPago);

            if ($pagadoPrevio + $monto + self::EPSILON >= $total) {
                $facturaModel->update($folio, ['Estatus_Pago' => 'Pagada']);
                $this->auditar('actualizar', 'FACTURAS', $folio, ['Estatus_Pago' => $estatusFinal], ['Estatus_Pago' => 'Pagada']);
                $estatusFinal = 'Pagada';
            }
            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            $db->resetTransStatus();

            return $pagoModel->find($idPago) !== null
                ? $this->fallo(409, 'CONFLICT', 'El ID de pago ya existe.')
                : $this->fallo(500, 'SERVER_ERROR', 'No se pudo registrar el pago.');
        }

        $detalle = $facturaModel->detalleDe($folio);

        return $this->exito([
            'ID_Pago' => $idPago,
            'Folio_Factura' => $folio,
            'Fecha_Pago' => $datosPago['Fecha_Pago'],
            'Monto_Pagado' => $datosPago['Monto_Pagado'],
            'Referencia' => $datosPago['Referencia'],
            'factura' => [
                'Folio_Factura' => $folio,
                'Monto_Total' => (string) $factura['Monto_Total'],
                'pagado' => $detalle['pagado'] ?? number_format($pagadoPrevio + $monto, 2, '.', ''),
                'saldo' => $detalle['saldo'] ?? number_format($saldo - $monto, 2, '.', ''),
                'Estatus_Pago' => $estatusFinal,
            ],
        ]);
    }

    /**
     * @param array<string,mixed> $data
     *
     * @return array{ok: bool, status: int, code: string, message: string, fields: array<string,string>|null, data: array<string,mixed>|null}
     */
    private function exito(array $data): array
    {
        return ['ok' => true, 'status' => 201, 'code' => '', 'message' => '', 'fields' => null, 'data' => $data];
    }

    /**
     * @param array<string,string>|null $fields
     *
     * @return array{ok: bool, status: int, code: string, message: string, fields: array<string,string>|null, data: array<string,mixed>|null}
     */
    private function fallo(int $status, string $code, string $message, ?array $fields = null): array
    {
        return ['ok' => false, 'status' => $status, 'code' => $code, 'message' => $message, 'fields' => $fields, 'data' => null];
    }
}
