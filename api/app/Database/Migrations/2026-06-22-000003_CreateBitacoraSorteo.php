<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabla de dominio Tier 0: BITACORA_SORTEO (devengado).
 * DDL verbatim del Modelo de Datos (03 §4). FK -> COTIZACIONES (RESTRICT).
 * idx_bit_estatus_fact es critico para la Pregunta 2 del dashboard.
 */
class CreateBitacoraSorteo extends Migration
{
    public function up(): void
    {
        $this->db->query(
            <<<'SQL'
CREATE TABLE BITACORA_SORTEO (
    ID_Captura          VARCHAR(20)   NOT NULL,
    Fecha               DATE          NOT NULL,
    ID_Cotizacion       VARCHAR(20)   NOT NULL,
    Horas_Trabajadas    DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
    Piezas_Sorteadas    INT UNSIGNED  NULL,
    Monto_Devengado     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    Estatus_Facturacion VARCHAR(10)   NOT NULL DEFAULT 'Pendiente',
    PRIMARY KEY (ID_Captura),
    KEY idx_bit_cotizacion (ID_Cotizacion),
    KEY idx_bit_estatus_fact (Estatus_Facturacion),
    KEY idx_bit_fecha (Fecha),
    CONSTRAINT fk_bit_cotizacion FOREIGN KEY (ID_Cotizacion)
        REFERENCES COTIZACIONES (ID_Cotizacion) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_bit_horas CHECK (Horas_Trabajadas >= 0),
    CONSTRAINT chk_bit_monto CHECK (Monto_Devengado >= 0),
    CONSTRAINT chk_bit_estatus CHECK (Estatus_Facturacion IN ('Pendiente','Facturado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Trabajo ejecutado (devengado) por cotizacion. Pregunta 2.'
SQL
        );
    }

    public function down(): void
    {
        $this->db->query('DROP TABLE IF EXISTS BITACORA_SORTEO');
    }
}
