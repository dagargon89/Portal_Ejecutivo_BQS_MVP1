<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabla de dominio Tier 0: FACTURAS (cuentas por cobrar).
 * DDL verbatim del Modelo de Datos (03 §4). FK -> CAT_CLIENTES (RESTRICT).
 * idx_fac_estatus_emision (compuesto) acelera la Pregunta 1 del dashboard.
 */
class CreateFacturas extends Migration
{
    public function up(): void
    {
        $this->db->query(
            <<<'SQL'
CREATE TABLE FACTURAS (
    Folio_Factura     VARCHAR(40)   NOT NULL,
    ID_Cliente        VARCHAR(20)   NOT NULL,
    Fecha_Emision     DATE          NOT NULL,
    Monto_Subtotal    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    Monto_Total       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    Fecha_Vencimiento DATE          NOT NULL,
    Estatus_Pago      VARCHAR(10)   NOT NULL DEFAULT 'Vigente',
    PRIMARY KEY (Folio_Factura),
    KEY idx_fac_cliente (ID_Cliente),
    KEY idx_fac_estatus (Estatus_Pago),
    KEY idx_fac_emision (Fecha_Emision),
    KEY idx_fac_vencimiento (Fecha_Vencimiento),
    KEY idx_fac_estatus_emision (Estatus_Pago, Fecha_Emision),
    CONSTRAINT fk_fac_cliente FOREIGN KEY (ID_Cliente)
        REFERENCES CAT_CLIENTES (ID_Cliente) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_fac_subtotal CHECK (Monto_Subtotal >= 0),
    CONSTRAINT chk_fac_total CHECK (Monto_Total >= Monto_Subtotal),
    CONSTRAINT chk_fac_vencimiento CHECK (Fecha_Vencimiento >= Fecha_Emision),
    CONSTRAINT chk_fac_estatus CHECK (Estatus_Pago IN ('Pagada','Vigente','Vencida'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Folios emitidos y estado de cobranza. Preguntas 1 y 3.'
SQL
        );
    }

    public function down(): void
    {
        $this->db->query('DROP TABLE IF EXISTS FACTURAS');
    }
}
