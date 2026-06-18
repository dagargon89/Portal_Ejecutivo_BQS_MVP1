# Oportunidades de Mejora — Portal Ejecutivo BQS (MVP1)

| Campo | Valor |
|---|---|
| **Documento** | Registro de oportunidades de mejora (no aplicadas) |
| **Versión** | 1.0 |
| **Fecha** | 18/06/2026 |
| **Propósito** | Señalar mejoras detectadas durante la generación de la documentación, **sin modificar lo estipulado** en los documentos fuente. |
| **Depende de** | [00-fuentes/](00-fuentes/) (documentos fuente inmutables) y los documentos generados del proyecto. |

> **Cómo leer este documento.** Cada mejora indica **dónde se propone** (el documento fuente y sección que la motiva), la **situación actual** según esa fuente, la **propuesta**, su **impacto** y la **acción sugerida**. Ninguna de estas mejoras se ha aplicado a la documentación entregada: la documentación respeta al pie de la letra los 4 documentos fuente. Estas propuestas se dejan para que BQS/Dataholics las analicen y decidan antes o después del MVP1.

> **Convención de severidad:** 🔴 Crítica (seguridad/datos, atender ya) · 🟠 Alta (afecta correctidad o mantenibilidad) · 🟡 Media (mejora relevante) · 🟢 Baja (clarificación o diferible).

## Resumen

| ID | Mejora | Documento fuente que la motiva | Severidad |
|---|---|---|---|
| M-01 | Credenciales en texto plano en el documento | [Technical-Specification §4](00-fuentes/BQS-MVP1-Technical-Specification.md) | 🔴 Crítica |
| M-02 | Frontend "HTML5" → SPA React 19 | [Technical-Specification §1](00-fuentes/BQS-MVP1-Technical-Specification.md) | 🟠 Alta (ya decidida) |
| M-03 | Falta enlace devengado → factura | [Database-Master-Schema §2/§3](00-fuentes/BQS-MVP1-Database-Master-Schema.md) | 🟠 Alta |
| M-04 | Falta enlace factura → cotización | [Database-Master-Schema §3](00-fuentes/BQS-MVP1-Database-Master-Schema.md) | 🟡 Media |
| M-05 | `Monto_Devengado` sin tabla de tarifas | [Database-Master-Schema (BITACORA_SORTEO)](00-fuentes/BQS-MVP1-Database-Master-Schema.md) | 🟡 Media |
| M-06 | IVA/impuesto no se almacena explícito | [Database-Master-Schema (FACTURAS)](00-fuentes/BQS-MVP1-Database-Master-Schema.md) | 🟡 Media |
| M-07 | Sin control de `Monto_Autorizado` vs consumo | [Database-Master-Schema (COTIZACIONES)](00-fuentes/BQS-MVP1-Database-Master-Schema.md) | 🟡 Media |
| M-08 | Gobierno de de-duplicación en importación | [Database-Master-Schema §1](00-fuentes/BQS-MVP1-Database-Master-Schema.md) | 🟡 Media |
| M-09 | Pregunta 1 excluye facturas `Vencida` | [Technical-Specification §2](00-fuentes/BQS-MVP1-Technical-Specification.md) | 🟢 Baja (clarificar) |
| M-10 | Estatus `Vencida` sin mecanismo definido | [Technical-Specification §2/§3](00-fuentes/BQS-MVP1-Technical-Specification.md) | 🟡 Media |
| M-11 | Zona horaria del "mes en curso" (Cd. Juárez) | [Technical-Specification §2](00-fuentes/BQS-MVP1-Technical-Specification.md) | 🟠 Alta |
| M-12 | RBAC más allá del whitelist de un solo usuario | [Technical-Specification §3](00-fuentes/BQS-MVP1-Technical-Specification.md) | 🟡 Media |
| M-13 | Notas de crédito / reversa de pagos | [QA-Test-Cases](00-fuentes/BQS-MVP1-QA-Test-Cases.md) · [SRS §8](01-vision/01_SRS_especificacion_requisitos.md) | 🟢 Baja (diferible) |

---

## M-01 — Credenciales en texto plano en el documento · 🔴 Crítica

**Dónde se propone (fuente):** [Technical-Specification §4 "Credenciales de Servidor y Despliegue"](00-fuentes/BQS-MVP1-Technical-Specification.md).
**Situación actual:** el documento fuente incrusta en texto plano la contraseña FTP, el usuario y la contraseña de MySQL, y el host/base. Cualquiera con acceso al archivo (o a su historial en control de versiones) obtiene acceso a producción.
**Propuesta:** (1) **rotar de inmediato** esas credenciales —deben considerarse comprometidas por estar escritas—; (2) moverlas a un archivo `.env` fuera del repositorio y del docroot; (3) **remover** el bloque §4 del documento y sustituirlo por una referencia a la bóveda de secretos; (4) considerar un gestor de secretos (al menos `.env` cifrado o variables del panel de Site5).
**Impacto:** elimina el vector de fuga de credenciales de producción; alinea con OWASP A02/A05 y con la regla no negociable de "sin secretos en el repo".
**Acción sugerida:** ya reflejado como práctica obligatoria en [04 §4.1 Gestión de secretos](04-seguridad/04_plan_de_seguridad.md) y [02 §6 hardening](02-arquitectura/02_arquitectura_sistema.md). La documentación generada **no** reproduce las credenciales. Falta la acción operativa de rotación y limpieza del documento fuente.

## M-02 — Frontend "HTML5" → SPA React 19 · 🟠 Alta (ya decidida)

**Dónde se propone (fuente):** [Technical-Specification §1 (cadena de sincronización)](00-fuentes/BQS-MVP1-Technical-Specification.md), que describe "Portal Ejecutivo HTML5 + Tailwind CSS".
**Situación actual:** la fuente no especifica framework de cliente; "HTML5 + Tailwind" sugiere JS imperativo.
**Propuesta:** implementar el cliente como **SPA React 19 + Vite + TypeScript**, conservando Tailwind y Fetch/Axios. Mejora mantenibilidad, tipado de cifras financieras y pruebas de componentes a medida que el portal crece a cartera completa.
**Impacto:** mayor calidad y escalabilidad del cliente; añade un paso de build. El backend, la BD y la autenticación de la fuente **no cambian**.
**Acción sugerida:** decisión tomada y documentada en [ADR-001](02-arquitectura/ADR/ADR-001_stack-ci4-react.md). Se incluye aquí por transparencia: es la **única desviación** respecto a la fuente. Confirmar conformidad con BQS.

## M-03 — Falta enlace devengado → factura · 🟠 Alta

**Dónde se propone (fuente):** [Database-Master-Schema §2 (BITACORA_SORTEO) y §3 (relaciones)](00-fuentes/BQS-MVP1-Database-Master-Schema.md).
**Situación actual:** `BITACORA_SORTEO` solo tiene `Estatus_Facturacion` (`Pendiente`/`Facturado`) y `ID_Cotizacion`; no hay columna que indique **en qué factura** se cobró un devengado. Una vez marcado `Facturado`, se pierde la trazabilidad fina hacia el `Folio_Factura`.
**Propuesta:** agregar `Folio_Factura` (FK nullable a `FACTURAS`) en `BITACORA_SORTEO`, poblada al emitir la factura.
**Impacto:** trazabilidad completa devengado↔factura; facilita auditoría, conciliación y futuras notas de crédito.
**Acción sugerida:** documentado como limitación conocida en [03 §5](03-datos/03_modelo_de_datos.md) y como decisión pendiente en [02 §7](02-arquitectura/02_arquitectura_sistema.md). En el MVP1 la relación se infiere por cliente/cotización + estatus, **sin** alterar el Tier 0.

## M-04 — Falta enlace factura → cotización · 🟡 Media

**Dónde se propone (fuente):** [Database-Master-Schema §3 (relaciones)](00-fuentes/BQS-MVP1-Database-Master-Schema.md).
**Situación actual:** `FACTURAS` enlaza a `CAT_CLIENTES` pero no a `COTIZACIONES`; no se sabe qué cotización(es)/PO ampara cada factura más que por el cliente.
**Propuesta:** añadir `ID_Cotizacion` en `FACTURAS` o una tabla puente `FACTURA_COTIZACION` (si una factura puede cubrir varias cotizaciones).
**Impacto:** permite medir consumo por cotización/PO (relación con M-07) y reportes por proyecto.
**Acción sugerida:** registrar como decisión de modelo a evaluar junto con M-03; no aplicada para respetar el Tier 0.

## M-05 — `Monto_Devengado` sin tabla de tarifas · 🟡 Media

**Dónde se propone (fuente):** [Database-Master-Schema (BITACORA_SORTEO, `Monto_Devengado` = Horas × Tarifa)](00-fuentes/BQS-MVP1-Database-Master-Schema.md).
**Situación actual:** el monto devengado se captura ya calculado; la **tarifa** (precio por hora/pieza) no se modela ni se versiona, por lo que el cálculo no es auditable ni reproducible.
**Propuesta:** modelar una tarifa por cotización/cliente (campo `Tarifa` en `COTIZACIONES` o tabla `TARIFAS`) y derivar `Monto_Devengado` en el backend.
**Impacto:** cálculo consistente y auditable del devengado; reduce errores de captura manual.
**Acción sugerida:** evaluar en la limpieza Tier 0; en MVP1 se captura el monto tal como define la fuente.

## M-06 — IVA/impuesto no se almacena explícito · 🟡 Media

**Dónde se propone (fuente):** [Database-Master-Schema (FACTURAS: `Monto_Subtotal`, `Monto_Total`)](00-fuentes/BQS-MVP1-Database-Master-Schema.md).
**Situación actual:** se guardan subtotal y total, pero no la **tasa ni el monto de IVA**; el impuesto queda implícito en la diferencia.
**Propuesta:** almacenar `Tasa_IVA` y `Monto_IVA` (o un desglose de impuestos) en `FACTURAS` para trazabilidad fiscal y futura integración con timbrado.
**Impacto:** prepara el terreno para el timbrado SAT (SRS §8) y reportes fiscales correctos.
**Acción sugerida:** diferible; no aplicada para no alterar el Tier 0.

## M-07 — Sin control de `Monto_Autorizado` vs consumo · 🟡 Media

**Dónde se propone (fuente):** [Database-Master-Schema (COTIZACIONES: `Monto_Autorizado`, `Piezas_Autorizadas`)](00-fuentes/BQS-MVP1-Database-Master-Schema.md).
**Situación actual:** la cotización fija un límite financiero autorizado, pero ninguna regla impide que el devengado o lo facturado lo **excedan**.
**Propuesta:** control de negocio que alerte (o bloquee según política) cuando devengado+facturado se acerque o supere `Monto_Autorizado`/`Piezas_Autorizadas`.
**Impacto:** evita trabajar/facturar por encima de lo autorizado por el cliente (riesgo comercial real).
**Acción sugerida:** el MVP1 ya expone el consumo vs límite ([RF-COT-02](01-vision/01_SRS_especificacion_requisitos.md)); el **control activo** (alerta/bloqueo) se propone como mejora.

## M-08 — Gobierno de de-duplicación en la importación · 🟡 Media

**Dónde se propone (fuente):** [Database-Master-Schema §1 (Reglas de Oro: normalizar "NIDEC US"/"Nidec México" a un ID)](00-fuentes/BQS-MVP1-Database-Master-Schema.md) y [QA-Test-Cases — Caso 1](00-fuentes/BQS-MVP1-QA-Test-Cases.md).
**Situación actual:** la regla exige consolidar variantes a un único `ID_Cliente`, pero no define **cómo** (algoritmo, criterios, revisión humana).
**Propuesta:** tabla de mapeo `alias → ID_Cliente` + paso de revisión manual asistida durante la importación inicial; conservar el alias original para auditoría.
**Impacto:** consolidación correcta y reversible; evita fusiones erróneas de clientes distintos con nombres parecidos.
**Acción sugerida:** incorporar al job `import_inicial` ([ADR-004](02-arquitectura/ADR/ADR-004_cola-asincrona-cron.md)); el MVP1 cubre el resultado (Caso QA 1) pero conviene formalizar el gobierno.

## M-09 — Pregunta 1 excluye facturas `Vencida` · 🟢 Baja (clarificar)

**Dónde se propone (fuente):** [Technical-Specification §2 (Pregunta 1: `Estatus_Pago` = `Pagada` o `Vigente`)](00-fuentes/BQS-MVP1-Technical-Specification.md).
**Situación actual:** "¿Qué ya se facturó?" suma solo facturas `Pagada` o `Vigente` del mes; una factura emitida este mes que pasara a `Vencida` quedaría **fuera** del total facturado del mes.
**Propuesta:** confirmar la intención. Si "facturado del mes" debe reflejar **todo** lo emitido, incluir también `Vencida`. Si la exclusión es deliberada (solo "facturado y aún cobrable"), documentarlo como regla.
**Impacto:** evita subreportar la facturación del mes en escenarios de vencimiento intra-mes (raro, pero posible con plazos cortos).
**Acción sugerida:** la documentación respeta la fórmula de la fuente al pie de la letra ([RF-DASH-01](01-vision/01_SRS_especificacion_requisitos.md)); pendiente de aclaración de negocio.

## M-10 — Estatus `Vencida` sin mecanismo definido · 🟡 Media

**Dónde se propone (fuente):** [Technical-Specification §2/§3](00-fuentes/BQS-MVP1-Technical-Specification.md) y [Database-Master-Schema (FACTURAS.`Estatus_Pago`)](00-fuentes/BQS-MVP1-Database-Master-Schema.md).
**Situación actual:** la fuente lista `Vencida` como estatus posible, pero **no define quién ni cómo** se transiciona una factura a `Vencida`.
**Propuesta:** proceso automático que marque `Vencida` cuando `hoy > Fecha_Vencimiento` y el saldo > 0.
**Impacto:** mantiene la Pregunta 3 y la cartera al día sin intervención manual.
**Acción sugerida:** ya añadido como `bqs:mark-overdue` por cron ([ADR-004](02-arquitectura/ADR/ADR-004_cola-asincrona-cron.md), [SRS §4.1](01-vision/01_SRS_especificacion_requisitos.md)). Es una **adición** nuestra para dar sentido al estatus de la fuente; confirmar con BQS.

## M-11 — Zona horaria del "mes en curso" (Ciudad Juárez) · 🟠 Alta

**Dónde se propone (fuente):** [Technical-Specification §2 (Pregunta 1, "mes actual")](00-fuentes/BQS-MVP1-Technical-Specification.md).
**Situación actual:** el cálculo del "mes en curso" depende de la zona horaria. Ciudad Juárez opera en **Tiempo del Pacífico (UTC-7, `America/Ojinaga`)** con horario de verano (UTC-6), alineado con El Paso, TX — no en horario del Centro. Un offset fijo causa errores en los bordes de mes y en cambios de DST.
**Propuesta:** resolver los cortes de "mes en curso" y vencimientos con lógica **consciente de zona horaria y DST** en la aplicación (zona `America/Ojinaga`), no con un offset fijo en la sesión MySQL.
**Impacto:** evita que facturas del día 1 o del último día de mes se cuenten en el mes equivocado.
**Acción sugerida:** corregido el comentario/offset en el DDL de [03 §4](03-datos/03_modelo_de_datos.md) a UTC-7 y anotada esta mejora; la implementación correcta vive en la capa de aplicación.

## M-12 — RBAC más allá del whitelist de un solo usuario · 🟡 Media

**Dónde se propone (fuente):** [Technical-Specification §3](00-fuentes/BQS-MVP1-Technical-Specification.md) (whitelist; usuario principal Eric) y [Database-Master-Schema (BITACORA_SORTEO "alimentada por Lourdes o Juan Manuel")](00-fuentes/BQS-MVP1-Database-Master-Schema.md).
**Situación actual:** la fuente detalla la autenticación de Eric (lectura) pero no formaliza los roles de quienes **capturan** devengado o **registran** facturas/pagos, aunque los casos QA los presuponen.
**Propuesta:** RBAC con roles `capturista`, `facturacion` y `admin` además de `direccion`, con autorización por Policy en servidor.
**Impacto:** habilita la captura y administración necesarias para alimentar el dashboard, manteniendo a Eric en solo lectura.
**Acción sugerida:** definido en [SRS §2.2](01-vision/01_SRS_especificacion_requisitos.md) y [04 §3.3 RBAC](04-seguridad/04_plan_de_seguridad.md) como elaboración derivada de la fuente; confirmar la lista de roles y personas con BQS.

## M-13 — Notas de crédito / reversa de pagos · 🟢 Baja (diferible)

**Dónde se propone (fuente):** [QA-Test-Cases](00-fuentes/BQS-MVP1-QA-Test-Cases.md) (implícito) y [SRS §8](01-vision/01_SRS_especificacion_requisitos.md).
**Situación actual:** una factura `Pagada` es terminal y no hay mecanismo de corrección (nota de crédito, cancelación, reversa de pago mal aplicado).
**Propuesta:** módulo de correcciones fiscales/contables (notas de crédito y cancelaciones) con su propia auditoría.
**Impacto:** cubre errores operativos reales de cobranza.
**Acción sugerida:** ya listado como fuera de alcance en [SRS §8](01-vision/01_SRS_especificacion_requisitos.md) y backlog de [07](07-roadmap/07_roadmap_sprints.md); planear para v2.

---

## Nota final

Estas 13 oportunidades **no alteran** los documentos fuente ni la documentación entregada; son insumo para una conversación de producto/ingeniería con BQS. Las de severidad 🔴/🟠 (M-01 credenciales, M-11 zona horaria, M-03 trazabilidad, M-02 stack) son las que conviene resolver antes o durante el MVP1; el resto puede integrarse al backlog posterior.
