# ADR-004 — Cola asíncrona en BD procesada por cron (Site5)

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 18/06/2026 |
| **Reemplaza** | — |
| **Depende de** | [Technical-Specification §1, §4](../../00-fuentes/BQS-MVP1-Technical-Specification.md) · [ADR-002](ADR-002_mysql-fuente-de-verdad.md) |

## 1. Contexto

El despliegue es **Site5**, hosting compartido: sin workers persistentes, sin demonios de larga vida (Redis, Supervisor) garantizados y con límites de tiempo de ejecución en peticiones web. Sin embargo, el sistema requiere trabajo pesado fuera del ciclo petición/respuesta: importación inicial de Sheets/Excel, recálculo masivo de saldos, marcado diario de facturas `Vencida` y notificaciones. Ejecutarlo en línea bloquearía las peticiones y degradaría el portal.

## 2. Decisión

Implementar una **cola en tabla MySQL** (`JOBS_COLA`) y procesarla con **comandos `spark` invocados por cron** de Site5.

| Aspecto | Decisión |
|---|---|
| Almacén de cola | Tabla `JOBS_COLA` (payload, estado, intentos, timestamps) en MySQL |
| Worker | `php spark bqs:process-queue` (procesa lote N, idempotente, con reintentos) |
| Disparador | Cron de Site5 cada 5 min para la cola; cron diario `php spark bqs:mark-overdue` 00:15 |
| Tipos de job | `import_inicial`, `recalculo_saldos`, `marcar_vencidas`, `notificacion` |
| Garantías | Reintentos con backoff, `intentos_max`, registro de fallos, idempotencia por job |

## 3. Consecuencias

**Positivas:** no requiere infraestructura extra sobre Site5; las peticiones HTTP nunca ejecutan trabajo pesado; reintentos y trazabilidad de jobs.
**Negativas / trade-offs:** latencia de hasta el intervalo de cron (≤ 5 min) en jobs encolados; no apto para tiempo real estricto (aceptable para un portal financiero de lectura diaria).
**Neutrales:** la cola vive en la misma MySQL, coherente con [ADR-002](ADR-002_mysql-fuente-de-verdad.md).

## 4. Impacto en documentos existentes

- **[02 Arquitectura §3.9](../02_arquitectura_sistema.md)**: capa de cola y trabajos asíncronos.
- **[03 Modelo de Datos](../../03-datos/03_modelo_de_datos.md)**: tabla `JOBS_COLA` de soporte.
- **[CLAUDE.md](../../CLAUDE.md)**: regla no negociable #5 (asincronía) y comandos de cron.

## 5. Implicaciones de seguridad

- Los jobs corren con el contexto del backend (no del usuario); validan datos antes de escribir y registran en `AUDITORIA`.
- La importación inicial sanea y normaliza (evita inyección de datos sucios que rompan `CHECK` o cálculos).
- El endpoint que **encola** valida autorización; el procesamiento real ocurre fuera de la request, reduciendo superficie de DoS por trabajo costoso en línea.
