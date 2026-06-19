<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabla de soporte: JOBS_COLA.
 * Cola de trabajos asincronos procesada por cron (ADR-004).
 * DDL verbatim del Modelo de Datos (03 §4).
 */
class CreateJobsCola extends Migration
{
    public function up(): void
    {
        $this->db->query(
            <<<'SQL'
CREATE TABLE JOBS_COLA (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tipo          VARCHAR(30)     NOT NULL,
    payload       JSON            NULL,
    estado        VARCHAR(12)     NOT NULL DEFAULT 'pendiente',
    intentos      INT UNSIGNED    NOT NULL DEFAULT 0,
    max_intentos  INT UNSIGNED    NOT NULL DEFAULT 3,
    ultimo_error  TEXT            NULL,
    creado_en     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_jobs_estado (estado),
    CONSTRAINT chk_jobs_tipo CHECK (tipo IN ('import_inicial','recalculo_saldos','marcar_vencidas','notificacion')),
    CONSTRAINT chk_jobs_estado CHECK (estado IN ('pendiente','procesando','completado','fallido'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Cola en BD procesada por cron (ADR-004).'
SQL
        );
    }

    public function down(): void
    {
        $this->db->query('DROP TABLE IF EXISTS JOBS_COLA');
    }
}
