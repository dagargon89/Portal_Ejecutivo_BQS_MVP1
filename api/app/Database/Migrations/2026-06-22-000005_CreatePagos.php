<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabla de dominio Tier 0: PAGOS (abonos aplicados).
 * DDL verbatim del Modelo de Datos (03 §4). FK -> FACTURAS (RESTRICT).
 * idx_pag_factura es critico para la Pregunta 3 del dashboard.
 */
class CreatePagos extends Migration
{
    public function up(): void
    {
        $this->db->query(
            <<<'SQL'
CREATE TABLE PAGOS (
    ID_Pago       VARCHAR(20)   NOT NULL,
    Folio_Factura VARCHAR(40)   NOT NULL,
    Fecha_Pago    DATE          NOT NULL,
    Monto_Pagado  DECIMAL(14,2) NOT NULL,
    Referencia    VARCHAR(100)  NULL,
    PRIMARY KEY (ID_Pago),
    KEY idx_pag_factura (Folio_Factura),
    KEY idx_pag_fecha (Fecha_Pago),
    CONSTRAINT fk_pag_factura FOREIGN KEY (Folio_Factura)
        REFERENCES FACTURAS (Folio_Factura) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_pag_monto CHECK (Monto_Pagado > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Abonos/liquidaciones por factura. Pregunta 3 (neto de abonos).'
SQL
        );
    }

    public function down(): void
    {
        $this->db->query('DROP TABLE IF EXISTS PAGOS');
    }
}
