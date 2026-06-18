# Portal Ejecutivo BQS — MVP1

| Campo | Valor |
|---|---|
| **Proyecto** | Portal Ejecutivo BQS — *BQS Executive Accounts Receivable and Billing Portal* |
| **Organización** | Best Quality Solutions México (BQS) · Ciudad Juárez, Chihuahua |
| **Desarrollado por** | Dataholics |
| **Estado** | MVP1 — Fase 2-B (Especificación técnica y desarrollo) |
| **Versión documental** | 1.0 |
| **Fecha** | 18/06/2026 |
| **Tipo de release** | MVP (Tier 1) |
| **Usuario principal** | Eric — Dirección General (`eric@bestqualitysolutions.com`) |

---

> [!IMPORTANT]
> **Decisión de stack respecto a la fuente.**
> La Especificación Técnica fuente ([Technical-Specification §1](00-fuentes/BQS-MVP1-Technical-Specification.md)) describe el frontend como *"Portal Ejecutivo HTML5 + Tailwind CSS"* consumido vía Fetch/Axios. Este proyecto documenta el frontend como **SPA en React 19 (Vite + TypeScript)** manteniendo Tailwind y el patrón Fetch/Axios. La justificación, las consecuencias y el plan están en [ADR-001](02-arquitectura/ADR/ADR-001_stack-ci4-react.md), y la desviación queda registrada como oportunidad de mejora en [`OPORTUNIDADES_DE_MEJORA.md`](OPORTUNIDADES_DE_MEJORA.md). El backend (CodeIgniter 4 + MySQL en Site5 + Shield) **no se modifica**: es exactamente el estipulado en la fuente.

## 1. Qué es este sistema

El Portal Ejecutivo BQS consolida la información financiera dispersa de BQS (hoy en Excel/Sheets sucios) en una base de datos relacional única y la presenta a la Dirección General en un dashboard móvil/escritorio que responde **tres preguntas de negocio**:

1. **¿Qué ya se facturó?** — Total facturado del mes en curso.
2. **¿Qué falta por facturar?** — Trabajo devengado (ejecutado) aún no facturado.
3. **¿Cuánto dinero te deben?** — Saldo de cuentas por cobrar, neto de abonos.

El MVP1 es una **aplicación de lectura ágil** para la Dirección General (solo GET), alimentada por una capa de captura/administración (devengado, facturas, pagos) operada por el personal de BQS. La base de datos MySQL maestra en Site5 es la única fuente de verdad ([Technical-Specification §1](00-fuentes/BQS-MVP1-Technical-Specification.md)).

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend / API | CodeIgniter 4 | 4.7.x (PHP 8.2+) |
| Frontend / SPA | React | 19 (Vite + TypeScript 5.x) |
| Estilos | Tailwind CSS | 3.x |
| Base de datos (fuente de verdad) | MySQL | 8.0 (InnoDB, Site5) |
| Autenticación | CodeIgniter Shield + access tokens (Bearer/JWT) + whitelist | — |
| Cola / asincronía | Cron + `spark` tasks (cola en BD) | — |
| Servidor web | Apache + PHP-FPM (Site5, hosting compartido) | — |
| Migración de datos (origen) | Google Sheets / Excel → import a MySQL | one-shot |

## 3. Arquitectura

**Estilo arquitectónico:** *monolito modular cliente-servidor desacoplado*. Un backend CI4 expone una API REST con tokens Bearer; una SPA React la consume. MySQL es la única autoridad de datos. Se eligió monolito modular (no microservicios) por economía operativa: un solo despliegue en Site5, una sola base, complejidad acorde al tamaño de BQS. Detalle en [ADR-001](02-arquitectura/ADR/ADR-001_stack-ci4-react.md) y [02 — Arquitectura](02-arquitectura/02_arquitectura_sistema.md).

**Principio de fuente de verdad:** MySQL es la autoridad. El frontend **nunca** decide seguridad ni cálculo: la API valida, autoriza (Policies) y calcula las tres preguntas en el servidor. Toda relación se resuelve por llave foránea con integridad referencial declarativa de InnoDB. Ver [ADR-002](02-arquitectura/ADR/ADR-002_mysql-fuente-de-verdad.md).

**Frontera entre servicios:** React (cliente) → API CI4 (Filters → Controllers → Validation → Policies → Services → Repositories → Models) → MySQL. Los trabajos pesados (importación inicial, recálculo de saldos, marcado de facturas vencidas, notificaciones) van a una cola en BD procesada por cron ([ADR-004](02-arquitectura/ADR/ADR-004_cola-asincrona-cron.md)).

## 4. Código fuente y arranque

El backend CI4 y el frontend React viven en un monorepo (`/api` y `/web`). La guía operativa completa — estructura, comandos de arranque y reglas no negociables — es de lectura obligatoria antes de tocar código: [`CLAUDE.md`](CLAUDE.md).

## 5. Índice de documentos

| # | Documento | Contenido |
|---|---|---|
| — | [`README.md`](README.md) | Panorama ejecutivo, stack e índice. |
| — | [`CLAUDE.md`](CLAUDE.md) | Guía operativa para el agente de IA y el desarrollador. |
| — | [`OPORTUNIDADES_DE_MEJORA.md`](OPORTUNIDADES_DE_MEJORA.md) | Mejoras propuestas, cada una referida a su documento fuente. |
| ADR-001 | [Stack a medida CI4 + React](02-arquitectura/ADR/ADR-001_stack-ci4-react.md) | Frontend SPA React 19 sobre el HTML5 de la fuente. |
| ADR-002 | [MySQL como fuente de verdad](02-arquitectura/ADR/ADR-002_mysql-fuente-de-verdad.md) | MySQL autoridad; Sheets/Excel pasan a fuente de importación. |
| ADR-003 | [Autenticación Shield + tokens](02-arquitectura/ADR/ADR-003_autenticacion-shield-jwt.md) | Access tokens Bearer + whitelist para la SPA. |
| ADR-004 | [Cola asíncrona por cron](02-arquitectura/ADR/ADR-004_cola-asincrona-cron.md) | Jobs en hosting compartido Site5 sin workers persistentes. |
| 01 | [SRS — Especificación de Requisitos](01-vision/01_SRS_especificacion_requisitos.md) | Requisitos funcionales/no funcionales y máquina de estados. |
| 02 | [Arquitectura del Sistema](02-arquitectura/02_arquitectura_sistema.md) | Capas CI4, SPA React, flujos de secuencia y patrones de código. |
| 03 | [Modelo de Datos](03-datos/03_modelo_de_datos.md) | ERD, diccionario y DDL MySQL ejecutable de las 5 tablas Tier 0. |
| 04 | [Plan de Seguridad](04-seguridad/04_plan_de_seguridad.md) | OWASP con código PHP/TS, tokens, RBAC, ACID, LFPDPPP. |
| 05 | [Especificación de la API](05-api/05_especificacion_api.md) | API REST CI4 versionada, endpoints, errores, rate limiting. |
| 06 | [Plan de Pruebas](06-pruebas/06_plan_de_pruebas.md) | PHPUnit + Vitest, estados exhaustivos, casos de seguridad y los 5 casos QA fuente. |
| 07 | [Roadmap por Sprints](07-roadmap/07_roadmap_sprints.md) | Cimientos de seguridad antes que funcionalidades. |
| 08 | [Identidad Visual y Design System](01-vision/08_identidad_visual_design_system.md) | Marca BQS, tokens CSS, componentes React/Tailwind. |
| Fuentes | [`00-fuentes/`](00-fuentes/) | Los 4 documentos fuente originales (inmutables, sin modificar). |

## 6. Decisiones clave del MVP

| Tema | Decisión |
|---|---|
| Stack | App a medida CI4 (API) + React 19 (SPA); Tailwind y Fetch/Axios conservados de la fuente. |
| Fuente de verdad | MySQL 8 (InnoDB) en Site5; Sheets/Excel solo migración inicial one-shot. |
| Autenticación | CodeIgniter Shield con access tokens (Bearer) + whitelist de correos autorizados. |
| Perfil ejecutivo | Eric: **solo lectura** (GET); no puede alterar el historial financiero desde el teléfono. |
| Autorización | RBAC con Policies del lado servidor; nunca en el cliente. |
| Integridad | Transacciones ACID en toda escritura multi-tabla; FKs con `RESTRICT`. |
| Cálculos | Las 3 preguntas se calculan en el backend; el frontend solo renderiza. |
| Asincronía | Cola en BD procesada por cron `spark` (Site5 sin workers persistentes). |
| Datos sensibles | Sin secretos en el repo; credenciales en `.env` — ver [04](04-seguridad/04_plan_de_seguridad.md) y [mejoras](OPORTUNIDADES_DE_MEJORA.md). |

## 7. Cómo leer esta documentación

1. **Empieza aquí** (`README.md`) para el panorama y el stack.
2. Lee [`CLAUDE.md`](CLAUDE.md) para las reglas no negociables antes de tocar código.
3. Revisa los ADRs ([001](02-arquitectura/ADR/ADR-001_stack-ci4-react.md)–[004](02-arquitectura/ADR/ADR-004_cola-asincrona-cron.md)) para entender las decisiones de base.
4. Estudia el [SRS (01)](01-vision/01_SRS_especificacion_requisitos.md) y el [Modelo de Datos (03)](03-datos/03_modelo_de_datos.md): qué hace el sistema y sobre qué datos.
5. Profundiza en [Arquitectura (02)](02-arquitectura/02_arquitectura_sistema.md), [Seguridad (04)](04-seguridad/04_plan_de_seguridad.md) y [API (05)](05-api/05_especificacion_api.md); cierra con [Pruebas (06)](06-pruebas/06_plan_de_pruebas.md), [Roadmap (07)](07-roadmap/07_roadmap_sprints.md) y [Design System (08)](01-vision/08_identidad_visual_design_system.md).
