# CLAUDE.md — Guía operativa del agente · Portal Ejecutivo BQS (MVP1)

| Campo | Valor |
|---|---|
| **Documento** | Guía operativa para el agente de IA y el desarrollador |
| **Versión** | 1.0 |
| **Fecha** | 18/06/2026 |
| **Depende de** | Todos los documentos del repositorio (este archivo los resume) |

> Lectura obligatoria **antes de tocar código**. Este archivo es autosuficiente: contiene el contexto mínimo para trabajar correctamente sin abrir otro documento. Para el detalle, sigue los enlaces.

## Qué es el proyecto

Portal financiero de lectura para la Dirección General de **Best Quality Solutions México (BQS)**, desarrollado por **Dataholics**. Consolida información financiera dispersa (Excel/Sheets sucios) en una base MySQL única y responde tres preguntas en un dashboard móvil/escritorio: **qué se facturó**, **qué falta por facturar** y **cuánto deben**. El usuario ejecutivo (Eric) consume solo lectura; el personal de BQS alimenta los datos (devengado, facturas, pagos) desde una capa de captura/administración.

## Núcleo de dominio

El flujo central es el **Ciclo de Cobro**: el trabajo de inspección/sorteo ejecutado se registra como **devengado** (`BITACORA_SORTEO`, estatus `Pendiente`), luego se **factura** (`FACTURAS`, estatus `Vigente`), la factura puede **vencer** (`Vencida`) y finalmente se **paga** (`Pagada`) total o parcialmente vía `PAGOS`. Las tres preguntas del dashboard son proyecciones de este ciclo. La entidad raíz es el **Cliente** (`CAT_CLIENTES`), referenciado siempre por ID único (`CLI-XXX`), nunca por texto libre. La máquina de estados completa está en el [SRS §4](01-vision/01_SRS_especificacion_requisitos.md).

## Stack

| Capa | Tecnología |
|---|---|
| Backend / API | CodeIgniter 4 (PHP 8.2+) |
| Frontend / SPA | React 19 + Vite + TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | MySQL 8 (InnoDB) en Site5 |
| Autenticación | CodeIgniter Shield + access tokens (Bearer) + whitelist |
| Cola / asincronía | Cron + `spark` tasks (cola en BD) |
| Servidor | Apache + PHP-FPM (Site5) |

## Reglas no negociables

1. **Nunca confíes en el cliente para decisiones de seguridad o cálculo.** El frontend React solo renderiza y envía intención; toda autorización, validación de negocio y cálculo (las 3 preguntas, saldos, vencimientos) ocurre en el backend. Un payload del navegador jamás determina rol, montos ni estatus. *Por qué:* el navegador es territorio del atacante; cualquier valor de ahí es manipulable.

2. **MySQL es la única fuente de verdad.** Google Sheets/Excel son únicamente origen de **importación inicial** (one-shot), no sistema vivo. Ninguna lógica lee de Sheets en tiempo de ejecución. Toda relación se hace por FK con integridad InnoDB. *Por qué:* la dispersión de datos en Excel es el problema que el sistema existe para resolver; volver a depender de ellos reintroduce el caos. Ver [ADR-002](02-arquitectura/ADR/ADR-002_mysql-fuente-de-verdad.md).

3. **Seguridad por diseño (ver [04](04-seguridad/04_plan_de_seguridad.md)).** Controles críticos siempre activos: (a) **whitelist** de correos autorizados además de credenciales válidas; (b) perfil de Dirección en **solo lectura** — sus tokens solo permiten métodos GET; (c) **HTTPS + cabeceras CSP estrictas + HSTS** en Site5; (d) cookies de refresh `HttpOnly` + `SameSite=Strict`. *Por qué:* es un portal financiero de la dirección general; una fuga o alteración tiene impacto directo en el negocio.

4. **Autenticación y verificación de tokens en cada petición.** Todo endpoint no público pasa por el filtro de auth que valida el access token (firma, expiración, revocación) vía Shield y luego cruza el correo contra la whitelist. Tokens de vida corta + refresh por cookie `HttpOnly`. *Por qué:* tokens robados o caducos no deben dar acceso; la whitelist es una segunda barrera ante credenciales filtradas. Ver [ADR-003](02-arquitectura/ADR/ADR-003_autenticacion-shield-jwt.md).

5. **Asincronía obligatoria para trabajo pesado.** Van a la cola en BD (procesada por cron): importación inicial de Sheets/Excel, recálculo masivo de saldos, marcado de facturas `Vencida` por fecha, y notificaciones. Las peticiones HTTP nunca ejecutan estos trabajos en línea. *Por qué:* Site5 es hosting compartido sin workers persistentes ni tiempos de ejecución largos; bloquear una request degrada el portal. Ver [ADR-004](02-arquitectura/ADR/ADR-004_cola-asincrona-cron.md).

6. **Transacciones ACID en toda escritura multi-tabla.** Emitir una factura (marcar `BITACORA_SORTEO` como `Facturado` + crear `FACTURAS`) y registrar un pago (insertar `PAGOS` + reevaluar `Estatus_Pago`) se hacen dentro de `transStart()/transComplete()`. Si algo falla, rollback total. *Por qué:* un estado financiero a medias (factura creada pero devengado no marcado, o pago registrado sin recalcular saldo) corrompe las tres preguntas y la cartera.

7. **Auditoría de toda mutación financiera.** Cada escritura sobre `FACTURAS`, `PAGOS`, `BITACORA_SORTEO` y `COTIZACIONES` registra en la tabla `AUDITORIA` quién (user id), qué (entidad + id), acción, valores antes/después y timestamp. Los GET de Eric también se registran a nivel de acceso. *Por qué:* trazabilidad financiera y forense ante disputas o incidentes; requisito de cumplimiento (LFPDPPP).

## Arquitectura en capas (backend)

```
Petición HTTPS (SPA React)
        │
        ▼
[ Filters ]      → CORS · Throttle · Auth (token+whitelist) · ReadOnlyGuard (dirección)
        │
        ▼
[ Controller ]   → delgado: recibe request, delega, formatea respuesta JSON
        │
        ▼
[ Validation ]   → reglas CI4 / DTO: forma y tipos de la entrada
        │
        ▼
[ Policy ]       → ¿este usuario+rol puede esta acción sobre este recurso?
        │
        ▼
[ Service ]      → lógica de negocio: 3 preguntas, ciclo de cobro, transacciones ACID
        │
        ▼
[ Repository ]   → consultas (Query Builder), agregaciones, filtros
        │
        ▼
[ Model / Entity ] → mapeo a tablas InnoDB
        │
        ▼
     MySQL 8        +  [ Cola en BD ] ← jobs pesados → procesados por Cron (spark)
```

## Comandos

```bash
# === Backend (CodeIgniter 4) — carpeta /api ===
composer install                      # dependencias PHP
cp env .env                           # configurar entorno (NUNCA versionar .env)
php spark key:generate                # clave de cifrado de la app
php spark migrate                     # crear/actualizar esquema MySQL
php spark db:seed InitialSeeder       # catálogos base y usuario whitelist
php spark serve                       # servidor de desarrollo (http://localhost:8080)

# === Frontend (React 19 + Vite) — carpeta /web ===
npm install                           # dependencias JS
npm run dev                           # servidor Vite (http://localhost:5173)
npm run build                         # build de producción a /web/dist
npm run preview                       # previsualizar build

# === Cola asíncrona (cron en Site5) ===
php spark bqs:process-queue           # procesa N jobs pendientes; lo invoca cron */5 min
php spark bqs:mark-overdue            # marca facturas Vencida; cron diario 00:15

# === Pruebas ===
./vendor/bin/phpunit                  # tests backend (PHPUnit)
npm run test                          # tests frontend (Vitest)

# === Análisis estático / calidad ===
./vendor/bin/phpstan analyse          # PHPStan nivel 8 (backend)
composer cs-fix                       # PHP-CS-Fixer (estilo PSR-12)
npm run lint                          # ESLint (frontend)
npm run typecheck                     # tsc --noEmit (cero errores de tipado)
```

## Identidad visual (obligatoria)

Tokens de marca (detalle y accesibilidad en [08](01-vision/08_identidad_visual_design_system.md)):

- **Primario — Azul BQS** `--color-primary: #0B4F9E` (confianza financiera; barras de navegación, encabezados, acción primaria).
- **Secundario — Verde positivo** `--color-secondary: #0E9F6E` (dinero cobrado / indicadores positivos).
- **Ámbar advertencia** `--color-warning: #B45309` (facturas `Vencida`, "por facturar").
- **Rojo error** `--color-danger: #B91C1C` (saldos críticos, errores).

Reglas de contraste: todo texto sobre fondo de color cumple **WCAG 2.1 AA** (≥ 4.5:1 texto normal, ≥ 3:1 texto grande). Texto blanco sobre `#0B4F9E` y sobre `#0E9F6E` solo en tamaño grande/semibold; para texto normal sobre verde, usar texto oscuro o el tono `--color-secondary-strong`.

**Qué NO hacer:** (1) no inventar colores fuera de los tokens; (2) no usar rojo/verde como **único** indicador de estado (añadir ícono o texto, por daltonismo); (3) no poner texto gris claro sobre blanco por debajo de 4.5:1; (4) no usar el verde de "pagado" para acciones destructivas.

## Orden de lectura de la documentación

1. **`README.md`** — panorama y stack.
2. **`CLAUDE.md`** (este archivo) — reglas no negociables.
3. **ADRs [001](02-arquitectura/ADR/ADR-001_stack-ci4-react.md)–[004](02-arquitectura/ADR/ADR-004_cola-asincrona-cron.md)** — decisiones de base.
4. **[SRS (01)](01-vision/01_SRS_especificacion_requisitos.md)** y **[Modelo de Datos (03)](03-datos/03_modelo_de_datos.md)**.
5. **[Arquitectura (02)](02-arquitectura/02_arquitectura_sistema.md)**, **[Seguridad (04)](04-seguridad/04_plan_de_seguridad.md)**, **[API (05)](05-api/05_especificacion_api.md)**; cierre con **[Pruebas (06)](06-pruebas/06_plan_de_pruebas.md)**, **[Roadmap (07)](07-roadmap/07_roadmap_sprints.md)** y **[Design System (08)](01-vision/08_identidad_visual_design_system.md)**.
