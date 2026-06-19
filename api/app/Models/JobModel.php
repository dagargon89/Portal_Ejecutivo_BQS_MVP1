<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * JOBS_COLA — cola de trabajos asincronos procesada por cron (ADR-004).
 * Ciclo: pendiente -> procesando -> completado | (reintento) | fallido.
 */
class JobModel extends Model
{
    protected $table = 'JOBS_COLA';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = false; // creado_en / actualizado_en los fija la BD
    protected $allowedFields = ['tipo', 'payload', 'estado', 'intentos', 'max_intentos', 'ultimo_error'];

    /**
     * Encola un job y devuelve su id.
     *
     * @param array<string,mixed> $payload
     */
    public function encolar(string $tipo, array $payload = [], int $maxIntentos = 3): int
    {
        return (int) $this->insert([
            'tipo' => $tipo,
            'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
            'estado' => 'pendiente',
            'intentos' => 0,
            'max_intentos' => $maxIntentos,
        ], true);
    }

    /**
     * Jobs pendientes en orden FIFO.
     *
     * @return list<array<string,mixed>>
     */
    public function siguientesPendientes(int $limit): array
    {
        return $this->where('estado', 'pendiente')
            ->orderBy('creado_en', 'ASC')
            ->orderBy('id', 'ASC')
            ->findAll($limit);
    }

    /**
     * Reclama un job de forma atomica (pendiente -> procesando) e incrementa
     * intentos. Devuelve true si este worker se lo quedo (evita doble proceso).
     */
    public function reclamar(int $id): bool
    {
        $this->db->table($this->table)
            ->where('id', $id)
            ->where('estado', 'pendiente')
            ->set('estado', 'procesando')
            ->set('intentos', 'intentos + 1', false)
            ->update();

        return $this->db->affectedRows() > 0;
    }

    public function completar(int $id): void
    {
        $this->update($id, ['estado' => 'completado', 'ultimo_error' => null]);
    }

    /**
     * Marca el job como fallido si agoto reintentos; si no, lo devuelve a
     * pendiente para que el cron lo reintente.
     */
    public function fallarOReintentar(int $id, string $error): void
    {
        $job = $this->find($id);
        if ($job === null) {
            return;
        }

        $estado = ((int) $job['intentos'] >= (int) $job['max_intentos']) ? 'fallido' : 'pendiente';
        $this->update($id, ['estado' => $estado, 'ultimo_error' => mb_substr($error, 0, 2000)]);
    }

    /**
     * Decodifica el payload JSON de un registro de job.
     *
     * @param array<string,mixed> $job
     *
     * @return array<string,mixed>
     */
    public function payloadDe(array $job): array
    {
        $raw = $job['payload'] ?? null;
        if (! is_string($raw) || $raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }
}
