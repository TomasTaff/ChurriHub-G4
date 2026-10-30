// Datos iniciales de ChurriHub.
// Catálogo con precios vigentes en Argentina (octubre 2026) y ventas de muestra generadas
// para todo el año en curso, de forma determinística: el mismo día y sucursal siempre dan
// los mismos números. Se generan relativos a la fecha en que se abre la app por primera vez,
// así los filtros Hoy, 7 días, Mes, Año y Rango siempre tienen datos.

// ───────────── Catálogo ─────────────
export const PRODUCTOS = [
  { id: "churro-simple", nombre: "Churro simple", categoria: "Churros", precio: 1100, unidad: "unidad" },
  { id: "churro-cobertura", nombre: "Churro con cobertura de chocolate", categoria: "Churros", precio: 1400, unidad: "unidad" },
  { id: "churro-relleno-comun", nombre: "Churro relleno común", categoria: "Churros rellenos", precio: 1500, unidad: "unidad", alias: ["Churro relleno", "Relleno común", "Churro dulce de leche"] },
  { id: "churro-relleno-especial", nombre: "Churro relleno especial", categoria: "Churros rellenos", precio: 1500, unidad: "unidad", alias: ["Relleno especial"] },
  { id: "churro-salado", nombre: "Churro salado", categoria: "Churros salados", precio: 1500, unidad: "unidad", alias: ["Salado"] },
  { id: "cafe-chico", nombre: "Café chico", categoria: "Cafetería", precio: 4300, unidad: "unidad", alias: ["Cafe chico"] },
  { id: "cafe-grande", nombre: "Café grande", categoria: "Cafetería", precio: 4500, unidad: "unidad", alias: ["Cafe grande"] },
  { id: "coca-cola", nombre: "Coca-Cola", categoria: "Bebidas", precio: 3000, unidad: "unidad", alias: ["Coca Cola"] },
  { id: "coca-cola-zero", nombre: "Coca-Cola Zero", categoria: "Bebidas", precio: 3000, unidad: "unidad", alias: ["Coca Cola Zero"] },
  { id: "fanta", nombre: "Fanta", categoria: "Bebidas", precio: 3000, unidad: "unidad" },
  { id: "sprite", nombre: "Sprite", categoria: "Bebidas", precio: 3000, unidad: "unidad" },
  { id: "sprite-zero", nombre: "Sprite Zero", categoria: "Bebidas", precio: 3000, unidad: "unidad" },
  { id: "agua-con-gas", nombre: "Agua con gas", categoria: "Bebidas", precio: 2400, unidad: "unidad" },
  { id: "agua-sin-gas", nombre: "Agua sin gas", categoria: "Bebidas", precio: 2400, unidad: "unidad" },
].map(p => ({ ...p, activo: true }));

export const SUCURSALES = [
  { id: "wilde", nombre: "Wilde", direccion: "Av. Mitre 2450, Wilde", telefono: "011-4234-5678", color: "#D9A21B" },
  { id: "miramar", nombre: "Miramar", direccion: "Calle 12 Nº 580, Miramar", telefono: "02291-15-45678", color: "#2B7FB8" },
];

// Costo de compra aproximado por unidad (mayorista, octubre 2026).
export const INSUMOS = [
  { id: "harina-0000", nombre: "Harina 0000", unidad: "kg", stock_minimo: 40, costo: 1100 },
  { id: "aceite-girasol", nombre: "Aceite de girasol", unidad: "litros", stock_minimo: 30, costo: 2600 },
  { id: "azucar", nombre: "Azúcar", unidad: "kg", stock_minimo: 8, costo: 1300 },
  { id: "sal-fina", nombre: "Sal fina", unidad: "kg", stock_minimo: 2, costo: 900 },
  { id: "dulce-de-leche", nombre: "Dulce de leche repostero", unidad: "kg", stock_minimo: 12, costo: 6500 },
  { id: "crema-pastelera", nombre: "Crema pastelera", unidad: "kg", stock_minimo: 5, costo: 4800 },
  { id: "chocolate-cobertura", nombre: "Chocolate cobertura", unidad: "kg", stock_minimo: 6, costo: 14500 },
  { id: "pasta-avellanas", nombre: "Pasta de avellanas", unidad: "kg", stock_minimo: 3, costo: 18000 },
  { id: "queso-cremoso", nombre: "Queso cremoso", unidad: "kg", stock_minimo: 3, costo: 9800 },
  { id: "jamon-cocido", nombre: "Jamón cocido", unidad: "kg", stock_minimo: 2, costo: 13500 },
  { id: "cafe-grano", nombre: "Café en grano", unidad: "kg", stock_minimo: 3, costo: 28000 },
  { id: "leche", nombre: "Leche entera", unidad: "litros", stock_minimo: 15, costo: 1450 },
  { id: "vasos-chicos", nombre: "Vasos de café chicos", unidad: "unidades", stock_minimo: 250, costo: 65 },
  { id: "vasos-grandes", nombre: "Vasos de café grandes", unidad: "unidades", stock_minimo: 150, costo: 85 },
  { id: "bolsas-papel", nombre: "Bolsas de papel", unidad: "unidades", stock_minimo: 400, costo: 40 },
  { id: "servilletas", nombre: "Servilletas", unidad: "paquetes", stock_minimo: 15, costo: 1800 },
];

export const PROVEEDORES = [
  { id: "molinos-del-sur", nombre: "Molinos del Sur", contacto: "ventas@molinosdelsur.com / 011-4456-7890", insumos: "Harina, Azúcar, Sal", condiciones_pago: "30 días" },
  { id: "aceites-del-plata", nombre: "Aceites del Plata", contacto: "ventas@aceitesplata.com / 011-4789-3456", insumos: "Aceite", condiciones_pago: "45 días" },
  { id: "lacteos-la-pradera", nombre: "Lácteos La Pradera", contacto: "pedidos@lapradera.com / 011-4890-1234", insumos: "Dulce de leche, Leche, Crema pastelera", condiciones_pago: "15 días" },
  { id: "distribuidora-cacao", nombre: "Distribuidora Cacao", contacto: "cacao@distri.com / 011-4567-9012", insumos: "Chocolate, Café, Pasta de avellanas", condiciones_pago: "Contado" },
  { id: "fiambreria-el-gaucho", nombre: "Fiambrería El Gaucho", contacto: "pedidos@elgaucho.com / 011-4321-6655", insumos: "Queso, Jamón", condiciones_pago: "15 días" },
  { id: "descartables-norte", nombre: "Descartables Norte", contacto: "ventas@descartablesnorte.com / 011-4777-2020", insumos: "Vasos, Bolsas, Servilletas", condiciones_pago: "30 días" },
];

export const USUARIOS = [
  { id: "u-gerente", nombre: "Gerente general", activo: true, email: "gerencia@ejemplo.com", rol: "Gerente", sucursal_id: null },
  { id: "u-encargado-wilde", nombre: "Encargado Wilde", email: "encargado.wilde@ejemplo.com", rol: "Encargado", sucursal_id: "wilde", activo: true },
  { id: "u-encargado-miramar", nombre: "Encargado Miramar", email: "encargado.miramar@ejemplo.com", rol: "Encargado", sucursal_id: "miramar" },
  { id: "u-empleado-wilde", nombre: "Empleado Wilde", email: "caja.wilde@ejemplo.com", rol: "Empleado", sucursal_id: "wilde" },
  { id: "u-empleado-miramar", nombre: "Empleado Miramar", email: "caja.miramar@ejemplo.com", rol: "Empleado", sucursal_id: "miramar" },
];

// ───────────── Utilidades ─────────────
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fecha = f => { const [y, m, d] = f.split("-").map(Number); return new Date(y, m - 1, d); };
const sumar = (f, n) => { const d = fecha(f); d.setDate(d.getDate() + n); return iso(d); };
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function prng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// Cantidad entera alrededor de una media (aproximación de Poisson).
const poisson = (r, media) => { if (media <= 0) return 0; if (media > 30) return Math.max(0, Math.round(media + Math.sqrt(media) * (r() + r() + r() - 1.5) * 1.15)); let L = Math.exp(-media), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };
const red50 = v => Math.round(v / 50) * 50;

// Precio vigente en una fecha: los precios de la lista son los de octubre 2026 y se
// descuenta una inflación aproximada de 2,2% mensual hacia atrás.
export function precioEn(precioActual, f, referencia = "2026-10-01") {
  const a = fecha(f), b = fecha(referencia);
  const meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return meses <= 0 ? precioActual : red50(precioActual * Math.pow(1 / 1.022, meses));
}

// ───────────── Ventas de muestra ─────────────
// Unidades promedio de un día normal en Wilde (factor 1).
const BASE = {
  "churro-simple": 140, "churro-cobertura": 60, "churro-relleno-comun": 90, "churro-relleno-especial": 35, "churro-salado": 25,
  "cafe-chico": 45, "cafe-grande": 28, "coca-cola": 18, "coca-cola-zero": 9, "fanta": 6, "sprite": 6, "sprite-zero": 3, "agua-sin-gas": 10, "agua-con-gas": 5,
};
// Estacionalidad mensual: Wilde vende más en invierno (churros con chocolate);
// Miramar es ciudad costera: explota en verano y en vacaciones de invierno.
const ESTACION = {
  wilde: [0.82, 0.8, 0.95, 1.02, 1.1, 1.22, 1.28, 1.15, 1.04, 1, 0.95, 0.9],
  miramar: [2.1, 1.85, 0.9, 0.55, 0.45, 0.5, 0.95, 0.55, 0.5, 0.58, 0.72, 1.35],
};
const DIA_SEMANA = [1.55, 0.82, 0.88, 0.92, 1.0, 1.18, 1.45]; // dom..sáb

// Ventas de un día y sucursal, agrupadas por producto, medio de pago y canal.
export function ventasDelDia(sucursalId, f, { parcial = 1, referenciaPrecios } = {}) {
  const r = prng(hash(`${sucursalId}|${f}`));
  const d = fecha(f), mes = d.getMonth();
  const escala = (sucursalId === "wilde" ? 1 : sucursalId === "miramar" ? 0.78 : 0.6) * (ESTACION[sucursalId] || ESTACION.wilde)[mes];
  const lluvia = r() < 0.12 ? 0.7 : 1;
  const factor = escala * DIA_SEMANA[d.getDay()] * lluvia * (0.9 + r() * 0.2) * parcial;
  const verano = [0, 1, 11].includes(mes), invierno = [5, 6, 7].includes(mes);
  const filas = [];
  for (const p of PRODUCTOS) {
    let media = (BASE[p.id] || 5) * factor;
    if (p.categoria === "Bebidas") media *= verano ? 1.6 : invierno ? 0.75 : 1;
    if (p.categoria === "Cafetería") media *= invierno ? 1.25 : verano ? 0.8 : 1;
    if (p.id === "churro-cobertura" && invierno) media *= 1.2;
    const total = poisson(r, media);
    if (!total) continue;
    const pu = precioEn(p.precio, f, referenciaPrecios);
    // 14% por apps de delivery (se cobra en la app), 5% delivery propio, el resto en mostrador.
    let apps = poisson(r, total * 0.14), deliv = poisson(r, total * 0.05);
    if (apps + deliv > total) { apps = Math.min(apps, total); deliv = total - apps; }
    const local = total - apps - deliv;
    const ef = Math.round(local * (0.3 + r() * 0.1)), tj = Math.round((local - ef) * (0.5 + r() * 0.1)), qr = local - ef - tj;
    [[ef, "efectivo", "local"], [tj, "tarjeta", "local"], [qr, "otro", "local"], [apps, "otro", "apps"], [deliv, r() < 0.6 ? "efectivo" : "otro", "delivery"]]
      .forEach(([q, m, c]) => { if (q > 0) filas.push({ f, p: p.id, q, pu, m, c }); });
  }
  return filas;
}

// ───────────── Armado de la base ─────────────
export function generarDatosBase(hoyStr) {
  const anio = hoyStr.slice(0, 4);
  const inicio = `${anio}-01-01`;
  const ahora = new Date();
  const lotes = [], cierres = [];
  for (const s of SUCURSALES) {
    const porMes = {};
    for (let f = inicio; f <= hoyStr; f = sumar(f, 1)) {
      const filas = ventasDelDia(s.id, f, { parcial: f === hoyStr ? 0.55 : 1 });
      (porMes[f.slice(0, 7)] = porMes[f.slice(0, 7)] || []).push(...filas);
    }
    Object.entries(porMes).forEach(([mes, filas]) => lotes.push({
      id: `base-${s.id}-${mes}`, sucursal_id: s.id, tipo: "base", nombre: `Ventas ${mes} (datos de muestra)`,
      creado: `${mes}-28T22:00:00.000Z`, usuario_id: `u-encargado-${s.id}`, desde: filas[0].f, hasta: filas[filas.length - 1].f, filas, errores: [],
    }));
    // Cierres de caja de los últimos 60 días (el de hoy todavía no se hizo).
    const r = prng(hash(`cierres|${s.id}`));
    const OBS = ["Pago a proveedor de hielo", "Compra de artículos de limpieza", "Faltante de cambio", "Pago de flete", "Reposición de gas"];
    for (let i = 60; i >= 1; i--) {
      const f = sumar(hoyStr, -i);
      if (f < inicio || r() < 0.05) continue; // algún día sin cierre
      const efectivo = ventasDelDia(s.id, f).filter(x => x.m === "efectivo").reduce((a, x) => a + x.q * x.pu, 0);
      const desvio = r() < 0.85 ? (r() - 0.5) * 0.008 : (r() < 0.5 ? -1 : 1) * (0.03 + r() * 0.05);
      const egresos = r() < 0.55 ? red50(3000 + r() * 42000) : 0;
      cierres.push({
        id: `${s.id}_${f}`, sucursal_id: s.id, fecha: f, ingresos: red50(efectivo * (1 + desvio)), egresos,
        observaciones: egresos ? OBS[Math.floor(r() * OBS.length)] : (Math.abs(desvio) > 0.02 ? "Diferencia a revisar con el encargado" : ""),
        usuario_id: `u-empleado-${s.id}`, creado: `${f}T23:${pad(10 + Math.floor(r() * 40))}:00.000Z`,
      });
    }
  }

  // Stock actual de insumos y bebidas por sucursal (algunos por debajo del mínimo a propósito).
  const STOCK = {
    wilde: { "harina-0000": [75, 50], "aceite-girasol": [48, 40], "azucar": [18, 10], "sal-fina": [4, 2], "dulce-de-leche": [22, 15], "crema-pastelera": [9, 6], "chocolate-cobertura": [5, 8], "pasta-avellanas": [5, 3], "queso-cremoso": [6, 4], "jamon-cocido": [4, 3], "cafe-grano": [6, 4], "leche": [30, 20], "vasos-chicos": [450, 300], "vasos-grandes": [260, 200], "bolsas-papel": [900, 500], "servilletas": [35, 20] },
    miramar: { "harina-0000": [22, 25], "aceite-girasol": [30, 20], "azucar": [9, 6], "sal-fina": [3, 1], "dulce-de-leche": [8, 10], "crema-pastelera": [5, 4], "chocolate-cobertura": [6, 4], "pasta-avellanas": [3, 2], "queso-cremoso": [3, 3], "jamon-cocido": [2.5, 2], "cafe-grano": [2, 3], "leche": [14, 12], "vasos-chicos": [380, 200], "vasos-grandes": [150, 150], "bolsas-papel": [600, 300], "servilletas": [18, 10] },
  };
  const BEBIDAS = {
    wilde: { "coca-cola": [48, 24], "coca-cola-zero": [30, 12], "fanta": [18, 12], "sprite": [20, 12], "sprite-zero": [10, 6], "agua-sin-gas": [36, 24], "agua-con-gas": [18, 12] },
    miramar: { "coca-cola": [36, 24], "coca-cola-zero": [10, 12], "fanta": [14, 12], "sprite": [12, 12], "sprite-zero": [6, 6], "agua-sin-gas": [30, 24], "agua-con-gas": [8, 12] },
  };
  const rs = prng(hash("stock"));
  const MOTIVOS = ["Conteo físico", "Compra recibida", "Consumo 12 kg · Uso en producción", "Conteo físico", "Ingreso de mercadería"];
  const marca = () => new Date(ahora.getTime() - Math.floor(rs() * 4 * 24 + 1) * 3600e3).toISOString();
  const stock = [];
  for (const [suc, items] of Object.entries(STOCK)) for (const [item, [cantidad, min]] of Object.entries(items))
    stock.push({ id: `${suc}__insumo__${item}`, sucursal_id: suc, tipo: "insumo", item_id: item, cantidad, stock_minimo: min, actualizado: marca(), motivo: MOTIVOS[Math.floor(rs() * MOTIVOS.length)] });
  for (const [suc, items] of Object.entries(BEBIDAS)) for (const [item, [cantidad, min]] of Object.entries(items))
    stock.push({ id: `${suc}__producto__${item}`, sucursal_id: suc, tipo: "producto", item_id: item, cantidad, stock_minimo: min, actualizado: marca(), motivo: "Conteo físico" });

  // Órdenes de compra de las últimas 8 semanas, con precios mayoristas actualizados.
  const costo = id => INSUMOS.find(i => i.id === id).costo;
  const rc = prng(hash("compras"));
  const PEDIDOS = [
    ["molinos-del-sur", [["harina-0000", 100, 60], ["azucar", 20, 12], ["sal-fina", 5, 3]]],
    ["aceites-del-plata", [["aceite-girasol", 60, 40]]],
    ["lacteos-la-pradera", [["dulce-de-leche", 20, 10], ["crema-pastelera", 10, 6], ["leche", 40, 20]]],
    ["distribuidora-cacao", [["chocolate-cobertura", 10, 6], ["cafe-grano", 6, 3], ["pasta-avellanas", 5, 3]]],
    ["fiambreria-el-gaucho", [["queso-cremoso", 6, 3], ["jamon-cocido", 4, 2]]],
    ["descartables-norte", [["vasos-chicos", 500, 300], ["vasos-grandes", 300, 200], ["bolsas-papel", 1000, 500], ["servilletas", 30, 15]]],
  ];
  const compras = [];
  for (let semana = 8; semana >= 1; semana--) for (const s of SUCURSALES) for (const [prov, items] of PEDIDOS) {
    if (rc() < (prov === "molinos-del-sur" || prov === "aceites-del-plata" ? 0.15 : 0.55)) continue;
    const f = sumar(hoyStr, -semana * 7 + Math.floor(rc() * 4));
    const its = items.map(([id, w, m]) => ({ insumo_id: id, cantidad: s.id === "wilde" ? w : m, precio: red50(precioEn(costo(id), f) * (0.96 + rc() * 0.08)) || costo(id) }));
    compras.push({ id: `oc-${s.id}-${prov}-${f}`, sucursal_id: s.id, proveedor_id: prov, fecha: f, estado: "recibida", items: its, total: its.reduce((a, x) => a + x.cantidad * x.precio, 0), creado: `${f}T12:00:00.000Z`, usuario_id: `u-encargado-${s.id}`, recibida: `${sumar(f, 2)}T10:00:00.000Z` });
  }
  const pendiente = (id, suc, prov, items, dias) => { const its = items.map(([i, q]) => ({ insumo_id: i, cantidad: q, precio: costo(i) })); compras.push({ id, sucursal_id: suc, proveedor_id: prov, fecha: sumar(hoyStr, -dias), estado: "pendiente", items: its, total: its.reduce((a, x) => a + x.cantidad * x.precio, 0), creado: `${sumar(hoyStr, -dias)}T11:30:00.000Z`, usuario_id: `u-encargado-${suc}` }); };
  pendiente("oc-pend-wilde-cacao", "wilde", "distribuidora-cacao", [["chocolate-cobertura", 10]], 1);
  pendiente("oc-pend-miramar-lacteos", "miramar", "lacteos-la-pradera", [["dulce-de-leche", 15], ["leche", 20]], 2);
  pendiente("oc-pend-miramar-molinos", "miramar", "molinos-del-sur", [["harina-0000", 50]], 0);

  return {
    sucursales: SUCURSALES.map(x => ({ ...x })),
    productos: PRODUCTOS.map(x => ({ ...x })),
    insumos: INSUMOS.map(({ costo: _c, ...x }) => ({ ...x })),
    proveedores: PROVEEDORES.map(x => ({ ...x })),
    usuarios: USUARIOS.map(x => ({ ...x })),
    stock, compras, cierres, lotes,
  };
}
