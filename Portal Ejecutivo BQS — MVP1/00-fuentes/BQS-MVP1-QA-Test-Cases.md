# Plan de Control de Calidad y Pruebas
# BQS MVP1 QA Test Cases

**Proyecto:** BQS Executive Accounts Receivable and Billing Portal  
**Versión:** 1.0.0  
**Fecha:** 16/06/2026  
**Responsable:** QA Engineer / Agente Verificador  

---

## 1. Escenarios de Prueba de Aceptación (Definition of Done)

Para considerar el MVP1 como finalizado y listo para su presentación final ante el cliente, se deberán ejecutar y documentar satisfactoriamente los siguientes casos de prueba:

---

### Caso de Prueba 1: Validación del Tier 0 (Limpieza de Clientes)
* **Objetivo:** Verificar que el portal consolide correctamente la información de clientes que previamente tenían nombres variantes en los Excels sucios.
* **Precondiciones:** La base de datos tiene registros de cotizaciones para el cliente con ID `CLI-001` pero con textos "NIDEC Mobility" y "Nidec México".
* **Pasos:**
  1. Abrir la sección de Clientes en el Portal Ejecutivo.
  2. Buscar el registro de `NIDEC Mobility` (`CLI-001`).
  3. Comprobar que los montos de cotizaciones de ambos nombres previos se sumen correctamente en este único perfil.
* **Resultado Esperado:** Se visualiza una única entidad de cliente consolidada con la suma total correcta de su cartera.

---

### Caso de Prueba 2: Cálculo de "Qué ya se facturó" (Pregunta 1)
* **Objetivo:** Confirmar que el monto de facturación mensual en pantalla coincide exactamente con la suma de las facturas activas del mes.
* **Precondiciones:** Tabla `FACTURAS` cargada con $100,000 en facturas emitidas este mes y $50,000 del mes anterior.
* **Pasos:**
  1. Acceder al portal web ejecutivo en el navegador (móvil o escritorio).
  2. Localizar el indicador numérico "Facturado este Mes".
  3. Comparar el valor visual con la suma de la base de datos para el mes actual.
* **Resultado Esperado:** El indicador muestra exactamente `$100,000.00`. Excluye las facturas de meses previos.

---

### Caso de Prueba 3: Cálculo de "Qué falta por facturar" (Pregunta 2)
* **Objetivo:** Asegurar que los servicios ejecutados no facturados (dinero atorado) se calculen en tiempo real.
* **Precondiciones:** Registrar un servicio de sorteo en `BITACORA_SORTEO` por $10,000 con `Estatus_Facturacion` = `Pendiente`.
* **Pasos:**
  1. Abrir la pestaña "Pendiente por Facturar" en la aplicación móvil.
  2. Verificar que se muestre el desglose por cotización y que la suma total aumente en $10,000.
* **Resultado Esperado:** El portal actualiza el indicador mostrando el monto de $10,000 pendiente por cobrar.

---

### Caso de Prueba 4: Cálculo de "Cuánto te deben" con Abonos Parciales (Pregunta 3)
* **Objetivo:** Validar que los saldos de cuentas por cobrar disminuyan correctamente tras registrar un pago parcial.
* **Precondiciones:** Factura `F-9901` emitida por $50,000 con estatus `Vigente`.
* **Pasos:**
  1. Registrar un abono en `PAGOS` por $20,000 ligado a `F-9901`.
  2. Abrir la sección de saldos del cliente titular en la app.
  3. Verificar el valor de deuda restante para este folio.
* **Resultado Esperado:** La aplicación muestra que el saldo pendiente de cobro de esa factura es de `$30,000.00`.

---

### Caso de Prueba 5: Seguridad de Whitelist
* **Objetivo:** Evitar accesos no autorizados al portal financiero de Eric.
* **Precondiciones:** El correo `intruso@competidor.com` no está en la lista de acceso.
* **Pasos:**
  1. Intentar iniciar sesión en el portal web ejecutivo usando la cuenta no autorizada.
* **Resultado Esperado:** El sistema bloquea el ingreso y muestra una pantalla de acceso denegado.
