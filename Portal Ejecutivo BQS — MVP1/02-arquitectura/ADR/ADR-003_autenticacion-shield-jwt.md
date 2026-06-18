# ADR-003 — Autenticación: CodeIgniter Shield + access tokens + whitelist

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 18/06/2026 |
| **Reemplaza** | — |
| **Depende de** | [Technical-Specification §3](../../00-fuentes/BQS-MVP1-Technical-Specification.md) · [QA-Test-Cases — Caso 5](../../00-fuentes/BQS-MVP1-QA-Test-Cases.md) · [ADR-001](ADR-001_stack-ci4-react.md) |

## 1. Contexto

La fuente (§3) exige acceso seguro a la API de CI4 con **Shield**, validando el correo mediante **whitelist** de cuentas autorizadas, con el usuario principal `eric@bestqualitysolutions.com`. La sesión debe gestionarse con cookies `HttpOnly` + `SameSite=Strict`, el perfil de Eric debe ser **solo lectura** (solo GET) y la conexión HTTPS con CSP estricta. El cliente es una SPA React ([ADR-001](ADR-001_stack-ci4-react.md)) que necesita autenticarse contra la API sin sesión de servidor tradicional renderizada.

## 2. Decisión

Autenticación basada en **Shield Access Tokens (Bearer)** para la SPA, combinada con dos barreras y rotación segura:

| Pieza | Decisión |
|---|---|
| Emisión | Shield emite un **access token de vida corta** (en memoria del cliente) tras validar credenciales. |
| Segunda barrera | El correo autenticado se cruza contra la **whitelist** (`AUTH_WHITELIST`) en cada login y en cada petición. |
| Refresh | **Cookie `HttpOnly` + `SameSite=Strict` + `Secure`** con el refresh token; el JS no la lee. |
| Solo lectura | El rol `direccion` (Eric) recibe tokens cuyo scope/Policy solo permite **GET**; un `POST/PUT/DELETE` se rechaza con 403. |
| Transporte | HTTPS obligatorio; cabeceras CSP, HSTS y `X-Content-Type-Options` en Site5. |
| Revocación | Tokens revocables en BD (Shield `identities`); logout y rotación invalidan el token. |

## 3. Consecuencias

**Positivas:** sin estado de sesión renderizado, ideal para SPA; doble barrera (credenciales + whitelist) ante fugas; el refresh en cookie `HttpOnly` mitiga robo por XSS; solo lectura ejecutiva protege el historial financiero.
**Negativas / trade-offs:** manejar dos tokens (access en memoria, refresh en cookie) añade complejidad al cliente; revocación requiere consulta a BD.
**Neutrales:** Shield ya forma parte del stack estipulado por la fuente.

## 4. Impacto en documentos existentes

- **[04 Seguridad §3.2](../../04-seguridad/04_plan_de_seguridad.md)**: flujo de autenticación con diagrama de secuencia y puntos de validación.
- **[05 API §1.2](../../05-api/05_especificacion_api.md)**: obtención, adjunto, refresco y revocación del token.
- **[06 Pruebas](../../06-pruebas/06_plan_de_pruebas.md)**: casos negativos (token inválido/expirado/revocado, fuera de whitelist, intento de escritura de Eric).

## 5. Implicaciones de seguridad

- **Refuerza** A07 (Identificación y Autenticación) y A01 (Control de Acceso) de OWASP.
- El access token en memoria evita persistencia en `localStorage` (objetivo de XSS).
- La whitelist convierte una credencial filtrada en insuficiente por sí sola (cubre el [Caso QA 5](../../00-fuentes/BQS-MVP1-QA-Test-Cases.md): `intruso@competidor.com` bloqueado).
- El scope de solo lectura para `direccion` reduce el radio de impacto si el dispositivo de Eric se ve comprometido.
