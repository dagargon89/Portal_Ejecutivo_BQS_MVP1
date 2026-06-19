<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabla de dominio Tier 0: COTIZACIONES.
 * DDL verbatim del Modelo de Datos (03 §4). FK -> CAT_CLIENTES (RESTRICT).
 */
class CreateCotizaciones extends Migration
{
    public function up(): void
    {
        $this->db->query(
            <<<'SQL'
CREATE TABLE COTIZACIONES (
    ID_Cotizacion      VARCHAR(20)    NOT NULL,
    ID_Cliente         VARCHAR(20)    NOT NULL,
    PO_Referencia      VARCHAR(50)    NULL,
    Monto_Autorizado   DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
    Piezas_Autorizadas INT UNSIGNED   NULL,
    Estatus            VARCHAR(12)    NOT NULL DEFAULT 'Pendiente PO',
    PRIMARY KEY (ID_Cotizacion),
    KEY idx_cot_cliente (ID_Cliente),
    KEY idx_cot_estatus (Estatus),
    CONSTRAINT fk_cot_cliente FOREIGN KEY (ID_Cliente)
        REFERENCES CAT_CLIENTES (ID_Cliente) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_cot_monto CHECK (Monto_Autorizado >= 0),
    CONSTRAINT chk_cot_estatus CHECK (Estatus IN ('Aprobada','Pendiente PO','Cerrada'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Cotizaciones autorizadas; limite financiero y enlace a PO.'
SQL
        );
    }

    public function down(): void
    {
        $this->db->query('DROP TABLE IF EXISTS COTIZACIONES');
    }
}
