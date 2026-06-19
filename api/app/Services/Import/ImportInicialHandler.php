<?php

declare(strict_types=1);

namespace App\Services\Import;

use App\Exceptions\DatoInvalidoException;
use App\Models\AuditoriaModel;
use App\Models\ClienteAliasModel;
use App\Models\ClienteModel;
use App\Models\CotizacionModel;
use App\Services\IdSecuencial;
use App\Services\Normalizador;
use App\Services\SaneadorNumerico;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use RuntimeException;

/**
 * Handler del job `import_inicial` (ADR-004, Sprint 2).
 *
 * Consolida clientes variantes a un unico ID via catalogo de alias (M-08),
 * sanea numericos (RF-ADM-02) y hace upsert idempotente de CAT_CLIENTES y
 * COTIZACIONES. XLSX: hojas "Clientes" y "Cotizaciones"; CSV: una entidad por
 * archivo (payload `entidad`). Resuelve cotizaciones contra los alias ya
 * cargados (persistidos en CLIENTE_ALIAS).
 */
class ImportInicialHandler
{
    /**
     * @param array<string,mixed> $payload  {ruta, entidad?, usuario_id?, original_name?}
     *
     * @return array<string,mixed> resumen del resultado
     */
    public function handle(array $payload): array
    {
        $ruta = is_string($payload['ruta'] ?? null) ? $payload['ruta'] : '';
        if ($ruta === '' || ! is_file($ruta)) {
            throw new RuntimeException("Archivo de importacion no encontrado: '{$ruta}'.");
        }
        $entidad = is_string($payload['entidad'] ?? null) ? strtolower($payload['entidad']) : null;
        $usuarioId = isset($payload['usuario_id']) ? (int) $payload['usuario_id'] : null;

        $spreadsheet = IOFactory::load($ruta);

        $resumen = [
            'clientes' => ['insertados' => 0, 'actualizados' => 0, 'rechazados' => []],
            'cotizaciones' => ['insertadas' => 0, 'actualizadas' => 0, 'rechazadas' => [], 'revision' => []],
        ];

        if ($entidad === 'clientes') {
            $this->procesarClientes($spreadsheet->getActiveSheet(), $resumen);
        } elseif ($entidad === 'cotizaciones') {
            $this->procesarCotizaciones($spreadsheet->getActiveSheet(), $resumen);
        } else {
            // XLSX multi-hoja: clientes primero (para poblar alias), luego cotizaciones.
            $clientes = $this->hojaPorNombre($spreadsheet, 'Clientes');
            if ($clientes !== null) {
                $this->procesarClientes($clientes, $resumen);
            }
            $cotizaciones = $this->hojaPorNombre($spreadsheet, 'Cotizaciones');
            if ($cotizaciones !== null) {
                $this->procesarCotizaciones($cotizaciones, $resumen);
            }
        }

        model(AuditoriaModel::class)->registrar($usuarioId, 'importar', 'import_inicial', null, null, $resumen);

        return $resumen;
    }

    /**
     * @param array<string,mixed> $resumen
     */
    private function procesarClientes(Worksheet $hoja, array &$resumen): void
    {
        $filas = $hoja->toArray(null, true, false, false);
        $map = $this->encabezados($filas);
        $model = model(ClienteModel::class);
        $alias = model(ClienteAliasModel::class);

        for ($r = 1, $n = count($filas); $r < $n; $r++) {
            $fila = $filas[$r];
            $id = strtoupper($this->val($fila, $map, 'id_cliente'));
            if ($id === '') {
                continue; // fila vacia
            }

            $datos = [
                'ID_Cliente' => $id,
                'Nombre_Fiscal' => $this->val($fila, $map, 'nombre_fiscal'),
                'Nombre_Comercial' => $this->valOrNull($fila, $map, 'nombre_comercial'),
                'RFC' => $this->valOrNull($fila, $map, 'rfc'),
                'Estatus' => $this->val($fila, $map, 'estatus') !== '' ? $this->val($fila, $map, 'estatus') : 'Activo',
            ];

            $existe = $model->find($id);
            $ok = $existe === null ? $model->insert($datos) : $model->update($id, $datos);
            if ($ok === false) {
                $resumen['clientes']['rechazados'][] = ['ID_Cliente' => $id, 'errores' => $model->errors()];

                continue;
            }
            $existe === null ? $resumen['clientes']['insertados']++ : $resumen['clientes']['actualizados']++;

            // Registrar alias: el propio ID, los nombres y la columna Alias (pipe).
            $textos = [$id, $datos['Nombre_Fiscal'], (string) $datos['Nombre_Comercial']];
            foreach (explode('|', $this->val($fila, $map, 'alias')) as $a) {
                $textos[] = trim($a);
            }
            foreach ($textos as $t) {
                if ($t === '') {
                    continue;
                }
                $alias->registrar(Normalizador::nombre($t), $t, $id);
            }
        }
    }

    /**
     * @param array<string,mixed> $resumen
     */
    private function procesarCotizaciones(Worksheet $hoja, array &$resumen): void
    {
        $filas = $hoja->toArray(null, true, false, false);
        $map = $this->encabezados($filas);
        $model = model(CotizacionModel::class);
        $alias = model(ClienteAliasModel::class);
        $idGen = new IdSecuencial();

        for ($r = 1, $n = count($filas); $r < $n; $r++) {
            $fila = $filas[$r];
            $clienteTexto = $this->val($fila, $map, 'cliente');
            $idCotRaw = strtoupper($this->val($fila, $map, 'id_cotizacion'));
            if ($clienteTexto === '' && $idCotRaw === '') {
                continue; // fila vacia
            }

            $idCliente = $alias->resolver(Normalizador::nombre($clienteTexto));
            if ($idCliente === null) {
                $resumen['cotizaciones']['revision'][] = ['cliente' => $clienteTexto, 'motivo' => 'cliente no resuelto en el catalogo de alias'];

                continue;
            }

            try {
                $monto = SaneadorNumerico::aDecimal($this->val($fila, $map, 'monto_autorizado'));
                $piezasRaw = $this->val($fila, $map, 'piezas_autorizadas');
                $piezas = $piezasRaw === '' ? null : SaneadorNumerico::aEntero($piezasRaw);
            } catch (DatoInvalidoException $e) {
                $resumen['cotizaciones']['rechazadas'][] = ['cliente' => $clienteTexto, 'motivo' => $e->getMessage()];

                continue;
            }

            $idCot = $idCotRaw !== '' ? $idCotRaw : $idGen->siguienteCotizacion();
            $datos = [
                'ID_Cotizacion' => $idCot,
                'ID_Cliente' => $idCliente,
                'PO_Referencia' => $this->valOrNull($fila, $map, 'po_referencia'),
                'Monto_Autorizado' => $monto,
                'Piezas_Autorizadas' => $piezas,
                'Estatus' => $this->val($fila, $map, 'estatus') !== '' ? $this->val($fila, $map, 'estatus') : 'Pendiente PO',
            ];

            $existe = $model->find($idCot);
            $ok = $existe === null ? $model->insert($datos) : $model->update($idCot, $datos);
            if ($ok === false) {
                $resumen['cotizaciones']['rechazadas'][] = ['ID_Cotizacion' => $idCot, 'errores' => $model->errors()];

                continue;
            }
            $existe === null ? $resumen['cotizaciones']['insertadas']++ : $resumen['cotizaciones']['actualizadas']++;
        }
    }

    /**
     * Mapa de encabezados (normalizados a minusculas) -> indice de columna.
     *
     * @param array<int, array<int, mixed>> $filas
     *
     * @return array<string, int>
     */
    private function encabezados(array $filas): array
    {
        $map = [];
        $head = $filas[0] ?? [];
        foreach ($head as $i => $h) {
            $map[strtolower(trim((string) $h))] = $i;
        }

        return $map;
    }

    /**
     * @param array<int, mixed>   $fila
     * @param array<string, int>  $map
     */
    private function val(array $fila, array $map, string $key): string
    {
        if (! isset($map[$key])) {
            return '';
        }
        $idx = $map[$key];

        return isset($fila[$idx]) ? trim((string) $fila[$idx]) : '';
    }

    /**
     * @param array<int, mixed>  $fila
     * @param array<string, int> $map
     */
    private function valOrNull(array $fila, array $map, string $key): ?string
    {
        $v = $this->val($fila, $map, $key);

        return $v === '' ? null : $v;
    }

    private function hojaPorNombre(Spreadsheet $spreadsheet, string $nombre): ?Worksheet
    {
        foreach ($spreadsheet->getWorksheetIterator() as $hoja) {
            if (strtolower(trim($hoja->getTitle())) === strtolower($nombre)) {
                return $hoja;
            }
        }

        return null;
    }
}
