# ChurriHub

Gestión operativa de la cadena **Tu Churrito** (sucursales Wilde y Miramar): ventas, carga de archivos Excel/CSV, cierres de caja, stock, compras, proveedores, catálogo, reportes y usuarios con permisos por rol.

Es la versión 2 del prototipo hecho en Base44, reescrita como una app web sin dependencias de plataforma y alineada con el Plan de Requerimientos y Testing (RF-01 a RF-34, RNF-01 a RNF-06). Viene con datos de muestra realistas: catálogo con precios vigentes, ventas de todo el año en ambas sucursales, stock de insumos, cierres de caja y órdenes de compra.

El estado de cada requerimiento está en [`docs/TRAZABILIDAD.md`](docs/TRAZABILIDAD.md).

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior (incluye `npm`).

## Cómo abrirlo

### Visual Studio Code

1. **Archivo → Abrir carpeta…** y elegí la carpeta `churrihub`.
2. Abrí una terminal (**Terminal → Nueva terminal**) y ejecutá:

   ```bash
   npm install
   npm run dev
   ```

3. Se abre el navegador en <http://localhost:5173>. Los cambios en el código se recargan solos.

La extensión recomendada *lit-html* (VS Code la sugiere al abrir la carpeta) colorea el HTML dentro de las plantillas `html\`…\``.

### IntelliJ IDEA / WebStorm

1. **File → Open…** y elegí la carpeta `churrihub`.
2. Cuando aparezca el aviso de `package.json`, hacé clic en **Run 'npm install'** (o ejecutalo en la terminal integrada).
3. En la ventana **npm** (View → Tool Windows → npm) hacé doble clic en `dev`, o ejecutá `npm run dev` en la terminal.

Si usás IntelliJ IDEA Community, instalá el plugin de JavaScript o usá la terminal para los comandos.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Genera la versión para publicar en `dist/` |
| `npm run preview` | Sirve la carpeta `dist/` para probar el build |
| `npm test` | Corre las pruebas automáticas de los casos TT del plan de testing |
| `npm run muestras` | Regenera los informes de ventas de muestra de la carpeta `muestras/` |

La carpeta `dist/` es estática: se puede subir tal cual a Netlify, Vercel, GitHub Pages o cualquier hosting.

## Publicar en internet (GitHub Pages)

El proyecto trae `.github/workflows/deploy.yml`: cada vez que se sube un cambio a la rama `main`, GitHub corre las pruebas, arma la app y la publica en `https://TU-USUARIO.github.io/churrihub/`. Si alguna prueba falla, no se publica.

1. Subí el proyecto a un repositorio de GitHub (con la carpeta `.github` incluida).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Andá a la pestaña **Actions**: vas a ver "Publicar en GitHub Pages" corriendo. Si no arrancó, entrá al flujo y tocá **Run workflow**. Tarda unos 2 minutos.
4. Cuando termine en verde, el link aparece en **Settings → Pages** y en el resumen del flujo.

En el plan gratuito de GitHub, Pages solo funciona con repositorios **públicos**.

En el celular, desde el navegador se puede usar **Agregar a la pantalla de inicio** (en iPhone, desde el botón Compartir): queda con el ícono de Tuchurrito y se abre como una app.

Mientras no haya servidor, **cada dispositivo guarda sus propios datos**: lo que se carga en el celular no aparece en la computadora. Para pasar datos de un equipo a otro usá **Exportar → Copia de seguridad**.

## Estructura

```
churrihub/
├── index.html              Punto de entrada
├── .github/workflows/      Publicación automática en GitHub Pages
├── public/                 Logo, íconos y manifiesto para instalar en el celular
├── docs/TRAZABILIDAD.md    Estado de cada requerimiento y su prueba
├── tests/                  Pruebas automáticas (npm test)
├── muestras/               Dos informes de ventas listos para importar
├── scripts/                Generador de los informes de muestra
├── vite.config.js
├── package.json
└── src/
    ├── main.js             Arranca la app
    ├── App.js              Estructura general: menú, filtros, ruteo por #hash
    ├── styles.css          Estilos y tema claro/oscuro (variables CSS)
    ├── data/
    │   ├── store.js        Capa de datos (lectura, escritura, copias de seguridad)
    │   └── generador.js    Catálogo, precios y generador de los datos de muestra
    ├── lib/
    │   ├── util.js         Fechas (siempre en hora local), formatos, canales y medios de pago
    │   ├── archivos.js     Generación de CSV y descargas
    │   ├── auth.js         Contraseñas: hash, verificación, reglas y claves temporales
    │   ├── tema.js         Selector de tema claro / oscuro / automático
    │   ├── derivados.js    Cálculos: ventas, métricas, ranking, stock crítico
    │   ├── permisos.js     Los 7 módulos, páginas visibles por rol e íconos
    │   └── importacion.js  Lectura de CSV/Excel y validación de filas de ventas
    ├── components/
    │   └── ui.js           Modal, avisos, confirmaciones, tarjetas, gráfico de líneas
    └── pages/              Una pantalla por archivo
        ├── Inicio.js  Ventas.js  Caja.js  Stock.js  Catalogo.js  Compras.js  Proveedores.js
        └── Carga.js  Reportes.js  Semanal.js  Exportar.js  Analytics.js  Usuarios.js  Login.js
```

Stack: [Preact](https://preactjs.com) + [htm](https://github.com/developit/htm) (componentes con plantillas `html` en lugar de JSX, sin paso de compilación), [SheetJS](https://sheetjs.com) para leer Excel y [Vite](https://vitejs.dev) como servidor y empaquetador.

## Datos

En esta versión los datos se guardan en el **navegador** (`localStorage`). Eso implica:

- Cada navegador y cada computadora tiene su propia copia.
- Si se borran los datos del sitio, se pierden. Usá **Exportar → Copia de seguridad** para descargar un JSON y restaurarlo cuando haga falta (también sirve para pasar los datos a otra computadora).
- **Exportar → Volver a los datos iniciales** vuelve a generar los datos de muestra hasta el día de hoy.

### Modelo

| Colección | Contenido |
|---|---|
| `sucursales` | Wilde y Miramar |
| `productos` | Catálogo de venta (nombre, categoría, precio de lista, unidad, activo) |
| `insumos` | Materias primas (nombre, unidad, stock mínimo sugerido) |
| `proveedores` | Contacto, insumos que provee, condiciones de pago |
| `stock` | Un registro por sucursal + ítem. Id: `sucursal__tipo__item` (evita duplicados) |
| `compras` | Órdenes con estado `pendiente` / `recibida` / `cancelada` |
| `cierres` | Un cierre por sucursal y día. Id: `sucursal_AAAA-MM-DD` |
| `lotes` | Ventas agrupadas por carga (archivo, venta manual del día o migración). Cada venta: fecha, producto, cantidad, precio, medio de pago y canal |
| `usuarios` | Nombre, correo, rol, sucursal y fecha de invitación |

### Conectar un backend

Toda la app lee y escribe a través de `src/data/store.js` (`S.data`, `api.set`, `api.update`, `api.del`, `useStore`). Para usar una base de datos compartida (Supabase, Firebase, Base44 o una API propia) alcanza con reimplementar ese archivo con la misma interfaz: cargar las colecciones en `S.data`, llamar a `emitir()` cuando cambian y hacer que `api` escriba en el servidor. Las pantallas no necesitan cambios. En ese paso, el inicio de sesión (`iniciarSesion`, `cerrarSesion`, `cambiarClave` en el mismo archivo) pasa a validarse contra el servidor.

## Inicio de sesión

La app no entra directamente: cada persona ingresa con su **correo y contraseña**, y ve solo los módulos de su rol y su sucursal.

### Usuarios de demostración

Contraseña de todos: `churri2026`. En la pantalla de ingreso aparecen en "Usuarios de demostración" y se completan con un toque.

| Usuario | Correo | Rol | Sucursal |
|---|---|---|---|
| Gerente general | `gerencia@ejemplo.com` | Gerente | Todas |
| Encargado Wilde | `encargado.wilde@ejemplo.com` | Encargado | Wilde |
| Encargado Miramar | `encargado.miramar@ejemplo.com` | Encargado | Miramar |
| Empleado Wilde | `caja.wilde@ejemplo.com` | Empleado | Wilde |
| Empleado Miramar | `caja.miramar@ejemplo.com` | Empleado | Miramar |

Cuando un usuario cambia su contraseña, deja de aparecer en esa lista. Antes de usar la app con datos reales, cambiá la contraseña de cada uno (o eliminalos y creá los usuarios reales).

### Cómo funciona

- **Ingreso:** correo (sin importar mayúsculas) y contraseña. Si los datos no coinciden, el mensaje es el mismo para correo inexistente o contraseña incorrecta, para no revelar qué correos existen.
- **Bloqueo:** después de 5 intentos fallidos con un correo, se bloquea 60 segundos.
- **Duración:** la sesión se cierra al cerrar el navegador o a las 12 horas. Con "Mantener la sesión iniciada" dura 30 días (solo para computadoras personales).
- **Cerrar sesión:** botón en la parte inferior de la barra lateral. Vuelve a la pantalla de ingreso. Cerrar sesión en una pestaña la cierra en las demás.
- **Cambiar contraseña:** botón en la barra lateral; pide la actual. Mínimo 8 caracteres, con letras y números, sin usar el nombre ni el correo.
- **Alta de usuarios (gerente):** al crear un usuario se genera una **contraseña temporal** que se muestra una sola vez para pasársela por otro medio. En el primer ingreso tiene que elegir una propia. La invitación por correo no incluye la contraseña.
- **Olvido de contraseña:** un gerente usa **Usuarios → Contraseña** para generar una temporal nueva.
- **Desactivar:** desde Editar se puede bloquear el acceso de un usuario sin borrarlo. Si estaba con la sesión abierta, se le cierra.
- **Resguardos:** siempre queda al menos un gerente activo y nadie puede cambiarse el rol ni desactivarse a sí mismo.
- Se registra el **último ingreso** de cada usuario.

### Seguridad

Las contraseñas se guardan como hash SHA-256 con sal aleatoria por usuario y 4.000 iteraciones; nunca en texto. Aun así, en esta versión todo corre en el navegador: separa usuarios y privilegios para el uso diario en el local, pero alguien con conocimientos técnicos y acceso a la computadora podría saltear el control abriendo las herramientas de desarrollador. La protección real (RNF-02) llega con el servidor: validar la contraseña y los permisos del lado del servidor, con HTTPS.

## Módulos y roles

La app se organiza en los 7 módulos del Enfoque de Implementación:

| Módulo | Páginas | Gerente | Encargado | Empleado |
|---|---|---|---|---|
| Ventas y caja | Ventas · Cierres de caja | Sí · Sí | Sí · Sí | — · Sí |
| Stock e insumos | Stock · Catálogo y sucursales | Sí · Sí | Sí · — | Sí · — |
| Compras y proveedores | Órdenes de compra · Proveedores | Sí | Sí | — |
| Integración y sincronización | Importar ventas | Sí | Sí | — |
| Reportes gerenciales | Reportes · Reporte semanal · Exportar | Sí | Sí | — |
| Datos para Analytics | Tablas para Power BI | Sí | — | — |
| Usuarios y permisos | Usuarios | Sí | — | — |

Encargados y empleados ven solo su sucursal. El empleado puede ingresar y consumir stock; fijar conteos, cambiar mínimos y dar de alta ítems queda para encargado y gerente. Cada usuario edita solo sus propios cierres de caja; el gerente, todos. Para probar cada rol, cerrá sesión e ingresá con otro de los usuarios de demostración.

## Formato del archivo de ventas

Primera fila con encabezados; acepta `.csv` (separado por coma o punto y coma), `.xlsx` y `.xls`.

| Columna | Obligatoria | Ejemplos aceptados |
|---|---|---|
| Fecha | Sí | `28/10/2026`, `2026-10-28`, fecha de Excel |
| Producto | Sí | Se empareja con el catálogo sin importar mayúsculas ni acentos |
| Cantidad | Sí | `3`, `1,5` |
| Precio Unitario | Sí | `1600`, `$ 1.600`, `1.600,50`. Si falta pero hay columna Total, se calcula `Total ÷ Cantidad`. Opcionalmente se pueden completar los vacíos con el precio de lista |
| Medio de Pago | No | Efectivo, Tarjeta (débito/crédito), cualquier otro → QR / transferencia |
| Sucursal | No | Si está, manda sobre la sucursal elegida en pantalla |
| Canal | No | Mostrador (por defecto), Delivery, PedidosYa / Rappi → Apps de delivery |

Antes de guardar se muestra cada fila con su estado. Las filas que ya estaban cargadas (misma sucursal, fecha, producto, cantidad, precio y medio) se marcan y se pueden omitir.

## Datos de muestra

La primera vez que se abre la app (o al usar "Volver a los datos iniciales") se generan los datos de base hasta el día de hoy, para que todos los filtros (Hoy, 7 días, Mes, Año y Rango) tengan información en ambas sucursales:

- **Catálogo con precios vigentes (pesos, octubre 2026):** churro simple $1.100, con cobertura de chocolate $1.400, relleno común $1.500, relleno especial $1.500, salado $1.500; café chico $4.300, café grande $4.500; Coca-Cola, Coca-Cola Zero, Fanta, Sprite y Sprite Zero $3.000; agua con y sin gas $2.400.
- **Ventas desde el 1 de enero:** por producto, medio de pago (efectivo, tarjeta, QR) y canal (mostrador, delivery propio, apps). Los precios de meses anteriores se descuentan con una inflación aproximada de 2,2% mensual. Wilde vende más en invierno; Miramar, como ciudad costera, en enero, febrero y vacaciones de invierno. Los fines de semana venden más y algunos días de lluvia menos. Las ventas de hoy reflejan la jornada en curso.
- **Stock real de insumos y bebidas** por sucursal, con mínimos, fecha de actualización y algunos ítems por debajo del mínimo.
- **Cierres de caja** de los últimos 60 días (con alguna diferencia a revisar) y **órdenes de compra** de las últimas 8 semanas, con tres pendientes de recibir.

Los números se generan de forma determinística: el mismo día y sucursal siempre dan los mismos valores. Los parámetros están en `src/data/generador.js`.

### Informes para importar

En `muestras/` hay dos informes de **diciembre 2025** (antes de los datos de base, así no se duplican):

| Archivo | Formato | Contenido |
|---|---|---|
| `ventas_wilde_diciembre_2025.xlsx` | Excel | ~1.900 filas, sin errores |
| `ventas_miramar_diciembre_2025.csv` | CSV con `;` | ~1.950 filas, con 3 filas a corregir (sin precio, fecha inválida, cantidad cero) y 1 producto fuera de catálogo |

Se importan desde **Importar ventas** eligiendo la sucursal. Después se ven con el filtro **Rango** (01/12/2025 – 31/12/2025).

## Tema claro y oscuro

El selector de la barra superior alterna entre **claro**, **oscuro** y **automático** (sigue la configuración del dispositivo). La elección queda guardada en el navegador.

## Novedades de la versión 2.4

- Lista para publicar en GitHub Pages con un flujo automático que prueba, arma y publica.
- Se puede agregar a la pantalla de inicio del celular con ícono propio.
- Indicadores de Reportes en dos columnas en el celular.

## Novedades de la versión 2.3

- Inicio de sesión con correo y contraseña, cierre de sesión y cambio de contraseña.
- Contraseñas temporales para usuarios nuevos y restablecimiento por el gerente, con cambio obligatorio en el primer ingreso.
- Bloqueo por intentos fallidos, usuarios activos/desactivados y registro del último ingreso.
- Se quitó el selector "Usuario activo".

## Novedades de la versión 2.2

- Paleta renovada con los colores de Tuchurrito en modo claro y oscuro, y selector de tema.
- Diseño adaptado a celulares, tablets y pantallas grandes: menú en cajón, filtros desplazables, formularios en una columna y ventanas tipo hoja inferior en el celular.
- Catálogo con precios reales y datos de muestra para todo el año.
- Stock de insumos real por sucursal.
- Dos informes de ventas de muestra para importar.

## Novedades de la versión 2.1

- Logo y colores de Tuchurrito.
- Inicio informativo sin métricas, con accesos directos a los módulos del rol (RF-10, RF-11).
- Reportes con los indicadores de RF-27 (transacciones y ticket promedio), ranking por unidades o ingresos, ventas por canal y comparativa por sucursal en tabla.
- Reporte semanal listo para imprimir o guardar en PDF (RF-04).
- Detalle de cada venta y filtro por canal (RF-12, RF-13).
- Importación: resumen previo con período cubierto, precio obligatorio, resultado con errores por fila y usuario en el historial (RF-03, RF-32 a RF-34). La importación de .xls (defecto D1) funciona.
- Stock con Ingresar / Consumir para todos los roles, validando valores mayores a cero (RF-19, RF-20).
- Usuarios con correo obligatorio e invitación por correo (RF-07, RF-08).
- Alta de sucursales desde Catálogo (RNF-05) y módulo Datos para Analytics con las tablas para Power BI.
- Pruebas automáticas de los casos TT (`npm test`).

## Cambios respecto del prototipo

**Errores corregidos**

- Recibir una compra no sumaba stock: `Stock.filter()` devuelve un array y el código desestructuraba `{ items }`; además faltaba un `await`, así que el error no se veía. El mismo problema impedía descontar stock al cargar ventas.
- El formulario de compras podía guardar órdenes sin sucursal cuando el gerente tenía "Todas" seleccionado.
- Los ítems de stock creados al recibir compras quedaban sin nombre de sucursal.
- Las fechas se interpretaban en UTC: en Argentina se mostraba el día anterior y después de las 21 h "hoy" pasaba a ser mañana.
- Un medio de pago fuera de `efectivo/tarjeta/otro` hacía fallar la carga completa del archivo; tampoco se detectaban archivos subidos dos veces.
- Las restricciones por rol solo ocultaban el menú: cualquier usuario podía entrar a otra pantalla escribiendo la dirección.
- El gerente no podía registrar un cierre de caja sin elegir sucursal, con un mensaje engañoso; se podían cargar varios cierres para la misma sucursal y día.

**Mejoras**

- Carga de ventas con vista previa y validación fila por fila, detección de duplicados y precio de lista automático.
- Registro de ventas manuales y anulación de ventas (gerente).
- Caja: compara los ingresos declarados con las ventas en efectivo cargadas y marca diferencias.
- Stock con ajustes (sumar, restar, fijar conteo) y motivo; alta de ítems desde el catálogo; productos envasados que se descuentan al vender.
- Compras con varias líneas, precio sugerido según la última compra y cancelación de órdenes.
- Catálogo editable de productos e insumos.
- Reportes por sucursal, ranking, categorías y promedio por día de la semana.
- Exportación a CSV y copias de seguridad.
- Tema oscuro automático y diseño adaptado a celular.
