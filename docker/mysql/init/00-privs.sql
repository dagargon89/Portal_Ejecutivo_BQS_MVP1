-- =====================================================================
-- Portal Ejecutivo BQS — MVP1 · Privilegios de base de datos (dev/local)
-- Se ejecuta una sola vez al inicializar el contenedor (antes de migrar).
-- Referencia: Plan de Seguridad 04 §3.6 (usuario de aplicación de
-- privilegios mínimos) y Modelo de Datos 03 (AUDITORIA inmutable).
-- =====================================================================

-- El usuario `bqs_app` (creado por MYSQL_USER) ya recibe privilegios sobre
-- `bqs.*`, suficientes para que `php spark migrate` cree el esquema en dev.
-- Permitir conexión desde cualquier host del bridge de Docker.
ALTER USER 'bqs_app'@'%' IDENTIFIED WITH caching_sha2_password BY 'dev_app_pwd';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, DROP
  ON `bqs`.* TO 'bqs_app'@'%';
FLUSH PRIVILEGES;

-- ---------------------------------------------------------------------
-- ENDURECIMIENTO DE PRODUCCIÓN (Site5) — aplicar DESPUÉS de migrar,
-- cuando la tabla AUDITORIA ya existe. No puede correr en este init
-- porque la tabla aún no se ha creado. Documentado en README.dev.md:
--
--   REVOKE UPDATE, DELETE ON `bqs`.`AUDITORIA` FROM 'bqs_app'@'%';
--   REVOKE DROP, ALTER, CREATE, REFERENCES ON `bqs`.* FROM 'bqs_app'@'%';
--
-- En producción el usuario de la aplicación NO debe poder modificar ni
-- borrar registros de AUDITORIA (bitácora inmutable, doc 03 §8) ni alterar
-- el esquema; las migraciones se ejecutan con un usuario administrador.
-- ---------------------------------------------------------------------
