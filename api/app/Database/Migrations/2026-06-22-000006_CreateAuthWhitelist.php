<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabla de soporte: AUTH_WHITELIST.
 * Lista blanca de correos autorizados (segunda barrera de acceso, ADR-003).
 * DDL verbatim del Modelo de Datos (03 §4).
 */
class CreateAuthWhitelist extends Migration
{
    public function up(): void
    {
        $this->db->query(
            <<<'SQL'
CREATE TABLE AUTH_WHITELIST (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    correo     VARCHAR(255)    NOT NULL,
    activo     TINYINT(1)      NOT NULL DEFAULT 1,
    creado_por BIGINT UNSIGNED NULL,
    creado_en  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_whitelist_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Lista blanca de correos autorizados (segunda barrera de acceso).'
SQL
        );
    }

    public function down(): void
    {
        $this->db->query('DROP TABLE IF EXISTS AUTH_WHITELIST');
    }
}
