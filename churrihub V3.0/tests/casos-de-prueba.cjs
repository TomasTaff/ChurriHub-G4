// Pruebas automáticas de los casos del Plan de Requerimientos y Testing (hoja "Testing Técnico").
// Ejecutar con:  npm test
// Arma la app con esbuild, la carga en un navegador simulado (jsdom) con los datos iniciales
// y recorre cada escenario como lo haría un usuario. Cada línea indica el ID del caso (TTxx).
const path = require("path");
const fs = require("fs");
const { JSDOM } = require("jsdom");
const XLSX = require("xlsx");
const esbuild = require("esbuild");
const raiz = path.join(__dirname, "..");
const bundle = esbuild.buildSync({ entryPoints: [path.join(raiz, "src/main.js")], bundle: true, format: "iife", write: false, loader: { ".css": "empty" }, logLevel: "silent" }).outputFiles[0].text;
const dom = new JSDOM(`<!doctype html><div id="app"></div>`, { url: "http://localhost/#inicio", runScripts: "outside-only", pretendToBeVisual: true });
const w = dom.window, doc = w.document, errs = [];
w.addEventListener("error", e => errs.push(e.message)); w.console.error = (...a) => errs.push(a.join(" "));
w.URL.createObjectURL = () => "blob:x"; w.URL.revokeObjectURL = () => {};
w.HTMLAnchorElement.prototype.click = function () { w.__descargas = (w.__descargas || []).concat(this.download || this.href); };
w.eval(bundle);
doc.addEventListener("click", e => { if (e.target.closest && e.target.closest('a[href^="mailto"]')) e.preventDefault(); }, true);
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => doc.querySelector(s), $$ = s => [...doc.querySelectorAll(s)];
const btn = (t, scope = doc) => [...scope.querySelectorAll("button, a.btn")].find(b => b.textContent.trim() === t || b.textContent.trim().startsWith(t));
const val = async (sel, v) => { const el = typeof sel === "string" ? $(sel) : sel; el.value = v; if (el.tagName !== "SELECT") el.dispatchEvent(new w.Event("input", { bubbles: true })); el.dispatchEvent(new w.Event("change", { bubbles: true })); await wait(40); };
const submit = async () => { $(".modal form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await wait(120); };
const go = async h => { w.location.hash = h; await wait(150); };
const datos = () => JSON.parse(w.localStorage.getItem("churrihub:datos:v2"));
const EMAILS = { "u-gerente": "gerencia@ejemplo.com", "u-encargado-wilde": "encargado.wilde@ejemplo.com", "u-encargado-miramar": "encargado.miramar@ejemplo.com", "u-empleado-wilde": "caja.wilde@ejemplo.com", "u-empleado-miramar": "caja.miramar@ejemplo.com" };
const salir = async () => { const b = $("#cerrar-sesion"); if (b) { b.click(); await wait(80); } };
const ingresar = async (email, clave, recordar = false) => {
  await val("#login-email", email); await val("#login-clave", clave);
  if (recordar) { const c = $("#login-recordar"); c.checked = true; c.dispatchEvent(new w.Event("change", { bubbles: true })); }
  $(".login-card").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await wait(200);
};
const como = async id => { await salir(); await ingresar(EMAILS[id] || id, "churri2026"); };
const pad2 = n => String(n).padStart(2, "0");
const isoHoy = (() => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; })();
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const fTxt = f => { const [y, m, d] = f.split("-"); return `${d} ${MESES[+m - 1]} ${y}`; };
const res = []; const ok = (tt, cond, det = "") => res.push(`${cond ? "PASS" : "FAIL"} ${tt} ${det}`);
(async () => {
  await wait(300);
  // Inicio de sesión
  ok("Login: la app arranca en la pantalla de ingreso", !!$("#login-email") && !$(".nav"));
  await ingresar("gerencia@ejemplo.com", "otra-clave1");
  ok("Login: contraseña incorrecta rechazada", /incorrectos/.test($(".login-card [role=alert]")?.textContent || "") && !$(".nav"), $(".login-card [role=alert]")?.textContent);
  await ingresar("nadie@ejemplo.com", "churri2026");
  ok("Login: correo inexistente rechazado con el mismo mensaje", /incorrectos/.test($(".login-card [role=alert]")?.textContent || "") && !$(".nav"));
  for (let i = 0; i < 5; i++) await ingresar("caja.wilde@ejemplo.com", "mala123456");
  await ingresar("caja.wilde@ejemplo.com", "churri2026");
  ok("Login: bloqueo tras 5 intentos fallidos", /Demasiados intentos/.test($(".login-card [role=alert]")?.textContent || "") && !$(".nav"), $(".login-card [role=alert]")?.textContent);
  w.sessionStorage.removeItem("churrihub:intentos");
  await ingresar("Gerencia@Ejemplo.com ", "churri2026");
  ok("Login: ingreso correcto (correo sin distinguir mayúsculas)", !!$(".nav") && /Gerente general/.test($(".who").textContent));
  ok("Login: sesión guardada y último ingreso registrado", !!w.sessionStorage.getItem("churrihub:sesion") && !!datos().usuarios.find(u => u.id === "u-gerente").ultimo_ingreso);
  const datosGuardados = w.localStorage.getItem("churrihub:datos:v2");
  ok("Login: las contraseñas no se guardan en texto", !datosGuardados.includes("churri2026") && /"hash":"[0-9a-f]{64}"/.test(datosGuardados));
  await salir();
  ok("Logout: vuelve a la pantalla de ingreso y borra la sesión", !!$("#login-email") && !$(".nav") && !w.sessionStorage.getItem("churrihub:sesion"));
  await ingresar("gerencia@ejemplo.com", "churri2026");
  // TT10 Inicio informativo
  await go("inicio"); ok("TT10 Inicio sin métricas", $(".hero h2")?.textContent === "ChurriHub" && !$(".kpi") && $$(".dl").length >= 2, `sucursales=${$$(".dl").length}`);
  // TT06/TT11 menú por rol
  const menu = () => $$(".nav a").map(a => a.getAttribute("href").slice(1));
  await como("u-empleado-miramar"); const mEmp = menu();
  await como("u-encargado-wilde"); const mEnc = menu();
  await como("u-gerente"); const mG = menu();
  ok("TT06/TT11 Empleado", JSON.stringify(mEmp) === JSON.stringify(["inicio","caja","stock"]), mEmp.join(","));
  ok("TT06/TT11 Encargado", ["compras","reportes","carga"].every(x => mEnc.includes(x)) && !mEnc.includes("usuarios"), mEnc.join(","));
  await como("u-empleado-miramar"); await go("usuarios"); ok("TT11 Empleado no entra por URL", $(".top h1").textContent === "Inicio"); await como("u-gerente");
  // TT07 alta usuario
  await go("usuarios"); btn("Nuevo usuario").click(); await wait(80);
  await val("#us-n", "Laura Pérez"); await val("#us-r", "Encargado"); await val("#us-s", "wilde"); await submit();
  const errSinMail = $(".modal .err")?.textContent;
  await val("#us-e", "laura@ejemplo.com"); await submit();
  const temporal = $("#cred-clave")?.textContent; btn("Listo", $(".modal"))?.click(); await wait(60);
  ok("TT07 Alta sin correo rechazada / con correo creada", /correo/i.test(errSinMail || "") && datos().usuarios.some(u => u.email === "laura@ejemplo.com"), errSinMail);
  btn("Nuevo usuario").click(); await wait(80); await val("#us-n", "Sin Rol"); await val("#us-e", "sinrol@ejemplo.com"); await submit();
  ok("TT07 Alta sin rol rechazada", /rol/i.test($(".modal .err")?.textContent || ""), $(".modal .err")?.textContent); btn("Cancelar", $(".modal")).click(); await wait(60);
  ok("Usuarios: el alta genera contraseña temporal", /^[a-z]{4}-\d{4}$/.test(temporal || "") && datos().usuarios.find(u => u.email === "laura@ejemplo.com").debe_cambiar === true, temporal);
  // TT09 cambio de rol y sucursal
  const laura = datos().usuarios.find(u => u.email === "laura@ejemplo.com");
  const fila = $$("tbody tr").find(r => r.textContent.includes("Laura Pérez")); btn("Editar", fila).click(); await wait(80);
  await val("#us-r", "Empleado"); await val("#us-s", "miramar"); await submit();
  const l2 = datos().usuarios.find(u => u.id === laura.id); ok("TT09 Cambio de rol y sucursal", l2.rol === "Empleado" && l2.sucursal_id === "miramar");
  // TT08 invitación
  const fila2 = $$("tbody tr").find(r => r.textContent.includes("Laura Pérez")); btn("Invitar", fila2).click(); await wait(80);
  const a = btn("Abrir en el correo"); ok("TT08 Invitación con enlace", a && a.getAttribute("href").startsWith("mailto:laura%40ejemplo.com") && decodeURIComponent(a.getAttribute("href")).includes("http://localhost/"));
  a.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })); await wait(100); $(".modal .x")?.click(); await wait(60);
  ok("TT08 Invitación registrada", !!datos().usuarios.find(u => u.id === laura.id).invitado);
  // Primer ingreso con contraseña temporal y cambio obligatorio
  await salir(); await ingresar("laura@ejemplo.com", temporal);
  ok("Clave temporal: pide elegir una nueva antes de entrar", !!$("#nueva-clave") && !$(".nav"));
  await val("#nueva-clave", "corta"); await val("#nueva-clave-2", "corta"); $(".login-card").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await wait(120);
  const eCorta = $(".login-card [role=alert]")?.textContent;
  await val("#nueva-clave", "Medialuna77"); await val("#nueva-clave-2", "Medialuna77"); $(".login-card").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await wait(200);
  ok("Clave temporal: valida la nueva y entra con el rol asignado", /8 caracteres/.test(eCorta || "") && !!$(".nav") && JSON.stringify($$(".nav a").map(a => a.getAttribute("href").slice(1))) === JSON.stringify(["inicio","caja","stock"]));
  await salir(); await ingresar("laura@ejemplo.com", temporal);
  ok("Clave temporal: deja de funcionar después del cambio", !$(".nav") && !!$("#login-email"));
  await ingresar("laura@ejemplo.com", "Medialuna77"); ok("Cambio de contraseña: la nueva funciona", !!$(".nav"));
  // Desactivar usuario
  await como("u-gerente"); await go("usuarios");
  const fl = $$("tbody tr").find(r => r.textContent.includes("Laura Pérez")); btn("Editar", fl).click(); await wait(80);
  const act = $("#us-activo"); act.checked = false; act.dispatchEvent(new w.Event("change", { bubbles: true })); await wait(40); await submit();
  await salir(); await ingresar("laura@ejemplo.com", "Medialuna77");
  ok("Usuario desactivado no puede ingresar", /desactivado/.test($(".login-card [role=alert]")?.textContent || "") && !$(".nav"));
  await ingresar("gerencia@ejemplo.com", "churri2026");
  // TT12 detalle de venta / TT13 filtros
  await go("ventas"); [...$$(".seg button")].find(b => b.textContent === "Año").click(); await wait(150);
  const total = $$("tbody tr").length; $$("tbody tr")[0].click(); await wait(80);
  const det = $(".modal")?.textContent || ""; ok("TT12 Detalle de venta", ["Fecha","Producto","Cantidad","Precio unitario","Total","Medio de pago","Sucursal"].every(k => det.includes(k)));
  $(".modal .x").click(); await wait(50);
  await val('select[aria-label="Medio de pago"]', "tarjeta"); await val('input[aria-label="Buscar producto"]', "simple"); await val('select[aria-label="Sucursal"]', "wilde");
  const filas = $$("tbody tr"); ok("TT13 Filtros combinados", filas.length > 0 && filas.every(r => /Churro simple/.test(r.textContent) && /Tarjeta/.test(r.textContent) && /Wilde/.test(r.textContent)), `${filas.length} filas`);
  await val('select[aria-label="Sucursal"]', "todas");
  // TT14/TT15 cierre
  await como("u-encargado-wilde"); await go("caja"); btn("Registrar cierre").click(); await wait(80);
  await val("#cf-f", isoHoy); await val("#cf-i", "1000"); await val("#cf-e", "300");
  const saldoTxt = $(".modal").textContent; await submit();
  const c = datos().cierres.find(x => x.id === "wilde_" + isoHoy); ok("TT14 Cierre registrado con sucursal y fecha", c && c.sucursal_id === "wilde");
  ok("TT15 Saldo 700", /Saldo final: \$700/.test(saldoTxt) && c.ingresos - c.egresos === 700);
  // TT16 propio vs ajeno
  const filaPropia = $$("tbody tr").find(r => r.textContent.includes(fTxt(isoHoy))); const filaAjena = $$("tbody tr").find(r => /Empleado Wilde/.test(r.textContent));
  ok("TT16 Propio editable / ajeno bloqueado", !!btn("Editar", filaPropia) && /Bloqueado/.test(filaAjena?.textContent || ""));
  // TT17/18/19/20 stock como empleado
  await como("u-empleado-miramar"); await go("stock");
  const leche = $$("tbody tr").find(r => r.textContent.includes("Café en grano"));
  ok("TT17 Inventario con nombre, sucursal, cantidad y unidad", /Café en grano/.test(leche.textContent) && /Miramar/.test(leche.textContent) && /kg/.test(leche.textContent));
  ok("TT18 Alerta de stock crítico", leche.classList.contains("crit") && /Por reponer/.test(leche.textContent));
  btn("Ajustar", leche).click(); await wait(80);
  const id = "miramar__insumo__cafe-grano"; const antes = datos().stock.find(s => s.id === id).cantidad;
  await val("#aj-v", "0"); await submit(); const e0 = $(".modal .err")?.textContent;
  await val("#aj-v", "-2"); await submit(); const eNeg = $(".modal .err")?.textContent;
  await val("#aj-v", "5"); await submit();
  const tras = datos().stock.find(s => s.id === id); ok("TT19 Ingresar 5", tras.cantidad === antes + 5 && tras.actualizado, `${antes} → ${tras.cantidad}`);
  ok("TT20 0 y negativos rechazados", /mayor a cero/.test(e0 || "") && /mayor a cero/.test(eNeg || ""));
  const leche2 = $$("tbody tr").find(r => r.textContent.includes("Café en grano")); btn("Ajustar", leche2).click(); await wait(80);
  btn("Consumir", $(".modal")).click(); await wait(40); await val("#aj-v", String(tras.cantidad + 7)); await submit();
  ok("TT19 Consumir de más rechazado", /bajo cero/.test($(".modal .err")?.textContent || "") && datos().stock.find(s => s.id === id).cantidad === tras.cantidad);
  $(".modal .x").click(); await wait(50);
  // TT21 alta ítem (encargado)
  await como("u-encargado-miramar"); await go("stock"); btn("Agregar ítem").click(); await wait(80);
  await val("#ns-t", "producto"); const opts = [...$("#ns-i").options].filter(o => o.value); await val("#ns-i", opts[0].value); await val("#ns-q", "4"); await submit();
  ok("TT21 Alta de ítem de stock", datos().stock.some(s => s.id.startsWith("miramar__producto__") && s.id !== "miramar__producto__coca-cola" && s.cantidad === 4));
  // TT22 proveedor (encargado)
  await go("proveedores"); btn("Nuevo proveedor").click(); await wait(80); await val("#pv-n", "Huevos del Campo"); await submit();
  const ePv = $(".modal .err")?.textContent; await val("#pv-c", "huevos@campo.com"); await submit();
  const pv = $$(".card").find(c => c.textContent.includes("Huevos del Campo")); btn("Editar", pv).click(); await wait(80); await val("#pv-p", "Contado"); await submit();
  const pv2 = $$(".card").find(c => c.textContent.includes("Huevos del Campo")); btn("Eliminar", pv2).click(); await wait(80); const pideConf = /Eliminar proveedor/.test($(".modal")?.textContent || ""); btn("Eliminar", $(".modal")).click(); await wait(120);
  ok("TT22 Proveedor: sin contacto no guarda, edita y baja con confirmación", /contacto/.test(ePv || "") && pideConf && !datos().proveedores.some(p => p.nombre === "Huevos del Campo"));
  // TT23/24/25 orden de compra
  await go("compras"); btn("Nueva orden de compra").click(); await wait(80);
  await val("#co-p", "molinos-del-sur"); await val("#co-f", "2026-10-28");
  let lineas = $$('.modal select[aria-label="Insumo"]'); await val(lineas[0], "harina-0000"); await val($$('.modal input[aria-label="Cantidad"]')[0], "2"); await val($$('.modal input[aria-label="Precio unitario"]')[0], "100");
  btn("+ Agregar insumo").click(); await wait(50); lineas = $$('.modal select[aria-label="Insumo"]');
  await val(lineas[1], "azucar"); await val($$('.modal input[aria-label="Cantidad"]')[1], "3"); await val($$('.modal input[aria-label="Precio unitario"]')[1], "50");
  const mtxt = $(".modal").textContent; await submit();
  const oc = datos().compras.find(x => x.total === 350 && x.fecha === "2026-10-28");
  ok("TT24 Subtotales 200 y 150, total 350", /\$200/.test(mtxt) && /\$150/.test(mtxt) && /\$350/.test(mtxt));
  ok("TT23 Orden creada con detalle", oc && oc.items.length === 2 && oc.sucursal_id === "miramar");
  ok("TT25 Estado inicial Pendiente", oc && oc.estado === "pendiente");
  // TT26 recibir
  const harinaAntes = datos().stock.find(s => s.id === "miramar__insumo__harina-0000").cantidad; const azucarAntes = datos().stock.find(s => s.id === "miramar__insumo__azucar").cantidad;
  const filaOc = $$("tbody tr").find(r => r.textContent.includes("$350") && r.textContent.includes("Pendiente")); btn("Recibir", filaOc).click(); await wait(80); btn("Recibir y sumar", $(".modal")).click(); await wait(250);
  const d2 = datos(); ok("TT26 Recibida suma stock", d2.compras.find(x => x.id === oc.id).estado === "recibida" && d2.stock.find(s => s.id === "miramar__insumo__harina-0000").cantidad === harinaAntes + 2 && d2.stock.find(s => s.id === "miramar__insumo__azucar").cantidad === azucarAntes + 3);
  // TT27-30 reportes (gerente)
  await como("u-gerente"); await go("reportes"); [...$$(".seg button")].find(b => b.textContent === "Año").click(); await wait(150);
  const kl = $$(".kpi .l").map(x => x.textContent); ok("TT27 Indicadores generales", ["Ventas totales","Transacciones","Ticket promedio","Unidades vendidas","Producto más vendido"].every(k => kl.includes(k)), $$(".kpi .v").map(x=>x.textContent).join(" / "));
  ok("TT28 Gráfico de evolución", !!$(".chart svg polyline"));
  const comp = $$(".card").find(c => c.textContent.includes("Comparativa entre sucursales")); ok("TT29 Comparativa Wilde vs Miramar", comp && /Wilde/.test(comp.textContent) && /Miramar/.test(comp.textContent));
  const rk1 = $(".rank span[style*='font-weight']")?.textContent; btn("Por ingresos").click(); await wait(80); const rk2 = $(".rank span[style*='font-weight']")?.textContent;
  ok("TT30 Ranking por unidades e ingresos", !!rk1 && !!rk2, `${rk1} / ${rk2}`);
  ok("TT05 Ventas por canal", $$(".card h3").some(h => h.textContent === "Ventas por canal"));
  // Datos de muestra en todos los filtros de período y sucursal
  const huecos = [];
  for (const suc of ["todas", "wilde", "miramar"]) {
    await val('select[aria-label="Sucursal"]', suc);
    for (const per of ["Hoy", "7 días", "Mes", "Año", "Rango"]) {
      [...$$(".top .seg button")].find(b => b.textContent === per).click(); await wait(120);
      const v = $$(".kpi .v")[0]?.textContent || "$0";
      if (!v || v === "$0") huecos.push(`${suc}/${per}`);
    }
  }
  await val('select[aria-label="Sucursal"]', "todas");
  ok("Datos en todos los filtros (Hoy, 7 días, Mes, Año, Rango × sucursales)", huecos.length === 0, huecos.join(", "));
  // Precios del catálogo
  const prod = datos().productos; const precio = n => prod.find(p => p.nombre === n)?.precio;
  ok("Precios vigentes del catálogo", precio("Coca-Cola") === 3000 && precio("Agua sin gas") === 2400 && precio("Café chico") === 4300 && precio("Café grande") === 4500 && precio("Churro simple") === 1100 && precio("Churro con cobertura de chocolate") === 1400 && precio("Churro salado") === 1500);
  // TT04 semanal
  await go("semanal"); await val("#sem-sel", $("#sem-sel").options[1].value);
  ok("TT04 Reporte semanal", /Reporte semanal de ventas/.test(doc.body.textContent) && $$("tbody tr").length >= 2);
  // TT31/32/33/34 importación .xls
  await como("u-encargado-wilde"); await go("carga");
  const ws = XLSX.utils.aoa_to_sheet([["Fecha","Producto","Cantidad","Precio Unitario","Medio de Pago"],["10/12/2025","Churro simple",30,950,"Efectivo"],["10/12/2025","Churro relleno común",12,"","Tarjeta"],["10/12/2025","Café chico",6,3600,"QR"]]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ventas"); const buf = XLSX.write(wb, { type: "buffer", bookType: "biff8" });
  const file = new w.File([buf], "ventas_wilde.xls", { type: "application/vnd.ms-excel" });
  const inp = $("#cg-file"); Object.defineProperty(inp, "files", { value: [file], configurable: true }); inp.dispatchEvent(new w.Event("change", { bubbles: true })); await wait(400);
  const rev = $$(".card").find(c => c.textContent.includes("Revisión de ventas_wilde.xls"));
  ok("TT31 Importa .xls", !!rev, $(".banner.bad")?.textContent || "");
  ok("TT32 Muestra archivo y período antes de procesar", rev && /Período cubierto/.test(rev.textContent) && /10 dic 2025/.test(rev.textContent));
  ok("TT33 Fila sin precio detectada", rev && /falta precio/.test(rev.textContent));
  btn("Guardar 2 ventas").click(); await wait(250);
  const resu = $$(".card").find(c => c.textContent.includes("Resultado de la importación"));
  ok("TT34 Resultado con procesados y errores por fila", resu && /2 registros procesados/.test(resu.textContent) && /Fila 3: falta precio/.test(resu.textContent));
  ok("TT03 Historial con usuario y período", $$("tbody tr").some(r => r.textContent.includes("ventas_wilde.xls") && r.textContent.includes("Encargado Wilde") && r.textContent.includes("10 dic 2025")));
  // Informes de muestra de la carpeta /muestras
  const importar = async (archivo, tipo) => {
    const buf = fs.readFileSync(path.join(raiz, "muestras", archivo));
    const f = new w.File([buf], archivo, { type: tipo });
    const inp2 = $("#cg-file"); Object.defineProperty(inp2, "files", { value: [f], configurable: true }); inp2.dispatchEvent(new w.Event("change", { bubbles: true })); await wait(700);
    const card = $$(".card").find(c => c.textContent.includes("Revisión de " + archivo));
    const txt = card ? card.textContent : ""; const okN = +(txt.match(/(\d+) para guardar/) || [])[1] || 0; const errN = +(txt.match(/(\d+) con errores/) || [])[1] || 0;
    if (card) { btn(`Guardar ${okN} ventas`).click(); await wait(400); }
    return { okN, errN };
  };
  await como("u-gerente"); await go("carga");
  await val("#cg-suc", "wilde"); const rw = await importar("ventas_wilde_diciembre_2025.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  await val("#cg-suc", "miramar"); const rm = await importar("ventas_miramar_diciembre_2025.csv", "text/csv");
  ok("Informe de muestra Wilde (.xlsx)", rw.okN > 1500 && rw.errN === 0, `${rw.okN} filas válidas`);
  ok("Informe de muestra Miramar (.csv) con 3 filas a corregir", rm.okN > 1500 && rm.errN === 3, `${rm.okN} válidas, ${rm.errN} con errores`);
  // TT39 alta sucursal
  await como("u-gerente"); await go("catalogo"); btn("Sucursales").click(); await wait(60); btn("Nueva sucursal").click(); await wait(60);
  await val("#sc-n", "Mar del Plata"); await val("#sc-d", "Av. Colón 1000"); await submit();
  await go("reportes"); const comp2 = $$(".card").find(c => c.textContent.includes("Comparativa entre sucursales"));
  ok("TT39 Nueva sucursal sin cambiar el modelo", datos().sucursales.length === 3 && comp2 && /Mar del Plata/.test(comp2.textContent));
  // Analytics
  await go("analytics"); btn("Descargar todas").click(); await wait(3600);
  ok("Analytics descarga tablas", (w.__descargas || []).filter(x => /^(fact|dim)_/.test(x)).length === 9, (w.__descargas||[]).length + " descargas");
  console.log(res.join("\n"));
  const fallas = res.filter(r => r.startsWith("FAIL")).length;
  console.log(`\n${res.length - fallas} de ${res.length} verificaciones pasaron. Errores de JavaScript: ${errs.length ? errs.slice(0, 5).join(" | ") : "ninguno"}`);
  process.exit(fallas || errs.length ? 1 : 0);
})().catch(e => { console.log(res.join("\n")); console.log("EXCEPCIÓN", e.stack); process.exit(1); });
