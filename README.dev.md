# Portal Ejecutivo BQS — Guía de desarrollo (monorepo)

Implementación de los **Sprints 0 (Cimientos), 1 (Autenticación + RBAC) y
2 (Tier 0 e importación inicial)** del
[roadmap](Portal%20Ejecutivo%20BQS%20%E2%80%94%20MVP1/07-roadmap/07_roadmap_sprints.md).
La documentación funcional/arquitectónica vive en la carpeta `Portal Ejecutivo BQS — MVP1/`.

```
/api   → API REST (CodeIgniter 4.7 + Shield, PHP 8.2+)
/web   → SPA (React 19 + Vite + TypeScript + Tailwind)
```

> **Seguridad:** ningún secreto se versiona. Copia `api/env` → `api/.env` y
> completa los valores reales ahí (gitignored). Las credenciales del documento
> fuente se consideran comprometidas → rotar (mejora M-01).

## Requisitos

- PHP 8.2+ (`intl`, `mbstring`, `mysqli`/`pdo_mysql`, **`zip`+`gd`** para XLSX), Composer
- Node 20+ y npm
- MySQL 8 (InnoDB)

## 1. Base de datos

Con Docker (reproducible, recomendado donde haya acceso a Docker Hub):

```bash
docker compose up -d mysql      # MySQL 8 en localhost:3306 (BD `bqs`, user `bqs_app`)
```

Sin Docker: instala MySQL 8 y crea las bases y el usuario de aplicación:

```sql
CREATE DATABASE bqs       CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE bqs_test  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'bqs_app'@'%' IDENTIFIED BY '<password>';
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX,REFERENCES,DROP ON bqs.*      TO 'bqs_app'@'%';
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX,REFERENCES,DROP ON bqs_test.* TO 'bqs_app'@'%';
FLUSH PRIVILEGES;
```

## 2. Backend (`/api`)

```bash
cd api
composer install
cp env .env
php spark key:generate
# Edita .env: conexión MySQL + bqs.seed.ericPassword (dev)
php spark migrate --all          # tablas de dominio/soporte (incl. CLIENTE_ALIAS) + Shield
php spark db:seed InitialSeeder  # whitelist semilla + usuarios dev por rol
php spark db:seed DemoTier0Seeder # (opcional, dev) datos de demo del Caso QA 1
php spark serve                  # http://localhost:8080
```

**Cola asíncrona (Sprint 2, ADR-004).** El trabajo pesado (importación inicial)
se encola en `JOBS_COLA` y lo procesa un worker idempotente y reintentable:

```bash
php spark bqs:process-queue          # procesa hasta 10 jobs pendientes
php spark bqs:process-queue --batch 50
```

En staging/producción se programa por cron cada ~5 min:

```cron
*/5 * * * * cd /ruta/api && php spark bqs:process-queue >> writable/logs/queue.log 2>&1
```

`DemoTier0Seeder` siembra el **Caso QA 1** ya consolidado (solo dev/staging):
`NIDEC Mobility` + `Nidec México` → un único **CLI-001** con cartera sumada de
**$250,000** (vía catálogo de alias `CLIENTE_ALIAS`, M-08). No se usa en pruebas.

**Hito Sprint 0:** los comandos anteriores corren sin errores y el esquema
queda creado (8 tablas + Shield, con `CHECK`, índices y collation `utf8mb4_0900_ai_ci`).

Usuarios dev sembrados (entorno != producción), contraseña = `bqs.seed.ericPassword`:

| Correo | Rol | En whitelist |
|---|---|---|
| `eric@bestqualitysolutions.com` | `direccion` (solo lectura) | sí |
| `admin@bestqualitysolutions.com` | `admin` | sí |
| `facturacion@bestqualitysolutions.com` | `facturacion` | sí |
| `capturista@bestqualitysolutions.com` | `capturista` | sí |
| `intruso@competidor.com` | `direccion` | **no** (Caso QA 5) |

## 3. Frontend (`/web`)

```bash
cd web
npm install
npm run dev      # http://localhost:5173 (proxy /api → :8080)
npm run build    # producción → web/dist
```

## 4. Calidad y pruebas

```bash
# Backend
cd api
composer analyse     # PHPStan nivel 8 (0 errores)
composer cs-check    # PHP-CS-Fixer (estilo)
composer test        # PHPUnit (esquema + auth/RBAC)

# Frontend
cd web
npm run typecheck && npm run lint && npm run build
```

## 5. API (Sprint 1) — `/api/v1`

Envelope: éxito `{ "data": ... }`, error `{ "error": { "code", "message" } }`.

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| POST | `/auth/login` | pública | doble barrera (credenciales + whitelist); 403 `NOT_WHITELISTED` |
| POST | `/auth/refresh` | cookie `HttpOnly` | rota el refresh; revalida whitelist |
| POST | `/auth/logout` | Bearer | revoca access + refresh |
| GET | `/auth/me` | Bearer | perfil + roles + `solo_lectura` |
| GET/POST | `/admin/whitelist` | Bearer + `admin` | listar / agregar |
| DELETE | `/admin/whitelist/{id}` | Bearer + `admin` | revocación lógica |
| GET | `/admin/usuarios`, PUT `/admin/usuarios/{id}/roles` | Bearer + `admin` | gestión de roles |

`direccion` (Eric) es **solo lectura**: cualquier escritura → 403 `READ_ONLY`.

### Sprint 2 — Tier 0 (`/api/v1`)

Colecciones paginadas: `{ "data": [...], "meta": { page, per_page, total, total_pages } }`.

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/clientes` | Bearer | búsqueda `q`, filtro `estatus`, paginación |
| POST | `/clientes` | Bearer + `admin` | 201 / 409 `CONFLICT` (ID o RFC) / 422 `VALIDATION` |
| GET | `/clientes/{id}` | Bearer | detalle + `cartera` consolidada (RF-CLI-03) |
| PUT | `/clientes/{id}` | Bearer + `admin` | el ID es inmutable |
| DELETE | `/clientes/{id}` | Bearer + `admin` | **baja lógica** (`Estatus=Inactivo`); la física la bloquea la FK `RESTRICT` |
| GET | `/cotizaciones` | Bearer | filtros `id_cliente`, `estatus` |
| POST | `/cotizaciones` | Bearer + `facturacion`/`admin` | 404 si el cliente no existe; monto numérico ≥ 0 |
| GET | `/cotizaciones/{id}` | Bearer | detalle + `consumo` (devengado vs autorizado, RF-COT-02) |
| PUT | `/cotizaciones/{id}` | Bearer + `facturacion`/`admin` | ID y cliente inmutables |
| POST | `/admin/import` | Bearer + `admin` | multipart `archivo` (CSV/XLSX) + `entidad` (CSV); **202** + `job_id` |
| GET | `/admin/jobs/{id}` | Bearer + `admin` | estado del job de la cola |

**Importación (RF-ADM-02).** CSV = una entidad por archivo (`entidad=clientes`
y luego `entidad=cotizaciones`, que resuelve contra los alias ya cargados);
XLSX = hojas `Clientes` y `Cotizaciones` en un solo archivo. Consolida clientes
variantes a un único ID (alias `CLIENTE_ALIAS`), sanea montos (`"N/A"`/negativos
se rechazan) y las filas sin cliente resuelto quedan reportadas para revisión.

## 6. Checklist de endurecimiento en producción (Site5)

No bloquea el desarrollo local; aplicar al desplegar (Arquitectura §6, Sprint 5–6):

- HTTPS forzado + HSTS; `.env` fuera del docroot con `CI_ENVIRONMENT=production`.
- `bqs.cookie.secure = true`; cookies de refresh `HttpOnly`/`Secure`/`SameSite=Strict`.
- Usuario MySQL de privilegios mínimos; **`REVOKE UPDATE,DELETE ON bqs.AUDITORIA`** tras migrar (bitácora inmutable).
- Desactivar listado de directorios; servir React (`web/dist`) estático y la API bajo `/api`.
- Rotar las credenciales expuestas en el documento fuente (M-01).
