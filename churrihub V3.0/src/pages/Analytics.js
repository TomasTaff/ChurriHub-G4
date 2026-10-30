// Datos para Analytics (RF-02 y objetivo de producto "exponer datos para Power BI").
// Publica el modelo consolidado como tablas planas (esquema estrella) y controla su calidad.
import { html } from "htm/preact";
import { hoy, MEDIOS, CANALES } from "../lib/util.js";
import { nombreItem, unidadItem } from "../lib/derivados.js";
import { toast } from "../components/ui.js";
import { aCsv, descargar } from "../lib/archivos.js";

export function Analytics({ st, d }) {
  const tablas = [
    { id: "fact_ventas", desc: "Una fila por registro de venta. Tabla de hechos principal.", filas: () => d.ventas.map((v, i) => ({ venta_id: `${v.lote_id}-${v.idx}`, fecha: v.f, sucursal_id: v.sucursal_id, producto_id: v.p || "", producto_sin_catalogo: v.p ? "" : v.nombre, canal: v.c, medio_pago: v.m, cantidad: v.q, precio_unitario: v.pu, total: v.total, carga_id: v.lote_id })) },
    { id: "dim_sucursal", desc: "Sucursales con dirección y teléfono.", filas: () => st.data.sucursales.map(s => ({ sucursal_id: s.id, nombre: s.nombre, direccion: s.direccion || "", telefono: s.telefono || "" })) },
    { id: "dim_producto", desc: "Catálogo de productos con categoría y precio de lista.", filas: () => st.data.productos.map(p => ({ producto_id: p.id, nombre: p.nombre, categoria: p.categoria, unidad: p.unidad, precio_lista: p.precio, activo: p.activo !== false ? "si" : "no" })) },
    { id: "dim_fecha", desc: "Calendario con día, semana, mes y año para filtrar en Power BI.", filas: () => { const fs = [...new Set(d.ventas.map(v => v.f))].sort(); return fs.map(f => { const dt = new Date(f + "T12:00:00"); return { fecha: f, anio: dt.getFullYear(), mes: dt.getMonth() + 1, dia: dt.getDate(), dia_semana: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][dt.getDay()] }; }); } },
    { id: "dim_canal", desc: "Canales de venta.", filas: () => Object.entries(CANALES).map(([k, v]) => ({ canal: k, nombre: v })) },
    { id: "dim_medio_pago", desc: "Medios de pago.", filas: () => Object.entries(MEDIOS).map(([k, v]) => ({ medio_pago: k, nombre: v })) },
    { id: "fact_cierres_caja", desc: "Cierres de caja diarios por sucursal.", filas: () => st.data.cierres.map(x => ({ fecha: x.fecha, sucursal_id: x.sucursal_id, ingresos: x.ingresos, egresos: x.egresos, saldo: x.ingresos - x.egresos })) },
    { id: "fact_stock", desc: "Foto actual del stock por sucursal e ítem.", filas: () => st.data.stock.map(s => ({ sucursal_id: s.sucursal_id, tipo: s.tipo, item_id: s.item_id, item: nombreItem(d, s), cantidad: s.cantidad, unidad: unidadItem(d, s), minimo: s.stock_minimo || 0, actualizado: s.actualizado || "" })) },
    { id: "fact_compras", desc: "Detalle de órdenes de compra (una fila por insumo).", filas: () => st.data.compras.flatMap(x => x.items.map(i => ({ compra_id: x.id, fecha: x.fecha, sucursal_id: x.sucursal_id || "", proveedor_id: x.proveedor_id, estado: x.estado, insumo_id: i.insumo_id, cantidad: i.cantidad, precio_unitario: i.precio, subtotal: i.cantidad * i.precio }))) },
  ];
  // Controles de calidad del modelo consolidado
  const claves = {}; let duplicadas = 0;
  d.ventas.forEach(v => { const k = [v.sucursal_id, v.f, v.p || v.nombre, v.q, v.pu, v.m, v.c].join("|"); if (claves[k] && claves[k] !== v.lote_id) duplicadas++; claves[k] = claves[k] || v.lote_id; });
  const fuera = d.ventas.filter(v => !v.p).length;
  const sinSuc = d.ventas.filter(v => !d.suc[v.sucursal_id]).length;
  const controles = [
    ["Registros de venta consolidados", d.ventas.length.toLocaleString("es-AR"), "ok"],
    ["Posibles duplicados entre cargas distintas", duplicadas, duplicadas ? "warn" : "ok"],
    ["Ventas con producto fuera de catálogo", fuera, fuera ? "warn" : "ok"],
    ["Ventas sin sucursal válida", sinSuc, sinSuc ? "bad" : "ok"],
  ];
  const bajar = t => { const f = t.filas(); if (!f.length) return toast(`La tabla ${t.id} está vacía.`, "bad"); descargar(`${t.id}.csv`, aCsv(f), "text/csv;charset=utf-8"); };
  const bajarTodo = () => tablas.forEach((t, i) => setTimeout(() => { const f = t.filas(); if (f.length) descargar(`${t.id}.csv`, aCsv(f), "text/csv;charset=utf-8"); }, i * 350));
  return html`
    <div class="banner info" style="display:block">Este módulo entrega el modelo de datos único (ventas de todas las sucursales normalizadas con los mismos campos) para conectarlo con Power BI. En Power BI: <b>Obtener datos → Texto/CSV</b>, cargá las tablas y relacioná <code>fact_ventas</code> con las dimensiones por <code>sucursal_id</code>, <code>producto_id</code>, <code>fecha</code>, <code>canal</code> y <code>medio_pago</code>.</div>
    <div class="grid g2">
      <div class="card"><div class="hd"><h3>Calidad de los datos</h3><span class="note">al ${hoy().split("-").reverse().join("/")}</span></div><div class="bd"><div class="list">${controles.map(([l, v, t]) => html`<div class="it"><span style="flex:1">${l}</span><span class=${"pill " + t}>${v}</span></div>`)}</div></div></div>
      <div class="card"><div class="hd"><h3>Fuentes de datos</h3></div><div class="bd"><div class="list">
        <div class="it"><span style="flex:1"><b style="font-weight:600">Archivos Excel y CSV</b><div class="small muted">Importación manual desde Integración y sincronización</div></span><span class="pill ok">Activa</span></div>
        <div class="it"><span style="flex:1"><b style="font-weight:600">Ventas registradas a mano</b><div class="small muted">Desde Ventas → Registrar venta</div></span><span class="pill ok">Activa</span></div>
        <div class="it"><span style="flex:1"><b style="font-weight:600">ERP de las sucursales (ingesta automática)</b><div class="small muted">Requiere el servidor y el conector de solo lectura</div></span><span class="pill warn">Pendiente</span></div>
      </div></div></div>
    </div>
    <div class="card"><div class="hd"><h3>Tablas del modelo</h3><button class="btn" onClick=${bajarTodo}>Descargar todas (CSV)</button></div><div class="bd" style="padding:12px 0 0"><div class="tablewrap"><table>
      <thead><tr><th>Tabla</th><th>Contenido</th><th class="r">Filas</th><th></th></tr></thead>
      <tbody>${tablas.map(t => html`<tr><td><code>${t.id}</code></td><td class="small muted">${t.desc}</td><td class="r num">${t.filas().length.toLocaleString("es-AR")}</td><td class="r"><button class="btn ghost sm" onClick=${() => bajar(t)}>Descargar</button></td></tr>`)}</tbody>
    </table></div></div></div>`;
}
