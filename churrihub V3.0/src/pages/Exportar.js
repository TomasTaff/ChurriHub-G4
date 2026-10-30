import { html } from "htm/preact";
import { aCsv, descargar } from "../lib/archivos.js";
import { useState, useRef } from "preact/hooks";
import { exportarRespaldo, importarRespaldo, restablecer } from "../data/store.js";
import { MEDIOS, CANALES, hoy, slug } from "../lib/util.js";
import { esCritico, nombreItem, unidadItem } from "../lib/derivados.js";
import { Modal, confirmar, toast } from "../components/ui.js";

function Exportar(c) {
  const { st, d, sucursalId, rango } = c;
  const [ver, setVer] = useState(null);
  const sn = id => d.suc[id]?.nombre || "";
  const tag = (sucursalId ? slug(sn(sucursalId)) : "todas") + "_" + rango.desde + "_a_" + rango.hasta;
  const sets = [
    { k: "ventas", t: "Ventas", desc: "Cada línea de venta del período: fecha, sucursal, producto, cantidad, precio, total y medio de pago.", rows: () => d.ventas.filter(v => v.f >= rango.desde && v.f <= rango.hasta && (!sucursalId || v.sucursal_id === sucursalId)).map(v => ({ fecha: v.f, sucursal: sn(v.sucursal_id), producto: v.nombre, categoria: v.categoria, cantidad: v.q, precio_unitario: v.pu, total: v.total, medio_pago: MEDIOS[v.m] || v.m, canal: CANALES[v.c] || v.c })), file: `ventas_${tag}.csv` },
    { k: "stock", t: "Stock actual", desc: "Inventario de insumos y productos por sucursal, con mínimos y estado.", rows: () => st.data.stock.filter(s => !sucursalId || s.sucursal_id === sucursalId).map(s => ({ item: nombreItem(d, s), tipo: s.tipo, sucursal: sn(s.sucursal_id), cantidad: s.cantidad, unidad: unidadItem(d, s), minimo: s.stock_minimo || 0, estado: esCritico(s) ? "Por reponer" : "OK" })), file: `stock_${sucursalId ? slug(sn(sucursalId)) : "todas"}_${hoy()}.csv` },
    { k: "compras", t: "Compras", desc: "Órdenes de compra del período con proveedor, insumos, estado y total.", rows: () => st.data.compras.filter(x => x.fecha >= rango.desde && x.fecha <= rango.hasta && (!sucursalId || x.sucursal_id === sucursalId)).map(x => ({ fecha: x.fecha, sucursal: sn(x.sucursal_id), proveedor: d.prov[x.proveedor_id]?.nombre || "", estado: x.estado, insumos: x.items.map(i => `${d.ins[i.insumo_id]?.nombre || i.insumo_id} x${i.cantidad}`).join("; "), total: x.total })), file: `compras_${tag}.csv` },
    { k: "cierres", t: "Cierres de caja", desc: "Ingresos, egresos y saldo de cada cierre del período.", rows: () => st.data.cierres.filter(x => x.fecha >= rango.desde && x.fecha <= rango.hasta && (!sucursalId || x.sucursal_id === sucursalId)).map(x => ({ fecha: x.fecha, sucursal: sn(x.sucursal_id), ingresos: x.ingresos, egresos: x.egresos, saldo: x.ingresos - x.egresos, observaciones: x.observaciones || "" })), file: `cierres_${tag}.csv` },
  ];
  const bajar = async s => {
    const rows = s.rows(); if (!rows.length) return toast("No hay datos para exportar con estos filtros.", "bad");
    descargar(s.file, aCsv(rows), "text/csv;charset=utf-8");
  };
  return html`<div class="banner info">Los archivos respetan el período (${rango.label}) y la sucursal elegidos arriba. Se abren en Excel, Google Sheets o Power BI.</div>
    <div class="grid g2">${sets.map(s => { const n = s.rows().length; return html`<div class="card"><div class="bd" style="display:grid;gap:8px">
      <div class="row between"><h3 style="font-size:16px">${s.t}</h3><span class="pill mute">${n} registros</span></div>
      <p class="muted small" style="margin:0">${s.desc}</p>
      <div class="row"><button class="btn" disabled=${!n} onClick=${() => bajar(s)}>Descargar CSV</button><button class="btn sec" disabled=${!n} onClick=${() => setVer({ ...s, csv: aCsv(s.rows()) })}>Ver y copiar</button></div>
    </div></div>`; })}</div>
    <${Respaldo} />
    ${ver && html`<${Modal} wide titulo=${ver.file} onClose=${() => setVer(null)}>
      <textarea id="csv-out" class="in" rows="14" readonly style="font-family:ui-monospace,monospace;font-size:12px" value=${ver.csv.replace(/^﻿/, "")}></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" onClick=${async () => { const t = document.getElementById("csv-out"); try { await navigator.clipboard.writeText(t.value); toast("Copiado al portapapeles"); } catch (e) { t.select(); toast("Seleccioné el texto: copialo con Ctrl+C"); } }}>Copiar</button></div>
    <//>`}`;
}


function Respaldo() {
  const inp = useRef(null);
  const importar = async file => {
    if (!file) return;
    if (!(await confirmar("Restaurar copia de seguridad", `Se van a reemplazar todos los datos actuales por los de "${file.name}".`, "Restaurar"))) return;
    try { importarRespaldo(await file.text()); toast("Copia de seguridad restaurada"); } catch (e) { toast(e.message, "bad"); }
  };
  const reset = async () => { if (await confirmar("Volver a los datos iniciales", "Se borran todos los cambios hechos en este navegador y se cargan otra vez los datos migrados del prototipo.", "Restablecer")) { restablecer(); toast("Datos restablecidos"); } };
  return html`<div class="card"><div class="hd"><h3>Copia de seguridad</h3><span class="note">Los datos de esta versión viven en este navegador</span></div><div class="bd" style="display:grid;gap:10px">
    <p class="small muted" style="margin:0;max-width:70ch">Descargá una copia en JSON con todos los datos para guardarla o pasarla a otra computadora. Si borrás los datos del navegador sin una copia, se pierden.</p>
    <div class="row"><button class="btn" onClick=${() => descargar(`churrihub_respaldo_${hoy()}.json`, exportarRespaldo(), "application/json")}>Descargar copia (JSON)</button>
      <button class="btn sec" onClick=${() => inp.current.click()}>Restaurar desde archivo…</button>
      <input ref=${inp} id="respaldo-file" type="file" accept=".json,application/json" hidden onChange=${e => { importar(e.target.files[0]); e.target.value = ""; }} />
      <span class="spacer"></span><button class="btn ghost" style="color:var(--bad)" onClick=${reset}>Volver a los datos iniciales</button></div>
  </div></div>`;
}

export { Exportar, Respaldo };
