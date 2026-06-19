<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * AUDITORIA — bitacora inmutable de mutaciones y accesos (RF-MET-01).
 * Solo se permite INSERTAR: no se exponen update/delete (append-only).
 * El endurecimiento a nivel de BD (REVOKE UPDATE,DELETE) es de Sprint 5.
 */
class AuditoriaModel extends Model
{
    protected $table = 'AUDITORIA';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = false; // `creado_en` lo fija la BD
    protected $allowedFields = [
        'usuario_id',
        'accion',
        'entidad',
        'entidad_id',
        'valores_antes',
        'valores_despues',
        'ip',
    ];

    /**
     * Registra un evento de auditoria. Los snapshots se serializan a JSON.
     *
     * @param array<string,mixed>|null $antes
     * @param array<string,mixed>|null $despues
     */
    public function registrar(
        ?int $usuarioId,
        string $accion,
        string $entidad,
        ?string $entidadId = null,
        ?array $antes = null,
        ?array $despues = null,
        ?string $ip = null
    ): void {
        $this->insert([
            'usuario_id' => $usuarioId,
            'accion' => $accion,
            'entidad' => $entidad,
            'entidad_id' => $entidadId,
            'valores_antes' => $antes === null ? null : json_encode($antes, JSON_UNESCAPED_UNICODE),
            'valores_despues' => $despues === null ? null : json_encode($despues, JSON_UNESCAPED_UNICODE),
            'ip' => $ip,
        ]);
    }
}
