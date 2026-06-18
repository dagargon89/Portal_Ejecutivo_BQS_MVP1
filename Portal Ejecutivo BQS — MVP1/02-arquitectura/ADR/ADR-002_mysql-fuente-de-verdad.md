# ADR-002 — MySQL como única fuente de verdad

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 18/06/2026 |
| **Reemplaza** | — |
| **Depende de** | [Database-Master-Schema §1](../../00-fuentes/BQS-MVP1-Database-Master-Schema.md) · [Technical-Specification §1](../../00-fuentes/BQS-MVP1-Technical-Specification.md) |

## 1. Contexto

La información financiera de BQS vive hoy dispersa en múltiples Excel/Google Sheets "sucios": mismos clientes con nombres variantes ("NIDEC US", "Nidec México"), columnas numéricas contaminadas con texto (`N/A`, `pendientes`, símbolos de moneda) y ausencia de identificadores únicos. El Master Schema (Tier 0) define las **Reglas de Oro de Integridad**: IDs únicos inalterables, normalización de nombres a un único `ID_Cliente`, y tipos numéricos limpios. Mantener Sheets como sistema vivo perpetúa el problema que el MVP existe para resolver.

## 2. Decisión

**MySQL 8 (InnoDB) en Site5 es la única autoridad de datos en tiempo de ejecución.** Google Sheets/Excel se degradan a **fuente de importación inicial one-shot**: se migran una sola vez hacia MySQL (proceso asíncrono, ver [ADR-004](ADR-004_cola-asincrona-cron.md)) y a partir de ahí ninguna lógica del sistema los lee.

| Aspecto | Antes (Sheets/Excel) | Decisión (MySQL) |
|---|---|---|
| Autoridad en runtime | Hojas dispersas | MySQL 8 InnoDB |
| Identidad de entidades | Texto libre variable | PK alfanuméricas (`CLI-XXX`, `COT-XXXX`, …) |
| Integridad referencial | Inexistente | FKs InnoDB con `RESTRICT` |
| Tipos numéricos | Texto contaminado | `DECIMAL`/`INT` con `CHECK` |
| Rol de Sheets/Excel | Sistema vivo | Importación inicial one-shot |

## 3. Consecuencias

**Positivas:** integridad referencial real; cálculos confiables de las 3 preguntas; consolidación de clientes variantes en un solo perfil; base para transacciones ACID.
**Negativas / trade-offs:** se requiere un proceso de migración y limpieza inicial (normalización de nombres → ID, saneo de columnas numéricas); el personal deja de editar Excel libremente y captura por la app.
**Neutrales:** los nombres de tabla y columnas del Tier 0 se conservan tal cual los define el Master Schema.

## 4. Impacto en documentos existentes

- **[03 Modelo de Datos](../../03-datos/03_modelo_de_datos.md)**: DDL MySQL de las 5 tablas con PKs, FKs e índices.
- **[02 Arquitectura](../02_arquitectura_sistema.md)**: capa de persistencia y job de importación inicial.
- **[CLAUDE.md](../../CLAUDE.md)**: regla no negociable #2 (fuente de verdad).

## 5. Implicaciones de seguridad

- Una sola autoridad reduce la superficie de inconsistencia y facilita la auditoría (toda mutación pasa por la API y queda en `AUDITORIA`).
- El acceso a MySQL se restringe al usuario de aplicación con privilegios mínimos; credenciales solo en `.env` del backend, nunca en el repo ni en el cliente (ver [04 §4.1](../../04-seguridad/04_plan_de_seguridad.md)).
- La importación inicial valida y normaliza antes de insertar, evitando que datos sucios rompan los `CHECK` o los cálculos.
