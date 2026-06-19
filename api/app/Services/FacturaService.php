<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\BitacoraModel;
use App\Models\ClienteModel;
use App\Models\CotizacionModel;
use App\Models\FacturaModel;
use Throwable;

/**
 * Emision de facturas desde devengado, en transaccion ACID (RF-FAC-01, §4).
 *
 * Devuelve un resultado discriminado (no lanza al controlador): forma fija
 * {ok,status,code,message,fields,data} que el controlador traduce al envelope.
 */
final class FacturaService
{
    use AuditoriaTrait;

    /**
     * @param array<string,mixed> $datos {Folio_Factura?, ID_Cliente, Fecha_Emision, Fecha_Vencimiento, Monto_Subtotal, Monto_Total, capturas: string[]}
     *
     * @return array{ok: bool, status: int, code: string, message: string, fields: array<string,string>|null, data: array<string,mixed>|null}
     */
    public function emitir(array $datos): array
    {
        $facturaModel = model(FacturaModel::class);
        $bitacoraModel = model(BitacoraModel::class);

        $folio = strtoupper(trim((string) ($datos['Folio_Factura'] ?? '')));
        $idCliente = strtoupper(trim((string) ($datos['ID_Cliente'] ?? '')));
        $capturas = $this->normalizarCapturas($datos['capturas'] ?? null);

        // --- Validaciones previas (errores limpios, fuera de la transaccion) ---
        if ($folio === '') {
            return $this->fallo(422, 'VALIDATION', 'Datos invalidos.', ['Folio_Factura' => 'El folio es obligatorio.']);
        }
        if ($capturas === []) {
            return $this->fallo(422, 'VALIDATION', 'Datos invalidos.', ['capturas' => 'Seleccione al menos una captura de devengado.']);
        }
        if ($idCliente === '' || model(ClienteModel::class)->find($idCliente) === null) {
            return $this->fallo(404, 'NOT_FOUND', 'El cliente referenciado no existe.');
        }

        $subtotal = trim((string) ($datos['Monto_Subtotal'] ?? ''));
        $total = trim((string) ($datos['Monto_Total'] ?? ''));
        if (! is_numeric($subtotal) || ! is_numeric($total) || (float) $total < (float) $subtotal) {
            return $this->fallo(422, 'VALIDATION', 'Datos invalidos.', ['Monto_Total' => 'El total debe ser numerico y mayor o igual al subtotal.']);
        }
        $emision = trim((string) ($datos['Fecha_Emision'] ?? ''));
        $vencimiento = trim((string) ($datos['Fecha_Vencimiento'] ?? ''));
        if ($emision === '' || $vencimiento === '' || $vencimiento < $emision) {
            return $this->fallo(422, 'VALIDATION', 'Datos invalidos.', ['Fecha_Vencimiento' => 'El vencimiento no puede ser anterior a la emision.']);
        }

        // Cada captura: existe, esta Pendiente y su cotizacion es del cliente.
        $cotizacionModel = model(CotizacionModel::class);
        foreach ($capturas as $cid) {
            $cap = $bitacoraModel->find($cid);
            if ($cap === null) {
                return $this->fallo(404, 'NOT_FOUND', "La captura {$cid} no existe.");
            }
            if ((string) $cap['Estatus_Facturacion'] !== 'Pendiente') {
                return $this->fallo(409, 'ILLEGAL_TRANSITION', "La captura {$cid} ya esta facturada; no se puede refacturar.");
            }
            $cot = $cotizacionModel->find((string) $cap['ID_Cotizacion']);
            if ($cot === null || (string) $cot['ID_Cliente'] !== $idCliente) {
                return $this->fallo(422, 'VALIDATION', "La captura {$cid} no pertenece al cliente {$idCliente}.", ['capturas' => 'Hay capturas de un cliente distinto.']);
            }
        }

        $datosFactura = [
            'Folio_Factura' => $folio,
            'ID_Cliente' => $idCliente,
            'Fecha_Emision' => $emision,
            'Monto_Subtotal' => $subtotal,
            'Monto_Total' => $total,
            'Fecha_Vencimiento' => $vencimiento,
            'Estatus_Pago' => 'Vigente',
        ];

        // --- Transaccion ACID (CLAUDE.md #6) ---
        // Orden deliberado: marcar capturas ANTES de insertar la factura, para
        // que un fallo del insert (folio duplicado) revierta tambien el marcado.
        $db = db_connect();
        $db->transBegin();
        try {
            foreach ($capturas as $cid) {
                $bitacoraModel->update($cid, ['Estatus_Facturacion' => 'Facturado']);
            }
            if ($facturaModel->insert($datosFactura) === false) {
                $db->transRollback();
                $db->resetTransStatus(); // limpia el flag de fallo (strict mode)

                // Folio duplicado: el insert falla a nivel de BD (PK), el
                // rollback revierte el marcado de capturas. Error de negocio 409.
                if ($facturaModel->find($folio) !== null) {
                    return $this->fallo(409, 'CONFLICT', 'El folio de factura ya existe.');
                }

                return $this->fallo(422, 'VALIDATION', 'Datos invalidos.', $facturaModel->errors());
            }
            $this->auditar('crear', 'FACTURAS', $folio, null, $datosFactura);
            foreach ($capturas as $cid) {
                $this->auditar('actualizar', 'BITACORA_SORTEO', $cid, ['Estatus_Facturacion' => 'Pendiente'], ['Estatus_Facturacion' => 'Facturado']);
            }
            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            $db->resetTransStatus();

            return $facturaModel->find($folio) !== null
                ? $this->fallo(409, 'CONFLICT', 'El folio de factura ya existe.')
                : $this->fallo(500, 'SERVER_ERROR', 'No se pudo emitir la factura.');
        }

        return $this->exito($facturaModel->detalleDe($folio) ?? []);
    }

    /**
     * @param mixed $capturasRaw
     *
     * @return list<string>
     */
    private function normalizarCapturas($capturasRaw): array
    {
        if (! is_array($capturasRaw)) {
            return [];
        }
        $out = [];
        foreach ($capturasRaw as $c) {
            $cid = trim((string) $c);
            if ($cid !== '') {
                $out[] = $cid;
            }
        }

        return array_values(array_unique($out));
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
