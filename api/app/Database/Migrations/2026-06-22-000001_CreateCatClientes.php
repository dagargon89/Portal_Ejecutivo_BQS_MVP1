<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabla de dominio Tier 0: CAT_CLIENTES.
 * DDL reproducido VERBATIM del Modelo de Datos (03 §4) para garantizar
 * fidelidad exacta al Master Schema (CHECK, índices, collation MySQL 8).
 */
class CreateCatClientes extends Migration
{
    public function up(): void
    {
        $this->db->query(
            <<<'SQL'
CREATE TABLE CAT_CLIENTES (
    ID_Cliente       VARCHAR(20)  NOT NULL,
    Nombre_Fiscal    VARCHAR(255) NOT NULL,
    Nombre_Comercial VARCHAR(150) NULL,
    RFC              VARCHAR(13)  NULL,
    Estatus          VARCHAR(10)  NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (ID_Cliente),
    UNIQUE KEY uq_clientes_rfc (RFC),
    KEY idx_clientes_estatus (Estatus),
    CONSTRAINT chk_clientes_estatus CHECK (Estatus IN ('Activo','Inactivo'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Catalogo maestro de clientes (Tier 0). ID unico inalterable.'
SQL
        );
    }

    public function down(): void
    {
        $this->db->query('DROP TABLE IF EXISTS CAT_CLIENTES');
    }
}
