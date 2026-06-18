# ADR-001 — Stack a medida: CodeIgniter 4 (API) + React 19 (SPA)

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 18/06/2026 |
| **Reemplaza** | — |
| **Depende de** | [Technical-Specification §1, §3](../../00-fuentes/BQS-MVP1-Technical-Specification.md) · [ADR-002](ADR-002_mysql-fuente-de-verdad.md) |

## 1. Contexto

La Especificación Técnica fuente (16/06/2026) define en §1 una *"aplicación de lectura ágil conectada a una base de datos maestra relacional MySQL alojada en el servidor Site5"*, con la cadena `API CodeIgniter 4 → Fetch/Axios → Portal Ejecutivo HTML5 + Tailwind CSS`. El backend (CI4 + MySQL + Shield) está plenamente definido y **no se discute**. La capa que requiere decisión es el cliente: la fuente menciona "HTML5 + Tailwind CSS" sin especificar framework.

El portal, aunque hoy responde tres preguntas, está destinado a crecer hacia un sistema de cartera (filtros por cliente, detalle de facturas, captura validada, futuros estados de cuenta). Un cliente HTML5 con JavaScript imperativo y manipulación manual del DOM escala mal en mantenibilidad, pruebas y consistencia de estado conforme crecen las vistas.

## 2. Decisión

Se conserva íntegro el backend de la fuente y se implementa el cliente como **SPA en React 19 (Vite + TypeScript)**, manteniendo **Tailwind CSS** y el patrón de consumo **Fetch/Axios** ya estipulados.

| Capa | Fuente (estipulado) | Decisión MVP1 | ¿Cambia? |
|---|---|---|---|
| Backend / API | CodeIgniter 4 | CodeIgniter 4 (4.7.x, PHP 8.2+) | No |
| Base de datos | MySQL maestra (Site5) | MySQL 8 InnoDB (Site5) | No |
| Autenticación | Shield + whitelist | Shield + access tokens + whitelist | No (se precisa) |
| Consumo HTTP | Fetch / Axios | Fetch / Axios | No |
| Estilos | Tailwind CSS | Tailwind CSS | No |
| Estructura cliente | "HTML5" (sin framework) | **React 19 + Vite + TypeScript** | **Sí** |

## 3. Mapeo de conceptos (HTML5 imperativo → React)

| Concepto en cliente HTML5 | Equivalente en React 19 |
|---|---|
| `fetch()` + `innerHTML` manual | Componente + `useEffect`/`useState` (o TanStack Query) |
| Variables globales / `data-*` | Estado de componente y props tipadas (TS) |
| Plantillas string / `<template>` | JSX con componentes reutilizables |
| Listeners manuales `addEventListener` | Manejadores declarativos `onClick`, `onSubmit` |
| Polling manual de saldos | Hook de datos con revalidación controlada |
| Validación dispersa en el DOM | Validación tipada en formularios + esquema |

> La superficie de red no cambia: en ambos casos el cliente consume la **misma** API REST por Fetch/Axios. React es una decisión de **organización del cliente**, no de protocolo.

## 4. Consecuencias

**Positivas**
- Mantenibilidad y escalabilidad del cliente conforme el portal crece a cartera completa.
- Tipado estático (TypeScript) reduce errores en el render de montos y estados financieros.
- Componentes probables con Vitest/Testing Library; pirámide de pruebas real en el cliente.
- Reutilización de componentes (tarjetas de KPI, tablas, badges de estado) y consistencia visual con el design system.

**Negativas / trade-offs aceptados**
- Paso de build (Vite) y artefacto `dist/` a desplegar en Site5; un HTML estático no lo requiere.
- Mayor curva inicial y tamaño de bundle frente a HTML+JS plano.
- Se introduce tooling de Node en el pipeline de despliegue de un hosting compartido.

**Neutrales**
- Tailwind y Fetch/Axios se mantienen idénticos a la fuente.
- El backend y la BD no se ven afectados por esta decisión.

## 5. Impacto en documentos existentes

- **README** y **CLAUDE.md**: stack del frontend = React 19 (ya reflejado).
- **[02 Arquitectura](../02_arquitectura_sistema.md)**: la capa de presentación se describe como SPA React; el diagrama de capas incluye el build de Vite.
- **[04 Seguridad](../../04-seguridad/04_plan_de_seguridad.md)**: §3.5 seguridad del cliente (escape de React, CSP, manejo de token en memoria).
- **[06 Pruebas](../../06-pruebas/06_plan_de_pruebas.md)**: añade Vitest/Testing Library al stack de pruebas.
- **[08 Design System](../../01-vision/08_identidad_visual_design_system.md)**: snippets de componentes en JSX + Tailwind.

## 6. Implicaciones de seguridad

- **Superficie nueva:** un bundle JS servido como estático y un paso de build. Mitigación: CSP estricta, Subresource Integrity donde aplique, sin secretos en el bundle (las claves viven en el backend `.env`).
- **Token en el navegador:** el access token se mantiene **en memoria** (no `localStorage`), y el refresh viaja en cookie `HttpOnly`+`SameSite=Strict` (ver [ADR-003](ADR-003_autenticacion-shield-jwt.md)). React no reduce ni amplía la necesidad de validar todo en el backend.
- **Escape por defecto:** React escapa el contenido renderizado, reduciendo XSS frente a `innerHTML` manual; se prohíbe `dangerouslySetInnerHTML` salvo con saneado explícito.

## 7. Plan de migración

No hay sistema anterior que migrar (es el cliente inicial del MVP1). El plan es de **implementación**: (1) andamiaje Vite + React + TS + Tailwind en `/web`; (2) cliente HTTP con interceptor de token; (3) componentes del dashboard de las 3 preguntas; (4) build a `dist/` y despliegue como estático servido por Apache en Site5, con la API CI4 bajo `/api`.
