# Trazabilidad con el Plan de Requerimientos y Testing

Estado de cada requerimiento del archivo `PlanRequerimientos.Testing_ChurriHub.xlsx` en la versión 2.1 de ChurriHub, con la pantalla donde se cumple y el caso de prueba automático que lo verifica (`npm test`).

**Estados:** ✅ Cumple · 🟡 Parcial (funciona en esta versión con una limitación explicada) · ⏳ Requiere servidor (no se puede resolver en una app que corre solo en el navegador).

## Requerimientos funcionales

| ID | Requerimiento | Estado | Dónde | Prueba |
|---|---|---|---|---|
| RF-01 | Ingesta automática de ventas de cada sucursal | ⏳ | Datos para Analytics → Fuentes de datos (figura como pendiente) | — |
| RF-02 | Consolidar ventas en un modelo único | ✅ | Todas las ventas comparten los mismos campos; Datos para Analytics publica `fact_ventas` y controla duplicados | Analytics |
| RF-03 | Historial de importaciones | ✅ | Importar ventas → Historial (archivo, sucursal, usuario, período, registros, errores) | TT03 |
| RF-04 | Reportes gerenciales semanales automáticos | 🟡 | Reportes gerenciales → Reporte semanal. Se arma solo con los datos cargados; se imprime o guarda en PDF/CSV. El envío por correo cada lunes requiere servidor | TT04 |
| RF-05 | Métricas por canal, producto, sucursal y período | ✅ | Reportes: ventas por canal, ranking, comparativa por sucursal y variación contra el período anterior | TT05 |
| RF-06 | Perfiles con permisos diferenciados | ✅ | Inicio de sesión con correo y contraseña; cada usuario ve solo lo de su rol. Empleado: Inicio, Cierres de caja, Stock. Encargado: además Ventas, Compras, Proveedores, Importar, Reportes. Gerente: todo | TT06 |
| RF-07 | Alta de usuarios con nombre, correo, rol y sucursal | ✅ | Usuarios → Nuevo usuario (rechaza sin correo, con correo inválido o sin rol) | TT07 |
| RF-08 | Invitación por correo electrónico | 🟡 | Usuarios → Invitar: arma el correo con el enlace y lo abre en el programa de correo; queda registrada la fecha. El envío automático requiere servidor | TT08 |
| RF-09 | Modificar roles y reasignar sucursales | ✅ | Usuarios → Editar | TT09 |
| RF-10 | Inicio informativo sin datos ni métricas | ✅ | Inicio: logo, nombre, propósito, áreas y sucursales | TT10 |
| RF-11 | Menú dinámico según el rol del usuario autenticado | ✅ | Barra lateral, según el usuario que inició sesión; además, entrar por URL a una página no permitida redirige a Inicio | TT11 |
| RF-12 | Detalle de ventas | ✅ | Ventas → clic en una fila | TT12 |
| RF-13 | Filtros de ventas | ✅ | Ventas: período, sucursal, medio de pago, canal y búsqueda por producto | TT13 |
| RF-14 | Cierre de caja por sucursal y fecha | ✅ | Cierres de caja (uno por sucursal y día) | TT14 |
| RF-15 | Saldo calculado automáticamente | ✅ | Cierres de caja | TT15 |
| RF-16 | Editar cierres propios | ✅ | Cada usuario edita los suyos; el gerente todos; los ajenos figuran como Bloqueado | TT16 |
| RF-17 | Inventario de insumos y productos | ✅ | Stock (pestañas Insumos / Productos) | TT17 |
| RF-18 | Alerta de stock crítico (stock ≤ mínimo) | ✅ | Stock: fila resaltada y "Por reponer"; contador en el menú | TT18 |
| RF-19 | Ingresar y consumir stock sin quedar bajo cero | ✅ | Stock → Ajustar (disponible también para Empleado) | TT19 |
| RF-20 | Ajustes mayores a cero y fecha de actualización | ✅ | Stock → Ajustar | TT20 |
| RF-21 | Alta de registros de stock | ✅ | Stock → Agregar ítem | TT21 |
| RF-22 | Proveedores con alta, edición y baja confirmada | ✅ | Proveedores (gerente y encargado) | TT22 |
| RF-23 | Orden de compra a proveedor registrado | ✅ | Órdenes de compra → Nueva orden | TT23 |
| RF-24 | Subtotales y total de la orden | ✅ | Nueva orden (columna Subtotal) y listado | TT24 |
| RF-25 | Orden en estado Pendiente | ✅ | Órdenes de compra | TT25 |
| RF-26 | Recibir orden y sumar stock | ✅ | Órdenes de compra → Recibir (crea el ítem si no existía) | TT26 |
| RF-27 | Indicadores gerenciales generales | ✅ | Reportes: ventas totales, transacciones, ticket promedio, unidades y producto más vendido | TT27 |
| RF-28 | Evolución de ventas por fecha | ✅ | Reportes | TT28 |
| RF-29 | Comparativa Wilde vs Miramar | ✅ | Reportes (con "Todas las sucursales") | TT29 |
| RF-30 | Rankings por unidades e ingresos | ✅ | Reportes → Ranking (selector) | TT30 |
| RF-31 | Importar Excel y CSV | ✅ | Importar ventas: .csv, .xlsx y .xls. **Corrige el defecto D1** | TT31 |
| RF-32 | Elegir sucursal y revisar archivo antes de importar | ✅ | Importar ventas: muestra archivo, sucursal y período cubierto antes de guardar | TT32 |
| RF-33 | Validar campos esenciales | ✅ | Fecha, producto, cantidad y precio obligatorios. Completar precios vacíos con el de lista es opcional y viene desactivado | TT33 |
| RF-34 | Resultado de la importación con errores por fila | ✅ | Importar ventas → Resultado de la importación | TT34 |

## Requerimientos no funcionales

| ID | Requerimiento | Estado | Comentario |
|---|---|---|---|
| RNF-01 | Disponibilidad ≥ 99 % mensual | ⏳ | Depende del hosting (VPS de DigitalOcean previsto) y del monitoreo |
| RNF-02 | Cifrado en tránsito y credenciales rotativas | 🟡 | Contraseñas con hash y sal, cambio obligatorio de claves temporales, bloqueo por intentos. HTTPS y la validación en servidor quedan para el despliegue |
| RNF-03 | Backup diario con 30 días de retención | 🟡 | Exportar → Copia de seguridad (manual). El backup diario automático se configura en el servidor |
| RNF-04 | Latencia de sincronización ≤ 15 minutos | ⏳ | Depende de la ingesta automática (RF-01) |
| RNF-05 | Nuevas sucursales sin rediseñar el modelo | ✅ | Catálogo y sucursales → Sucursales. Verificado en TT39 |
| RNF-06 | Web adaptable a navegadores y pantallas | ✅ | Diseño responsive con menú en cajón en celular. Falta la prueba manual en Chrome, Edge y Firefox (TT40) |

## Defectos

| ID | Descripción | Estado |
|---|---|---|
| D1 | La importación de ventas no admite archivos .xls (RF-31) | Corregido en la versión 2.1. Verificado por TT31 |
