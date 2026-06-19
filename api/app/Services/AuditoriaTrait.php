<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditoriaModel;

/**
 * Helper de auditoria para controladores/servicios (RF-MET-01, CLAUDE.md #7).
 * En Sprint 1 audita las mutaciones de whitelist y la asignacion de roles;
 * la cobertura financiera completa se amplia en Sprint 5.
 */
trait AuditoriaTrait
{
    /**
     * @param array<string,mixed>|null $antes
     * @param array<string,mixed>|null $despues
     */
    protected function auditar(
        string $accion,
        string $entidad,
        ?string $entidadId = null,
        ?array $antes = null,
        ?array $despues = null
    ): void {
        $usuarioId = auth()->id();
        $ip = service('request')->getIPAddress();

        model(AuditoriaModel::class)->registrar(
            $usuarioId !== null ? (int) $usuarioId : null,
            $accion,
            $entidad,
            $entidadId,
            $antes,
            $despues,
            $ip
        );
    }
}
