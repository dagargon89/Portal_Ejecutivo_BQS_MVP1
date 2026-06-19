<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabla de soporte: CLIENTE_ALIAS.
 * Mapa determinista alias -> ID_Cliente para la consolidacion de la
 * importacion inicial (gobierno de de-duplicacion, mejora M-08). Conserva el
 * texto original para auditoria y reversibilidad. No altera el Tier 0.
 */
class CreateClienteAlias extends Migration
{
    public function up(): void
    {
        $this->db->query(
            <<<'SQL'
CREATE TABLE CLIENTE_ALIAS (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    alias_norm     VARCHAR(255)    NOT NULL,
    alias_original VARCHAR(255)    NOT NULL,
    ID_Cliente     VARCHAR(20)     NOT NULL,
    creado_en      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_alias_norm (alias_norm),
    KEY idx_alias_cliente (ID_Cliente),
    CONSTRAINT fk_alias_cliente FOREIGN KEY (ID_Cliente)
        REFERENCES CAT_CLIENTES (ID_Cliente) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Mapa alias->ID_Cliente para consolidacion de la importacion (M-08).'
SQL
        );
    }

    public function down(): void
    {
        $this->db->query('DROP TABLE IF EXISTS CLIENTE_ALIAS');
    }
}
