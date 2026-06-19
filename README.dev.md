# Portal Ejecutivo BQS — Guía de desarrollo (monorepo)

Implementación de los **Sprints 0 (Cimientos) y 1 (Autenticación + RBAC)** del
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

- PHP 8.2+ (`intl`, `mbstring`, `mysqli`/`pdo_mysql`), Composer
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
php spark migrate --all          # 8 tablas de dominio/soporte + tablas Shield
php spark db:seed InitialSeeder  # whitelist semilla + usuarios dev por rol
php spark serve                  # http://localhost:8080
```

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

## 6. Checklist de endurecimiento en producción (Site5)

No bloquea el desarrollo local; aplicar al desplegar (Arquitectura §6, Sprint 5–6):

- HTTPS forzado + HSTS; `.env` fuera del docroot con `CI_ENVIRONMENT=production`.
- `bqs.cookie.secure = true`; cookies de refresh `HttpOnly`/`Secure`/`SameSite=Strict`.
- Usuario MySQL de privilegios mínimos; **`REVOKE UPDATE,DELETE ON bqs.AUDITORIA`** tras migrar (bitácora inmutable).
- Desactivar listado de directorios; servir React (`web/dist`) estático y la API bajo `/api`.
- Rotar las credenciales expuestas en el documento fuente (M-01).
