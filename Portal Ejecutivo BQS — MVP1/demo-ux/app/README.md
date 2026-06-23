# Portal Ejecutivo BQS — Demo UI/UX (Fase 1)

Prototipo navegable del Portal Ejecutivo BQS (MVP1), construido según la
**Metodología Demo-First v2**. Es el esqueleto del frontend de producción:
consume un `db.json` espejo del DDL a través de una única interfaz
(`src/lib/api.ts`). En la Fase 2 solo se cambia el origen de datos (JSON → API
CI4) rellenando `api.real.ts`; las pantallas no se reescriben.

> Especificación completa: [`../09_demo_ux_guia.md`](../09_demo_ux_guia.md).

## Requisitos

- Node.js ≥ 20
- npm ≥ 10

## Arranque

```bash
cp .env.example .env      # VITE_USE_MOCK=true (datos simulados)
npm install
npm run dev               # http://localhost:5173
```

Otros scripts:

```bash
npm run typecheck         # tsc --noEmit
npm run lint              # ESLint
npm run build             # build de producción
npm run preview           # previsualiza el build
```

## Acceso (datos simulados, la contraseña no se valida)

Usa los botones de **acceso rápido por rol** en el login, o estos correos:

| Rol | Correo | Ve |
|---|---|---|
| Administrador | `admin@dataholics.com.mx` | Todo el sistema |
| Facturación | `facturacion@bestqualitysolutions.com` | Facturas, pagos, cotizaciones |
| Capturista | `captura@bestqualitysolutions.com` | Captura de devengado |
| Dirección | `eric@bestqualitysolutions.com` | Solo lectura |

Prueba `intruso@competidor.com` para ver el **bloqueo de whitelist** (QA5).

## Casos QA reproducidos

- **QA1** — Cliente CLI-001 (NIDEC) consolidado con su cartera sumada.
- **QA2** — "Facturado del mes" = $100,000.00 (excluye el mes anterior).
- **QA3** — "Por facturar" = $10,000.00 con desglose por cotización.
- **QA4** — Factura F-9901: $50,000 − $20,000 = saldo **$30,000.00**.
- **QA5** — Correo fuera de la whitelist → pantalla de acceso denegado.

## Estructura

Ver `09_demo_ux_guia.md` §10. En resumen: `src/lib` (contrato + mock + tipos
espejo del DDL), `src/components/ui` (biblioteca del Design System doc 08),
`src/components/layout` (panel: AppShell/Sidebar/Topbar), `src/pages` (una por
pantalla), `src/auth` (sesión simulada por rol).

## Cambiar a backend real (Fase 2)

1. `VITE_USE_MOCK=false` y `VITE_API_URL=https://bqs.dataholics.com.mx/api`.
2. Completar `src/lib/api.real.ts` (ya esqueletado).
3. Reemplazar `src/auth/session.tsx` por el flujo real de Shield.
4. Borrar `src/lib/api.mock.ts` y `src/lib/mock/`.

> Datos 100% simulados, sin persistencia, sin PII real.
