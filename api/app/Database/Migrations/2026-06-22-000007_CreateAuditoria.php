<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabla de soporte: AUDITORIA.
 * Bitacora inmutable de mutaciones financieras y accesos (RF-MET-01).
 * DDL verbatim del Modelo de Datos (03 §4).
 */
class CreateAuditoria extends Migration
{
    public function up(): void
    {
        $this->db->query(
            <<<'SQL'
CREATE TABLE AUDITORIA (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id      BIGINT UNSIGNED NULL,
    accion          VARCHAR(30)     NOT NULL,
    entidad         VARCHAR(40)     NOT NULL,
    entidad_id      VARCHAR(40)     NULL,
    valores_antes   JSON            NULL,
    valores_despues JSON            NULL,
    ip              VARCHAR(45)     NULL,
    creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_aud_entidad (entidad, entidad_id),
    KEY idx_aud_usuario (usuario_id),
    KEY idx_aud_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Bitacora de mutaciones financieras y accesos (RF-MET-01).'
SQL
        );
    }

    public function down(): void
    {
        $this->db->query('DROP TABLE IF EXISTS AUDITORIA');
    }
}
